import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Automatically detect the backend address
function getApiUrl() {
  // Use a configured production URL when available
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  // Expo Web: use the computer hosting the frontend
  if (Platform.OS === 'web') {
    return `http://${window.location.hostname}:4000`;
  }

  // Expo Go: detect the computer running the Expo development server
  const expoHost =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost;

  if (expoHost) {
    const hostname = expoHost
      .replace(/^https?:\/\//, '')
      .replace(/^exp:\/\//, '')
      .split('/')[0]
      .split(':')[0];

    return `http://${hostname}:4000`;
  }

  // Android emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  // iOS simulator fallback
  return 'http://localhost:4000';
}

const BASE_URL = getApiUrl();

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

// Common request handler
async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    console.error(`API connection failed: ${BASE_URL}`, error);
    throw new ApiError(
      'Unable to connect to the server. Please try again.',
      0,
      true,
    );
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