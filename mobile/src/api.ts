import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In React Native Expo, connecting to a local backend differs by platform:
// iOS Simulator uses standard localhost, Android Emulator maps local PC to 10.0.2.2.
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }
  return 'https://api.getbuddy.com'; // Production fallback
};

export const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
});

// Automatically inject JWT tokens into all outbound Native requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to grab token securely', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
