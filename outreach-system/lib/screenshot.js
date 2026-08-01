// Erstellt Vorher- (Original-Website) und Nachher-Screenshots (neues Mockup)
// und montiert sie nebeneinander zu einem Vergleichsbild.
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { pruefeUrlOeffentlich } from './safeurl.js';

const VIEWPORT = { width: 1280, height: 900, deviceScaleFactor: 1 };

// Findet einen installierten Chrome/Edge-Browser, damit kein Chromium-Download
// nötig ist (auf verwalteten PCs oft vom Virenscanner blockiert).
// Override per Umgebungsvariable PUPPETEER_EXECUTABLE_PATH möglich.
export function findBrowser() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium',
  ];
  return candidates.find((p) => existsSync(p)) || null;
}

export async function captureBeforeAfter(lead, mockupFile, outDir) {
  const executablePath = findBrowser();
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: executablePath || undefined, // sonst gebündeltes Chromium
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const before = path.join(outDir, 'before.png');
    const after = path.join(outDir, 'after.png');
    const combined = path.join(outDir, 'before-after.png');

    await shoot(browser, lead.website, before, { waitExternal: true });
    await shoot(browser, pathToFileURL(mockupFile).href, after, { waitExternal: false });
    await combine(before, after, combined);

    return { before, after, combined };
  } finally {
    await browser.close();
  }
}

async function shoot(browser, url, outPath, { waitExternal }) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  try {
    // Fremde Website-URLs gegen SSRF prüfen (nur echte externe Ziele; das eigene
    // lokale Mockup, waitExternal=false, ist ausgenommen).
    if (waitExternal) await pruefeUrlOeffentlich(url);
    await page.goto(url, {
      waitUntil: waitExternal ? 'networkidle2' : 'load',
      timeout: 25000,
    });
    // Volle Höhe begrenzen, damit das Bild handhabbar bleibt
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height } });
  } catch (e) {
    // Platzhalter, falls die Originalseite nicht lädt
    await sharp({ create: { width: VIEWPORT.width, height: VIEWPORT.height, channels: 3, background: '#e5e7eb' } })
      .png().toFile(outPath);
  } finally {
    await page.close();
  }
}

// Montiert before|after nebeneinander mit Labels.
async function combine(beforePath, afterPath, outPath) {
  const w = 640, h = 450, gap = 16;
  const label = (text, color) =>
    Buffer.from(
      `<svg width="${w}" height="34"><rect width="100%" height="100%" fill="${color}"/><text x="16" y="23" font-family="Arial" font-size="18" font-weight="bold" fill="#fff">${text}</text></svg>`
    );

  const [beforeImg, afterImg] = await Promise.all([
    sharp(beforePath).resize(w, h, { fit: 'cover', position: 'top' }).toBuffer(),
    sharp(afterPath).resize(w, h, { fit: 'cover', position: 'top' }).toBuffer(),
  ]);

  await sharp({
    create: { width: w * 2 + gap, height: h + 34, channels: 4, background: '#ffffff' },
  })
    .composite([
      { input: label('VORHER', '#6b7280'), top: 0, left: 0 },
      { input: label('NACHHER (AVA)', '#2563eb'), top: 0, left: w + gap },
      { input: beforeImg, top: 34, left: 0 },
      { input: afterImg, top: 34, left: w + gap },
    ])
    .png()
    .toFile(outPath);
}
