import { EventEmitter } from 'events';
import { discordApi } from './discord-api';
import { Quest, LogEntry } from '../../types';

export class QuestsService extends EventEmitter {
  private activeLoopToken?: string;
  private isRunning: boolean = false;
  private loopTimer?: NodeJS.Timeout;
  private cachedQuests: Quest[] = [];

  constructor() {
    super();
  }

  private log(level: LogEntry['level'], message: string) {
    this.emit('log', {
      module: 'QUESTS',
      level,
      message
    });
  }

  public async fetchQuests(token: string): Promise<Quest[]> {
    try {
      this.log('info', 'Discord Quests (@me) verileri çekiliyor...');
      const response = await discordApi.fetchWithRetry<any>(
        'https://discord.com/api/v9/quests/@me',
        {
          method: 'GET',
          token
        }
      );

      const rawQuests = response?.quests || [];
      const quests: Quest[] = rawQuests.map((q: any) => {
        const config = q.config || {};
        const messages = config.messages || {};
        const userStatus = q.user_status || {};
        const taskConfig = config.task_config || config.task_config_v2 || {};
        const tasksObj = taskConfig.tasks || {};
        const taskKeys = Object.keys(tasksObj);

        let taskType: Quest['taskType'] = 'PLAY_ON_DESKTOP';
        const rawType = String(taskConfig.type || (taskKeys.length > 0 ? taskKeys[0] : '')).toUpperCase();
        if (rawType.includes('VIDEO')) {
          taskType = 'WATCH_VIDEO';
        } else if (rawType.includes('STREAM')) {
          taskType = 'STREAM_ON_DESKTOP';
        } else if (rawType.includes('ACTIVITY')) {
          taskType = 'PLAY_ACTIVITY';
        } else {
          taskType = 'PLAY_ON_DESKTOP';
        }

        // Determine target seconds
        let targetSeconds = 900;
        if (taskConfig.target) {
          targetSeconds = Number(taskConfig.target);
        } else if (taskKeys.length > 0) {
          const firstTask = tasksObj[taskKeys[0]] as any;
          if (firstTask?.target) targetSeconds = Number(firstTask.target);
        }

        // Determine current progress
        let progressSeconds = 0;
        if (userStatus.progress) {
          const pVals = Object.values(userStatus.progress);
          if (pVals.length > 0 && typeof pVals[0] === 'object' && pVals[0] !== null) {
            progressSeconds = Number((pVals[0] as any).value || 0);
          } else if (typeof userStatus.progress === 'number') {
            progressSeconds = userStatus.progress;
          }
        }

        const enrolled = !!userStatus.enrolled_at;
        const completed = !!userStatus.completed_at || progressSeconds >= targetSeconds;
        const claimed = !!userStatus.claimed_at;
        const isExpired = config.expires_at ? new Date(config.expires_at).getTime() <= Date.now() : false;

        // Determine reward name (supports Orbs properly)
        const rewards = config.rewards_config?.rewards || [];
        const orbReward = rewards.find((r: any) => r.orb_quantity || r.premium_orb_quantity);
        const orbCount = orbReward ? (orbReward.orb_quantity || orbReward.premium_orb_quantity) : 0;
        const rewardName = orbCount
          ? `${orbCount} Orbs`
          : (rewards[0]?.messages?.name?.default || rewards[0]?.messages?.name || 'Discord Ödülü');

        return {
          id: q.id,
          name: messages.quest_name || config.quest_name || `Discord Görevi #${q.id}`,
          description: messages.game_publisher || messages.quest_description || 'Discord Görevi',
          publisherName: messages.game_publisher,
          gameTitle: messages.game_title,
          rewardName,
          taskType,
          targetSeconds: targetSeconds || 900,
          progressSeconds: Math.min(progressSeconds, targetSeconds),
          enrolled,
          completed,
          claimed,
          isExpired,
          expiresAt: config.expires_at,
          streamKey: userStatus.stream_key,
          questUrl: `https://discord.com/quests/${q.id}`,
          rewardUrl: config.application?.link || `https://discord.com/quests/${q.id}`
        };
      });

      // Sort:
      // 1. Active uncompleted quests first
      // 2. Active completed quests (ready to claim)
      // 3. Claimed quests
      // 4. Expired quests last
      const now = Date.now();
      quests.sort((a, b) => {
        const aExp = a.expiresAt ? new Date(a.expiresAt).getTime() <= now : false;
        const bExp = b.expiresAt ? new Date(b.expiresAt).getTime() <= now : false;
        if (aExp !== bExp) return aExp ? 1 : -1;

        if (a.claimed !== b.claimed) return a.claimed ? 1 : -1;
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      });

      this.cachedQuests = quests;
      this.emit('quests_updated', quests);
      this.log('success', `${quests.length} adet Discord görevi listelendi.`);
      return quests;
    } catch (err: any) {
      this.log('error', `Görevler çekilemedi: ${err.message}`);
      throw err;
    }
  }

