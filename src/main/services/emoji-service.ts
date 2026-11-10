import { EventEmitter } from 'events';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import { app } from 'electron';
import { request } from 'undici';
import { discordApi } from './discord-api';
import { EmojiInfo, LogEntry } from '../../types';

export class EmojiService extends EventEmitter {
  constructor() {
    super();
  }

  private log(level: LogEntry['level'], message: string) {
    this.emit('log', {
      module: 'EMOJI',
      level,
      message
    });
  }

  public async getGuildEmojis(token: string, guildId: string): Promise<{ guildName: string; emojis: EmojiInfo[] }> {
    try {
      this.log('info', `Sunucu emojileri çekiliyor: Sunucu ID ${guildId}...`);

      const guild = await discordApi.fetchWithRetry<any>(
        `https://discord.com/api/v9/guilds/${guildId}`,
        { method: 'GET', token }
      );

      const rawEmojis = await discordApi.fetchWithRetry<any[]>(
        `https://discord.com/api/v9/guilds/${guildId}/emojis`,
        { method: 'GET', token }
      );

      const emojis: EmojiInfo[] = (rawEmojis || []).map(e => ({
        id: e.id,
        name: e.name,
        animated: Boolean(e.animated),
        url: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? 'gif' : 'png'}?size=96`
      }));

      this.log('success', `${guild.name} sunucusunda ${emojis.length} adet emoji bulundu.`);
      return {
        guildName: guild.name || 'Sunucu',
        emojis
      };
    } catch (err: any) {
      this.log('error', `Emojiler alınamadı: ${err.message}`);
      throw err;
    }
  }

  public async downloadEmojisZip(token: string, guildId: string): Promise<string> {
    const { guildName, emojis } = await this.getGuildEmojis(token, guildId);

    if (emojis.length === 0) {
      throw new Error('Bu sunucuda indirilecek emoji bulunamadı.');
    }

    const safeGuildName = guildName.replace(/[/\\?%*:|"<>]/g, '_');
    const desktopPath = app ? app.getPath('desktop') : path.join(os.homedir(), 'Desktop');
    const zipFilePath = path.join(desktopPath, `${safeGuildName}_emojiler.zip`);

    this.log('info', `📦 ZIP oluşturuluyor: ${zipFilePath}`);

    const zip = new AdmZip();
    let count = 0;

    for (const emoji of emojis) {
      try {
        const ext = emoji.animated ? 'gif' : 'png';
        const fileName = `${emoji.name}_${emoji.id}.${ext}`;

        const res = await request(emoji.url);
        const buf = Buffer.from(await res.body.arrayBuffer());

        zip.addFile(fileName, buf);
        count++;

        if (count % 10 === 0 || count === emojis.length) {
          this.log('info', `İndiriliyor: [${count}/${emojis.length}] emoji pakete eklendi.`);
        }
      } catch (e: any) {
        this.log('warn', `Emoji indirilemedi (${emoji.name}): ${e.message}`);
      }
    }

    await new Promise<void>((resolve, reject) => {
      zip.writeZip(zipFilePath, (err) => {
        if (err) {
          this.log('error', `ZIP kaydedilirken hata oluştu: ${err.message}`);
          reject(err);
        } else {
          this.log('success', `🎉 ${count} emoji "${zipFilePath}" konumuna kaydedildi!`);
          resolve();
        }
      });
    });

    return zipFilePath;
  }

  public async uploadEmojisToGuild(
    token: string,
    targetGuildId: string,
    emojis: { name: string; url: string; animated: boolean }[]
  ): Promise<{ success: number; failed: number }> {
    this.log('info', `Hedef sunucuya [${targetGuildId}] ${emojis.length} emoji yükleniyor...`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < emojis.length; i++) {
      const emoji = emojis[i];
      try {
        this.log('info', `[${i + 1}/${emojis.length}] Yükleniyor: :${emoji.name}:`);

        // Fetch image buffer and convert to Data URI
        const res = await request(emoji.url);
        const mime = emoji.animated ? 'image/gif' : 'image/png';
        const base64 = Buffer.from(await res.body.arrayBuffer()).toString('base64');
        const dataUri = `data:${mime};base64,${base64}`;

        await discordApi.fetchWithRetry(
          `https://discord.com/api/v9/guilds/${targetGuildId}/emojis`,
          {
            method: 'POST',
            token,
            body: {
              name: emoji.name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 32),
              image: dataUri
            }
          }
        );

        success++;
        this.log('success', `:${emoji.name}: başarıyla yüklendi.`);
        await new Promise(r => setTimeout(r, 1500));
      } catch (err: any) {
        failed++;
        this.log('warn', `:${emoji.name}: yüklenemedi: ${err.message}`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    this.log('success', `Emoji yükleme tamamlandı! Başarılı: ${success}, Başarısız: ${failed}`);
    return { success, failed };
  }
}

export const emojiService = new EmojiService();
