// Local development only. Vercel uses api/index.js instead.
import os from 'node:os';
import app, { connectDb } from './app.js';

// ---------- IPv4 auto-detection ----------
const VIRTUAL = /(vethernet|virtualbox|vmware|vbox|wsl|docker|hyper-v|loopback|tailscale|zerotier|vpn|tap|tun)/i;
const isPrivate = (ip) =>
  /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

function getLocalIPv4() {
  const all = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      const v4 = a.family === 'IPv4' || a.family === 4;
      if (v4 && !a.internal && !a.address.startsWith('169.254.')) {
        all.push({ name, address: a.address, virtual: VIRTUAL.test(name) });
      }
    }
  }
  const pick =
    all.find((a) => !a.virtual && isPrivate(a.address)) ||
    all.find((a) => isPrivate(a.address)) ||
    all[0];
  return pick ? pick.address : '127.0.0.1';
}

const PORT = process.env.PORT || 4000;

await connectDb();

app.listen(PORT, '0.0.0.0', () => {
  console.log('API running:');
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${getLocalIPv4()}:${PORT}   (auto-detected IPv4)`);
});


