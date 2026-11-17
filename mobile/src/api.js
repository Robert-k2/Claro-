import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PORT = 4000;
const TIMEOUT_MS = 10000;

// Automatically detect the backend address
function getApiUrl() {
  // Use a configured URL when available (mobile/.env: EXPO_PUBLIC_API_URL=http://10.1.0.150:4000)
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

  if (configuredUrl) {
    return configuredUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  }

  // Expo Web: use the computer hosting the frontend
  if (Platform.OS === 'web') {
    return `http://${window.location.hostname}:${PORT}`;
  }

  // Expo Go: detect the computer running the Expo development server
  const expoHost =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (expoHost) {
    const hostname = expoHost
      .replace(/^https?:\/\//, '')
      .replace(/^exp:\/\//, '')
      .split('/')[0]
      .split(':')[0];

    // Tunnel mode gives an *.exp.direct host that does not forward the API port
    if (!/\.exp\.direct$|\.ngrok/.test(hostname)) {
      return `http://${hostname}:${PORT}`;
    }
  }

  // Android emulator fallback
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}`;
  }

  // iOS simulator fallback
  return `http://localhost:${PORT}`;
}

export const BASE_URL = getApiUrl();
console.log('[api] BASE_URL =', BASE_URL);

export const MODE = 'MongoDB';

// ---- Login session (kept in memory) ----
let token = null;
let onUnauthorized = null;

// App.js registers a function here. It is called when the server says
// the session is missing or expired, so the app can show the login screen.
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export function logout() {
  token = null;
}

export function isLoggedIn() {
  return token !== null;
}

// Error type that carries the HTTP status and tells network errors apart
export class ApiError extends Error {
  constructor(message, status, isNetwork = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetwork = isNetwork;
  }
}

// Quick connectivity test. Returns { ok, url, error? }
export async function checkServer() {
  const url = `${BASE_URL}/api/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const r = await fetch(url, { signal: controller.signal });
    return { ok: r.ok, url };
  } catch (e) {
    return { ok: false, url, error: String(e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

// Common request handler
async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    console.error(`API connection failed: ${BASE_URL}${path}`, error);
    const timedOut = error?.name === 'AbortError';
    throw new ApiError(
      `${timedOut ? 'Timed out connecting to' : 'Unable to connect to'} ${BASE_URL}`,
      0,
      true,
    );
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Session missing or expired: back to the login screen
    // (a wrong password on the login call is not a session problem)
    const isLoginCall = path === '/api/auth/login';
    if (response.status === 401 && !isLoginCall) {
      token = null;
      if (onUnauthorized) {
        onUnauthorized();
      }
    }
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
    );
  }

  return data;
}

// Real backend API
export const api = {
  // Login. role is 'client' for the client screen.
  // Returns the user: { name, role, key, mustChangePassword, ... }
  login: async (name, password, role = 'client') => {
    const data = await req('POST', '/api/auth/login', {
      name,
      password,
      role,
    });
    token = data.token;
    return data.user;
  },

  changePassword: (oldPassword, newPassword) =>
    req('POST', '/api/auth/change-password', {
      oldPassword,
      newPassword,
    }),

  state: () =>
    req('GET', '/api/state'),

  setStatus: (key, status) =>
    req('PATCH', `/api/cases/${key}/status`, { status }),

  upload: (key, i, file) =>
    req('POST', `/api/cases/${key}/docs/${i}/upload`, { file }),

  review: (key, i, approve, note) =>
    req('POST', `/api/cases/${key}/docs/${i}/review`, {
      approve,
      note,
    }),

  addSlot: (consultant, date, time) =>
    req('POST', '/api/slots', {
      consultant,
      date,
      time,
    }),

  delSlot: (id) =>
    req('DELETE', `/api/slots/${id}`),

  // For clients the server uses the logged-in user and ignores "by"
  book: (id, by) =>
    req('POST', `/api/slots/${id}/book`, { by }),

  cancel: (id, by) =>
    req('POST', `/api/slots/${id}/cancel`, { by }),
};