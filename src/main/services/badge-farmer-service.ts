import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { discordApi } from './discord-api';
import { clientManager } from './discord-client-manager';
import { tokenStore } from './token-store';
import { voiceStreamService } from './voice-stream-service';
import { getDvs } from './dvs-loader';
import { BadgeFarmerStatus, DetectableApp, LogEntry } from '../../types';

export class BadgeFarmerService extends EventEmitter {
  private status: BadgeFarmerStatus = {
    diversityActive: false,
    diversityProcessed: 0,
    diversityTotal: 0,
    playtimeActive: false,
    playtimeElapsedSeconds: 0,
    streamerActive: false,
    viewerAccountConnected: false
  };

  private diversityAbort: boolean = false;
  private playtimeInterval?: NodeJS.Timeout;
  private cachedApps: DetectableApp[] = [];
  private cacheFilePath: string;

  constructor() {
    super();
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    this.cacheFilePath = path.join(userDataPath, 'detectable_applications.json');
  }

  private log(level: LogEntry['level'], message: string) {
    this.emit('log', {
      module: 'BADGES',
      level,
      message
    });
  }

  public getStatus(): BadgeFarmerStatus {
    return { ...this.status };
  }

  /**
   * Fetches the 10,400+ detectable applications from Discord, filters for win32 executables,
   * and caches locally.
   */
  public async getDetectableApps(token: string): Promise<DetectableApp[]> {
    if (this.cachedApps.length > 0) {
      return this.cachedApps;
    }

    if (fs.existsSync(this.cacheFilePath)) {
      try {
        const raw = fs.readFileSync(this.cacheFilePath, 'utf8');
        this.cachedApps = JSON.parse(raw);
        this.log('info', `Önbellekten ${this.cachedApps.length} adet doğrulanmış Win32 oyunu yüklendi.`);
        return this.cachedApps;
      } catch (_) {}
    }

    try {
      this.log('info', 'Discord Detectable Applications API veritabanı çekiliyor (10.400+ Oyun)...');
      const data = await discordApi.fetchWithRetry<DetectableApp[]>(
        'https://discord.com/api/v9/applications/detectable',
        {
          method: 'GET',
          token
        }
      );

      // Filter only win32 games
      const win32Games = (data || []).filter(app => {
        if (!app.executables || app.executables.length === 0) return true;
        return app.executables.some(e => e.os === 'win32');
      });

      this.cachedApps = win32Games;
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(win32Games), 'utf8');
      this.log('success', `Toplam ${win32Games.length} adet doğrulanmış Win32 oyunu önbelleğe alındı.`);
      return win32Games;
    } catch (err: any) {
      this.log('error', `Oyun listesi çekilemedi: ${err.message}`);
      return [];
    }
  }

  private async sendScienceTelemetry(token: string, eventName: string, properties: any) {
    try {
      await discordApi.fetchWithRetry('https://discord.com/api/v9/science', {
        method: 'POST',
        token,
        body: {
          events: [
            {
              type: eventName,
              properties: {
                client_track_timestamp: Date.now(),
                client_send_timestamp: Date.now(),
                ...properties
              }
            }
          ]
        }
      });
    } catch (_) {
      // Non-critical telemetry failure is ignored safely
    }
  }

  /**
   * Mode 1: Game Diversity (Sampler / Universalist - 10,400+ Games)
   */
  public async startDiversityFarmer(token: string): Promise<void> {
    if (this.status.diversityActive) return;

    this.status.diversityActive = true;
    this.diversityAbort = false;
    this.emit('status_updated', this.getStatus());

    this.log('info', '🎮 Oyun Çeşitliliği (10.400+ Oyun Rozet Kasıcı) başlatıldı.');

    const apps = await this.getDetectableApps(token);
    this.status.diversityTotal = apps.length;
    this.status.diversityProcessed = 0;
    this.emit('status_updated', this.getStatus());

    const client = await clientManager.getClient(token);

    const runLoop = async () => {
      let batchCount = 0;

      for (let i = 0; i < apps.length; i++) {
        if (this.diversityAbort || !this.status.diversityActive) break;

        const app = apps[i];
        this.status.currentGameName = app.name;
        this.status.currentGameId = app.id;
        this.status.diversityProcessed = i + 1;
        this.emit('status_updated', this.getStatus());

        this.log(
          'info',
          `[${i + 1}/${apps.length}] Oynanıyor simüle ediliyor: ${app.name} (${app.id})`
        );

        const startTime = Date.now();

        // 1. Gateway presence update
        try {
          if (client.ws) {
            client.ws.broadcast({
              op: 3,
              d: {
                since: 0,
                activities: [
                  {
                    type: 0, // Playing
                    name: app.name,
                    application_id: app.id,
                    timestamps: { start: startTime }
                  }
                ],
                status: 'online',
                afk: false
              }
            });
          }
        } catch (_) {}

        // 2. Activities endpoint sync
        try {
          await discordApi.fetchWithRetry('https://discord.com/api/v9/activities', {
            method: 'POST',
            token,
            body: {
              application_id: app.id,
              name: app.name,
              type: 0,
              timestamps: { start: startTime }
            }
          });
        } catch (_) {}

        // 3. Discord Science telemetry
        await this.sendScienceTelemetry(token, 'game_opened', {
          application_id: app.id,
          game_name: app.name,
          distributor: 'discord'
        });

        batchCount++;

        // Jitter delay between 8 to 12 seconds per game
        const delay = Math.floor(8000 + Math.random() * 4000);
        await new Promise(r => setTimeout(r, delay));

        // After 50 games, take a 25-second safety break
        if (batchCount >= 50) {
          batchCount = 0;
          this.log('warn', '🛡️ 50 oyun tamamlandı. Anti-ban güvenliği için 25 saniye mola veriliyor...');
          await new Promise(r => setTimeout(r, 25000));
        }
      }

      this.log('success', '🏆 Oyun Çeşitliliği döngüsü tamamlandı!');
      this.status.diversityActive = false;
      this.emit('status_updated', this.getStatus());
    };

    runLoop().catch(err => {
      this.log('error', `Oyun Çeşitliliği döngü hatası: ${err.message}`);
      this.status.diversityActive = false;
      this.emit('status_updated', this.getStatus());
    });
  }

  public stopDiversityFarmer(): void {
    this.diversityAbort = true;
    this.status.diversityActive = false;
    this.log('warn', '🛑 Oyun Çeşitliliği kasıcı durduruldu.');
    this.emit('status_updated', this.getStatus());
  }

  /**
   * Mode 2: Dedicated Playtime (5,000 Hours)
   */
  public async startPlaytimeFarmer(
    token: string,
    gameName: string,
    appId: string
  ): Promise<void> {
    if (this.status.playtimeActive) return;

    this.status.playtimeActive = true;
    this.status.playtimeGameName = gameName;
    this.status.playtimeAppId = appId;
    this.status.playtimeElapsedSeconds = 0;
    this.emit('status_updated', this.getStatus());

    this.log('info', `🗡️ Oyun Süresi Kasıcı başlatıldı: ${gameName} (${appId})`);

    const client = await clientManager.getClient(token);
    const initialStartTime = Date.now() - 3600000; // 1 hour prior timestamp for immediate boost

    const setPresence = async () => {
      try {
        if (client.ws) {
          client.ws.broadcast({
            op: 3,
            d: {
              since: 0,
              activities: [
                {
                  type: 0,
                  name: gameName,
                  application_id: appId,
                  timestamps: { start: initialStartTime }
                }
              ],
              status: 'online',
              afk: false
            }
          });
        }
        await discordApi.fetchWithRetry('https://discord.com/api/v9/activities', {
          method: 'POST',
          token,
          body: {
            application_id: appId,
            name: gameName,
            type: 0,
            timestamps: { start: initialStartTime }
          }
        });
        await this.sendScienceTelemetry(token, 'launch_game', {
          application_id: appId,
          game_name: gameName
        });
      } catch (err: any) {
        this.log('warn', `Oyun varlığı senkronize hatası: ${err.message}`);
      }
    };

    await setPresence();

    // Sync every 12 to 15 minutes
    this.playtimeInterval = setInterval(async () => {
      this.status.playtimeElapsedSeconds += 720;
      this.log('info', `⏱️ ${gameName} oyun süresi senkronize ediliyor... Toplam aktif süre: ${Math.floor(this.status.playtimeElapsedSeconds / 60)} dk`);
      await setPresence();
      this.emit('status_updated', this.getStatus());
    }, 720000);
  }

  public stopPlaytimeFarmer(): void {
    this.status.playtimeActive = false;
    if (this.playtimeInterval) {
      clearInterval(this.playtimeInterval);
      this.playtimeInterval = undefined;
    }
    this.log('warn', '🛑 Oyun Süresi Kasıcı durduruldu.');
    this.emit('status_updated', this.getStatus());
  }

  /**
   * Mode 3: Streamer Badge (Go Live + Dual Account Live Viewer)
   */
  public async startStreamerBadgeFarmer(
    primaryToken: string,
    guildId: string,
    channelId: string
  ): Promise<void> {
    if (this.status.streamerActive) return;

    this.status.streamerActive = true;
    this.emit('status_updated', this.getStatus());
    this.log('info', '🏆 Streamer Rozet Kasıcı başlatılıyor...');

    // 1. Start Go Live stream on Primary Account
    await voiceStreamService.start(primaryToken, {
      guildId,
      channelId,
      selfMute: false,
      selfDeaf: false,
      fakeCamera: false,
      goLive: true,
      fps: 30,
      resolution: '720p'
    });

    // 2. Check for a 2nd account to join as viewer
    const allAccounts = tokenStore.getAccounts();
    const secondAccount = allAccounts.find(a => a.token !== primaryToken && a.status !== 'error');

    if (secondAccount) {
      try {
        this.log('info', `👥 2. Hesap tespit edildi: @${secondAccount.username}. İzleyici (Viewer) olarak kanala sokuluyor...`);
        const client2 = await clientManager.getClient(secondAccount.token);
        const guild2 = client2.guilds.cache.get(guildId);
        const channel2 = guild2?.channels.cache.get(channelId);

        if (channel2) {
          // Connect 2nd account to voice channel
          const { Streamer } = await getDvs();
          const streamer2 = new Streamer(client2 as any);
          await streamer2.joinVoice(guildId, channelId);

          // Update voice state to mute
          try {
            if ((client2 as any).ws) {
              (client2 as any).ws.broadcast({
                op: 4,
                d: {
                  guild_id: guildId,
                  channel_id: channelId,
                  self_mute: true,
                  self_deaf: false,
                  self_video: false
                }
              });
            }
          } catch (_) {}

          this.status.viewerAccountConnected = true;
          this.status.viewerUsername = secondAccount.username;
          this.log('success', `🎉 @${secondAccount.username} yayına izleyici olarak bağlandı! Streamer rozet şartı sağlandı.`);
        } else {
          this.log('warn', `2. hesap (@${secondAccount.username}) bu sunucuda bulunmuyor. Lütfen davet edin.`);
        }
      } catch (err: any) {
        this.log('warn', `2. hesap izleyici bağlantı hatası: ${err.message}`);
      }
    } else {
      this.log('warn', '⚠️ Sistemde 2. bir hesap ekli değil. Rozet izleyici şartı için Hesaplar sekmesinden 2. bir hesap eklemeniz önerilir.');
    }

    this.emit('status_updated', this.getStatus());
  }

  public async stopStreamerBadgeFarmer(): Promise<void> {
    this.status.streamerActive = false;
    this.status.viewerAccountConnected = false;
    this.status.viewerUsername = undefined;
    await voiceStreamService.stop();
    this.log('info', '🛑 Streamer Rozet Kasıcı durduruldu.');
    this.emit('status_updated', this.getStatus());
  }
}

export const badgeFarmerService = new BadgeFarmerService();

