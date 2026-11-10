import { EventEmitter } from 'events';
import { discordApi } from './discord-api';
import { LogEntry } from '../../types';

export class HypeSquadService extends EventEmitter {
  constructor() {
    super();
  }

  private log(level: LogEntry['level'], message: string) {
    this.emit('log', {
      module: 'HYPESQUAD',
      level,
      message
    });
  }

  public async setHouse(token: string, houseId: 1 | 2 | 3): Promise<void> {
    const houseNames: Record<number, string> = {
      1: 'House of Bravery (Cesaret)',
      2: 'House of Brilliance (Zeka)',
      3: 'House of Balance (Denge)'
    };

    const targetName = houseNames[houseId] || `Ev #${houseId}`;
    this.log('info', `HypeSquad değiştiriliyor: ${targetName}...`);

    try {
      await discordApi.fetchWithRetry(
        'https://discord.com/api/v9/hypesquad/online',
        {
          method: 'POST',
          token,
          body: {
            house_id: houseId
          }
        }
      );

      this.log('success', `🎉 HypeSquad evi başarıyla ${targetName} olarak ayarlandı!`);
    } catch (err: any) {
      this.log('error', `HypeSquad değiştirme hatası: ${err.message}`);
      throw err;
    }
  }

  public async leaveHypeSquad(token: string): Promise<void> {
    this.log('info', 'HypeSquad evinden ayrılınıyor...');
    try {
      await discordApi.fetchWithRetry(
        'https://discord.com/api/v9/hypesquad/online',
        {
          method: 'DELETE',
          token
        }
      );
      this.log('success', 'HypeSquad evinden başarıyla ayrılındı.');
    } catch (err: any) {
      this.log('error', `HypeSquad ayrılma hatası: ${err.message}`);
      throw err;
    }
  }
}

export const hypeSquadService = new HypeSquadService();

