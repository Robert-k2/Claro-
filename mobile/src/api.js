
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

// Common request handler
async function req(method, path, body) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    console.error(`API connection failed: ${BASE_URL}`, error);
    throw new Error('Unable to connect to the server. Please try again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Real backend API
export const api = {
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

  book: (id, by) =>
    req('POST', `/api/slots/${id}/book`, { by }),

  cancel: (id, by) =>
    req('POST', `/api/slots/${id}/cancel`, { by }),
};
