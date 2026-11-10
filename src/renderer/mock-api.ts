import {
  Account,
  Quest,
  VoiceStreamStatus,
  BadgeFarmerStatus,
  CloneProgress,
  DmCleanerStatus,
  LogEntry
} from '../types';

if (typeof window !== 'undefined' && !window.electronAPI) {
  const mockAccount: Account = {
    id: '109283749281738291',
    token: 'mfa.V1rTU4L_mock_token_hextra_cyber_secured_local_only',
    username: 'HextraUser',
    discriminator: '0001',
    globalName: 'Hextra Studio Official',
    status: 'online',
    createdAt: Date.now() - 86400000 * 15
  };

  (window as any).__MOCK_ACTIVE_ACCOUNT__ = mockAccount;
  (window as any).__MOCK_ACCOUNTS__ = [mockAccount];

  const mockQuests: Quest[] = [
    {
      id: 'quest_marvel_rivals',
      name: 'Marvel Rivals Season Launch',
      description: 'Discord Masaüstü uygulamasında en az 15 dakika Marvel Rivals oyna.',
      publisherName: 'NetEase Games',
      gameTitle: 'Marvel Rivals',
      rewardName: 'Exclusive Cyberpunk Spray & 500 Orbs',
      taskType: 'PLAY_ON_DESKTOP',
      targetSeconds: 900,
      progressSeconds: 765,
      enrolled: true,
      completed: false,
      claimed: false,
      expiresAt: '2026-12-31T23:59:59Z'
    },
    {
      id: 'quest_genshin_impact',
      name: 'Genshin Impact Live Stream',
      description: 'Bir ses kanalında arkadaşlarına en az 15 dakika Go Live ekran yayını yap.',
      publisherName: 'HoYoverse',
      gameTitle: 'Genshin Impact',
      rewardName: '30x Primogems & Special In-game Bundle',
      taskType: 'STREAM_ON_DESKTOP',
      targetSeconds: 900,
      progressSeconds: 900,
      enrolled: true,
      completed: true,
      claimed: false,
      expiresAt: '2026-12-15T23:59:59Z'
    },
    {
      id: 'quest_the_finals',
      name: 'The Finals Season Trailer Video',
      description: 'Discord içinden 15 dakikalık video içeriğini izle.',
      publisherName: 'Embark Studios',
      gameTitle: 'The Finals',
      rewardName: 'Neon Red Weapon Skin',
      taskType: 'WATCH_VIDEO',
      targetSeconds: 900,
      progressSeconds: 900,
      enrolled: true,
      completed: true,
      claimed: true,
      expiresAt: '2026-11-30T23:59:59Z'
    },
    {
      id: 'quest_zzz',
      name: 'Zenless Zone Zero New Version',
      description: 'Masaüstünde Zenless Zone Zero oyununu 15 dakika çalıştır.',
      publisherName: 'HoYoverse',
      gameTitle: 'Zenless Zone Zero',
      rewardName: '60x Polychromes',
      taskType: 'PLAY_ON_DESKTOP',
      targetSeconds: 900,
      progressSeconds: 0,
      enrolled: false,
      completed: false,
      claimed: false,
      expiresAt: '2027-01-10T23:59:59Z'
    }
  ];

  const mockLogs: LogEntry[] = [
    {
      id: '1',
      timestamp: '20:48:12',
      module: 'AUTH',
      level: 'success',
      message: 'AES-256-GCM donanımsal entropy anahtarı doğrulandı. 1 aktif hesap oturumu açıldı.'
    },
    {
      id: '2',
      timestamp: '20:48:15',
      module: 'SYSTEM',
      level: 'info',
      message: 'Discord Client Kimliği yüklendi: build 359505 | Chrome 128 | Electron 32 (Anti-Ban v9175).'
    },
    {
      id: '3',
      timestamp: '20:48:22',
      module: 'QUESTS',
      level: 'info',
      message: 'GET /quests/@me çağrıldı: 4 aktif Discord görevi tespit edildi.'
    },
    {
      id: '4',
      timestamp: '20:48:30',
      module: 'QUESTS',
      level: 'success',
      message: '[Marvel Rivals] Heartbeat gönderildi (765s / 900s - %85). Otomatik kasma devam ediyor.'
    },
    {
      id: '5',
      timestamp: '20:49:01',
      module: 'VOICE',
      level: 'success',
      message: 'Ses kanalına bağlanıldı: "Cyberpunk Syndicate" -> "🔊 7/24 Lo-Fi Lounge" (RTC Session Active).'
    },
    {
      id: '6',
      timestamp: '20:49:05',
      module: 'VOICE',
      level: 'info',
      message: 'WebRTC Go Live ekran yayını (1080p 60fps) loop akışı başladı. Self-Mute: Açık, Self-Deaf: Açık.'
    },
    {
      id: '7',
      timestamp: '20:49:20',
      module: 'BADGES',
      level: 'success',
      message: 'Presence Gateway op:3 & Science telemetrisi senkronize edildi: Counter-Strike 2 (4,116 Saat).'
    },
    {
      id: '8',
      timestamp: '20:50:00',
      module: 'SYSTEM',
      level: 'info',
      message: 'Arka plan hizmetleri ve koruma protokolleri senkronize. Bellek kullanımı: 42MB.'
    }
  ];

  const logListeners = new Set<(log: LogEntry) => void>();
  const questsListeners = new Set<(quests: Quest[]) => void>();
  const voiceListeners = new Set<(status: VoiceStreamStatus) => void>();
  const badgesListeners = new Set<(status: BadgeFarmerStatus) => void>();
  const clonerListeners = new Set<(progress: CloneProgress) => void>();
  const dmListeners = new Set<(status: DmCleanerStatus) => void>();

  (window as any).electronAPI = {
    minimize: () => console.log('[Mock API] minimize'),
    maximize: () => console.log('[Mock API] maximize'),
    close: () => console.log('[Mock API] close'),
    toTray: () => console.log('[Mock API] toTray'),
    openExternal: async (url: string) => {
      console.log('[Mock API] openExternal:', url);
      return true;
    },

    getAccounts: async () => [mockAccount],
    addAccount: async (_token: string) => mockAccount,
    removeAccount: async (_id: string) => [],

    fetchQuests: async (_token: string) => mockQuests,
    enrollQuest: async (_token: string, _questId: string) => true,
    claimQuest: async (_token: string, _questId: string) => true,
    startQuestFarmer: async (_token: string) => true,
    stopQuestFarmer: async () => true,
    getQuestFarmerStatus: async () => ({
      isRunning: true,
      quests: mockQuests
    }),

    getGuilds: async (_token: string) => [
      { id: 'guild_1', name: 'Cyberpunk Syndicate', icon: null },
      { id: 'guild_2', name: 'Hextra Alpha Club', icon: null },
      { id: 'guild_3', name: 'Night City Underground', icon: null }
    ],
    getVoiceChannels: async (_token: string, _guildId: string) => [
      { id: 'chan_1', name: '🔊 7/24 Lo-Fi Lounge' },
      { id: 'chan_2', name: '🎮 Gaming Stream' },
      { id: 'chan_3', name: '💬 VIP Chat' }
    ],
    startVoiceStream: async (_token: string, _config: any) => ({
      active: true,
      connected: true,
      streaming: true,
      guildId: 'guild_1',
      guildName: 'Cyberpunk Syndicate',
      channelId: 'chan_1',
      channelName: '🔊 7/24 Lo-Fi Lounge',
      reconnectAttempts: 0,
      uptimeSeconds: 147820
    }),
    stopVoiceStream: async () => ({
      active: false,
      connected: false,
      streaming: false,
      reconnectAttempts: 0,
      uptimeSeconds: 0
    }),
    getVoiceStatus: async () => ({
      active: true,
      connected: true,
      streaming: true,
      guildId: 'guild_1',
      guildName: 'Cyberpunk Syndicate',
      channelId: 'chan_1',
      channelName: '🔊 7/24 Lo-Fi Lounge',
      reconnectAttempts: 0,
      uptimeSeconds: 147820
    }),

    getDetectableApps: async (_token: string) => [
      { id: '730', name: 'Counter-Strike 2' },
      { id: '7001', name: 'Valorant' },
      { id: '2175', name: 'League of Legends' },
      { id: '271590', name: 'Grand Theft Auto V' },
      { id: '1091500', name: 'Cyberpunk 2077' }
    ],
    startDiversityFarmer: async (_token: string) => true,
    stopDiversityFarmer: async () => true,
    startPlaytimeFarmer: async (_token: string, _gameName: string, _appId: string) => true,
    stopPlaytimeFarmer: async () => true,
    startStreamerFarmer: async (_token: string, _guildId: string, _channelId: string) => true,
    stopStreamerFarmer: async () => true,
    getBadgeStatus: async () => ({
      diversityActive: true,
      diversityProcessed: 342,
      diversityTotal: 10420,
      currentGameName: 'Grand Theft Auto V',
      currentGameId: '271590',
      playtimeActive: true,
      playtimeGameName: 'Counter-Strike 2',
      playtimeAppId: '730',
      playtimeElapsedSeconds: 14820000,
      streamerActive: true,
      viewerAccountConnected: true,
      viewerUsername: 'ViewerBot#1337'
    }),

    startCloner: async (_token: string, _config: any) => true,
    stopCloner: async () => true,
    getClonerProgress: async () => ({
      active: true,
      stage: 'Kanallar ve İzinler Oluşturuluyor',
      currentStep: 42,
      totalSteps: 48,
      percentage: 88,
      detail: 'Ses kanalı oluşturuldu: #🎮-turnuva-odasi (İzinler uygulandı)'
    }),

    getDmChannels: async (_token: string) => [
      { id: 'dm_1', recipient: { id: 'u1', username: 'NightRider', discriminator: '1337', avatar: null } },
      { id: 'dm_2', recipient: { id: 'u2', username: 'SpamChannel', discriminator: '0000', avatar: null } },
      { id: 'dm_3', recipient: { id: 'u3', username: 'OldContact', discriminator: '4421', avatar: null } }
    ],
    startDmCleaner: async (_token: string, _config: any) => true,
    stopDmCleaner: async () => true,
    getDmStatus: async () => ({
      active: true,
      totalFound: 1850,
      deletedCount: 942,
      currentChannelName: '@NightRider',
      lastDeletedMessageId: '13298129381293812',
      rateLimitWaitMs: 0
    }),

    getGuildEmojis: async (_token: string, _guildId: string) => [
      { id: 'e1', name: 'hextra_fire', animated: true, url: '' },
      { id: 'e2', name: 'cyber_skull', animated: false, url: '' },
      { id: 'e3', name: 'neon_heart', animated: true, url: '' },
      { id: 'e4', name: 'glitch_pepe', animated: true, url: '' }
    ],
    downloadEmojisZip: async (_token: string, _guildId: string) => 'C:\\Users\\User\\Desktop\\emojiler.zip',
    uploadEmojis: async (_token: string, _targetGuildId: string, _emojis: any[]) => ({ success: true, count: 4 }),

    setHypeSquad: async (_token: string, _houseId: number) => true,
    leaveHypeSquad: async (_token: string) => true,

    onLog: (cb: (log: LogEntry) => void) => {
      logListeners.add(cb);
      // Send initial logs
      setTimeout(() => {
        mockLogs.forEach((log) => cb(log));
      }, 50);
      return () => {
        logListeners.delete(cb);
      };
    },
    onQuestsUpdated: (cb: (quests: Quest[]) => void) => {
      questsListeners.add(cb);
      return () => {
        questsListeners.delete(cb);
      };
    },
    onVoiceStatus: (cb: (status: VoiceStreamStatus) => void) => {
      voiceListeners.add(cb);
      return () => {
        voiceListeners.delete(cb);
      };
    },
    onBadgesStatus: (cb: (status: BadgeFarmerStatus) => void) => {
      badgesListeners.add(cb);
      return () => {
        badgesListeners.delete(cb);
      };
    },
    onClonerProgress: (cb: (progress: CloneProgress) => void) => {
      clonerListeners.add(cb);
      return () => {
        clonerListeners.delete(cb);
      };
    },
    onDmStatus: (cb: (status: DmCleanerStatus) => void) => {
      dmListeners.add(cb);
      return () => {
        dmListeners.delete(cb);
      };
    }
  };
}
