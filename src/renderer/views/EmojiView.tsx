import React, { useState } from 'react';
import {
  SmilePlus,
  Download,
  Upload,
  Search,
  Sparkles,
  CheckCircle,
  FileArchive
} from 'lucide-react';
import { Account, EmojiInfo } from '../../types';

interface EmojiViewProps {
  activeAccount?: Account;
}

export const EmojiView: React.FC<EmojiViewProps> = ({ activeAccount }) => {
  const [sourceGuildId, setSourceGuildId] = useState('');
  const [targetGuildId, setTargetGuildId] = useState('');
  const [guildName, setGuildName] = useState('');
  const [emojis, setEmojis] = useState<EmojiInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zipResultPath, setZipResultPath] = useState<string | null>(null);

  const handleFetchEmojis = async () => {
    if (!activeAccount || !sourceGuildId.trim()) return;
    setLoading(true);
    setZipResultPath(null);
    try {
      const data = await window.electronAPI.getGuildEmojis(activeAccount.token, sourceGuildId.trim());
      setGuildName(data.guildName);
      setEmojis(data.emojis);
    } catch (err: any) {
      alert(`Emojiler çekilemedi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!activeAccount || !sourceGuildId.trim()) return;
    setZipping(true);
    try {
      const path = await window.electronAPI.downloadEmojisZip(activeAccount.token, sourceGuildId.trim());
      setZipResultPath(path);
    } catch (err: any) {
      alert(`ZIP indirme hatası: ${err.message}`);
    } finally {
      setZipping(false);
    }
  };

  const handleUploadEmojis = async () => {
    if (!activeAccount || !targetGuildId.trim() || emojis.length === 0) {
      alert('Lütfen geçerli bir hedef sunucu ID girin ve önce kaynak sunucudan emojileri listeleyin.');
      return;
    }
    setUploading(true);
    try {
      const res = await window.electronAPI.uploadEmojis(activeAccount.token, targetGuildId.trim(), emojis);
      alert(`Yükleme tamamlandı! Başarılı: ${res.success}, Başarısız: ${res.failed}`);
    } catch (err: any) {
      alert(`Yükleme hatası: ${err.message}`);
    } finally {
      setUploading(false);
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
          <SmilePlus className="w-5 h-5 text-hextra-red" />
          <span>Emoji İndirici (.ZIP) & Yükleyici</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Herhangi bir sunucudaki tüm statik ve hareketli (GIF) emojileri tek tıkla masaüstünüze ZIP olarak indirin veya başka sunucuya aktarın.
        </p>
      </div>

      {/* Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Panel */}
        <div className="cyber-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Download className="w-4 h-4 text-hextra-red" />
            <span>Kaynak Sunucudan Emoji Çek</span>
          </h2>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Kaynak Sunucu ID</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={sourceGuildId}
                onChange={(e) => setSourceGuildId(e.target.value)}
                placeholder="Örn: 987654321012345678"
                className="cyber-input flex-1 text-xs font-mono"
              />
              <button
                onClick={handleFetchEmojis}
                disabled={loading || !sourceGuildId.trim()}
                className="cyber-btn-secondary px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Listele</span>
              </button>
            </div>
          </div>

          {emojis.length > 0 && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-gray-300 font-mono">
                {guildName}: <strong className="text-hextra-red">{emojis.length}</strong> Emoji
              </span>
              <button
                onClick={handleDownloadZip}
                disabled={zipping}
                className="cyber-btn-red px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <FileArchive className="w-4 h-4" />
                <span>{zipping ? 'Paketleniyor...' : 'Masaüstüne .ZIP İndir'}</span>
              </button>
            </div>
          )}

          {zipResultPath && (
            <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-xs text-green-400 flex items-center space-x-2 font-mono break-all">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Kaydedildi: {zipResultPath}</span>
            </div>
          )}
        </div>

        {/* Target Uploader Panel */}
        <div className="cyber-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Upload className="w-4 h-4 text-hextra-red" />
            <span>Hedef Sunucuya Yükle</span>
          </h2>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Hedef Sunucu ID</label>
            <input
              type="text"
              value={targetGuildId}
              onChange={(e) => setTargetGuildId(e.target.value)}
              placeholder="Örn: 123456789012345678"
              className="cyber-input w-full text-xs font-mono"
            />
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-[11px] text-gray-500">
              Hedef sunucuda Emojileri Yönet yetkiniz olmalıdır.
            </span>
            <button
              onClick={handleUploadEmojis}
              disabled={uploading || emojis.length === 0 || !targetGuildId.trim()}
              className="cyber-btn-secondary px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>{uploading ? 'Yükleniyor...' : 'Toplu Yükle'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emojis Preview Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">
          Emoji Önizleme {emojis.length > 0 && `(${emojis.length} Adet)`}
        </h2>

        {emojis.length === 0 ? (
          <div className="cyber-card p-8 text-center text-gray-500 text-xs">
            Önizlemek için yukarıya bir Sunucu ID girip "Listele" butonuna tıklayın.
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {emojis.map((emoji) => (
              <div
                key={emoji.id}
                className="cyber-card p-2.5 flex flex-col items-center justify-center space-y-1.5 hover:border-hextra-red/50 transition-all group"
              >
                <img
                  src={emoji.url}
                  alt={emoji.name}
                  className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                />
                <span className="text-[10px] font-mono text-gray-400 truncate w-full text-center">
                  :{emoji.name}:
                </span>
                {emoji.animated && (
                  <span className="text-[8px] font-mono px-1 rounded bg-hextra-red/20 text-hextra-red border border-hextra-red/40">
                    GIF
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

