import { EventEmitter } from 'events';
import { clientManager } from './discord-client-manager';
import { CloneConfig, CloneProgress, LogEntry } from '../../types';

export class ClonerService extends EventEmitter {
  private isRunning: boolean = false;
  private abortRequested: boolean = false;
  private progress: CloneProgress = {
    active: false,
    stage: 'Bekleniyor',
    currentStep: 0,
    totalSteps: 100,
    percentage: 0,
    detail: 'Klonlayıcı hazır.'
  };

  constructor() {
    super();
  }

  private log(level: LogEntry['level'], message: string) {
    this.emit('log', {
      module: 'CLONER',
      level,
      message
    });
  }

  public getProgress(): CloneProgress {
    return { ...this.progress };
  }

  private updateProgress(stage: string, step: number, total: number, detail: string) {
    this.progress = {
      active: this.isRunning,
      stage,
      currentStep: step,
      totalSteps: Math.max(total, 1),
      percentage: Math.min(100, Math.round((step / Math.max(total, 1)) * 100)),
      detail
    };
    this.emit('progress_updated', this.progress);
  }

  public stop() {
    if (this.isRunning) {
      this.abortRequested = true;
      this.log('warn', '🛑 Sunucu klonlama kullanıcı tarafından durduruldu.');
    }
  }

