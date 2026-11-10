import { contextBridge, ipcRenderer } from 'electron';
import {
  Account,
  Quest,
  VoiceStreamConfig,
  VoiceStreamStatus,
  BadgeFarmerStatus,
  CloneConfig,
  CloneProgress,
  DmCleanerConfig,
  DmCleanerStatus,
  LogEntry
} from '../types';

export const electronAPI = {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  toTray: () => ipcRenderer.invoke('window:to-tray'),
  openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke('app:open-external', { url }),

  // Accounts
  getAccounts: (): Promise<Account[]> => ipcRenderer.invoke('accounts:list'),
  addAccount: (token: string): Promise<Account> => ipcRenderer.invoke('accounts:add', { token }),
  removeAccount: (id: string): Promise<Account[]> => ipcRenderer.invoke('accounts:remove', { id }),

  // Quests
  fetchQuests: (token: string): Promise<Quest[]> => ipcRenderer.invoke('quests:list', { token }),
  enrollQuest: (token: string, questId: string): Promise<boolean> =>
    ipcRenderer.invoke('quests:enroll', { token, questId }),
  claimQuest: (token: string, questId: string): Promise<any> =>
    ipcRenderer.invoke('quests:claim', { token, questId }),
  startQuestFarmer: (token: string): Promise<boolean> =>
    ipcRenderer.invoke('quests:start-auto', { token }),
  stopQuestFarmer: (): Promise<boolean> => ipcRenderer.invoke('quests:stop-auto'),
  getQuestFarmerStatus: (): Promise<{ isRunning: boolean; quests: Quest[] }> =>
    ipcRenderer.invoke('quests:status'),

  // 7/24 Voice & Go Live
  getGuilds: (token: string): Promise<any[]> => ipcRenderer.invoke('voice:get-guilds', { token }),
  getVoiceChannels: (token: string, guildId: string): Promise<any[]> =>
    ipcRenderer.invoke('voice:get-channels', { token, guildId }),
  startVoiceStream: (token: string, config: VoiceStreamConfig): Promise<VoiceStreamStatus> =>
    ipcRenderer.invoke('voice:start', { token, config }),
  stopVoiceStream: (): Promise<VoiceStreamStatus> => ipcRenderer.invoke('voice:stop'),
  getVoiceStatus: (): Promise<VoiceStreamStatus> => ipcRenderer.invoke('voice:status'),

  // Badge Farmer
  getDetectableApps: (token: string): Promise<any[]> =>
    ipcRenderer.invoke('badges:get-apps', { token }),
  startDiversityFarmer: (token: string): Promise<boolean> =>
    ipcRenderer.invoke('badges:start-diversity', { token }),
  stopDiversityFarmer: (): Promise<boolean> => ipcRenderer.invoke('badges:stop-diversity'),
  startPlaytimeFarmer: (token: string, gameName: string, appId: string): Promise<boolean> =>
    ipcRenderer.invoke('badges:start-playtime', { token, gameName, appId }),
  stopPlaytimeFarmer: (): Promise<boolean> => ipcRenderer.invoke('badges:stop-playtime'),
  startStreamerFarmer: (token: string, guildId: string, channelId: string): Promise<boolean> =>
    ipcRenderer.invoke('badges:start-streamer', { token, guildId, channelId }),
  stopStreamerFarmer: (): Promise<boolean> => ipcRenderer.invoke('badges:stop-streamer'),
  getBadgeStatus: (): Promise<BadgeFarmerStatus> => ipcRenderer.invoke('badges:status'),

  // Cloner
  startCloner: (token: string, config: CloneConfig): Promise<boolean> =>
    ipcRenderer.invoke('cloner:start', { token, config }),
  stopCloner: (): Promise<boolean> => ipcRenderer.invoke('cloner:stop'),
  getClonerProgress: (): Promise<CloneProgress> => ipcRenderer.invoke('cloner:status'),

  // DM Cleaner
  getDmChannels: (token: string): Promise<any[]> => ipcRenderer.invoke('dm:get-channels', { token }),
  startDmCleaner: (token: string, config: DmCleanerConfig): Promise<boolean> =>
    ipcRenderer.invoke('dm:start', { token, config }),
  stopDmCleaner: (): Promise<boolean> => ipcRenderer.invoke('dm:stop'),
  getDmStatus: (): Promise<DmCleanerStatus> => ipcRenderer.invoke('dm:status'),

  // Emojis
  getGuildEmojis: (token: string, guildId: string): Promise<any> =>
    ipcRenderer.invoke('emoji:list', { token, guildId }),
  downloadEmojisZip: (token: string, guildId: string): Promise<string> =>
    ipcRenderer.invoke('emoji:download-zip', { token, guildId }),
  uploadEmojis: (token: string, targetGuildId: string, emojis: any[]): Promise<any> =>
    ipcRenderer.invoke('emoji:upload', { token, targetGuildId, emojis }),

  // HypeSquad
  setHypeSquad: (token: string, houseId: 1 | 2 | 3): Promise<boolean> =>
    ipcRenderer.invoke('hypesquad:set', { token, houseId }),
  leaveHypeSquad: (token: string): Promise<boolean> =>
    ipcRenderer.invoke('hypesquad:leave', { token }),

  // Event Listeners
  onLog: (callback: (log: LogEntry) => void) => {
    const handler = (_: any, log: LogEntry) => callback(log);
    ipcRenderer.on('event:log', handler);
    return () => ipcRenderer.removeListener('event:log', handler);
  },
  onQuestsUpdated: (callback: (quests: Quest[]) => void) => {
    const handler = (_: any, quests: Quest[]) => callback(quests);
    ipcRenderer.on('event:quests-updated', handler);
    return () => ipcRenderer.removeListener('event:quests-updated', handler);
  },
  onVoiceStatus: (callback: (status: VoiceStreamStatus) => void) => {
    const handler = (_: any, status: VoiceStreamStatus) => callback(status);
    ipcRenderer.on('event:voice-status', handler);
    return () => ipcRenderer.removeListener('event:voice-status', handler);
  },
  onBadgesStatus: (callback: (status: BadgeFarmerStatus) => void) => {
    const handler = (_: any, status: BadgeFarmerStatus) => callback(status);
    ipcRenderer.on('event:badges-status', handler);
    return () => ipcRenderer.removeListener('event:badges-status', handler);
  },
  onClonerProgress: (callback: (progress: CloneProgress) => void) => {
    const handler = (_: any, progress: CloneProgress) => callback(progress);
    ipcRenderer.on('event:cloner-progress', handler);
    return () => ipcRenderer.removeListener('event:cloner-progress', handler);
  },
  onDmStatus: (callback: (status: DmCleanerStatus) => void) => {
    const handler = (_: any, status: DmCleanerStatus) => callback(status);
    ipcRenderer.on('event:dm-status', handler);
    return () => ipcRenderer.removeListener('event:dm-status', handler);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
export type ElectronAPI = typeof electronAPI;

