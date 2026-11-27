import { useState } from 'react';
import { Camera, CheckCircle2, Star, Smartphone } from 'lucide-react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import api, { getApiErrorMessage } from '@/lib/api';

const PROVIDERS = [
  { key: 'MTN_MOMO', label: 'MTN Mobile Money' },
  { key: 'ORANGE_MONEY', label: 'Orange Money' },
  { key: 'WAVE', label: 'Wave' },
  { key: 'MOOV', label: 'Moov Money' },
];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Saved Mobile Money withdrawal accounts
  const [accounts, setAccounts] = useState({
    MTN_MOMO: {
      phone: user?.withdrawalAccounts?.MTN_MOMO?.phone || '',
      accountName: user?.withdrawalAccounts?.MTN_MOMO?.accountName || '',
    },
    ORANGE_MONEY: {
      phone: user?.withdrawalAccounts?.ORANGE_MONEY?.phone || '',
      accountName: user?.withdrawalAccounts?.ORANGE_MONEY?.accountName || '',
    },
    WAVE: {
      phone: user?.withdrawalAccounts?.WAVE?.phone || '',
      accountName: user?.withdrawalAccounts?.WAVE?.accountName || '',
    },
    MOOV: {
      phone: user?.withdrawalAccounts?.MOOV?.phone || '',
      accountName: user?.withdrawalAccounts?.MOOV?.accountName || '',
    },
  });
  const [savingAccounts, setSavingAccounts] = useState(false);
  const [accFeedback, setAccFeedback] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      const fd = new FormData();
      fd.append('fullName', fullName);
      fd.append('phone', phone);
      fd.append('email', email);
      if (avatarFile) fd.append('avatar', avatarFile);

      const { data } = await api.patch('/auth/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(data.user);
      setFeedback({ type: 'success', text: data.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Erreur lors de la mise à jour.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccounts = async (e) => {
    e.preventDefault();
    setSavingAccounts(true);
    setAccFeedback('');
    try {
      const { data } = await api.patch('/auth/withdrawal-accounts', {
        withdrawalAccounts: accounts,
      });
      setUser(data.user);
      setAccFeedback(data.message);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de l’enregistrement des comptes.'));
    } finally {
      setSavingAccounts(false);
    }
  };

  const updateAccount = (key, field, value) => {
    setAccounts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  return (
    <UserLayout title="Mon Profil">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Profile Banner */}
        <div className="fl-gradient-blue text-white rounded-3xl p-5 flex items-center gap-4 shadow-xl">
          <label htmlFor="profile-avatar" className="relative cursor-pointer shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-[#FFD200] overflow-hidden bg-blue-950 flex items-center justify-center text-xl font-black">
              {preview ? (
                <img src={preview} alt={user?.fullName} className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full fl-gradient-gold text-[#001B6B] flex items-center justify-center shadow">
              <Camera className="w-4 h-4" />
            </span>
            <input
              id="profile-avatar"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarFile(file);
                  setPreview(URL.createObjectURL(file));
                }
              }}
            />
          </label>
          <div>
            <h2 className="text-xl font-extrabold">{user?.fullName}</h2>
            <p className="text-sm text-blue-100">{user?.phone}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 fl-gradient-gold text-[#001B6B] text-xs font-extrabold px-3 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-current" />
                {user?.tier || 'Membre Argent'}
              </span>
              {user?.walletId && (
                <span className="bg-white/15 text-[#FFD200] text-xs font-mono font-bold px-3 py-1 rounded-full">
                  ID : {user.walletId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Info Form */}
        <div className="bg-white rounded-3xl p-6 fl-card-shadow border border-slate-100">
          <h3 className="text-lg font-extrabold text-[#001B6B] mb-4">Informations personnelles</h3>

          {feedback.text && (
            <div
              role="alert"
              className={`mb-4 rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="p-name" className="block text-sm font-bold text-slate-700 mb-1">
                Nom complet
              </label>
              <input
                id="p-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label htmlFor="p-phone" className="block text-sm font-bold text-slate-700 mb-1">
                Numéro de téléphone
              </label>
              <input
                id="p-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label htmlFor="p-email" className="block text-sm font-bold text-slate-700 mb-1">
                Adresse email (pour code OTP mot de passe oublié)
              </label>
              <input
                id="p-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </form>
        </div>

        {/* Configure Mobile Money Withdrawal Accounts */}
        <div className="bg-white rounded-3xl p-6 fl-card-shadow border border-slate-100 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#0033B3]" />
            <h3 className="text-lg font-extrabold text-[#001B6B]">Mes comptes Mobile Money de retrait</h3>
          </div>
          <p className="text-xs text-slate-500">
            Enregistrez votre numéro et le nom associé pour chaque opérateur. Ils s’afficheront automatiquement lors de vos retraits.
          </p>

          {accFeedback && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" /> {accFeedback}
            </div>
          )}

          <form onSubmit={handleSaveAccounts} className="space-y-4">
            {PROVIDERS.map((p) => (
              <div key={p.key} className="bg-[#EEF4FF]/60 rounded-2xl p-3.5 space-y-2 border border-blue-100">
                <p className="text-xs font-extrabold text-[#001B6B]">{p.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="tel"
                    placeholder="Numéro Mobile Money"
                    value={accounts[p.key].phone}
                    onChange={(e) => updateAccount(p.key, 'phone', e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 bg-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nom associé au compte"
                    value={accounts[p.key].accountName}
                    onChange={(e) => updateAccount(p.key, 'accountName', e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 bg-white text-sm"
                  />
                </div>
              </div>
            ))}

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={savingAccounts}>
              {savingAccounts ? 'Enregistrement...' : 'Enregistrer mes numéros de retrait'}
            </Button>
          </form>
        </div>
      </div>
    </UserLayout>
  );
}
