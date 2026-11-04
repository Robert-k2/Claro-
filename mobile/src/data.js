export const TODAY = '2026-11-05'; //todays data
export const CASE_STATUSES = ['Preparation', 'Submitted', 'Approved', 'Rejected']; // statues for each of the cases 
export const DOC_STATUSES = ['Missing', 'Submitted', 'Needs correction', 'Approved']; //documentation statues for each of the cases

export const PEOPLE = { //Mock data for the worker roles 
  camila: { name: 'Camila Reyes', short: 'Camila', role: 'client' },
  tereza: { name: 'Tereza Králová', short: 'Tereza', role: 'consultant' },
  martin: { name: 'Martin Novák', short: 'Martin', role: 'consultant' },
  lucie: { name: 'Lucie Horáková', short: 'Lucie', role: 'admin' },
};

export const fmtDate = (d) =>
  new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });//Converts the date to a more readable formate 

export const fmtRange = (t) => {
  const [h, m] = t.split(':').map(Number);
  const e = h * 60 + m + 30;
  const p = (n) => String(n).padStart(2, '0');
  return `${t}–${p(Math.floor(e / 60))}:${p(e % 60)}`;
}; //Takes the starting time and add at least 30 minutes to it and returns the time range in a reable formate

export const sortSlots = (a, b) => (a.date + a.time).localeCompare(b.date + b.time); //function sorts appointment time by the date and time 

export const daysUntil = (d) => Math.round((new Date(d + 'T00:00') - new Date(TODAY + 'T00:00')) / 864e5); //Caculates the number of days between todays date and a given date 
export const dueInfo = (d) => {
  const n = daysUntil(d);
  if (n < 0) return { text: `Overdue by ${-n} day${n === -1 ? '' : 's'}`, level: 'bad' };
  if (n === 0) return { text: 'Due today', level: 'bad' };
  return { text: `Due ${fmtDate(d)} · in ${n} day${n === 1 ? '' : 's'}`, level: n <= 7 ? 'warn' : 'ok' };
}; //checks a due date and tells you whether something is overdue, due today, or still has time left.
export const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(); // person's name and creates initials from the first two words.
