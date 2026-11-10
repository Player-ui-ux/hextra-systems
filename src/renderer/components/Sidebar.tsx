import React from 'react';
import {
  KeyRound,
  Sparkles,
  Radio,
  Award,
  Copy,
  Trash2,
  SmilePlus,
  Flame,
  Terminal
} from 'lucide-react';

export type TabId =
  | 'accounts'
  | 'quests'
  | 'voice'
  | 'badges'
  | 'cloner'
  | 'dm'
  | 'emoji'
  | 'hypesquad';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  showTerminal: boolean;
  onToggleTerminal: () => void;
  accountsCount: number;
  activeTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  showTerminal,
  onToggleTerminal,
  accountsCount,
  activeTasksCount
}) => {
  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'accounts',
      label: 'Hesap / Token',
      icon: <KeyRound className="w-4 h-4" />,
      badge: accountsCount > 0 ? accountsCount : undefined
    },
    {
      id: 'quests',
      label: 'Orbs & Quest Kasıcı',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'voice',
      label: '7/24 Ses & Go Live',
      icon: <Radio className="w-4 h-4" />
    },
    {
      id: 'badges',
      label: 'Rozet Fulleme',
      icon: <Award className="w-4 h-4" />
    },
    {
      id: 'cloner',
      label: 'Sunucu Klonlayıcı',
      icon: <Copy className="w-4 h-4" />
    },
    {
      id: 'dm',
      label: 'Gelişmiş DM Temizleyici',
      icon: <Trash2 className="w-4 h-4" />
    },
    {
      id: 'emoji',
      label: 'Emoji İndir / Yükle',
      icon: <SmilePlus className="w-4 h-4" />
    },
    {
      id: 'hypesquad',
      label: 'HypeSquad Değiştirici',
      icon: <Flame className="w-4 h-4" />
    }
  ];

  return (
    <aside className="w-64 bg-obsidian-900/90 border-r border-hextra-red/15 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] uppercase font-mono tracking-wider text-gray-500 font-semibold">
          Modüller
        </div>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-hextra-red/15 text-white border border-hextra-red/50 shadow-neon-subtle'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-obsidian-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-hextra-red' : 'text-gray-500'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-hextra-red/20 text-hextra-red font-semibold border border-hextra-red/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Terminal Toggle & Status */}
      <div className="pt-3 border-t border-hextra-red/15 space-y-2">
        <button
          onClick={onToggleTerminal}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all ${
            showTerminal
              ? 'bg-hextra-red/20 text-hextra-red border border-hextra-red/40'
              : 'bg-obsidian-850 text-gray-400 hover:text-gray-200 border border-obsidian-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>Sistem Konsolu</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-gray-400">
            {showTerminal ? 'Açık' : 'Gizli'}
          </span>
        </button>

        <div className="px-3 py-2 rounded bg-obsidian-950/70 border border-hextra-red/10 text-[10px] font-mono text-gray-400 flex items-center justify-between">
          <span>Aktif Görevler:</span>
          <span className="text-hextra-red font-bold">{activeTasksCount}</span>
        </div>
      </div>
    </aside>
  );
};

