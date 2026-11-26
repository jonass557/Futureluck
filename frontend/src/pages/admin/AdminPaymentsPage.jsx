import { useState, useEffect } from 'react';
import { KeyRound, Copy, CheckCircle2, ShieldCheck, Webhook } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export default function AdminPaymentsPage() {
  const [secretKey, setSecretKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.ikeepay.com');
  const [defaultCountry, setDefaultCountry] = useState('CI');
  const [defaultCurrency, setDefaultCurrency] = useState('XOF');
  const [enabled, setEnabled] = useState(true);
  const [maskedKey, setMaskedKey] = useState('');
  const [hasSecretKey, setHasSecretKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);

  const siteBase = 'https://futureluck.vercel.app';
  const apiBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : siteBase;
  const webhookUrl = `${siteBase}/api/webhooks/ikeepay`;
  const backendWebhookUrl = `${apiBase}/api/webhooks/ikeepay`;

  useEffect(() => {
    api
      .get('/admin/payment-config')
      .then((res) => {
        const c = res.data.config;
        setBaseUrl(c.baseUrl || 'https://api.ikeepay.com');
        setPublicKey(c.publicKey || '');
        setDefaultCountry(c.defaultCountry || 'CI');
        setDefaultCurrency(c.defaultCurrency || 'XOF');
        setEnabled(Boolean(c.enabled));
        setHasSecretKey(Boolean(c.hasSecretKey));
        setMaskedKey(c.maskedSecretKey || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      const { data } = await api.put('/admin/payment-config', {
        secretKey: secretKey || undefined,
        publicKey,
        baseUrl,
        defaultCountry,
        defaultCurrency,
        enabled,
      });
      setFeedback(data.message);
      setSecretKey('');
      setHasSecretKey(data.config.hasSecretKey);
      setMaskedKey(data.config.maskedSecretKey);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout title="Configuration Paiements Ikeepay">
      <div className="max-w-3xl space-y-5">
        {/* Webhook URL Card */}
        <div className="fl-gradient-blue text-white rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-[#FFD200] font-extrabold text-sm">
            <Webhook className="w-5 h-5" />
            Lien Webhook à connecter dans votre tableau de bord Ikeepay
          </div>
          <p className="text-xs text-blue-100">
            Copiez cette URL et collez-la dans les paramètres Webhook d’Ikeepay. La signature{' '}
            <code className="bg-white/15 px-1.5 py-0.5 rounded">X-Ikeepay-Signature</code> (HMAC SHA-256) est vérifiée
            automatiquement avec votre clé secrète.
          </p>
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl p-3">
            <code className="text-xs sm:text-sm font-mono text-[#FFD200] flex-1 truncate">{webhookUrl}</code>
            <button
              type="button"
              onClick={copyWebhook}
              className="fl-gradient-gold text-[#001B6B] text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          {backendWebhookUrl !== webhookUrl && (
            <p className="text-[11px] text-blue-200 font-mono truncate">
              Endpoint direct Backend : {backendWebhookUrl}
            </p>
          )}
        </div>

        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {feedback}
          </div>
        )}

        {/* API Keys Form */}
        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500">Chargement...</div>
        ) : (
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 fl-card-shadow border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#001B6B] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#0033B3]" />
                Clés API Ikeepay H2H
              </h2>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  hasSecretKey ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasSecretKey ? `Configurée (${maskedKey})` : 'Non configurée'}
              </span>
            </div>

            <div>
              <label htmlFor="ik-secret" className="block text-sm font-bold text-slate-700 mb-1">
                Clé Secrète Ikeepay (<code className="text-xs">x-api-key</code> / HMAC Secret)
              </label>
              <input
                id="ik-secret"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={hasSecretKey ? 'Laissez vide pour conserver la clé actuelle' : 'Collez votre SECRET_KEY Ikeepay'}
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ik-base" className="block text-sm font-bold text-slate-700 mb-1">
                  Endpoint API Live
                </label>
                <input
                  id="ik-base"
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label htmlFor="ik-public" className="block text-sm font-bold text-slate-700 mb-1">
                  Clé Publique (optionnel)
                </label>
                <input
                  id="ik-public"
                  type="text"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="Optionnel"
                  className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label htmlFor="ik-country" className="block text-sm font-bold text-slate-700 mb-1">
                  Pays par défaut
                </label>
                <select
                  id="ik-country"
                  value={defaultCountry}
                  onChange={(e) => setDefaultCountry(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  <option value="CI">Côte d’Ivoire (CI)</option>
                  <option value="CM">Cameroun (CM)</option>
                  <option value="SN">Sénégal (SN)</option>
                  <option value="BF">Burkina Faso (BF)</option>
                  <option value="BJ">Bénin (BJ)</option>
                  <option value="TG">Togo (TG)</option>
                  <option value="ML">Mali (ML)</option>
                </select>
              </div>

              <div>
                <label htmlFor="ik-currency" className="block text-sm font-bold text-slate-700 mb-1">
                  Devise par défaut
                </label>
                <select
                  id="ik-currency"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  <option value="XOF">XOF (FCFA BCEAO)</option>
                  <option value="XAF">XAF (FCFA BEAC)</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#0033B3]"
              />
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Activer les paiements automatiques Ikeepay H2H (Payin & Payout)
              </span>
            </label>

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer les clés API Ikeepay'}
            </Button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
