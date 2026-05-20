import { Platform } from 'react-native';

const trimEnv = (value?: string | null) => value?.trim();

const envApiBaseUrl = trimEnv(process.env.EXPO_PUBLIC_API_BASE_URL);
const envApiHost = trimEnv(process.env.EXPO_PUBLIC_API_HOST);

const fallbackHost =
  Platform.OS === 'android'
    ? '10.0.2.2'
    : Platform.OS === 'ios'
      ? 'localhost'
      : '192.168.1.10';

const apiHost = envApiHost ?? fallbackHost;

export const API_BASE_URL = envApiBaseUrl ?? `http://${apiHost}:5001/api`;

export const SUPPORT_PHONE = '+911800123456';
