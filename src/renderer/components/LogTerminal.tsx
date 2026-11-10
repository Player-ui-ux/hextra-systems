import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, ArrowDownCircle, Filter, X } from 'lucide-react';
import { LogEntry } from '../../types';

interface LogTerminalProps {
  logs: LogEntry[];
  onClear: () => void;
  onClose: () => void;
}

export const LogTerminal: React.FC<LogTerminalProps> = ({ logs, onClear, onClose }) => {
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs =
    selectedModule === 'ALL'
      ? logs
      : logs.filter(l => l.module === selectedModule);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'warn':
        return 'text-yellow-400';
      case 'error':
        return 'text-hextra-red font-bold';
      default:
        return 'text-gray-300';
    }
  };

  const getModuleBadge = (mod: LogEntry['module']) => {
    switch (mod) {
      case 'AUTH':
        return 'bg-purple-900/40 text-purple-300 border-purple-500/30';
      case 'QUESTS':
        return 'bg-pink-900/40 text-pink-300 border-pink-500/30';
      case 'VOICE':
        return 'bg-blue-900/40 text-blue-300 border-blue-500/30';
      case 'BADGES':
        return 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30';
      case 'CLONER':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30';
      case 'DM_CLEANER':
        return 'bg-red-900/40 text-red-300 border-red-500/30';
      case 'EMOJI':
        return 'bg-cyan-900/40 text-cyan-300 border-cyan-500/30';
      case 'HYPESQUAD':
        return 'bg-orange-900/40 text-orange-300 border-orange-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  return (
    <div className="h-60 bg-obsidian-950/95 border-t border-hextra-red/30 flex flex-col font-mono text-xs select-text shadow-2xl">
      {/* Header Bar */}
      <div className="h-9 px-3 bg-obsidian-900 border-b border-hextra-red/20 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-hextra-red" />
          <span className="font-bold text-gray-200">SİSTEM KONSOLU & CANLI LOGLAR</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-hextra-red/20 text-hextra-red font-semibold">
            {filteredLogs.length} Kayıt
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Module Filter */}
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-obsidian-850 text-gray-300 text-[11px] px-2 py-0.5 rounded border border-hextra-red/20 outline-none"
            >
              <option value="ALL">Tüm Modüller</option>
              <option value="AUTH">AUTH</option>
              <option value="QUESTS">QUESTS</option>
              <option value="VOICE">VOICE</option>
              <option value="BADGES">BADGES</option>
              <option value="CLONER">CLONER</option>
              <option value="DM_CLEANER">DM CLEANER</option>
              <option value="EMOJI">EMOJI</option>
              <option value="HYPESQUAD">HYPESQUAD</option>
            </select>
          </div>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title="Otomatik Kaydırma"
            className={`px-2 py-0.5 rounded text-[11px] border flex items-center space-x-1 ${
              autoScroll
                ? 'bg-hextra-red/20 text-hextra-red border-hextra-red/40'
                : 'bg-obsidian-850 text-gray-400 border-obsidian-700'
            }`}
          >
            <ArrowDownCircle className="w-3 h-3" />
            <span>Oto-Kaydır</span>
          </button>

          {/* Clear button */}
          <button
            onClick={onClear}
            title="Logları Temizle"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-obsidian-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            title="Konsolu Gizle"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-hextra-red/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-600 italic">
            Henüz konsol kaydı yok. Sistem hazır.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-2 text-[11px] leading-relaxed hover:bg-white/[0.02] px-1 rounded transition-colors"
            >
              <span className="text-gray-500 shrink-0 font-mono">[{log.timestamp}]</span>
              <span
                className={`px-1.5 py-0.2 rounded border text-[9px] uppercase font-semibold shrink-0 ${getModuleBadge(
                  log.module
                )}`}
              >
                {log.module}
              </span>
              <span className={`break-all ${getLevelColor(log.level)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

