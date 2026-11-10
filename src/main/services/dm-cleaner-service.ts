import { EventEmitter } from 'events';
import { discordApi } from './discord-api';
import { DmCleanerConfig, DmCleanerStatus, LogEntry } from '../../types';

export class DmCleanerService extends EventEmitter {
  private isRunning: boolean = false;
  private abortRequested: boolean = false;
  private status: DmCleanerStatus = {
    active: false,
    totalFound: 0,
    deletedCount: 0,
    rateLimitWaitMs: 0
  };

  constructor() {
    super();
  }

  private log(level: LogEntry['level'], message: string) {
    this.emit('log', {
      module: 'DM_CLEANER',
      level,
      message
    });
  }

  public getStatus(): DmCleanerStatus {
    return { ...this.status };
  }

  public async getDmChannels(token: string) {
    try {
      const channels = await discordApi.fetchWithRetry<any[]>(
        'https://discord.com/api/v9/users/@me/channels',
        { method: 'GET', token }
      );

      return (channels || []).map(ch => {
        let recipientName = 'Grup DM';
        let avatar = undefined;
        if (ch.recipients && ch.recipients.length > 0) {
          recipientName = ch.recipients.map((r: any) => r.global_name || r.username).join(', ');
          if (ch.recipients[0].avatar) {
            avatar = `https://cdn.discordapp.com/avatars/${ch.recipients[0].id}/${ch.recipients[0].avatar}.png?size=64`;
          }
        }
        return {
          id: ch.id,
          name: recipientName,
          type: ch.type,
          avatar,
          lastMessageId: ch.last_message_id
        };
      });
    } catch (err: any) {
      this.log('error', `DM kanalları listelenemedi: ${err.message}`);
      return [];
    }
  }

  public stop(): void {
    if (this.isRunning) {
      this.abortRequested = true;
      this.log('warn', '🛑 DM temizleme işlemi durduruldu.');
    }
  }

  public async start(token: string, config: DmCleanerConfig): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.abortRequested = false;
    this.status = {
      active: true,
      totalFound: 0,
      deletedCount: 0,
      rateLimitWaitMs: 0
    };
    this.emit('status_updated', this.getStatus());

    try {
      // Get current user id
      const me = await discordApi.getMe(token);
      const myId = me.id;

      let channelIds: { id: string; name: string }[] = [];

      if (config.target === 'all') {
        this.log('info', 'Tüm açık DM kanalları çekiliyor...');
        const allDms = await this.getDmChannels(token);
        channelIds = allDms.map(d => ({ id: d.id, name: d.name }));
        this.log('info', `Toplam ${channelIds.length} DM kanalı taranacak.`);
      } else {
        channelIds = [{ id: config.target, name: `Kanal #${config.target}` }];
      }

      for (const ch of channelIds) {
        if (this.abortRequested || !this.isRunning) break;

        this.status.currentChannelName = ch.name;
        this.emit('status_updated', this.getStatus());
        this.log('info', `🧹 ${ch.name} içindeki mesajlar taranıyor...`);

        let beforeId: string | undefined = undefined;
        let hasMore = true;

        while (hasMore && !this.abortRequested && this.isRunning) {
          let url = `https://discord.com/api/v9/channels/${ch.id}/messages?limit=100`;
          if (beforeId) {
            url += `&before=${beforeId}`;
          }

          let messages: any[] = [];
          try {
            messages = await discordApi.fetchWithRetry<any[]>(url, {
              method: 'GET',
              token
            });
          } catch (fetchErr: any) {
            this.log('warn', `Mesajlar okunamadı (${ch.name}): ${fetchErr.message}`);
            break;
          }

          if (!messages || messages.length === 0) {
            hasMore = false;
            break;
          }

          beforeId = messages[messages.length - 1].id;

          // Filter only own messages
          const myMessages = messages.filter(m => m.author?.id === myId);
          this.status.totalFound += myMessages.length;
          this.emit('status_updated', this.getStatus());

          for (const msg of myMessages) {
            if (this.abortRequested || !this.isRunning) break;

            try {
              await discordApi.fetchWithRetry(
                `https://discord.com/api/v9/channels/${ch.id}/messages/${msg.id}`,
                {
                  method: 'DELETE',
                  token
                }
              );

              this.status.deletedCount++;
              this.status.lastDeletedMessageId = msg.id;
              this.emit('status_updated', this.getStatus());

              if (this.status.deletedCount % 10 === 0) {
                this.log('info', `[${ch.name}] Toplam ${this.status.deletedCount} mesaj silindi.`);
              }

              // Delay with user configured jitter
              const delay =
                config.delayMs + Math.floor(Math.random() * (config.randomJitterMs || 400));
              await new Promise(r => setTimeout(r, delay));
            } catch (delErr: any) {
              if (delErr.status === 429) {
                this.status.rateLimitWaitMs = (delErr.retryAfter || 2) * 1000;
                this.emit('status_updated', this.getStatus());
                this.log('warn', `429 Rate limit: ${delErr.retryAfter}s bekleniyor...`);
                await new Promise(r => setTimeout(r, this.status.rateLimitWaitMs + 200));
                this.status.rateLimitWaitMs = 0;
              } else if (delErr.status === 404) {
                // Message already deleted
              } else {
                this.log('warn', `Mesaj silinemedi (${msg.id}): ${delErr.message}`);
              }
            }
          }
        }
      }

      this.log('success', `🎉 DM Temizleme tamamlandı! Toplam ${this.status.deletedCount} mesaj başarıyla silindi.`);
    } catch (err: any) {
      this.log('error', `DM Temizleme hatası: ${err.message}`);
    } finally {
      this.isRunning = false;
      this.abortRequested = false;
      this.status.active = false;
      this.emit('status_updated', this.getStatus());
    }
  }
}

export const dmCleanerService = new DmCleanerService();

