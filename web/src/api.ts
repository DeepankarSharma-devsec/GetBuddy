import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired/invalid token: clear it and send the user back to login
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// FastAPI errors: detail is a string (HTTPException) or an array (422 validation)
export function apiError(e: unknown, fallback: string): string {
  const detail = (e as any)?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => {
      const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : '';
      return field ? `${field}: ${d?.msg ?? 'invalid'}` : d?.msg ?? 'invalid';
    }).join(' · ');
  }
  return fallback;
}

export const getToken = () => localStorage.getItem('token');
export const clearToken = () => { localStorage.removeItem('token'); localStorage.removeItem('is_admin'); };
export const setToken = (t: string) => localStorage.setItem('token', t);
export const setIsAdmin = (v: boolean) => localStorage.setItem('is_admin', v ? '1' : '0');
export const isAdmin = () => localStorage.getItem('is_admin') === '1';
