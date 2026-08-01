// Findet Betriebe über die Google Places API (Text Search, New) und bewertet,
// wie dringend ihre Website eine Optimierung braucht.
// Ohne API-Key wird ein Hinweis ausgegeben und eine leere Liste zurückgegeben.

import { pruefeUrlOeffentlich } from './safeurl.js';

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

export async function discover({ queries, limit, apiKey }) {
  if (!apiKey) {
    console.warn('⚠  Kein GOOGLE_MAPS_API_KEY gesetzt – Lead-Suche übersprungen.');
    console.warn('   Trage Betriebe manuell in leads.json ein oder hinterlege den Key in .env.');
    return [];
  }

  const results = [];
  for (const query of queries) {
    if (results.length >= limit) break;
    const places = await searchPlaces(query.trim(), apiKey);
    for (const p of places) {
      if (results.length >= limit) break;
      if (!p.websiteUri) continue; // ohne Website nichts zu optimieren
      const lead = {
        name: p.displayName?.text || '',
        website: p.websiteUri,
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
        address: p.formattedAddress || '',
        category: query.trim(),
        email: '', // wird in der Analyse-Phase von der Website gezogen
      };
      // Website kurz prüfen: braucht sie Optimierung?
      lead.score = await scoreWebsite(lead.website);
      // Nur Leads mit echtem Optimierungsbedarf aufnehmen (Score >= 30)
      if (lead.score >= 30) results.push(lead);
    }
  }
  // Höchster Optimierungsbedarf zuerst
  results.sort((a, b) => (b.score || 0) - (a.score || 0));
  return results.slice(0, limit);
}

async function searchPlaces(textQuery, apiKey) {
  const res = await fetch(PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.displayName,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery, languageCode: 'de', regionCode: 'DE', maxResultCount: 20 }),
  });
  if (!res.ok) {
    console.warn(`   Places-API Fehler (${res.status}) bei "${textQuery}": ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  return data.places || [];
}

// Heuristik: lädt die Startseite und vergibt Punkte für typische Schwächen.
// 0 = top, 100 = dringend überarbeiten.
export async function scoreWebsite(url) {
  let html = '';
  let ok = false;
  try {
    await pruefeUrlOeffentlich(url); // SSRF-Schutz: nur öffentliche http/https-Ziele
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (AVA-Webcheck)' },
      signal: AbortSignal.timeout(12000),
    });
    ok = res.ok;
    html = (await res.text()).slice(0, 200000);
  } catch {
    return 70; // nicht erreichbar / Timeout = sehr verbesserungswürdig
  }

  let score = 0;
  const lower = html.toLowerCase();

  if (!url.startsWith('https://')) score += 15;                       // kein HTTPS
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) score += 25;     // nicht mobil-optimiert
  if (/wix\.com|jimdo|weebly|1and1|ionos-website|godaddy site/i.test(lower)) score += 15; // Baukasten
  if (/<table[\s>]/i.test(lower) && (lower.match(/<table/g) || []).length > 3) score += 10; // Tabellen-Layout
  if (!/<meta[^>]+name=["']description["']/i.test(html)) score += 8;   // kein SEO-Description
  if (!/<link[^>]+(rel=["']stylesheet["']|font)/i.test(html) && !/<style/i.test(lower)) score += 8;
  if (html.length < 4000) score += 12;                                 // sehr dünne Seite
  if (/copyright\s*©?\s*(199\d|200\d|201[0-8])/i.test(lower)) score += 10; // altes Copyright-Jahr
  if (/flash|swfobject/i.test(lower)) score += 15;                     // Flash = sehr alt
  if (!ok) score += 10;

  return Math.min(100, score);
}
