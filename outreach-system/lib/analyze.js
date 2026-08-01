// Analysiert die bestehende Website eines Leads:
//  - sammelt Geschäftsinfos (Name, Beschreibung, E-Mail, Telefon, Leistungen)
//  - lädt das Logo und extrahiert die Markenfarben (für das Theme der neuen Seite)
import sharp from 'sharp';
import { pruefeUrlOeffentlich } from './safeurl.js';

export async function analyze(lead) {
  const html = await fetchHtml(lead.website);
  const info = extractInfo(html, lead);
  // E-Mail steht bei DE-Seiten meist im Impressum -> ggf. dort nachladen
  if (!info.email) info.email = await findEmailDeep(html, lead.website);
  const logoUrl = findLogoUrl(html, lead.website);
  const colors = await extractColors(logoUrl);
  return { info, colors, logoUrl };
}

async function fetchHtml(url) {
  await pruefeUrlOeffentlich(url); // SSRF-Schutz: nur öffentliche http/https-Ziele
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (AVA-Webcheck)' },
    signal: AbortSignal.timeout(15000),
  });
  // Antwortgröße begrenzen (Schutz vor riesigen/bösartigen Antworten).
  return (await res.text()).slice(0, 500000);
}

function extractInfo(html, lead) {
  const pick = (re) => (html.match(re)?.[1] || '').trim();
  const title = pick(/<title[^>]*>([^<]+)<\/title>/i);
  const description =
    pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);

  // Überschriften als grobe Leistungsliste
  const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 2 && t.length < 80)
    .slice(0, 8);

  return {
    title: title || lead.name,
    description,
    email: lead.email || findEmailInHtml(html),
    phone: lead.phone,
    address: lead.address,
    headings,
  };
}

