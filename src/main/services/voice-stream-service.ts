import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import type { Streamer } from '@dank074/discord-video-stream';
import { getDvs } from './dvs-loader';
import { clientManager } from './discord-client-manager';
import { VoiceStreamConfig, VoiceStreamStatus, LogEntry } from '../../types';

export class VoiceStreamService extends EventEmitter {
  private streamer?: Streamer;
  private currentConfig?: VoiceStreamConfig;
  private currentToken?: string;
  private status: VoiceStreamStatus = {
    active: false,
    connected: false,
    streaming: false,
    reconnectAttempts: 0,
    uptimeSeconds: 0
  };
  private uptimeInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private abortController?: AbortController;
  private isIntentionalStop: boolean = false;

  constructor() {
    super();
  }

  private log(level: LogEntry['level'], message: string) {
    this.emit('log', {
      module: 'VOICE',
      level,
      message
    });
  }

  public getStatus(): VoiceStreamStatus {
    return { ...this.status };
  }

  public async getGuilds(token: string) {
    const client = await clientManager.getClient(token);
    return client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ dynamic: true, size: 64 })
    }));
  }

  public async getVoiceChannels(token: string, guildId: string) {
    const client = await clientManager.getClient(token);
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return [];
    return guild.channels.cache
      .filter(c => c.type === 'GUILD_VOICE' || c.type === 'GUILD_STAGE_VOICE' || (c as any).isVoice?.())
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type
      }));
  }

  public async start(token: string, config: VoiceStreamConfig): Promise<void> {
    this.isIntentionalStop = false;
    this.currentToken = token;
    this.currentConfig = config;
    this.status.reconnectAttempts = 0;
    this.status.active = true;

    await this.connectAndStream();
  }

  private async connectAndStream(): Promise<void> {
    if (!this.currentToken || !this.currentConfig || this.isIntentionalStop) return;

    try {
      this.log('info', `Ses kanalına bağlanılıyor: Kanal ID ${this.currentConfig.channelId}...`);

      const client = await clientManager.getClient(this.currentToken);
      const guild = client.guilds.cache.get(this.currentConfig.guildId);
      const channel = guild?.channels.cache.get(this.currentConfig.channelId);

      this.status.guildId = this.currentConfig.guildId;
      this.status.guildName = guild?.name || 'Bilinmeyen Sunucu';
      this.status.channelId = this.currentConfig.channelId;
      this.status.channelName = channel?.name || 'Bilinmeyen Kanal';

      // Initialize Streamer via dynamic ESM loader
      const { Streamer } = await getDvs();
      this.streamer = new Streamer(client as any);

      // Join voice channel
      await this.streamer.joinVoice(this.currentConfig.guildId, this.currentConfig.channelId);

      // Broadcast voice state update with mute, deaf, and camera settings
      try {
        if ((client as any).ws) {
          (client as any).ws.broadcast({
            op: 4,
            d: {
              guild_id: this.currentConfig.guildId,
              channel_id: this.currentConfig.channelId,
              self_mute: this.currentConfig.selfMute,
              self_deaf: this.currentConfig.selfDeaf,
              self_video: this.currentConfig.fakeCamera
            }
          });
        }
      } catch (_) {}

      if (this.currentConfig.fakeCamera) {
        this.streamer.signalVideo(true);
      }

      this.status.connected = true;
      this.status.reconnectAttempts = 0;
      this.log('success', `🔊 ${this.status.guildName} / #${this.status.channelName} ses kanalına bağlanıldı.`);

      // Start uptime tracking
      if (!this.uptimeInterval) {
        this.uptimeInterval = setInterval(() => {
          this.status.uptimeSeconds++;
          this.emit('status_updated', this.getStatus());
        }, 1000);
      }

      // Handle 7/24 Go Live Screen Streaming
      if (this.currentConfig.goLive) {
        this.startGoLiveLoop();
      }

      this.emit('status_updated', this.getStatus());
    } catch (err: any) {
      this.log('error', `Ses bağlantı hatası: ${err.message}`);
      this.status.connected = false;
      this.status.streaming = false;
      this.emit('status_updated', this.getStatus());
      this.scheduleReconnect();
    }
  }

  private async startGoLiveLoop() {
    if (!this.streamer || !this.status.connected || this.isIntentionalStop) return;

    this.abortController = new AbortController();
    this.status.streaming = true;
    this.emit('status_updated', this.getStatus());

    const appPath = app ? app.getAppPath() : process.cwd();
    let videoPath = path.join(appPath, 'assets', 'black.mp4');
    if (!fs.existsSync(videoPath)) {
      videoPath = path.join(process.cwd(), 'assets', 'black.mp4');
    }

    this.log('info', `🎥 7/24 Go Live Ekran Yayını başlatılıyor: ${videoPath}`);

    // Loop video stream continuously
    const streamLoop = async () => {
      const { prepareStream, playStream } = await getDvs();
      while (this.status.streaming && !this.isIntentionalStop) {
        try {
          const fps = this.currentConfig?.fps || 30;
          const width = this.currentConfig?.resolution === '1080p' ? 1920 : 1280;
          const height = this.currentConfig?.resolution === '1080p' ? 1080 : 720;

          // Prepare stream via ffmpeg pipeline
          const prep = prepareStream(
            videoPath,
            {
              width,
              height,
              frameRate: fps,
              noTranscoding: false
            },
            this.abortController?.signal
          );

          await playStream(
            prep.output,
            this.streamer!,
            {
              width,
              height,
              frameRate: fps,
              type: 'go-live'
            },
            this.abortController?.signal
          );

          // Small delay before looping the video again
          await new Promise(r => setTimeout(r, 200));
        } catch (err: any) {
          if (this.abortController?.signal.aborted || this.isIntentionalStop) {
            break;
          }
          this.log('warn', `Yayın akışı uyarısı: ${err.message}. Yeniden başlatılıyor...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    };

    streamLoop().catch(err => {
      this.log('error', `Yayın döngüsü hatası: ${err.message}`);
    });
  }

  private scheduleReconnect() {
    if (this.isIntentionalStop || !this.status.active) return;

    this.status.reconnectAttempts++;
    const backoffs = [5000, 10000, 20000];
    const delay = backoffs[Math.min(this.status.reconnectAttempts - 1, backoffs.length - 1)];

    this.log('warn', `⚠️ Bağlantı koptu. ${delay / 1000} saniye içinde yeniden bağlanılıyor (Deneme ${this.status.reconnectAttempts})...`);

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connectAndStream();
    }, delay);
  }

  public async stop(): Promise<void> {
    this.isIntentionalStop = true;
    this.status.active = false;
    this.status.connected = false;
    this.status.streaming = false;

    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = undefined;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }

    if (this.streamer) {
      try {
        await this.streamer.stopStream();
      } catch (_) {}
      try {
        await this.streamer.leaveVoice();
      } catch (_) {}
      this.streamer = undefined;
    }

    this.status.uptimeSeconds = 0;
    this.log('info', '🛑 7/24 Ses & Go Live yayını durduruldu.');
    this.emit('status_updated', this.getStatus());
  }
}

export const voiceStreamService = new VoiceStreamService();
