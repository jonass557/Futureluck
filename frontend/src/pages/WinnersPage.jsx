import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { UserLayout } from '@/components/UserLayout';
import { FutureLuckLogo } from '@/components/FutureLuckLogo';
import api from '@/lib/api';

export default function WinnersPage() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/markets/winners/all')
      .then((res) => setWinners(res.data.winners || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rankBadge = (idx) => {
    if (idx === 0) return 'bg-[#FFD200] text-[#001B6B]';
    if (idx === 1) return 'bg-slate-300 text-slate-800';
    if (idx === 2) return 'bg-amber-600 text-white';
    return 'bg-slate-200 text-slate-700';
  };

  return (
    <UserLayout title="Nos Gagnants">
      <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl fl-gradient-blue">
        {/* Celebratory Banner (Image 3) */}
        <div className="pt-7 pb-5 px-4 flex flex-col items-center text-center relative">
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-[#FFD200] flex items-center justify-center mb-3 shadow-lg">
            <Trophy className="w-11 h-11 text-[#FFD200]" />
          </div>
          <div className="fl-gradient-gold text-[#001B6B] font-extrabold text-base sm:text-lg px-6 py-2.5 rounded-2xl shadow-lg">
            Félicitations à tous nos gagnants !
          </div>
        </div>

        {/* Winners Table */}
        <div className="bg-white mx-3 sm:mx-5 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-[#0033B3] text-white grid grid-cols-12 px-4 py-3 text-xs sm:text-sm font-extrabold">
            <div className="col-span-5">Nom</div>
            <div className="col-span-4">Téléphone</div>
            <div className="col-span-3 text-right">Montant</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Chargement des gagnants...</div>
          ) : winners.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Aucun gagnant publié pour le moment.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {winners.map((w, idx) => (
                <div key={w.id} className="grid grid-cols-12 items-center px-4 py-3 text-xs sm:text-sm">
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${rankBadge(
                        idx
                      )}`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{w.name}</span>
                  </div>
                  <div className="col-span-4 text-slate-600 font-medium truncate">{w.maskedPhone}</div>
                  <div className="col-span-3 text-right font-black text-[#001B6B]">
                    {Number(w.amount).toLocaleString('fr-FR')} F
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="py-6 flex justify-center">
          <FutureLuckLogo size="sm" showSlogan slogan="Jouez • Gagnez • Encaissez" />
        </div>
      </div>
    </UserLayout>
  );
}
