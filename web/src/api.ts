import axios from 'axios';

export const API_BASE = 'http://localhost:8000';

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getToken = () => localStorage.getItem('token');
export const clearToken = () => localStorage.removeItem('token');
export const setToken = (t: string) => localStorage.setItem('token', t);
