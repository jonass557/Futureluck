import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api, { getApiErrorMessage } from '@/lib/api';
import { FutureLuckLogo } from '@/components/FutureLuckLogo';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [terms, setTerms] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/auth/settings')
      .then((res) => setTerms(res.data.termsAndConditions || ''))
      .catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (!acceptedTerms) {
      setError('Veuillez lire et accepter les termes, conditions et la politique de fonctionnement.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', fullName.trim());
      fd.append('phone', phone.trim());
      if (email.trim()) fd.append('email', email.trim());
      fd.append('password', password);
      fd.append('acceptedTerms', 'true');
      if (avatarFile) fd.append('avatar', avatarFile);

      await register(fd);
      const nextUrl = `/login?registered=1${redirect !== '/' ? `&redirect=${encodeURIComponent(redirect)}` : ''}`;
      navigate(nextUrl);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la création du compte.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen fl-gradient-blue flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-1.5 text-blue-100 hover:text-white text-sm font-semibold mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="flex justify-center mb-5">
          <FutureLuckLogo size="md" showSlogan />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h1 className="text-2xl font-extrabold text-[#001B6B] mb-1">Créer un compte</h1>
          <p className="text-sm text-slate-500 mb-5">Rejoignez FutureLuck et tentez votre chance dès aujourd’hui.</p>

          {error && (
            <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="avatar"
                className="w-16 h-16 rounded-full bg-[#EEF4FF] border-2 border-dashed border-[#0033B3] flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
              >
                {preview ? (
                  <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-[#0033B3]" />
                )}
                <input id="avatar" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
              </label>
              <div>
                <p className="text-sm font-bold text-slate-700">Photo de profil (optionnel)</p>
                <p className="text-xs text-slate-500">PNG ou JPG jusqu’à 5 Mo</p>
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-bold text-slate-700 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom complet"
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-1">
                Numéro Mobile Money <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 0700000000"
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1">
                Email (optionnel)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autocorrect="off"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-bold text-slate-700 mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300"
              />
            </div>

            {/* Termes, conditions et politique de fonctionnement */}
            <div className="bg-[#EEF4FF] border border-blue-200 rounded-2xl p-3.5 space-y-2.5">
              <p className="text-xs font-extrabold text-[#001B6B] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0033B3]" />
                Termes, conditions & politique de fonctionnement
              </p>
              <div className="max-h-36 overflow-y-auto bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {terms ||
                  "1. FutureLuck est une plateforme de participation à des marchés.\n2. Les participations sont fermes.\n3. Les gagnants reçoivent leurs gains dans leur portefeuille retirable (frais de retrait : 8 %)."}
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-[#0033B3] shrink-0"
                />
                <span className="text-xs font-bold text-slate-800">
                  J’ai lu et j’accepte les termes, conditions et la politique de fonctionnement de FutureLuck.
                </span>
              </label>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full mt-2 font-extrabold" disabled={submitting}>
              {submitting ? 'Création en cours...' : 'Créer mon compte'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-5">
            Déjà inscrit ?{' '}
            <Link
              to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-bold text-[#0033B3] hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
