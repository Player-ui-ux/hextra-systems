import React, { useState, useEffect } from 'react';
import {
  Award,
  Gamepad2,
  Hourglass,
  Tv,
  Play,
  Square,
  Users,
  Shield,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Account, BadgeFarmerStatus } from '../../types';

interface BadgeFarmerViewProps {
  activeAccount?: Account;
}

const POPULAR_GAMES = [
  { name: 'Counter-Strike 2', id: '730' },
  { name: 'Valorant', id: '7001' },
  { name: 'League of Legends', id: '2175' },
  { name: 'Grand Theft Auto V', id: '271590' },
  { name: 'Dota 2', id: '570' },
  { name: 'Cyberpunk 2077', id: '1091500' },
  { name: 'Minecraft', id: '438122941372039178' }
];

export const BadgeFarmerView: React.FC<BadgeFarmerViewProps> = ({ activeAccount }) => {
  const [activeTab, setActiveTab] = useState<'diversity' | 'playtime' | 'streamer'>('diversity');
  const [status, setStatus] = useState<BadgeFarmerStatus>({
    diversityActive: false,
    diversityProcessed: 0,
    diversityTotal: 0,
    playtimeActive: false,
    playtimeElapsedSeconds: 0,
    streamerActive: false,
    viewerAccountConnected: false
  });

  // Dedicated Playtime State
  const [selectedGame, setSelectedGame] = useState(POPULAR_GAMES[0]);
  const [customGameName, setCustomGameName] = useState('');
  const [customAppId, setCustomAppId] = useState('');

  // Streamer Mode State
  const [guilds, setGuilds] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [streamGuildId, setStreamGuildId] = useState('');
  const [streamChannelId, setStreamChannelId] = useState('');

  useEffect(() => {
    if (activeAccount) {
      loadBadgeStatus();
      loadGuilds();
    }
    const unsub = window.electronAPI.onBadgesStatus((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, [activeAccount]);

  const loadBadgeStatus = async () => {
    const s = await window.electronAPI.getBadgeStatus();
    setStatus(s);
  };

  const loadGuilds = async () => {
    if (!activeAccount) return;
    try {
      const list = await window.electronAPI.getGuilds(activeAccount.token);
      setGuilds(list || []);
      if (list && list.length > 0 && !streamGuildId) {
        setStreamGuildId(list[0].id);
        const chs = await window.electronAPI.getVoiceChannels(activeAccount.token, list[0].id);
        setChannels(chs || []);
        if (chs && chs.length > 0) setStreamChannelId(chs[0].id);
      }
    } catch (_) {}
  };

  const handleGuildChange = async (gId: string) => {
    setStreamGuildId(gId);
    if (!activeAccount) return;
    const chs = await window.electronAPI.getVoiceChannels(activeAccount.token, gId);
    setChannels(chs || []);
    if (chs && chs.length > 0) setStreamChannelId(chs[0].id);
  };

  // Handlers for Mode 1: Game Diversity
  const handleToggleDiversity = async () => {
    if (!activeAccount) return;
    if (status.diversityActive) {
      await window.electronAPI.stopDiversityFarmer();
    } else {
      await window.electronAPI.startDiversityFarmer(activeAccount.token);
    }
  };

  // Handlers for Mode 2: Playtime
  const handleTogglePlaytime = async () => {
    if (!activeAccount) return;
    if (status.playtimeActive) {
      await window.electronAPI.stopPlaytimeFarmer();
    } else {
      const gName = customGameName.trim() || selectedGame.name;
      const aId = customAppId.trim() || selectedGame.id;
      await window.electronAPI.startPlaytimeFarmer(activeAccount.token, gName, aId);
    }
  };

  // Handlers for Mode 3: Streamer
  const handleToggleStreamer = async () => {
    if (!activeAccount) return;
    if (status.streamerActive) {
      await window.electronAPI.stopStreamerFarmer();
    } else {
      if (!streamGuildId || !streamChannelId) {
        alert('Lütfen geçerli bir sunucu ve ses kanalı seçin.');
        return;
      }
      await window.electronAPI.startStreamerFarmer(activeAccount.token, streamGuildId, streamChannelId);
    }
  };

  if (!activeAccount) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Lütfen önce sol menüden <span className="text-hextra-red">Hesap / Token</span> sekmesine gidip bir Discord hesabı ekleyin ve seçin.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-hextra-red" />
          <span>Discord Rozet Fulleme (Badge Farmer)</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Discord oyun ve yayın rozetlerini (Sampler, Dedicated, Streamer vb.) telemetri ve gateway presence simülasyonu ile fulleyin.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-hextra-red/20 pb-2">
        <button
          onClick={() => setActiveTab('diversity')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'diversity'
              ? 'bg-hextra-red/20 text-white border border-hextra-red/40 shadow-neon-subtle'
              : 'text-gray-400 hover:text-white hover:bg-obsidian-850'
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-hextra-red" />
          <span>1. Oyun Çeşitliliği (10.400+ Oyun)</span>
          {status.diversityActive && <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />}
        </button>

        <button
          onClick={() => setActiveTab('playtime')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'playtime'
              ? 'bg-hextra-red/20 text-white border border-hextra-red/40 shadow-neon-subtle'
              : 'text-gray-400 hover:text-white hover:bg-obsidian-850'
          }`}
        >
          <Hourglass className="w-4 h-4 text-hextra-red" />
          <span>2. Oyun Süresi (5.000 Saat)</span>
          {status.playtimeActive && <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />}
        </button>

        <button
          onClick={() => setActiveTab('streamer')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'streamer'
              ? 'bg-hextra-red/20 text-white border border-hextra-red/40 shadow-neon-subtle'
              : 'text-gray-400 hover:text-white hover:bg-obsidian-850'
          }`}
        >
          <Tv className="w-4 h-4 text-hextra-red" />
          <span>3. Ekran Yayını & İzleyici Rozeti</span>
          {status.streamerActive && <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />}
        </button>
      </div>

      {/* Mode 1: Game Diversity */}
      {activeTab === 'diversity' && (
        <div className="space-y-4">
          <div className="cyber-card p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Gamepad2 className="w-4 h-4 text-hextra-red" />
                  <span>Evrensel Oyun Koleksiyoncusu (Universalist / Sampler)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                  Discord'un doğrulanmış 10.400+ Windows oyununu sırayla simüle eder. Her oyunda 8-12 saniye beklenir,
                  50 oyunda bir 25 saniye güvenlik molası verilir ve Science telemetrisi (<code className="text-hextra-red">game_opened</code>) gönderilir.
                </p>
              </div>

              <button
                onClick={handleToggleDiversity}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 shrink-0 ${
                  status.diversityActive
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    : 'cyber-btn-red'
                }`}
              >
                {status.diversityActive ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Döngüyü Durdur</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>10.400+ Oyun Kasmayı Başlat</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Display */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-mono text-gray-300">
                <span>
                  İşlenen Oyun: <span className="text-hextra-red font-bold">{status.diversityProcessed}</span> /{' '}
                  {status.diversityTotal || '10.400+'}
                </span>
                <span>
                  {status.currentGameName ? (
                    <span className="text-green-400 font-semibold">Oynanıyor: {status.currentGameName}</span>
                  ) : (
                    <span className="text-gray-500">Hazırda bekliyor</span>
                  )}
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-obsidian-850 overflow-hidden border border-hextra-red/20">
                <div
                  className="h-full bg-gradient-to-r from-hextra-red via-hextra-red-bright to-pink-500 transition-all duration-300"
                  style={{
                    width: `${
                      status.diversityTotal > 0
                        ? Math.min(100, Math.round((status.diversityProcessed / status.diversityTotal) * 100))
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="cyber-card p-3 flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-[11px] text-gray-400">Anti-Ban Güvenliği</div>
                  <div className="text-xs font-bold text-white">8-12s Jitter + 25s Mola</div>
                </div>
              </div>
              <div className="cyber-card p-3 flex items-center space-x-3">
                <Activity className="w-5 h-5 text-hextra-red" />
                <div>
                  <div className="text-[11px] text-gray-400">Telemetri</div>
                  <div className="text-xs font-bold text-white">Discord Science API Aktif</div>
                </div>
              </div>
              <div className="cyber-card p-3 flex items-center space-x-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-[11px] text-gray-400">Hedef Rozet</div>
                  <div className="text-xs font-bold text-white">Sampler / Universalist</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Playtime */}
      {activeTab === 'playtime' && (
        <div className="space-y-4">
          <div className="cyber-card p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Hourglass className="w-4 h-4 text-hextra-red" />
                  <span>Oyun Süresi Kasıcı (Dedicated Gamer — 5.000 Saat)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                  Seçtiğiniz oyunu profilinizde aralıksız oynuyor gösterir ve her 12-15 dakikada bir Discord Science telemetrisiyle süreyi senkronize eder.
                </p>
              </div>

              <button
                onClick={handleTogglePlaytime}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 shrink-0 ${
                  status.playtimeActive
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    : 'cyber-btn-red'
                }`}
              >
                {status.playtimeActive ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Süreyi Durdur</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Oyun Süresi Kasmayı Başlat</span>
                  </>
                )}
              </button>
            </div>

            {/* Popular Games Selection */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">Popüler Oyunlardan Seç:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {POPULAR_GAMES.map((game) => {
                  const isChosen = selectedGame.id === game.id && !customGameName;
                  return (
                    <button
                      key={game.id}
                      onClick={() => {
                        setSelectedGame(game);
                        setCustomGameName('');
                        setCustomAppId('');
                      }}
                      disabled={status.playtimeActive}
                      className={`p-2.5 rounded-lg text-xs font-medium text-left transition-all border ${
                        isChosen
                          ? 'border-hextra-red bg-hextra-red/15 text-white shadow-neon-subtle'
                          : 'border-obsidian-700 bg-obsidian-900 text-gray-300 hover:border-hextra-red/30'
                      }`}
                    >
                      <div className="font-semibold">{game.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">ID: {game.id}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Game Name & ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Özel Oyun Adı (İsteğe Bağlı)</label>
                <input
                  type="text"
                  value={customGameName}
                  onChange={(e) => setCustomGameName(e.target.value)}
                  placeholder="Örn: Half-Life 3"
                  disabled={status.playtimeActive}
                  className="cyber-input w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Özel Application ID (İsteğe Bağlı)</label>
                <input
                  type="text"
                  value={customAppId}
                  onChange={(e) => setCustomAppId(e.target.value)}
                  placeholder="Örn: 1091500"
                  disabled={status.playtimeActive}
                  className="cyber-input w-full text-xs font-mono"
                />
              </div>
            </div>

            {/* Status Info */}
            {status.playtimeActive && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between text-xs font-mono text-green-400">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Şu Anda Oynanıyor: <strong>{status.playtimeGameName}</strong></span>
                </div>
                <span>Toplam Kasma Süresi: {Math.floor(status.playtimeElapsedSeconds / 60)} dakika</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Streamer Badge */}
      {activeTab === 'streamer' && (
        <div className="space-y-4">
          <div className="cyber-card p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Tv className="w-4 h-4 text-hextra-red" />
                  <span>Canlı İzleyicili Ekran Yayını (Streamer Rozeti)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                  Discord yayın rozetleri <strong>en az 1 canlı izleyici</strong> şartı koşar. Sistemde 2. bir hesap ekliyse,
                  bu mod otomatik olarak 2. hesabı ses kanalına sokup yayına <strong>Canlı İzleyici (Viewer)</strong> olarak bağlar!
                </p>
              </div>

              <button
                onClick={handleToggleStreamer}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 shrink-0 ${
                  status.streamerActive
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    : 'cyber-btn-red'
                }`}
              >
                {status.streamerActive ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Yayını & İzleyiciyi Durdur</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>İzleyicili Yayını Başlat</span>
                  </>
                )}
              </button>
            </div>

            {/* Guild & Channel selection for Streamer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Yayın Yapılacak Sunucu</label>
                <select
                  value={streamGuildId}
                  onChange={(e) => handleGuildChange(e.target.value)}
                  disabled={status.streamerActive}
                  className="cyber-input w-full text-xs font-mono"
                >
                  {guilds.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Ses Kanalı</label>
                <select
                  value={streamChannelId}
                  onChange={(e) => setStreamChannelId(e.target.value)}
                  disabled={status.streamerActive}
                  className="cyber-input w-full text-xs font-mono"
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      🔊 {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dual Account Viewer Indicator */}
            <div className="cyber-card p-4 flex items-center justify-between border border-hextra-red/20">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-hextra-red" />
                <div>
                  <div className="text-xs font-semibold text-white">Çift Hesap Otomatik İzleyici (Dual Viewer)</div>
                  <div className="text-[11px] text-gray-400">
                    {status.viewerAccountConnected ? (
                      <span className="text-green-400 font-semibold">
                        İzleyici Aktif: @{status.viewerUsername} yayını izliyor!
                      </span>
                    ) : (
                      'Yayın başladığında sistemdeki diğer hesabınız otomatik olarak izleyici olarak katılacak.'
                    )}
                  </div>
                </div>
              </div>

              {status.viewerAccountConnected && (
                <div className="flex items-center space-x-1.5 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded border border-green-500/20 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ŞART SAĞLANDI (1 İZLEYİCİ)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
