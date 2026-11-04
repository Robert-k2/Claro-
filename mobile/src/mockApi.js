// In-memory backend used when EXPO_PUBLIC_API_URL is not set (instant demo, no server needed).
// It mirrors the REST API in /server, including its business rules.
const doc = (name, status, due, note) => ({ name, status, due: due || null, note: note || '', file: '' });
let nid = 100;
const state = {
  cases: {
    camila: {
      key: 'camila', name: 'Camila Reyes', from: 'Bogotá', uni: 'Charles University', status: 'Preparation',
      docs: [
        doc('Passport copy', 'Approved'),
        doc('University acceptance letter', 'Submitted', '2026-10-15'),
        doc('Proof of accommodation', 'Missing', '2026-10-20'),
        doc('Health insurance', 'Needs correction', '2026-10-23', 'Policy must cover at least 60,000 EUR and the full stay.'),
        doc('Proof of funds', 'Missing', '2026-10-30'),
      ],
    },
    diego: {
      key: 'diego', name: 'Diego Paredes', from: 'Lima', uni: 'Masaryk University', status: 'Submitted',
      docs: ['Passport copy', 'University acceptance letter', 'Proof of accommodation', 'Health insurance', 'Proof of funds'].map((n) => doc(n, 'Approved')),
    },
  },
  slots: [
    { id: '1', consultant: 'tereza', date: '2026-11-10', time: '11:00', by: 'diego' },
    { id: '2', consultant: 'tereza', date: '2026-11-13', time: '11:30', by: null },
    { id: '3', consultant: 'tereza', date: '2026-11-20', time: '11:00', by: null },
    { id: '4', consultant: 'martin', date: '2026-11-09', time: '09:00', by: null },
    { id: '5', consultant: 'martin', date: '2026-11-09', time: '09:30', by: 'camila' },
    { id: '6', consultant: 'martin', date: '2026-11-16', time: '10:00', by: null },
  ],
};
const ok = (v = {}) => new Promise((r) => setTimeout(() => r(v), 120));
const fail = (m) => Promise.reject(new Error(m));
const slot = (id) => state.slots.find((s) => s.id === id);

export const mock = {
  state: () => ok(JSON.parse(JSON.stringify(state))),
  setStatus: (k, s) => { state.cases[k].status = s; return ok(); },
  upload: (k, i, file) => {
    const d = state.cases[k].docs[i];
    if (!['Missing', 'Needs correction'].includes(d.status)) return fail('This document cannot be uploaded right now');
    Object.assign(d, { status: 'Submitted', note: '', file });
    return ok();
  },
  review: (k, i, approve, note) => {
    const d = state.cases[k].docs[i];
    if (d.status !== 'Submitted') return fail('Document is not waiting for review');
    if (!approve && !note?.trim()) return fail('A correction note is required');
    Object.assign(d, { status: approve ? 'Approved' : 'Needs correction', note: approve ? '' : note.trim() });
    return ok();
  },
  addSlot: (consultant, date, time) => {
    if (state.slots.some((s) => s.consultant === consultant && s.date === date && s.time === time)) return fail('You already have that slot');
    state.slots.push({ id: String(nid++), consultant, date, time, by: null });
    return ok();
  },
  delSlot: (id) => {
    if (slot(id)?.by) return fail('Booked slots cannot be removed');
    state.slots = state.slots.filter((s) => s.id !== id);
    return ok();
  },
  book: (id, by) => { const s = slot(id); if (!s || s.by) return fail('Slot just taken'); s.by = by; return ok(); },
  cancel: (id, by) => { const s = slot(id); if (!s || s.by !== by) return fail('Booking not found'); s.by = null; return ok(); },
};
