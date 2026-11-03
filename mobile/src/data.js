export const TODAY = '2026-10-07';
export const CASE_STATUSES = ['Preparation', 'Submitted', 'Approved', 'Rejected'];
export const DOC_STATUSES = ['Missing', 'Submitted', 'Needs correction', 'Approved'];

export const PEOPLE = {
  camila: { name: 'Camila Reyes', short: 'Camila', role: 'client' },
  tereza: { name: 'Tereza Králová', short: 'Tereza', role: 'consultant' },
  martin: { name: 'Martin Novák', short: 'Martin', role: 'consultant' },
  lucie: { name: 'Lucie Horáková', short: 'Lucie', role: 'admin' },
};

export const fmtDate = (d) =>
  new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export const fmtRange = (t) => {
  const [h, m] = t.split(':').map(Number);
  const e = h * 60 + m + 30;
  const p = (n) => String(n).padStart(2, '0');
  return `${t}–${p(Math.floor(e / 60))}:${p(e % 60)}`;
};

export const sortSlots = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

export const daysUntil = (d) => Math.round((new Date(d + 'T00:00') - new Date(TODAY + 'T00:00')) / 864e5);
export const dueInfo = (d) => {
  const n = daysUntil(d);
  if (n < 0) return { text: `Overdue by ${-n} day${n === -1 ? '' : 's'}`, level: 'bad' };
  if (n === 0) return { text: 'Due today', level: 'bad' };
  return { text: `Due ${fmtDate(d)} · in ${n} day${n === 1 ? '' : 's'}`, level: n <= 7 ? 'warn' : 'ok' };
};
export const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