// Findet eine E-Mail in einem HTML-Block: mailto, Klartext, oder verschleiert
// (info(at)domain.de / info [at] domain . de / &#64; usw.).
function findEmailInHtml(html) {
  const mailto = html.match(/mailto:([^"'?\s>]+@[^"'?\s>]+)/i)?.[1];
  if (mailto) return cleanEmail(mailto);

  // Entitäten dekodieren und gängige Verschleierungen normalisieren
  const norm = html
    .replace(/&#0?64;|&#x40;/gi, '@')
    .replace(/&#0?46;|&#x2e;/gi, '.')
    .replace(/\s*[\(\[\{]\s*at\s*[\)\]\}]\s*/gi, '@')
    .replace(/\s+at\s+/gi, '@')
    .replace(/\s*[\(\[\{]\s*(dot|punkt)\s*[\)\]\}]\s*/gi, '.')
    .replace(/\s+(dot|punkt)\s+/gi, '.');

  const plain = norm.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)?.[0];
  if (plain && !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(plain)) return cleanEmail(plain);
  return '';
}

const cleanEmail = (e) => e.trim().replace(/\s+/g, '').toLowerCase();

// Lädt zusätzlich Impressum/Kontakt-Seiten, falls die Startseite keine Mail hat.
async function findEmailDeep(homepageHtml, baseUrl) {
  const links = new Set();
  for (const m of homepageHtml.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1];
    const text = (m[2] || '').toLowerCase();
    if (/impressum|kontakt|imprint|contact|legal/i.test(href + ' ' + text)) {
      try { links.add(new URL(href, baseUrl).href); } catch { /* ignore */ }
    }
  }
  for (const url of [...links].slice(0, 3)) {
    try {
      const html = await fetchHtml(url);
      const email = findEmailInHtml(html);
      if (email) return email;
    } catch { /* nächste Seite versuchen */ }
  }
  return '';
}

// Sucht die wahrscheinlichste Logo-/Bildquelle für die Farbanalyse.
function findLogoUrl(html, baseUrl) {
  const abs = (u) => {
    try { return new URL(u, baseUrl).href; } catch { return null; }
  };
  const candidates = [];
  // 1) explizites Logo-Bild
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    const tag = m[0].toLowerCase();
    if (tag.includes('logo')) candidates.push(abs(m[1]));
  }
  // 2) og:image
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (og) candidates.push(abs(og));
  // 3) apple-touch-icon / großes Icon
  const apple = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (apple) candidates.push(abs(apple));
  // 4) favicon
  const fav = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (fav) candidates.push(abs(fav));
  // 5) Standard-favicon
  candidates.push(abs('/favicon.ico'));

  return candidates.find(Boolean) || null;
}

// Extrahiert ein Markenfarben-Set aus dem Logo. Fällt auf neutrale AVA-Farben zurück.
export async function extractColors(logoUrl) {
  // text = Schriftfarbe AUF primary (Hero/Footer). primary ist dunkel -> weiß.
  const fallback = {
    primary: '#1f2937', secondary: '#374151', accent: '#3b82f6',
    light: '#f8fafc', text: '#ffffff', source: 'fallback',
  };
  if (!logoUrl) return fallback;
  try {
    await pruefeUrlOeffentlich(logoUrl); // SSRF-Schutz für aus der Seite geparste Logo-URL
    const res = await fetch(logoUrl, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return fallback;
    const buf = Buffer.from(await res.arrayBuffer());

    // Dominante Farben über eine kleine Histogramm-Quantisierung gewinnen
    const { data, info } = await sharp(buf)
      .resize(64, 64, { fit: 'inside' })
      .flatten({ background: '#ffffff' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const buckets = new Map();
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      // helle (inkl. heller Anti-Aliasing-Grautöne), fast schwarze und graue Pixel raus
      if (min > 222) continue;                      // (fast) weiß / sehr hell
      if (max < 18) continue;                       // fast schwarz
      if (max - min < 16 && max > 60) continue;     // graustufig (kein Markencharakter)
      const key = `${r >> 4},${g >> 4},${b >> 4}`;  // 4-Bit-Quantisierung
      const e = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
      e.r += r; e.g += g; e.b += b; e.n++;
      buckets.set(key, e);
    }
    const colors = [...buckets.values()]
      .map((e) => {
        const r = Math.round(e.r / e.n), g = Math.round(e.g / e.n), b = Math.round(e.b / e.n);
        return { r, g, b, n: e.n, sat: Math.max(r, g, b) - Math.min(r, g, b) };
      })
      .sort((a, b) => b.n - a.n);

    if (!colors.length) return fallback;

    // Markenfarbe = kräftigste Farbe mit ausreichender Häufigkeit
    // (Häufigkeit * Sättigung), nicht einfach die häufigste (= meist Anti-Aliasing).
    const brand =
      colors.filter((c) => c.sat >= 30).sort((a, b) => b.sat * Math.sqrt(b.n) - a.sat * Math.sqrt(a.n))[0] ||
      colors[0];

    // primary trägt den Hero-Hintergrund -> muss dunkel genug für weiße Schrift sein.
    const primary = luminance(brand) > 0.55 ? darken(brand, 0.42) : brand;
    // accent = kräftige Markenfarbe für Buttons (heller als primary).
    const accent = luminance(brand) > 0.45 ? brand : lighten(brand, 0.22);
    const secondary = darken(primary, 0.18);

    return {
      primary: hex(primary),
      secondary: hex(secondary),
      accent: hex(accent),
      light: '#f8fafc',
      text: readableText(primary),
      source: logoUrl,
    };
  } catch {
    return fallback;
  }
}

// --- Farb-Helfer ---
const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const darken = (c, f) => ({ r: c.r * (1 - f), g: c.g * (1 - f), b: c.b * (1 - f) });
const lighten = (c, f) => ({ r: c.r + (255 - c.r) * f, g: c.g + (255 - c.g) * f, b: c.b + (255 - c.b) * f });
const luminance = (c) => (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
const readableText = (c) => (luminance(c) > 0.6 ? '#111827' : '#ffffff');
// kräftigste, gesättigtste Farbe als Akzent
function pickAccent(sorted) {
  return sorted
    .map((c) => ({ ...c, sat: (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) }))
    .sort((a, b) => b.sat - a.sat)[0];
}
