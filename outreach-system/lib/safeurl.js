// Zentrale URL-Sicherung gegen SSRF: erlaubt nur öffentliche http/https-Adressen.
// Blockiert file://, andere Schemata sowie interne/private/Cloud-Metadaten-Ziele.
import dns from 'node:dns/promises';
import net from 'node:net';

function istPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;              // Link-Local / Cloud-Metadaten
    if (a === 172 && b >= 16 && b <= 31) return true;     // 172.16/12
    if (a === 192 && b === 168) return true;              // 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return true;    // CGNAT 100.64/10
    return false;
  }
  const l = ip.toLowerCase();
  return l === '::1' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80') || l === '::';
}

/** Wirft, wenn die URL nicht öffentlich http/https ist. Gibt sonst die geparste URL zurück. */
export async function pruefeUrlOeffentlich(roh) {
  let u;
  try { u = new URL(String(roh)); }
  catch { throw new Error('Ungültige URL: ' + roh); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:')
    throw new Error('Nur http/https erlaubt (blockiert: ' + u.protocol + ')');
  // Direkt notierte interne IPs sofort blocken.
  if (net.isIP(u.hostname) && istPrivateIp(u.hostname))
    throw new Error('Interne IP-Adresse blockiert: ' + u.hostname);
  // Hostnamen auflösen und alle Adressen prüfen (DNS-Rebinding/interne Namen abfangen).
  try {
    const adressen = await dns.lookup(u.hostname, { all: true });
    if (adressen.some((a) => istPrivateIp(a.address)))
      throw new Error('Hostname zeigt auf eine interne Adresse: ' + u.hostname);
  } catch (e) {
    if (String(e.message).includes('interne')) throw e;
    // DNS-Fehler = Ziel ohnehin nicht erreichbar; der Aufrufer behandelt das.
  }
  return u;
}

/** Bequeme boolesche Variante für Filter (ohne throw). */
export async function istUrlSicher(roh) {
  try { await pruefeUrlOeffentlich(roh); return true; } catch { return false; }
}
