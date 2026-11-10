export interface Account {
  id: string; // Discord user ID
  token: string;
  username: string;
  discriminator: string;
  globalName?: string;
  avatar?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline' | 'error';
  lastError?: string;
  createdAt: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  publisherName?: string;
  gameTitle?: string;
  rewardName?: string;
  taskType: 'PLAY_ON_DESKTOP' | 'STREAM_ON_DESKTOP' | 'WATCH_VIDEO' | 'WATCH_VIDEO_ON_MOBILE' | 'PLAY_ACTIVITY' | 'UNKNOWN';
  targetSeconds: number;
  progressSeconds: number;
  enrolled: boolean;
  completed: boolean;
  claimed: boolean;
  isExpired?: boolean;
  expiresAt?: string;
  streamKey?: string;
  questUrl?: string;
  rewardUrl?: string;
}

export interface VoiceStreamConfig {
  guildId: string;
  channelId: string;
  selfMute: boolean;
  selfDeaf: boolean;
  fakeCamera: boolean;
  goLive: boolean;
  fps: number;
  resolution: '720p' | '1080p';
}

export interface VoiceStreamStatus {
  active: boolean;
  connected: boolean;
  streaming: boolean;
  guildId?: string;
  guildName?: string;
  channelId?: string;
  channelName?: string;
  reconnectAttempts: number;
  uptimeSeconds: number;
}

export interface BadgeFarmerStatus {
  // Sampler Mode
  diversityActive: boolean;
  diversityProcessed: number;
  diversityTotal: number;
  currentGameName?: string;
  currentGameId?: string;

  // Dedicated Mode
  playtimeActive: boolean;
  playtimeGameName?: string;
  playtimeAppId?: string;
  playtimeElapsedSeconds: number;

  // Streamer Mode
  streamerActive: boolean;
  viewerAccountConnected: boolean;
  viewerUsername?: string;
}

export interface DetectableApp {
  id: string;
  name: string;
  executables?: { name: string; os: string }[];
}

export interface CloneConfig {
  sourceGuildId: string;
  targetGuildId: string;
  wipeTarget: boolean;
  cloneRoles: boolean;
  cloneCategories: boolean;
  cloneChannels: boolean;
  clonePermissions: boolean;
  cloneEmojis: boolean;
  cloneServerInfo: boolean;
}

export interface CloneProgress {
  active: boolean;
  stage: string;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  detail: string;
}

export interface DmCleanerConfig {
  target: 'all' | string; // 'all' or channelId / userId
  delayMs: number;
  randomJitterMs: number;
  maxMessages?: number;
}

export interface DmCleanerStatus {
  active: boolean;
  totalFound: number;
  deletedCount: number;
  currentChannelName?: string;
  lastDeletedMessageId?: string;
  rateLimitWaitMs: number;
}

export interface EmojiInfo {
  id: string;
  name: string;
  animated: boolean;
  url: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  module: 'AUTH' | 'QUESTS' | 'VOICE' | 'BADGES' | 'CLONER' | 'DM_CLEANER' | 'EMOJI' | 'HYPESQUAD' | 'SYSTEM';
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

