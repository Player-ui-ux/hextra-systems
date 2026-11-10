import React, { useState, useEffect } from 'react';
import {
  Radio,
  Tv,
  MicOff,
  VolumeX,
  Camera,
  Play,
  Square,
  RefreshCw,
  Clock,
  ShieldCheck,
  Server
} from 'lucide-react';
import { Account, VoiceStreamConfig, VoiceStreamStatus } from '../../types';

interface VoiceStreamViewProps {
  activeAccount?: Account;
}

export const VoiceStreamView: React.FC<VoiceStreamViewProps> = ({ activeAccount }) => {
  const [guilds, setGuilds] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [loadingGuilds, setLoadingGuilds] = useState<boolean>(false);
  const [loadingChannels, setLoadingChannels] = useState<boolean>(false);

  const [selfMute, setSelfMute] = useState<boolean>(true);
  const [selfDeaf, setSelfDeaf] = useState<boolean>(true);
  const [fakeCamera, setFakeCamera] = useState<boolean>(false);
  const [goLive, setGoLive] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(30);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  const [status, setStatus] = useState<VoiceStreamStatus>({
    active: false,
    connected: false,
    streaming: false,
    reconnectAttempts: 0,
    uptimeSeconds: 0
  });

  useEffect(() => {
    if (activeAccount) {
      loadGuilds();
      fetchStatus();
    }

    const unsub = window.electronAPI.onVoiceStatus((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, [activeAccount]);

  const fetchStatus = async () => {
    const s = await window.electronAPI.getVoiceStatus();
    setStatus(s);
  };

  const loadGuilds = async () => {
    if (!activeAccount) return;
    setLoadingGuilds(true);
    try {
      const list = await window.electronAPI.getGuilds(activeAccount.token);
      setGuilds(list || []);
      if (list && list.length > 0 && !selectedGuildId) {
        setSelectedGuildId(list[0].id);
        loadChannels(list[0].id);
      }
    } catch (_) {
    } finally {
      setLoadingGuilds(false);
    }
  };

  const loadChannels = async (guildId: string) => {
    if (!activeAccount || !guildId) return;
    setLoadingChannels(true);
    try {
      const list = await window.electronAPI.getVoiceChannels(activeAccount.token, guildId);
      setChannels(list || []);
      if (list && list.length > 0) {
        setSelectedChannelId(list[0].id);
      } else {
        setSelectedChannelId('');
      }
    } catch (_) {
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleGuildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gId = e.target.value;
    setSelectedGuildId(gId);
    loadChannels(gId);
  };

  const handleToggleStart = async () => {
    if (!activeAccount) return;

    if (status.active) {
      await window.electronAPI.stopVoiceStream();
    } else {
      if (!selectedGuildId || !selectedChannelId) {
        alert('Lütfen bir sunucu ve ses kanalı seçin.');
        return;
      }

      const config: VoiceStreamConfig = {
        guildId: selectedGuildId,
        channelId: selectedChannelId,
        selfMute,
        selfDeaf,
        fakeCamera,
        goLive,
        fps,
        resolution
      };

      await window.electronAPI.startVoiceStream(activeAccount.token, config);
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Radio className="w-5 h-5 text-hextra-red" />
            <span>7/24 Ses & Go Live Yayın Kasıcı</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            WebRTC ve ffmpeg üzerinden otomatik siyah ekran akışı ile ses kanalında 7/24 aktif kalın, yayın rozeti kazanın.
          </p>
        </div>

        <button
          onClick={handleToggleStart}
          className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
            status.active
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
              : 'cyber-btn-red'
          }`}
        >
          {status.active ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Yayını & Sesi Durdur</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>7/24 Ses & Yayını Başlat</span>
            </>
          )}
        </button>
      </div>

      {/* Live Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Bağlantı Durumu</div>
          <div className="text-lg font-bold font-mono mt-1 flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status.connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
              }`}
            />
            <span className={status.connected ? 'text-green-400' : 'text-gray-400'}>
              {status.connected ? 'Ses Bağlı' : 'Bağlı Değil'}
            </span>
          </div>
        </div>

        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Go Live Yayını</div>
          <div className="text-lg font-bold font-mono mt-1 flex items-center space-x-2">
            <Tv className={`w-4 h-4 ${status.streaming ? 'text-hextra-red animate-pulse' : 'text-gray-600'}`} />
            <span className={status.streaming ? 'text-hextra-red' : 'text-gray-400'}>
              {status.streaming ? 'Canlı Akışta' : 'Yayın Kapalı'}
            </span>
          </div>
        </div>

        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Aktif Kalma Süresi</div>
          <div className="text-lg font-bold font-mono text-white mt-1 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-hextra-red" />
            <span>{formatUptime(status.uptimeSeconds)}</span>
          </div>
        </div>

        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Oto-Yeniden Bağlanma</div>
          <div className="text-lg font-bold font-mono text-gray-300 mt-1 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span>{status.reconnectAttempts} Deneme</span>
          </div>
        </div>
      </div>

      {/* Channel Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="cyber-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-hextra-red" />
              <span>Sunucu & Ses Kanalı Seçimi</span>
            </span>
            <button
              onClick={loadGuilds}
              disabled={loadingGuilds}
              className="text-gray-400 hover:text-white p-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingGuilds ? 'animate-spin' : ''}`} />
            </button>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Hedef Sunucu</label>
              <select
                value={selectedGuildId}
                onChange={handleGuildChange}
                disabled={status.active || loadingGuilds}
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
              <label className="text-xs text-gray-400 block mb-1">Hedef Ses Kanalı</label>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                disabled={status.active || loadingChannels}
                className="cyber-input w-full text-xs font-mono"
              >
                {channels.length === 0 ? (
                  <option value="">(Bu sunucuda ses kanalı bulunamadı)</option>
                ) : (
                  channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      🔊 {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Stream Settings */}
        <div className="cyber-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-200">Kanal & Yayın Seçenekleri</h2>

          <div className="grid grid-cols-2 gap-3">
            <label
              className={`cyber-card p-3 flex items-center justify-between cursor-pointer border ${
                selfMute ? 'border-hextra-red/40 bg-hextra-red/10' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MicOff className="w-4 h-4 text-hextra-red" />
                <span className="text-xs text-gray-300">Kendini Sustur</span>
              </div>
              <input
                type="checkbox"
                checked={selfMute}
                onChange={(e) => setSelfMute(e.target.checked)}
                disabled={status.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>

            <label
              className={`cyber-card p-3 flex items-center justify-between cursor-pointer border ${
                selfDeaf ? 'border-hextra-red/40 bg-hextra-red/10' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <VolumeX className="w-4 h-4 text-hextra-red" />
                <span className="text-xs text-gray-300">Sağırlaştır</span>
              </div>
              <input
                type="checkbox"
                checked={selfDeaf}
                onChange={(e) => setSelfDeaf(e.target.checked)}
                disabled={status.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>

            <label
              className={`cyber-card p-3 flex items-center justify-between cursor-pointer border ${
                fakeCamera ? 'border-hextra-red/40 bg-hextra-red/10' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-hextra-red" />
                <span className="text-xs text-gray-300">Sahte Kamera</span>
              </div>
              <input
                type="checkbox"
                checked={fakeCamera}
                onChange={(e) => setFakeCamera(e.target.checked)}
                disabled={status.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>

            <label
              className={`cyber-card p-3 flex items-center justify-between cursor-pointer border ${
                goLive ? 'border-hextra-red/40 bg-hextra-red/10' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4 text-hextra-red" />
                <span className="text-xs text-gray-300">Go Live Yayını</span>
              </div>
              <input
                type="checkbox"
                checked={goLive}
                onChange={(e) => setGoLive(e.target.checked)}
                disabled={status.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Yayın Çözünürlüğü</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                disabled={status.active}
                className="cyber-input w-full text-xs font-mono"
              >
                <option value="720p">720p HD (Önerilen - Düşük Kaynak)</option>
                <option value="1080p">1080p Full HD (Nitro)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">FPS Hızı</label>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                disabled={status.active}
                className="cyber-input w-full text-xs font-mono"
              >
                <option value={15}>15 FPS (Ultra Tasarruf)</option>
                <option value={30}>30 FPS (Standart)</option>
                <option value={60}>60 FPS (Akıcı)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

