import React, { useState, useEffect } from 'react';
import {
  Copy,
  Play,
  Square,
  ShieldAlert,
  FolderTree,
  Smile,
  Info,
  Layers
} from 'lucide-react';
import { Account, CloneConfig, CloneProgress } from '../../types';

interface ClonerViewProps {
  activeAccount?: Account;
}

export const ClonerView: React.FC<ClonerViewProps> = ({ activeAccount }) => {
  const [sourceGuildId, setSourceGuildId] = useState('');
  const [targetGuildId, setTargetGuildId] = useState('');

  const [wipeTarget, setWipeTarget] = useState(true);
  const [cloneRoles, setCloneRoles] = useState(true);
  const [cloneCategories, setCloneCategories] = useState(true);
  const [cloneChannels, setCloneChannels] = useState(true);
  const [clonePermissions, setClonePermissions] = useState(true);
  const [cloneEmojis, setCloneEmojis] = useState(true);
  const [cloneServerInfo, setCloneServerInfo] = useState(true);

  const [progress, setProgress] = useState<CloneProgress>({
    active: false,
    stage: 'Bekleniyor',
    currentStep: 0,
    totalSteps: 100,
    percentage: 0,
    detail: 'Hazır.'
  });

  useEffect(() => {
    loadStatus();
    const unsub = window.electronAPI.onClonerProgress((p) => {
      setProgress(p);
    });
    return () => unsub();
  }, []);

  const loadStatus = async () => {
    const p = await window.electronAPI.getClonerProgress();
    setProgress(p);
  };

  const handleToggleCloner = async () => {
    if (!activeAccount) return;

    if (progress.active) {
      await window.electronAPI.stopCloner();
    } else {
      if (!sourceGuildId.trim() || !targetGuildId.trim()) {
        alert('Lütfen hem Kaynak Sunucu ID hem de Hedef Sunucu ID girin.');
        return;
      }

      if (
        wipeTarget &&
        !confirm(
          'DİKKAT: Hedef sunucudaki tüm mevcut kanallar ve roller silinecek! Devam etmek istiyor musunuz?'
        )
      ) {
        return;
      }

      const config: CloneConfig = {
        sourceGuildId: sourceGuildId.trim(),
        targetGuildId: targetGuildId.trim(),
        wipeTarget,
        cloneRoles,
        cloneCategories,
        cloneChannels,
        clonePermissions,
        cloneEmojis,
        cloneServerInfo
      };

      await window.electronAPI.startCloner(activeAccount.token, config);
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
          <Copy className="w-5 h-5 text-hextra-red" />
          <span>Sunucu Klonlayıcı (Server Cloner)</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Kaynak sunucunun rollerini, kanallarını, izin geçersiz kılmalarını ve emojilerini hedef sunucunuza birebir kopyalayın.
        </p>
      </div>

      {/* Inputs */}
      <div className="cyber-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Kaynak Sunucu ID (Kopyalanacak Sunucu)
            </label>
            <input
              type="text"
              value={sourceGuildId}
              onChange={(e) => setSourceGuildId(e.target.value)}
              placeholder="Örn: 104523456789012345"
              disabled={progress.active}
              className="cyber-input w-full text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Hedef Sunucu ID (Yönetici Yetkinizin Olduğu Sunucu)
            </label>
            <input
              type="text"
              value={targetGuildId}
              onChange={(e) => setTargetGuildId(e.target.value)}
              placeholder="Örn: 124567890123456789"
              disabled={progress.active}
              className="cyber-input w-full text-xs font-mono"
            />
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="space-y-2 pt-2 border-t border-hextra-red/10">
          <label className="text-xs text-gray-300 font-semibold block mb-2">Klonlama Seçenekleri:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="cyber-card p-3 flex items-center justify-between cursor-pointer border border-hextra-red/20">
              <span className="text-xs text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-hextra-red" />
                <span>Hedefi Temizle (Wipe)</span>
              </span>
              <input
                type="checkbox"
                checked={wipeTarget}
                onChange={(e) => setWipeTarget(e.target.checked)}
                disabled={progress.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>

            <label className="cyber-card p-3 flex items-center justify-between cursor-pointer border border-hextra-red/20">
              <span className="text-xs text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-hextra-red" />
                <span>Rolleri Kopyala</span>
              </span>
              <input
                type="checkbox"
                checked={cloneRoles}
                onChange={(e) => setCloneRoles(e.target.checked)}
                disabled={progress.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>

            <label className="cyber-card p-3 flex items-center justify-between cursor-pointer border border-hextra-red/20">
              <span className="text-xs text-white flex items-center space-x-2">
                <FolderTree className="w-4 h-4 text-hextra-red" />
                <span>Kanallar & Kategoriler</span>
              </span>
              <input
                type="checkbox"
                checked={cloneChannels && cloneCategories}
                onChange={(e) => {
                  setCloneChannels(e.target.checked);
                  setCloneCategories(e.target.checked);
                }}
                disabled={progress.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>

            <label className="cyber-card p-3 flex items-center justify-between cursor-pointer border border-hextra-red/20">
              <span className="text-xs text-white flex items-center space-x-2">
                <Info className="w-4 h-4 text-hextra-red" />
                <span>İzin Overwrite'ları</span>
              </span>
              <input
                type="checkbox"
                checked={clonePermissions}
                onChange={(e) => setClonePermissions(e.target.checked)}
                disabled={progress.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>

            <label className="cyber-card p-3 flex items-center justify-between cursor-pointer border border-hextra-red/20">
              <span className="text-xs text-white flex items-center space-x-2">
                <Smile className="w-4 h-4 text-hextra-red" />
                <span>Sunucu Emojileri</span>
              </span>
              <input
                type="checkbox"
                checked={cloneEmojis}
                onChange={(e) => setCloneEmojis(e.target.checked)}
                disabled={progress.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>

            <label className="cyber-card p-3 flex items-center justify-between cursor-pointer border border-hextra-red/20">
              <span className="text-xs text-white flex items-center space-x-2">
                <Info className="w-4 h-4 text-hextra-red" />
                <span>Ad & İkon (Server Info)</span>
              </span>
              <input
                type="checkbox"
                checked={cloneServerInfo}
                onChange={(e) => setCloneServerInfo(e.target.checked)}
                disabled={progress.active}
                className="accent-hextra-red w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleToggleCloner}
            className={`px-6 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
              progress.active
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                : 'cyber-btn-red'
            }`}
          >
            {progress.active ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Klonlamayı Durdur</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Klonlamayı Başlat</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="cyber-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-mono text-gray-400">İşlem Aşaması</div>
            <div className="text-sm font-bold text-white mt-0.5">{progress.stage}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase font-mono text-gray-400">Genel İlerleme</div>
            <div className="text-lg font-bold font-mono text-hextra-red">{progress.percentage}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 rounded-full bg-obsidian-850 overflow-hidden border border-hextra-red/20">
          <div
            className="h-full bg-gradient-to-r from-hextra-red to-hextra-red-bright transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        <div className="text-xs font-mono text-gray-400 flex items-center justify-between">
          <span>{progress.detail}</span>
          <span>
            Adım: {progress.currentStep} / {progress.totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
};

