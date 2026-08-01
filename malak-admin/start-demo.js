/**
 * Malak Demo-Starter
 * ──────────────────
 * Startet den Shop-Server und einen kostenlosen öffentlichen
 * Cloudflare-Tunnel. Der öffentliche Link wird hier angezeigt
 * und zusätzlich in DEMO-URL.txt gespeichert.
 *
 * Start:  Doppelklick auf start-demo.bat   (oder: node start-demo.js)
 * Ende:   Fenster schließen bzw. Strg+C
 *
 * Hinweis: Der Link ist nur gültig, solange dieses Fenster offen ist.
 * Nach einem Neustart gibt es eine NEUE Zufalls-URL (kostenlos, ohne Account).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const HERE = __dirname;
const PORT = process.env.PORT || 4000;
const children = [];
// Demo-Zugang (überschreibbar per Umgebungsvariable).
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'malak2026';
const ADMIN_USER = process.env.ADMIN_USER || 'malak';

function line(char = '─') { console.log(char.repeat(64)); }

async function serverAlive() {
  try { const r = await fetch(`http://localhost:${PORT}/api/products`); return r.ok; }
  catch { return false; }
}

async function main() {
  console.log('');
  line('═');
  console.log('  MALAK GMBH – DEMO-STARTER');
  line('═');

  /* 1) Shop-Server starten (falls nicht schon aktiv) */
  if (await serverAlive()) {
    console.log(`  ✔ Server läuft bereits auf Port ${PORT}.`);
  } else {
    console.log(`  ▶ Starte Server (Port ${PORT}) …`);
    const server = spawn(process.execPath, [path.join(HERE, 'server.js')], { cwd: HERE, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ADMIN_PASSWORD: ADMIN_PW, ADMIN_USER } });
    children.push(server);
    server.stdout.on('data', d => process.stdout.write('    [Server] ' + d));
    server.stderr.on('data', d => process.stdout.write('    [Server] ' + d));
    server.on('exit', c => { console.log(`  ✖ Server beendet (Code ${c}).`); shutdown(1); });
    for (let i = 0; i < 30 && !(await serverAlive()); i++) await new Promise(r => setTimeout(r, 500));
    if (!(await serverAlive())) { console.log('  ✖ Server startet nicht – Abbruch.'); return shutdown(1); }
    console.log('  ✔ Server läuft.');
  }

  /* 2) Öffentlichen Tunnel starten (Cloudflare, kostenlos, ohne Account) */
  console.log('  ▶ Starte öffentlichen Link (Cloudflare Tunnel) …');
  // Pfad zur echten cloudflared.exe aus dem npm-Paket (kein Shell nötig →
  // funktioniert auch mit Leerzeichen im Pfad, z. B. OneDrive-Ordner)
  const { bin } = require('cloudflared');
  const tun = spawn(bin, ['tunnel', '--url', `http://localhost:${PORT}`], { cwd: HERE, stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(tun);

  let url = null;
  const scan = d => {
    if (url) return;
    const m = String(d).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (!m) return;
    url = m[0];
    fs.writeFileSync(path.join(HERE, 'DEMO-URL.txt'),
      `Malak GmbH – Demo-Links (${new Date().toLocaleString('de-DE')})\r\n\r\n` +
      `Shop:        ${url}\r\n` +
      `Backoffice:  ${url}/admin\r\n` +
      `Login:       ${ADMIN_USER} / ${ADMIN_PW}\r\n\r\n` +
      `Gültig, solange das Demo-Fenster auf diesem PC offen ist.\r\n`);
    console.log('');
    line('═');
    console.log('  ✅ DEMO IST ONLINE – Links zum Weitergeben:');
    console.log('');
    console.log(`  🛒 Shop:        ${url}`);
    console.log(`  🔐 Backoffice:  ${url}/admin`);
    console.log(`     Login:       ${ADMIN_USER} / ${ADMIN_PW}`);
    console.log('');
    console.log('  Die Links stehen auch in DEMO-URL.txt.');
    console.log('  ⚠ Dieses Fenster OFFEN LASSEN – Schließen beendet die Demo.');
    line('═');
  };
  tun.stdout.on('data', scan);
  tun.stderr.on('data', scan);
  tun.on('exit', c => { console.log(`  ✖ Tunnel beendet (Code ${c}).`); shutdown(1); });

  setTimeout(() => { if (!url) console.log('  … Tunnel braucht länger als üblich. Internetverbindung prüfen.'); }, 20000);
}

function shutdown(code = 0) {
  for (const c of children) { try { c.kill(); } catch { /* schon beendet */ } }
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main();
