import React, { useState } from 'react';
import { Flame, Shield, Award, Sparkles, Check, LogOut } from 'lucide-react';
import { Account } from '../../types';

interface HypeSquadViewProps {
  activeAccount?: Account;
}

const HOUSES = [
  {
    id: 1 as const,
    name: 'House of Bravery',
    trName: 'Cesaret Evi',
    description: 'Evren cesur olanları ödüllendirir. Korkusuzca mücadele edenlerin ve liderlerin evi.',
    color: 'from-purple-600 to-indigo-700',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400',
    iconColor: 'text-purple-400'
  },
  {
    id: 2 as const,
    name: 'House of Brilliance',
    trName: 'Zeka Evi',
    description: 'Sabır, zeka ve bilgelik. Strateji ve derin düşünceyle zafere ulaşanların evi.',
    color: 'from-amber-600 to-orange-700',
    borderColor: 'border-orange-500/50',
    textColor: 'text-orange-400',
    iconColor: 'text-orange-400'
  },
  {
    id: 3 as const,
    name: 'House of Balance',
    trName: 'Denge Evi',
    description: 'Uyum, adalet ve denge. Her iki tarafı da anlayıp dünyayı dengede tutanların evi.',
    color: 'from-teal-600 to-cyan-700',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-400',
    iconColor: 'text-cyan-400'
  }
];

export const HypeSquadView: React.FC<HypeSquadViewProps> = ({ activeAccount }) => {
  const [loadingHouse, setLoadingHouse] = useState<number | null>(null);
  const [successHouse, setSuccessHouse] = useState<number | null>(null);

  const handleSelectHouse = async (houseId: 1 | 2 | 3) => {
    if (!activeAccount) return;
    setLoadingHouse(houseId);
    setSuccessHouse(null);
    try {
      await window.electronAPI.setHypeSquad(activeAccount.token, houseId);
      setSuccessHouse(houseId);
    } catch (err: any) {
      alert(`HypeSquad değiştirilemedi: ${err.message}`);
    } finally {
      setLoadingHouse(null);
    }
  };

  const handleLeave = async () => {
    if (!activeAccount) return;
    if (confirm('HypeSquad rozetinizden ayrılmak istediğinize emin misiniz?')) {
      setLoadingHouse(0);
      try {
        await window.electronAPI.leaveHypeSquad(activeAccount.token);
        alert('HypeSquad evinden başarıyla ayrıldınız.');
      } catch (err: any) {
        alert(`Ayrılma hatası: ${err.message}`);
      } finally {
        setLoadingHouse(null);
      }
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
            <Flame className="w-5 h-5 text-hextra-red" />
            <span>HypeSquad Değiştirici</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Discord profilinizdeki HypeSquad rozetini sınav sorularını çözmeden tek tıkla dilediğiniz gibi değiştirin.
          </p>
        </div>

        <button
          onClick={handleLeave}
          disabled={loadingHouse !== null}
          className="cyber-btn-secondary px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 hover:border-hextra-red"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          <span>HypeSquad'dan Ayrıl</span>
        </button>
      </div>

      {/* House Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {HOUSES.map((house) => {
          const isLoading = loadingHouse === house.id;
          const isSuccess = successHouse === house.id;

          return (
            <div
              key={house.id}
              className={`cyber-card p-6 flex flex-col justify-between space-y-4 border ${house.borderColor} hover:scale-[1.02] transition-all`}
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${house.color} flex items-center justify-center shadow-lg`}>
                  <Shield className="w-6 h-6 text-white" />
                </div>

                <div>
                  <h3 className={`text-base font-bold ${house.textColor}`}>{house.name}</h3>
                  <div className="text-xs text-gray-300 font-semibold">{house.trName}</div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  {house.description}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSelectHouse(house.id)}
                  disabled={loadingHouse !== null}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    isSuccess
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                      : 'cyber-btn-red'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Değiştiriliyor...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Aktif Edildi!</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>Bu Eve Katıl</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

