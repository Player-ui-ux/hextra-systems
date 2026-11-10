import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Play,
  Square,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { Account, DmCleanerConfig, DmCleanerStatus } from '../../types';

interface DmCleanerViewProps {
  activeAccount?: Account;
}

export const DmCleanerView: React.FC<DmCleanerViewProps> = ({ activeAccount }) => {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [customChannelId, setCustomChannelId] = useState<string>('');
  const [delayMs, setDelayMs] = useState<number>(1200);
  const [randomJitterMs, setRandomJitterMs] = useState<number>(400);
  const [loadingChannels, setLoadingChannels] = useState<boolean>(false);

  const [status, setStatus] = useState<DmCleanerStatus>({
    active: false,
    totalFound: 0,
    deletedCount: 0,
    rateLimitWaitMs: 0
  });

  useEffect(() => {
    if (activeAccount) {
      loadChannels();
      loadStatus();
    }
    const unsub = window.electronAPI.onDmStatus((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, [activeAccount]);

  const loadStatus = async () => {
    const s = await window.electronAPI.getDmStatus();
    setStatus(s);
  };

  const loadChannels = async () => {
    if (!activeAccount) return;
    setLoadingChannels(true);
    try {
      const list = await window.electronAPI.getDmChannels(activeAccount.token);
      setChannels(list || []);
    } catch (_) {
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleToggleCleaner = async () => {
    if (!activeAccount) return;

    if (status.active) {
      await window.electronAPI.stopDmCleaner();
    } else {
      let target = selectedTarget;
      if (target === 'custom') {
        if (!customChannelId.trim()) {
          alert('Lütfen bir DM Kanal ID girin.');
          return;
        }
        target = customChannelId.trim();
      }

      const config: DmCleanerConfig = {
        target,
        delayMs: Number(delayMs) || 1200,
        randomJitterMs: Number(randomJitterMs) || 400
      };

      await window.electronAPI.startDmCleaner(activeAccount.token, config);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-hextra-red" />
            <span>Gelişmiş DM Temizleyici (DM Cleaner)</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Yalnızca sizin gönderdiğiniz mesajları filtreler ve rate-limit korumalı jitter gecikmesiyle siler.
          </p>
        </div>

        <button
          onClick={handleToggleCleaner}
          className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
            status.active
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
              : 'cyber-btn-red'
          }`}
        >
          {status.active ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Silmeyi Durdur</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Mesajları Silmeyi Başlat</span>
            </>
          )}
        </button>
      </div>

      {/* Live Counter Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Silinen Mesaj Sayısı</div>
          <div className="text-2xl font-bold font-mono text-hextra-red mt-1">
            {status.deletedCount}
          </div>
        </div>

        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Aktif Taranan Kanal</div>
          <div className="text-sm font-bold font-mono text-white mt-1 truncate">
            {status.currentChannelName || (status.active ? 'Taranıyor...' : 'Beklemede')}
          </div>
        </div>

        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Rate Limit Durumu</div>
          <div className="text-sm font-bold font-mono mt-1 flex items-center space-x-1.5">
            {status.rateLimitWaitMs > 0 ? (
              <span className="text-yellow-400 flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                <span>Bekleniyor: {Math.ceil(status.rateLimitWaitMs / 1000)}s</span>
              </span>
            ) : (
              <span className="text-green-400 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Normal Akış</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="cyber-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-hextra-red" />
            <span>Hedef & Hız Ayarları</span>
          </span>
          <button
            onClick={loadChannels}
            disabled={loadingChannels}
            className="text-gray-400 hover:text-white p-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingChannels ? 'animate-spin' : ''}`} />
          </button>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Silinecek Hedef</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              disabled={status.active}
              className="cyber-input w-full text-xs font-mono"
            >
              <option value="all">⚡ TÜM AÇIK DM KANALLARI (Toplu Temizlik)</option>
              <option value="custom">Özel DM Kanal ID Gir</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  💬 {ch.name} ({ch.id})
                </option>
              ))}
            </select>
          </div>

          {selectedTarget === 'custom' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Özel DM Kanal ID</label>
              <input
                type="text"
                value={customChannelId}
                onChange={(e) => setCustomChannelId(e.target.value)}
                placeholder="Örn: 104523456789012345"
                disabled={status.active}
                className="cyber-input w-full text-xs font-mono"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-hextra-red/10">
          <div>
            <label className="text-xs text-gray-400 block mb-1 flex items-center justify-between">
              <span>Silme Gecikmesi (Delay)</span>
              <span className="text-hextra-red font-mono">{delayMs} ms</span>
            </label>
            <input
              type="range"
              min="800"
              max="3500"
              step="100"
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
              disabled={status.active}
              className="w-full accent-hextra-red"
            />
            <div className="text-[10px] text-gray-500 mt-1">Önerilen: 1200ms - 1500ms</div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 flex items-center justify-between">
              <span>Rastgele Doğal Sapma (Jitter)</span>
              <span className="text-hextra-red font-mono">+{randomJitterMs} ms</span>
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={randomJitterMs}
              onChange={(e) => setRandomJitterMs(Number(e.target.value))}
              disabled={status.active}
              className="w-full accent-hextra-red"
            />
            <div className="text-[10px] text-gray-500 mt-1">İnsan davranışını taklit eder, ban riskini önler.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

