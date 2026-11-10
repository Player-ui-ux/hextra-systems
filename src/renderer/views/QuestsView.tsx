import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Square,
  RefreshCw,
  Gift,
  CheckCircle,
  Video,
  Gamepad2,
  Tv,
  ExternalLink
} from 'lucide-react';
import { Account, Quest } from '../../types';

interface QuestsViewProps {
  activeAccount?: Account;
}

export const QuestsView: React.FC<QuestsViewProps> = ({ activeAccount }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isAutoFarming, setIsAutoFarming] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeAccount) {
      loadQuests();
    }
    // Listen for live quest updates pushed from main process
    const unsub = window.electronAPI.onQuestsUpdated((updated) => {
      setQuests(updated);
    });
    return () => unsub();
  }, [activeAccount]);

  const loadQuests = async () => {
    if (!activeAccount) return;
    setLoading(true);
    try {
      const list = await window.electronAPI.fetchQuests(activeAccount.token);
      setQuests(list);
      const status = await window.electronAPI.getQuestFarmerStatus();
      setIsAutoFarming(status.isRunning);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoFarm = async () => {
    if (!activeAccount) return;
    if (isAutoFarming) {
      await window.electronAPI.stopQuestFarmer();
      setIsAutoFarming(false);
    } else {
      await window.electronAPI.startQuestFarmer(activeAccount.token);
      setIsAutoFarming(true);
    }
  };

  const handleEnroll = async (questId: string) => {
    if (!activeAccount) return;
    await window.electronAPI.enrollQuest(activeAccount.token, questId);
    loadQuests();
  };

  const handleClaim = async (questId: string) => {
    if (!activeAccount) return;
    await window.electronAPI.claimQuest(activeAccount.token, questId);
    loadQuests();
  };

  const handleOpenLink = async (quest: Quest) => {
    const targetUrl = quest.questUrl || `https://discord.com/quests/${quest.id}`;
    if (window.electronAPI.openExternal) {
      await window.electronAPI.openExternal(targetUrl);
    } else {
      window.open(targetUrl, '_blank');
    }
  };

  if (!activeAccount) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Lütfen önce sol menüden <span className="text-hextra-red">Hesap / Token</span> sekmesine gidip bir Discord hesabı ekleyin ve seçin.
      </div>
    );
  }

  const activeQuests = quests.filter(q => !q.isExpired);
  const completedCount = quests.filter(q => q.completed).length;
  const claimedCount = quests.filter(q => q.claimed).length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-full">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-hextra-red" />
            <span>Discord Orbs & Quest Otomatik Kasıcı</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Discord istemci simülasyonu ile aktif görevleri otomatik olarak 900 saniyeye kadar kasın.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadQuests}
            disabled={loading}
            className="cyber-btn-secondary px-3 py-2 rounded-lg text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>

          <button
            onClick={handleToggleAutoFarm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
              isAutoFarming
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                : 'cyber-btn-red'
            }`}
          >
            {isAutoFarming ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Oto-Kasıcıyı Durdur</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tek Tıkla Otomatik Kas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Aktif / Toplam Görev</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            <span className="text-hextra-red">{activeQuests.length}</span> / {quests.length}
          </div>
        </div>
        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Tamamlanan Görevler</div>
          <div className="text-2xl font-bold font-mono text-green-400 mt-1">{completedCount}</div>
        </div>
        <div className="cyber-card p-4">
          <div className="text-[11px] uppercase font-mono text-gray-400">Alınan Ödüller (Orbs)</div>
          <div className="text-2xl font-bold font-mono text-hextra-red mt-1">{claimedCount}</div>
        </div>
      </div>

      {/* Quests List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">Görev Listesi</h2>
          <span className="text-[11px] text-gray-400 font-mono">
            {activeQuests.length} Güncel Görev Hazır
          </span>
        </div>

        {quests.length === 0 ? (
          <div className="cyber-card p-8 text-center text-gray-500 text-xs">
            {loading ? 'Görevler yükleniyor...' : 'Şu anda hesabınız için Discord görevi bulunamadı.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {quests.map((quest) => {
              const progressPct = Math.min(
                100,
                Math.round((quest.progressSeconds / quest.targetSeconds) * 100)
              );

              return (
                <div
                  key={quest.id}
                  className={`cyber-card p-4 space-y-3 ${
                    quest.isExpired ? 'opacity-60 border-zinc-800' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white text-sm">{quest.name}</span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-hextra-red/15 text-hextra-red border border-hextra-red/30 flex items-center space-x-1">
                          {quest.taskType === 'WATCH_VIDEO' ? (
                            <Video className="w-3 h-3" />
                          ) : quest.taskType === 'STREAM_ON_DESKTOP' ? (
                            <Tv className="w-3 h-3" />
                          ) : (
                            <Gamepad2 className="w-3 h-3" />
                          )}
                          <span>{quest.taskType}</span>
                        </span>

                        {quest.isExpired && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            SÜRESİ DOLDU
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{quest.description}</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {quest.isExpired ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-zinc-500 font-mono">Eski Görev</span>
                          <button
                            onClick={() => handleOpenLink(quest)}
                            title="Discord'da Görevi Görüntüle"
                            className="cyber-btn-secondary px-2.5 py-1 rounded text-xs flex items-center space-x-1 text-gray-400 hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Linki Aç</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {!quest.enrolled && (
                            <button
                              onClick={() => handleEnroll(quest.id)}
                              className="cyber-btn-secondary px-3 py-1.5 rounded text-xs font-semibold"
                            >
                              Kaydol (Enroll)
                            </button>
                          )}

                          {quest.completed && !quest.claimed && (
                            <button
                              onClick={() => handleOpenLink(quest)}
                              className="cyber-btn-red px-3.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-hextra-red/20"
                              title="Discord web sayfasına giderek ödülünüzü teslim alın"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Ödülü Al (Linke Git)</span>
                            </button>
                          )}

                          {quest.claimed && (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded border border-green-500/20 font-mono">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>ÖDÜL ALINDI</span>
                              </div>
                              <button
                                onClick={() => handleOpenLink(quest)}
                                title="Discord'da Görevi / Ödülü Görüntüle"
                                className="cyber-btn-secondary px-2.5 py-1 rounded text-xs flex items-center space-x-1 text-gray-300 hover:text-white"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Linki Aç</span>
                              </button>
                            </div>
                          )}

                          {!quest.claimed && !quest.completed && (
                            <button
                              onClick={() => handleOpenLink(quest)}
                              title="Discord'da Görev Sayfasına Git"
                              className="cyber-btn-secondary px-2.5 py-1.5 rounded text-xs text-gray-300 hover:text-white flex items-center space-x-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Görev Linki</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-gray-400">
                      <span>
                        İlerleme: {quest.progressSeconds}s / {quest.targetSeconds}s ({progressPct}%)
                      </span>
                      <span className="text-hextra-red">Ödül: {quest.rewardName}</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-obsidian-850 overflow-hidden border border-hextra-red/20">
                      <div
                        className={`h-full transition-all duration-300 ${
                          quest.isExpired
                            ? 'bg-zinc-600'
                            : 'bg-gradient-to-r from-hextra-red to-hextra-red-bright'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

