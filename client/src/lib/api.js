import axios from 'axios';

// VITE_API_URL points at the backend in production (e.g. https://xxx.up.railway.app); empty = same origin.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const api = axios.create({ baseURL: `${API_ORIGIN}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tss_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (err) => err?.response?.data?.message || err?.message || 'Something went wrong';

export default api;
