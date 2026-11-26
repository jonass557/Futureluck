import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FutureLuckLogo } from '@/components/FutureLuckLogo';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Veuillez remplir votre téléphone/email et mot de passe.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(identifier.trim(), password);
      navigate(user.role === 'admin' ? '/admin' : redirect);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion.');
    } finally {
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

          {error && (
            <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
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
                  placeholder="+237 695008164 ou email"
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1.5">
                Mot de passe <span className="text-red-500">*</span>
              </label>
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
