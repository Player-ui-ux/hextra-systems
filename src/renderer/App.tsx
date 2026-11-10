import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, TabId } from './components/Sidebar';
import { LogTerminal } from './components/LogTerminal';
import { AccountsView } from './views/AccountsView';
import { QuestsView } from './views/QuestsView';
import { VoiceStreamView } from './views/VoiceStreamView';
import { BadgeFarmerView } from './views/BadgeFarmerView';
import { ClonerView } from './views/ClonerView';
import { DmCleanerView } from './views/DmCleanerView';
import { EmojiView } from './views/EmojiView';
import { HypeSquadView } from './views/HypeSquadView';
import { Account, LogEntry } from '../types';

const VALID_TABS: TabId[] = ['accounts', 'quests', 'voice', 'badges', 'cloner', 'dm', 'emoji', 'hypesquad'];

const getInitialTab = (): TabId => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '') as TabId;
    if (VALID_TABS.includes(hash)) return hash;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as TabId;
    if (tabParam && VALID_TABS.includes(tabParam)) return tabParam;
  }
  return 'accounts';
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);
  const [accounts, setAccounts] = useState<Account[]>(() => {
    if (typeof window !== 'undefined' && (window as any).__MOCK_ACCOUNTS__) {
      return (window as any).__MOCK_ACCOUNTS__;
    }
    return [];
  });
  const [activeAccount, setActiveAccount] = useState<Account | undefined>(() => {
    if (typeof window !== 'undefined' && (window as any).__MOCK_ACTIVE_ACCOUNT__) {
      return (window as any).__MOCK_ACTIVE_ACCOUNT__;
    }
    return undefined;
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showTerminal, setShowTerminal] = useState<boolean>(true);
  const [activeTasksCount, setActiveTasksCount] = useState<number>(0);

  useEffect(() => {
    const handleSetTab = (tab: TabId) => {
      if (VALID_TABS.includes(tab)) {
        setActiveTab(tab);
      }
    };
    (window as any).__setTab = handleSetTab;

    const handleCustomEvent = (e: any) => {
      if (e.detail && VALID_TABS.includes(e.detail)) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('set-active-tab', handleCustomEvent);

    loadAccounts();

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabId;
      if (VALID_TABS.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Attach real-time log listener from main process
    const unsubLog = window.electronAPI.onLog((log) => {
      setLogs((prev) => [...prev.slice(-250), log]);
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      unsubLog();
    };
  }, []);

  const loadAccounts = async () => {
    try {
      const list = await window.electronAPI.getAccounts();
      setAccounts(list);
      if (list.length > 0 && !activeAccount) {
        const valid = list.find(a => a.status !== 'error') || list[0];
        setActiveAccount(valid);
      }
    } catch (e) {
      console.error('Failed to load accounts:', e);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-obsidian-950 font-sans select-none text-gray-200">
      {/* Frameless Custom TitleBar */}
      <TitleBar activeAccount={activeAccount} />

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showTerminal={showTerminal}
          onToggleTerminal={() => setShowTerminal(!showTerminal)}
          accountsCount={accounts.length}
          activeTasksCount={activeTasksCount}
        />

        {/* Center Content View */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-obsidian-950 via-obsidian-900 to-obsidian-950 relative">
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'accounts' && (
              <AccountsView
                accounts={accounts}
                activeAccount={activeAccount}
                onSelectAccount={setActiveAccount}
                onRefreshAccounts={loadAccounts}
              />
            )}
            {activeTab === 'quests' && (
              <QuestsView activeAccount={activeAccount} />
            )}
            {activeTab === 'voice' && (
              <VoiceStreamView activeAccount={activeAccount} />
            )}
            {activeTab === 'badges' && (
              <BadgeFarmerView activeAccount={activeAccount} />
            )}
            {activeTab === 'cloner' && (
              <ClonerView activeAccount={activeAccount} />
            )}
            {activeTab === 'dm' && (
              <DmCleanerView activeAccount={activeAccount} />
            )}
            {activeTab === 'emoji' && (
              <EmojiView activeAccount={activeAccount} />
            )}
            {activeTab === 'hypesquad' && (
              <HypeSquadView activeAccount={activeAccount} />
            )}
          </div>

          {/* Cyberpunk CRT Log Terminal */}
          {showTerminal && (
            <LogTerminal
              logs={logs}
              onClear={handleClearLogs}
              onClose={() => setShowTerminal(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
};
export default App;

