import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 45000, // 45s timeout for weak networks and Render cold starts
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
    const isNetworkOrTimeout = !err.response || err.code === 'ECONNABORTED' || err.response?.status >= 502;
    const isIdempotent = config && ['get', 'head'].includes((config.method || '').toLowerCase());

    if (config && isNetworkOrTimeout && isIdempotent && (config._retryCount || 0) < 2) {
      config._retryCount = (config._retryCount || 0) + 1;
      await new Promise((r) => setTimeout(r, 1500 * config._retryCount));
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
    return 'Connexion internet faible ou serveur en cours de démarrage. Patientez quelques secondes et réessayez.';
  }
  return fallback;
}

export default api;
