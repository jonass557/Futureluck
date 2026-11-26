import { useState } from 'react';
import { Camera, CheckCircle2, Star } from 'lucide-react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

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
        text: err.response?.data?.message || 'Erreur lors de la mise à jour.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserLayout title="Mon Profil">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Profile Banner (Image 7) */}
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
            <span className="inline-flex items-center gap-1.5 fl-gradient-gold text-[#001B6B] text-xs font-extrabold px-3 py-1 rounded-full mt-2">
              <Star className="w-3.5 h-3.5 fill-current" />
              {user?.tier || 'Membre Argent'}
            </span>
          </div>
        </div>

        {/* Edit Form */}
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
                Adresse email
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
      </div>
    </UserLayout>
  );
}
