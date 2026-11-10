import React from 'react';
import { Minus, Square, X, Download, ShieldCheck, Cpu } from 'lucide-react';
import { Account } from '../../types';

interface TitleBarProps {
  activeAccount?: Account;
}

export const TitleBar: React.FC<TitleBarProps> = ({ activeAccount }) => {
  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();
  const handleToTray = () => window.electronAPI?.toTray();

  return (
    <header className="h-10 bg-obsidian-950/90 border-b border-hextra-red/20 flex items-center justify-between px-3 select-none titlebar-drag z-50">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-2.5 titlebar-nodrag">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-hextra-red/20 border border-hextra-red shadow-neon-subtle">
          <Cpu className="w-3.5 h-3.5 text-hextra-red animate-pulse" />
        </div>
        <span className="font-mono text-xs font-bold tracking-wider text-white">
          HEXTRA<span className="text-hextra-red">.STUDIO</span>
        </span>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-hextra-red/10 text-hextra-red border border-hextra-red/30">
          v1.0
        </span>
      </div>

      {/* Center Status Info */}
      <div className="flex items-center space-x-3 text-xs font-mono text-gray-400">
        {activeAccount ? (
          <div className="flex items-center space-x-1.5 text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
            <span className="text-[11px]">@{activeAccount.username}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span className="text-[11px]">Hesap Seçilmedi</span>
          </div>
        )}
        <div className="flex items-center space-x-1 text-[11px] text-gray-500">
          <ShieldCheck className="w-3 h-3 text-hextra-red" />
          <span>Anti-Ban v9175</span>
        </div>
      </div>

      {/* Window Controls */}
      <div className="flex items-center space-x-1 titlebar-nodrag">
        <button
          onClick={handleToTray}
          title="Sistem Tepsisine Küçült"
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-obsidian-700/60 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMinimize}
          title="Simge Durumuna Küçült"
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-obsidian-700/60 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          title="Büyüt / Küçült"
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-obsidian-700/60 transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          title="Kapat"
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-hextra-red transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

