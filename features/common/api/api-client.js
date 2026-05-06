import Constants from 'expo-constants';

const DEFAULT_BASE_URL = 'http://localhost:3000';

function getBaseUrl() {
  // Expo supports EXPO_PUBLIC_* env vars at build/runtime.
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit) return explicit;

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
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

