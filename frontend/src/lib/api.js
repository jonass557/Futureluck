import axios from 'axios';

const configuredUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '';

const baseURL = configuredUrl || '/api';

const api = axios.create({
  baseURL,
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('futureluck_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    if (!config) return Promise.reject(err);

    const isNetworkOrGatewayError =
      !err.response || err.code === 'ECONNABORTED' || err.response?.status >= 502;

    // 1) If direct VITE_API_URL failed at network/DNS/CORS level (e.g. Orange CM mobile network),
    // automatically fallback to same-origin '/api' (Vercel Edge rewrite proxy -> Render).
    if (isNetworkOrGatewayError && config.baseURL !== '/api' && !config._triedProxyFallback) {
      config._triedProxyFallback = true;
      config.baseURL = '/api';
      return api(config);
    }

    // 2) Retry idempotent requests (GET/HEAD) up to 2 times on transient weak-network errors
    const isIdempotent = ['get', 'head'].includes((config.method || '').toLowerCase());
    if (isNetworkOrGatewayError && isIdempotent && (config._retryCount || 0) < 2) {
      config._retryCount = (config._retryCount || 0) + 1;
      await new Promise((r) => setTimeout(r, 1200 * config._retryCount));
      return api(config);
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('futureluck_token');
    }
    return Promise.reject(err);
  }
);

export function getApiErrorMessage(err, fallback = 'Une erreur est survenue.') {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ECONNABORTED') {
    return 'La connexion au serveur est lente (délai dépassé). Veuillez réessayer.';
  }
  if (!err.response) {
    return 'Impossible de joindre le serveur sur ce réseau. Vérifiez votre connexion et réessayez.';
  }
  return fallback;
}

export default api;
