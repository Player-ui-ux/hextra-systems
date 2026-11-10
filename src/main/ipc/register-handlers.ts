import { ipcMain, BrowserWindow, shell } from 'electron';
import { tokenStore } from '../services/token-store';
import { clientManager } from '../services/discord-client-manager';
import { questsService } from '../services/quests-service';
import { voiceStreamService } from '../services/voice-stream-service';
import { badgeFarmerService } from '../services/badge-farmer-service';
import { clonerService } from '../services/cloner-service';
import { dmCleanerService } from '../services/dm-cleaner-service';
import { emojiService } from '../services/emoji-service';
import { hypeSquadService } from '../services/hypesquad-service';
import { LogEntry } from '../../types';

let logIdCounter = 0;

export function registerIpcHandlers(mainWindow: BrowserWindow, sendToTray: () => void) {
  // Broadcast log helper
  const sendLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('event:log', {
        id: `log-${Date.now()}-${++logIdCounter}`,
        timestamp: new Date().toLocaleTimeString(),
        ...entry
      });
    }
  };

  // Attach service logs to renderer
  const attachServiceLogger = (service: any, defaultModule: LogEntry['module']) => {
    service.on('log', (data: { level: LogEntry['level']; message: string; module?: LogEntry['module'] }) => {
      sendLog({
        module: data.module || defaultModule,
        level: data.level,
        message: data.message
      });
    });
  };

  attachServiceLogger(clientManager, 'AUTH');
  attachServiceLogger(questsService, 'QUESTS');
  attachServiceLogger(voiceStreamService, 'VOICE');
  attachServiceLogger(badgeFarmerService, 'BADGES');
  attachServiceLogger(clonerService, 'CLONER');
  attachServiceLogger(dmCleanerService, 'DM_CLEANER');
  attachServiceLogger(emojiService, 'EMOJI');
  attachServiceLogger(hypeSquadService, 'HYPESQUAD');

  // Push event updates to renderer
  questsService.on('quests_updated', (quests) => {
    mainWindow.webContents.send('event:quests-updated', quests);
  });
  voiceStreamService.on('status_updated', (status) => {
    mainWindow.webContents.send('event:voice-status', status);
  });
  badgeFarmerService.on('status_updated', (status) => {
    mainWindow.webContents.send('event:badges-status', status);
  });
  clonerService.on('progress_updated', (progress) => {
    mainWindow.webContents.send('event:cloner-progress', progress);
  });
  dmCleanerService.on('status_updated', (status) => {
    mainWindow.webContents.send('event:dm-status', status);
  });

  // --- WINDOW CONTROLS ---
  ipcMain.handle('window:minimize', () => mainWindow.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.handle('window:close', () => mainWindow.close());
  ipcMain.handle('window:to-tray', () => sendToTray());

  // --- ACCOUNTS / TOKENS ---
  ipcMain.handle('accounts:list', async () => {
    return tokenStore.getAccounts();
  });

  ipcMain.handle('accounts:add', async (_, { token }: { token: string }) => {
    const acc = await clientManager.validateToken(token);
    return acc;
  });

  ipcMain.handle('accounts:remove', async (_, { id }: { id: string }) => {
    const accs = tokenStore.getAccounts();
    const target = accs.find(a => a.id === id);
    if (target) {
      clientManager.disconnect(target.token);
    }
    tokenStore.removeAccount(id);
    return tokenStore.getAccounts();
  });

  // --- QUESTS ---
  ipcMain.handle('quests:list', async (_, { token }: { token: string }) => {
    return await questsService.fetchQuests(token);
  });

  ipcMain.handle('quests:enroll', async (_, { token, questId }: { token: string; questId: string }) => {
    return await questsService.enrollQuest(token, questId);
  });

  ipcMain.handle('quests:claim', async (_, { token, questId }: { token: string; questId: string }) => {
    return await questsService.claimReward(token, questId);
  });

  ipcMain.handle('quests:start-auto', async (_, { token }: { token: string }) => {
    questsService.startAutoFarmer(token);
    return true;
  });

  ipcMain.handle('quests:stop-auto', async () => {
    questsService.stopAutoFarmer();
    return true;
  });

  ipcMain.handle('quests:status', async () => {
    return questsService.getStatus();
  });

  // --- 7/24 VOICE & GO LIVE ---
  ipcMain.handle('voice:get-guilds', async (_, { token }: { token: string }) => {
    return await voiceStreamService.getGuilds(token);
  });

  ipcMain.handle('voice:get-channels', async (_, { token, guildId }: { token: string; guildId: string }) => {
    return await voiceStreamService.getVoiceChannels(token, guildId);
  });

  ipcMain.handle('voice:start', async (_, { token, config }) => {
    await voiceStreamService.start(token, config);
    return voiceStreamService.getStatus();
  });

  ipcMain.handle('voice:stop', async () => {
    await voiceStreamService.stop();
    return voiceStreamService.getStatus();
  });

  ipcMain.handle('voice:status', async () => {
    return voiceStreamService.getStatus();
  });

  // --- BADGE FARMER ---
  ipcMain.handle('badges:get-apps', async (_, { token }: { token: string }) => {
    return await badgeFarmerService.getDetectableApps(token);
  });

  ipcMain.handle('badges:start-diversity', async (_, { token }: { token: string }) => {
    badgeFarmerService.startDiversityFarmer(token);
    return true;
  });

  ipcMain.handle('badges:stop-diversity', async () => {
    badgeFarmerService.stopDiversityFarmer();
    return true;
  });

  ipcMain.handle(
    'badges:start-playtime',
    async (_, { token, gameName, appId }: { token: string; gameName: string; appId: string }) => {
      badgeFarmerService.startPlaytimeFarmer(token, gameName, appId);
      return true;
    }
  );

  ipcMain.handle('badges:stop-playtime', async () => {
    badgeFarmerService.stopPlaytimeFarmer();
    return true;
  });

  ipcMain.handle(
    'badges:start-streamer',
    async (_, { token, guildId, channelId }: { token: string; guildId: string; channelId: string }) => {
      await badgeFarmerService.startStreamerBadgeFarmer(token, guildId, channelId);
      return true;
    }
  );

  ipcMain.handle('badges:stop-streamer', async () => {
    await badgeFarmerService.stopStreamerBadgeFarmer();
    return true;
  });

  ipcMain.handle('badges:status', async () => {
    return badgeFarmerService.getStatus();
  });

  // --- SERVER CLONER ---
  ipcMain.handle('cloner:start', async (_, { token, config }) => {
    // Fire in background to keep IPC snappy
    clonerService.startCloning(token, config).catch(e => {
      sendLog({ module: 'CLONER', level: 'error', message: e.message });
    });
    return true;
  });

  ipcMain.handle('cloner:stop', async () => {
    clonerService.stop();
    return true;
  });

  ipcMain.handle('cloner:status', async () => {
    return clonerService.getProgress();
  });

  // --- DM CLEANER ---
  ipcMain.handle('dm:get-channels', async (_, { token }: { token: string }) => {
    return await dmCleanerService.getDmChannels(token);
  });

  ipcMain.handle('dm:start', async (_, { token, config }) => {
    dmCleanerService.start(token, config).catch(e => {
      sendLog({ module: 'DM_CLEANER', level: 'error', message: e.message });
    });
    return true;
  });

  ipcMain.handle('dm:stop', async () => {
    dmCleanerService.stop();
    return true;
  });

  ipcMain.handle('dm:status', async () => {
    return dmCleanerService.getStatus();
  });

  // --- EMOJIS ---
  ipcMain.handle('emoji:list', async (_, { token, guildId }: { token: string; guildId: string }) => {
    return await emojiService.getGuildEmojis(token, guildId);
  });

  ipcMain.handle('emoji:download-zip', async (_, { token, guildId }: { token: string; guildId: string }) => {
    return await emojiService.downloadEmojisZip(token, guildId);
  });

  ipcMain.handle(
    'emoji:upload',
    async (_, { token, targetGuildId, emojis }: { token: string; targetGuildId: string; emojis: any[] }) => {
      return await emojiService.uploadEmojisToGuild(token, targetGuildId, emojis);
    }
  );

  // --- HYPESQUAD ---
  ipcMain.handle('hypesquad:set', async (_, { token, houseId }: { token: string; houseId: 1 | 2 | 3 }) => {
    await hypeSquadService.setHouse(token, houseId);
    return true;
  });

  ipcMain.handle('hypesquad:leave', async (_, { token }: { token: string }) => {
    await hypeSquadService.leaveHypeSquad(token);
    return true;
  });

  // --- EXTERNAL LINKS ---
  ipcMain.handle('app:open-external', async (_, { url }: { url: string }) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('discord://'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });
}

