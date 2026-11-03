import { mock } from './mockApi';

// No EXPO_PUBLIC_API_URL -> instant demo mode (in-memory). With it -> real REST API + MongoDB.
// Physical phone: http://<your-computer-LAN-IP>:4000 · Android emulator: http://10.0.2.2:4000
const BASE = process.env.EXPO_PUBLIC_API_URL || '';
export const MODE = BASE ? 'MongoDB' : 'Demo';

async function req(method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
}

const real = {
  state: () => req('GET', '/api/state'),
  setStatus: (key, status) => req('PATCH', `/api/cases/${key}/status`, { status }),
  upload: (key, i, file) => req('POST', `/api/cases/${key}/docs/${i}/upload`, { file }),
  review: (key, i, approve, note) => req('POST', `/api/cases/${key}/docs/${i}/review`, { approve, note }),
  addSlot: (consultant, date, time) => req('POST', '/api/slots', { consultant, date, time }),
  delSlot: (id) => req('DELETE', `/api/slots/${id}`),
  book: (id, by) => req('POST', `/api/slots/${id}/book`, { by }),
  cancel: (id, by) => req('POST', `/api/slots/${id}/cancel`, { by }),
};

export const api = BASE ? real : mock;




