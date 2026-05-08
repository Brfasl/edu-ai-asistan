import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_BASE_URL = 'http://localhost:3000';

export function getApiBaseUrl() {
  // Expo supports EXPO_PUBLIC_* env vars at build/runtime.
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit) return explicit;

  // Simulator/emulator networking differs by platform.
  // - iOS Simulator can reach the host machine via localhost.
  // - Android Emulator reaches the host machine via 10.0.2.2.
  if (Platform.OS === 'ios' && Constants.isDevice === false) {
    return DEFAULT_BASE_URL;
  }
  if (Platform.OS === 'android' && Constants.isDevice === false) {
    return 'http://10.0.2.2:3000';
  }

  // Dev helper: derive host IP from Expo runtime (Metro host).
  // Example hostUri: "10.196.121.71:8081"
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.experienceUrl?.hostUri ||
    Constants.linkingUri?.split('://')?.[1];

  const host = hostUri ? hostUri.split(':')[0] : null;
  if (host && host !== 'localhost') {
    return `http://${host}:3000`;
  }

  return DEFAULT_BASE_URL;
}

export async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  // In React Native, FormData may not always pass `instanceof FormData` reliably.
  const isFormData =
    body &&
    typeof body === 'object' &&
    typeof body.append === 'function' &&
    (body?.constructor?.name === 'FormData' || Array.isArray(body?._parts));

  const headers = {
    Accept: 'application/json',
  };
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    });
  } catch (e) {
    const err = new Error(
      `Network request failed. API: ${baseUrl} (EXPO_PUBLIC_API_BASE_URL ayarlayabilirsin)`
    );
    err.cause = e;
    throw err;
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!res.ok) {
    const err = new Error(data?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data?.error?.code;
    err.details = data?.error?.details;
    throw err;
  }

  return data;
}

