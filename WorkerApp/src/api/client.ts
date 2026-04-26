import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

const TOKEN_KEY = 'rozgarsetu-worker-token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token might be invalid, clear it
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } catch (err) {
        console.error('Error clearing token:', err);
      }
    }

    return Promise.reject(error);
  }
);

// API request methods
export const apiClient = {
  get: (url: string, config?: AxiosRequestConfig) => api.get(url, config),
  post: (url: string, data?: any, config?: AxiosRequestConfig) => api.post(url, data, config),
  put: (url: string, data?: any, config?: AxiosRequestConfig) => api.put(url, data, config),
  delete: (url: string, config?: AxiosRequestConfig) => api.delete(url, config),
  patch: (url: string, data?: any, config?: AxiosRequestConfig) => api.patch(url, data, config),
};
