import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import { FutureLuckLogo } from '@/components/FutureLuckLogo';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = send OTP, 2 = verify OTP & reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep(2);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de l’envoi du code OTP.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la réinitialisation.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen fl-gradient-blue flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-blue-100 hover:text-white text-sm font-semibold mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>

        <div className="flex justify-center mb-6">
          <FutureLuckLogo size="md" showSlogan />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
          <h1 className="text-2xl font-extrabold text-[#001B6B]">Mot de passe oublié</h1>
          <p className="text-sm text-slate-500">
            {step === 1
              ? 'Entrez votre adresse email pour recevoir un code OTP de vérification.'
              : 'Saisissez le code OTP reçu par email et choisissez un nouveau mot de passe.'}
          </p>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-bold space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{message}</span>
              </div>
              {devOtp && (
                <p className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-emerald-200 inline-block">
                  Code OTP (mode démo) : <strong>{devOtp}</strong>
                </p>
              )}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="fp-email" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Adresse email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="fp-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Envoi du code...' : 'Envoyer le code OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label htmlFor="fp-otp" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Code OTP (6 chiffres) *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="fp-otp"
                    type="text"
                    inputMode="numeric"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 font-mono font-bold tracking-widest"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fp-pass" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Nouveau mot de passe *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="fp-pass"
                    type="password"
                    minLength={6}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caractères"
                    className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Réinitialisation...' : 'Changer mon mot de passe'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