  public async startCloning(token: string, config: CloneConfig): Promise<void> {
    if (this.isRunning) throw new Error('Zaten aktif bir klonlama işlemi var.');

    this.isRunning = true;
    this.abortRequested = false;
    this.log('info', `🚀 Sunucu klonlama başlatıldı: Kaynak [${config.sourceGuildId}] -> Hedef [${config.targetGuildId}]`);

    try {
      const client = await clientManager.getClient(token);
      const sourceGuild = await client.guilds.fetch(config.sourceGuildId);
      const targetGuild = await client.guilds.fetch(config.targetGuildId);

      if (!sourceGuild) {
        throw new Error(`Kaynak sunucu bulunamadı (${config.sourceGuildId}).`);
      }
      if (!targetGuild) {
        throw new Error(`Hedef sunucu bulunamadı (${config.targetGuildId}).`);
      }

      // Check admin permissions on target guild
      const targetMember = targetGuild.members.cache.get(client.user!.id);
      if (targetMember && !targetMember.permissions.has('ADMINISTRATOR') && !targetMember.permissions.has('MANAGE_GUILD')) {
        this.log('warn', 'Hedef sunucuda Yönetici (ADMINISTRATOR) yetkisi olmayabilir; bazı işlemler kısıtlanabilir.');
      }

      // Role map: oldRoleId -> newRoleId
      const roleMap = new Map<string, string>();
      roleMap.set(sourceGuild.id, targetGuild.id); // Map @everyone role

      // 1. Wipe Target if configured
      if (config.wipeTarget) {
        this.updateProgress('Temizleme', 0, 10, 'Hedef sunucudaki eski kanallar ve roller temizleniyor...');
        this.log('info', '🧹 Hedef sunucu kanalları ve rolleri siliniyor...');

        // Delete channels
        for (const [id, ch] of targetGuild.channels.cache) {
          if (this.abortRequested) break;
          try {
            await ch.delete();
            await new Promise(r => setTimeout(r, 600));
          } catch (_) {}
        }

        // Delete roles (except managed / @everyone)
        const targetHighestRole = targetMember?.roles.highest.position || 999;
        for (const [id, r] of targetGuild.roles.cache) {
          if (this.abortRequested) break;
          if (r.id !== targetGuild.id && !r.managed && r.position < targetHighestRole) {
            try {
              await r.delete();
              await new Promise(r => setTimeout(r, 600));
            } catch (_) {}
          }
        }
        this.log('success', 'Hedef sunucu temizlendi.');
      }

      if (this.abortRequested) return;

      // 2. Clone Server Info (Name, Icon, Verification)
      if (config.cloneServerInfo) {
        this.updateProgress('Sunucu Bilgileri', 1, 10, 'Sunucu adı ve ikonu kopyalanıyor...');
        try {
          await targetGuild.setName(sourceGuild.name);
          const iconUrl = sourceGuild.iconURL({ format: 'png', size: 1024 });
          if (iconUrl) {
            await targetGuild.setIcon(iconUrl);
          }
          await targetGuild.setVerificationLevel(sourceGuild.verificationLevel);
          this.log('success', `Sunucu adı "${sourceGuild.name}" ve ikonu kopyalandı.`);
        } catch (err: any) {
          this.log('warn', `Sunucu bilgileri kopyalama uyarısı: ${err.message}`);
        }
      }

      if (this.abortRequested) return;

      // 3. Clone Roles
      if (config.cloneRoles) {
        this.log('info', '🎭 Roller kopyalanıyor...');
        const sourceRoles = Array.from(sourceGuild.roles.cache.values())
          .filter(r => r.id !== sourceGuild.id && !r.managed)
          .sort((a, b) => a.position - b.position);

        let roleIndex = 0;
        for (const role of sourceRoles) {
          if (this.abortRequested) break;
          roleIndex++;
          this.updateProgress(
            'Roller',
            roleIndex,
            sourceRoles.length,
            `Rol kopyalanıyor: ${role.name}`
          );

          try {
            const newRole = await targetGuild.roles.create({
              name: role.name,
              color: role.color,
              hoist: role.hoist,
              permissions: role.permissions,
              mentionable: role.mentionable
            });
            roleMap.set(role.id, newRole.id);
            this.log('info', `Rol oluşturuldu: @${role.name}`);
            await new Promise(r => setTimeout(r, 800));
          } catch (rErr: any) {
            this.log('warn', `Rol oluşturulamadı (${role.name}): ${rErr.message}`);
          }
        }
      }

      if (this.abortRequested) return;

      // 4. Clone Categories & Channels
      if (config.cloneCategories || config.cloneChannels) {
        this.log('info', '📁 Kategoriler ve kanallar kopyalanıyor...');
        const categoryMap = new Map<string, string>();

        // Categories first
        const categories = Array.from(sourceGuild.channels.cache.values())
          .filter(c => c.type === 'GUILD_CATEGORY')
          .sort((a, b) => a.position - b.position);

        let catIdx = 0;
        for (const cat of categories) {
          if (this.abortRequested) break;
          catIdx++;
          this.updateProgress(
            'Kategoriler',
            catIdx,
            categories.length,
            `Kategori oluşturuluyor: ${cat.name}`
          );

          // Map permission overwrites
          const overwrites: any[] = [];
          if (config.clonePermissions) {
            for (const [owId, ow] of (cat as any).permissionOverwrites?.cache || []) {
              const mappedTargetId = roleMap.get(owId) || owId;
              overwrites.push({
                id: mappedTargetId,
                allow: ow.allow.bitfield,
                deny: ow.deny.bitfield,
                type: ow.type
              });
            }
          }

          try {
            const newCat = await targetGuild.channels.create(cat.name, {
              type: 'GUILD_CATEGORY',
              position: cat.position,
              permissionOverwrites: overwrites.length > 0 ? overwrites : undefined
            });
            categoryMap.set(cat.id, newCat.id);
            this.log('info', `Kategori oluşturuldu: ${cat.name}`);
            await new Promise(r => setTimeout(r, 800));
          } catch (catErr: any) {
            this.log('warn', `Kategori oluşturulamadı (${cat.name}): ${catErr.message}`);
          }
        }

        // Non-category channels
        const channels = Array.from(sourceGuild.channels.cache.values())
          .filter(c => c.type !== 'GUILD_CATEGORY')
          .sort((a, b) => (((a as any).position ?? 0) - ((b as any).position ?? 0)));

        let chIdx = 0;
        for (const ch of channels) {
          if (this.abortRequested) break;
          chIdx++;
          this.updateProgress(
            'Kanallar',
            chIdx,
            channels.length,
            `Kanal oluşturuluyor: #${ch.name}`
          );

          const overwrites: any[] = [];
          if (config.clonePermissions) {
            for (const [owId, ow] of (ch as any).permissionOverwrites?.cache || []) {
              const mappedTargetId = roleMap.get(owId) || owId;
              overwrites.push({
                id: mappedTargetId,
                allow: ow.allow.bitfield,
                deny: ow.deny.bitfield,
                type: ow.type
              });
            }
          }

          const targetParentId = ch.parentId ? categoryMap.get(ch.parentId) : undefined;

          try {
            await targetGuild.channels.create(ch.name, {
              type: ch.type as any,
              parent: targetParentId,
              topic: (ch as any).topic || undefined,
              nsfw: (ch as any).nsfw || false,
              rateLimitPerUser: (ch as any).rateLimitPerUser || 0,
              position: (ch as any).position ?? chIdx,
              permissionOverwrites: overwrites.length > 0 ? overwrites : undefined
            });
            this.log('info', `Kanal oluşturuldu: #${ch.name}`);
            await new Promise(r => setTimeout(r, 1000));
          } catch (chErr: any) {
            this.log('warn', `Kanal oluşturulamadı (#${ch.name}): ${chErr.message}`);
          }
        }
      }

      if (this.abortRequested) return;

      // 5. Clone Emojis
      if (config.cloneEmojis) {
        this.log('info', '😀 Emojiler aktarılıyor...');
        const emojis = Array.from(sourceGuild.emojis.cache.values());
        let emojiIdx = 0;

        for (const emoji of emojis) {
          if (this.abortRequested) break;
          emojiIdx++;
          this.updateProgress('Emojiler', emojiIdx, emojis.length, `Emoji yükleniyor: :${emoji.name}:`);

          try {
            await targetGuild.emojis.create(emoji.url, emoji.name || `emoji_${emojiIdx}`);
            this.log('info', `Emoji eklendi: :${emoji.name}:`);
            await new Promise(r => setTimeout(r, 1200));
          } catch (eErr: any) {
            this.log('warn', `Emoji eklenemedi (:${emoji.name}:): ${eErr.message}`);
          }
        }
      }

      this.updateProgress('Tamamlandı', 100, 100, 'Tüm sunucu ögeleri başarıyla klonlandı!');
      this.log('success', '🎉 Sunucu klonlama işlemi başarıyla tamamlandı!');
    } catch (err: any) {
      this.log('error', `Sunucu klonlama hatası: ${err.message}`);
      this.updateProgress('Hata', 0, 100, `Hata oluştu: ${err.message}`);
    } finally {
      this.isRunning = false;
      this.abortRequested = false;
      this.progress.active = false;
      this.emit('progress_updated', this.progress);
    }
  }
}

export const clonerService = new ClonerService();