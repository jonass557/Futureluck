import crypto from 'crypto';
import PaymentConfig from '../models/PaymentConfig.js';

export const OPERATOR_MAP = {
  MTN_MOMO: 'MTN',
  ORANGE_MONEY: 'ORANGE',
  WAVE: 'WAVE',
  MOOV: 'MOOV',
  MOBICASH: 'MOBICASH',
  AIRTEL: 'AIRTEL',
  VODACOM: 'VODACOM',
};

export async function getIkeepayConfig() {
  const doc = await PaymentConfig.findOne({ provider: 'ikeepay' });
  const secretKey = doc?.secretKey || process.env.IKEEPAY_SECRET_KEY || '';
  return {
    secretKey,
    publicKey: doc?.publicKey || '',
    baseUrl: (doc?.baseUrl || 'https://api.ikeepay.com').replace(/\/$/, ''),
    defaultCountry: doc?.defaultCountry || 'CI',
    defaultCurrency: doc?.defaultCurrency || 'XOF',
    enabled: doc ? doc.enabled : Boolean(secretKey),
    isConfigured: Boolean(secretKey),
  };
}

async function ikeepayRequest(path, method = 'GET', body = null) {
  const cfg = await getIkeepayConfig();
  if (!cfg.isConfigured || !cfg.enabled) {
    return { skipped: true, reason: 'Ikeepay non configuré ou désactivé' };
  }

  const options = {
    method,
    headers: {
      'x-api-key': cfg.secretKey,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${cfg.baseUrl}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Erreur Ikeepay (${res.status})`);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return { skipped: false, data };
}

export async function ikeepayPayin({
  amount,
  currency,
  country,
  phoneNumber,
  operator,
  external_reference,
  customer_email,
  otp,
}) {
  const cfg = await getIkeepayConfig();
  const payload = {
    amount: Number(amount),
    currency: currency || cfg.defaultCurrency,
    country: country || cfg.defaultCountry,
    phoneNumber: String(phoneNumber).replace(/[^0-9]/g, ''),
    operator: OPERATOR_MAP[operator] || operator,
    external_reference,
    ...(customer_email ? { customer_email } : {}),
    ...(otp ? { otp } : {}),
  };
  return ikeepayRequest('/h2h-payin', 'POST', payload);
}

export async function ikeepayPayout({
  amount,
  currency,
  country,
  phoneNumber,
  operator,
  external_reference,
}) {
  const cfg = await getIkeepayConfig();
  const payload = {
    amount: Number(amount),
    currency: currency || cfg.defaultCurrency,
    country: country || cfg.defaultCountry,
    phoneNumber: String(phoneNumber).replace(/[^0-9]/g, ''),
    operator: OPERATOR_MAP[operator] || operator,
    external_reference,
  };
  return ikeepayRequest('/h2h-payout', 'POST', payload);
}

export async function ikeepayVerify(reference) {
  return ikeepayRequest(`/h2h-verify/${encodeURIComponent(reference)}`, 'GET');
}

export function verifyIkeepaySignature(rawBody, signature, secretKey) {
  if (!signature || !secretKey || !rawBody) return false;
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(String(signature));
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}
