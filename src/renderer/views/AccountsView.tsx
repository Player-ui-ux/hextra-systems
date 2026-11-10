import React, { useState } from 'react';
import { KeyRound, Plus, Trash2, CheckCircle2, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { Account } from '../../types';

interface AccountsViewProps {
  accounts: Account[];
  activeAccount?: Account;
  onSelectAccount: (account: Account) => void;
  onRefreshAccounts: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  activeAccount,
  onSelectAccount,
  onRefreshAccounts
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const added = await window.electronAPI.addAccount(tokenInput.trim());
      setTokenInput('');
      onRefreshAccounts();
      if (!activeAccount) {
        onSelectAccount(added);
      }
    } catch (err: any) {
      setError(err.message || 'Geçersiz token veya doğrulama başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bu hesabı silmek istediğinize emin misiniz?')) {
      await window.electronAPI.removeAccount(id);
      onRefreshAccounts();
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <KeyRound className="w-5 h-5 text-hextra-red" />
          <span>Hesap & Token Yönetimi</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Discord kullanıcı tokenlerinizi güvenle ekleyin. Tüm tokenler bilgisayarınızda{' '}
          <span className="text-hextra-red font-semibold">AES-256-GCM</span> ile şifrelenir ve harici bir sunucuya iletilmez.
        </p>
      </div>

      {/* Add Token Form */}
      <div className="cyber-card p-5">
        <h2 className="text-sm font-semibold text-gray-200 mb-3 flex items-center space-x-2">
          <Plus className="w-4 h-4 text-hextra-red" />
          <span>Yeni Token Ekle</span>
        </h2>
        <form onSubmit={handleAddAccount} className="space-y-3">
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Discord Kullanıcı Tokeninizi buraya yapıştırın..."
              className="cyber-input w-full pr-10 font-mono text-xs"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-xs text-hextra-red bg-hextra-red/10 p-2.5 rounded border border-hextra-red/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <div className="text-[11px] text-gray-400 flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-green-400" />
              <span>Masaüstü Windows Client başlıkları simüle edilir.</span>
            </div>

            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="cyber-btn-red px-5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Hesabı Ekle & Giriş Yap</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300 flex items-center justify-between">
          <span>Kayıtlı Hesaplar ({accounts.length})</span>
          <span className="text-[11px] text-gray-500 font-normal">
            Kullanmak istediğiniz hesabı aktif etmek için üzerine tıklayın.
          </span>
        </h2>

        {accounts.length === 0 ? (
          <div className="cyber-card p-8 text-center text-gray-500 text-xs">
            Kayıtlı hesap bulunamadı. Yukarıdaki formu kullanarak ilk Discord tokeninizi ekleyin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc) => {
              const isSelected = activeAccount?.id === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => onSelectAccount(acc)}
                  className={`cyber-card p-4 flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-hextra-red bg-hextra-red/10 shadow-neon'
                      : 'hover:border-hextra-red/40'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.username}
                          className="w-11 h-11 rounded-full border border-hextra-red/40 object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-obsidian-800 border border-hextra-red/30 flex items-center justify-center font-bold text-hextra-red">
                          {acc.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-obsidian-950 ${
                          acc.status === 'error'
                            ? 'bg-hextra-red'
                            : 'bg-green-500 shadow-neon-subtle'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-sm text-white">
                          {acc.globalName || acc.username}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          @{acc.username}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        ID: {acc.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isSelected && (
                      <span className="flex items-center space-x-1 text-[11px] text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>AKTİF</span>
                      </span>
                    )}

                    <button
                      onClick={(e) => handleRemoveAccount(acc.id, e)}
                      title="Hesabı Sil"
                      className="p-2 rounded text-gray-500 hover:text-hextra-red hover:bg-hextra-red/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