  public async enrollQuest(token: string, questId: string): Promise<boolean> {
    try {
      this.log('info', `Göreve kaydolunuyor (Enroll): Quest ID ${questId}`);
      await discordApi.fetchWithRetry(
        `https://discord.com/api/v9/quests/${questId}/enroll`,
        {
          method: 'POST',
          token,
          body: {
            location: 11,
            is_targeted: false,
            metadata_raw: null
          }
        }
      );
      this.log('success', `Göreve başarıyla kaydolundu: ${questId}`);
      await this.fetchQuests(token);
      return true;
    } catch (err: any) {
      this.log('error', `Göreve kayıt başarısız: ${err.message}`);
      return false;
    }
  }

  public async sendHeartbeat(
    token: string,
    questId: string,
    streamKey?: string,
    terminal: boolean = false
  ): Promise<any> {
    const payload = {
      stream_key: streamKey || `call:0:${Date.now()}`,
      terminal
    };

    return await discordApi.fetchWithRetry(
      `https://discord.com/api/v9/quests/${questId}/heartbeat`,
      {
        method: 'POST',
        token,
        body: payload
      }
    );
  }

  public async sendVideoProgress(
    token: string,
    questId: string,
    timestamp: number
  ): Promise<any> {
    return await discordApi.fetchWithRetry(
      `https://discord.com/api/v9/quests/${questId}/video-progress`,
      {
        method: 'POST',
        token,
        body: {
          timestamp
        }
      }
    );
  }

  public async claimReward(token: string, questId: string): Promise<any> {
    try {
      this.log('info', `Ödül talep ediliyor: Quest ID ${questId}`);
      const result = await discordApi.fetchWithRetry(
        `https://discord.com/api/v9/quests/${questId}/claim-reward`,
        {
          method: 'POST',
          token,
          body: {
            platform: 0,
            location: 11,
            is_targeted: false
          }
        }
      );
      this.log('success', `Ödül başarıyla alındı! Quest ID: ${questId}`);
      await this.fetchQuests(token);
      return result;
    } catch (err: any) {
      if (err.message?.includes('captcha') || err.message?.includes('400')) {
        this.log(
          'warn',
          `ℹ️ Discord bu ödül için güvenlik doğrulaması (Captcha) talep ediyor. Lütfen listedeki "Ödülü Al (Linke Git)" butonu ile ödülü Discord üzerinden tek tıkla teslim alınız.`
        );
        return { captchaRequired: true, questId };
      }
      this.log('error', `Ödül talebi başarısız: ${err.message}`);
      throw err;
    }
  }

  public startAutoFarmer(token: string) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.activeLoopToken = token;
    this.log('info', '⚡ Orbs & Quest Otomatik Kasıcı başlatıldı.');

