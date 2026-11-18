import { Platform } from 'react-native';

export const SUPABASE_URL = 'https://tcyndqzzawwcqqvcsbvu.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_txO2mh73LE4sY8AqzTiujA_jniwTOrQ';
export const GOOGLE_MAPS_API_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) ||
  'AIzaSyD6WqT0s_TLC2Va1n3RidhZa5MnAxMBAeA';

const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  `${DEFAULT_HOST}/api/v1`;

export const SUPABASE_HEADERS = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};
