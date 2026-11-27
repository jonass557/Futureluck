import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api';
import { FutureLuckLogo } from '@/components/FutureLuckLogo';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const registered = searchParams.get('registered') === '1';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [slowNotice, setSlowNotice] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSlowNotice(false);
    if (!identifier.trim() || !password) {
      setError('Veuillez remplir votre téléphone/email et mot de passe.');
      return;
    }
    setSubmitting(true);
    const timer = setTimeout(() => setSlowNotice(true), 3000);
    try {
      const user = await login(identifier.trim(), password);
      navigate(user.role === 'admin' ? '/admin' : redirect);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur de connexion.'));
    } finally {
      clearTimeout(timer);
      setSlowNotice(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen fl-gradient-blue flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-1.5 text-blue-100 hover:text-white text-sm font-semibold mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="flex justify-center mb-6">
          <FutureLuckLogo size="md" showSlogan />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h1 className="text-2xl font-extrabold text-[#001B6B] mb-1">Se connecter</h1>
          <p className="text-sm text-slate-500 mb-6">Accédez à votre portefeuille LuckyGamble et aux marchés.</p>

          {registered && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-bold">
              Compte créé avec succès ! Connectez-vous pour accéder à votre tableau de bord.
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {slowNotice && submitting && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 font-semibold">
              Connexion lente ou démarrage du serveur en cours, veuillez patienter quelques secondes...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-bold text-slate-700 mb-1.5">
                Téléphone ou Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  autocorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Téléphone ou email"
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-[#0033B3] hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={submitting}>
              {submitting ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Pas encore de compte ?{' '}
            <Link
              to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-bold text-[#0033B3] hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