    this.runFarmerLoop();
  }

  public stopAutoFarmer() {
    this.isRunning = false;
    this.activeLoopToken = undefined;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = undefined;
    }
    this.log('warn', '🛑 Orbs & Quest Otomatik Kasıcı durduruldu.');
    this.emit('farmer_status', { isRunning: false });
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      quests: this.cachedQuests
    };
  }

  private async runFarmerLoop() {
    if (!this.isRunning || !this.activeLoopToken) return;

    try {
      const quests = await this.fetchQuests(this.activeLoopToken);
      const now = Date.now();

      // Only active (not expired) and not yet completed quests need heartbeat / farming
      const farmableQuests = quests.filter(q => {
        const isExp = q.expiresAt ? new Date(q.expiresAt).getTime() <= now : false;
        return !isExp && !q.completed && !q.claimed;
      });

      if (farmableQuests.length === 0) {
        this.log(
          'success',
          '🎉 Tüm aktif görevlerin süresi (%100) tamamlandı! Ödülleri almak için listedeki "Ödülü Al (Linke Git)" butonuna tıklayabilirsiniz.'
        );
        this.stopAutoFarmer();
        return;
      }

      for (const quest of farmableQuests) {
        if (!this.isRunning) break;

        // Auto-enroll if not enrolled
        if (!quest.enrolled) {
          try {
            await this.enrollQuest(this.activeLoopToken, quest.id);
            await new Promise(r => setTimeout(r, 1500));
          } catch (enErr: any) {
            if (enErr.message?.includes('doldu') || enErr.message?.includes('expire')) {
              quest.isExpired = true;
              continue;
            }
          }
        }

        // Handle video quest
        if (quest.taskType === 'WATCH_VIDEO' || quest.taskType === 'WATCH_VIDEO_ON_MOBILE') {
          if (!quest.completed) {
            this.log('info', `[Video Görevi] ${quest.name} ilerletiliyor...`);
            await this.sendVideoProgress(this.activeLoopToken, quest.id, quest.targetSeconds);
            quest.progressSeconds = quest.targetSeconds;
            quest.completed = true;
            this.log(
              'success',
              `🎉 ${quest.name} görevi %100 tamamlandı! "Ödülü Al (Linke Git)" butonunu kullanarak ödülünüzü alabilirsiniz.`
            );
            this.emit('quests_updated', this.cachedQuests);
            await new Promise(r => setTimeout(r, 2000));
          }
        } else {
          // Play or Stream quest heartbeat
          if (!quest.completed) {
            const nextProgress = Math.min(quest.progressSeconds + 25, quest.targetSeconds);
            const isTerminal = nextProgress >= quest.targetSeconds;
            this.log('info', `[Kalp Atışı] ${quest.name}: ${nextProgress}s / ${quest.targetSeconds}s`);

            try {
              await this.sendHeartbeat(
                this.activeLoopToken,
                quest.id,
                quest.streamKey,
                isTerminal
              );
              quest.progressSeconds = nextProgress;
              if (isTerminal) {
                quest.completed = true;
                this.log(
                  'success',
                  `🎉 ${quest.name} görevi %100 tamamlandı! "Ödülü Al (Linke Git)" butonuna tıklayarak Discord üzerinden teslim alabilirsiniz.`
                );
              }
              this.emit('quests_updated', this.cachedQuests);
            } catch (hbErr: any) {
              if (hbErr.message?.includes('doldu') || hbErr.message?.includes('expire')) {
                quest.isExpired = true;
              } else {
                this.log('warn', `Heartbeat hatası (${quest.name}): ${hbErr.message}`);
              }
            }
          }
        }

        // Safety jitter between quests
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (err: any) {
      this.log('error', `Quest döngüsü hatası: ${err.message}`);
    }

    if (this.isRunning) {
      // 20-25 seconds interval with jitter
      const interval = Math.floor(20000 + Math.random() * 5000);
      this.loopTimer = setTimeout(() => this.runFarmerLoop(), interval);
    }
  }
}

export const questsService = new QuestsService();

