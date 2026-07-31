/**
 * Malak GmbH – Backoffice & Shop-Backend (Enterprise-Ausbau)
 * ──────────────────────────────────────────────────────────
 *  /            → öffentlicher Shop (mit echtem Checkout)
 *  /admin       → Verwaltungssystem (Login: Benutzer + Passwort, optional 2FA)
 *  /api/*       → JSON-API (öffentlich + Admin)
 *
 *  Daten: JSON-Dateien in ./data (atomare Schreibvorgänge, in-Memory-Cache).
 *  Backup = data-Ordner kopieren. Kein Datenbankserver nötig.
 *
 *  Rollen:  admin (alles) · staff (Produkte/Lager/Bestellungen/Kunden/…)
 *  Sicherheit: scrypt-Passwort-Hashes, Login-Sperre nach Fehlversuchen,
 *              TOTP-2FA (RFC 6238), Session-Cookies (httpOnly).
 */

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;
// DATA_DIR per Env änderbar → beim Cloud-Hosting auf ein persistentes Volume legen
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const LOG_FILE = path.join(DATA_DIR, 'server.log');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ═══════════════════ Logging ═══════════════════ */

function log(level, msg, extra) {
  const line = `[${new Date().toISOString()}] ${level.padEnd(5)} ${msg}${extra ? ' ' + JSON.stringify(extra) : ''}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch { /* Log darf nie crashen */ }
}

/* ═══════════════════ Mini-Datenbank (JSON-Collections) ═══════════════════ */

const store = {};
const fileOf = n => path.join(DATA_DIR, n + '.json');

function load(name, fallback) {
  try { store[name] = JSON.parse(fs.readFileSync(fileOf(name), 'utf8')); }
  catch { store[name] = fallback; }
  return store[name];
}
function save(name) {
  const tmp = fileOf(name) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store[name], null, 2));
  fs.renameSync(tmp, fileOf(name));
}

const newId = p => p + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n; };
const round2 = n => Math.round((Number(n) || 0) * 100) / 100;
const dayKey = (d = new Date()) => new Date(d).toISOString().slice(0, 10);
const slugify = s => String(s || '').toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ═══════════════════ Passwörter & 2FA (TOTP, RFC 6238) ═══════════════════ */

function hashPassword(pw) {
  const salt = crypto.randomBytes(8).toString('hex');
  return salt + ':' + crypto.scryptSync(String(pw), salt, 32).toString('hex');
}
function checkPassword(pw, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(String(pw), salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(buf) {
  let bits = 0, val = 0, out = '';
  for (const b of buf) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
function base32Decode(str) {
  let bits = 0, val = 0; const out = [];
  for (const c of String(str).replace(/=+$/, '').toUpperCase()) {
    const i = B32.indexOf(c); if (i === -1) continue;
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
function totpCode(secretB32, offset = 0) {
  const counter = Math.floor(Date.now() / 30000) + offset;
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', base32Decode(secretB32)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
const verifyTotp = (secret, code) => [-1, 0, 1].some(w => totpCode(secret, w) === String(code || '').trim());

/* ═══════════════════ Seed & Migration ═══════════════════ */

const CAT_ICONS = { 'Getränke': '🥤', 'Getrocknete': '🌿', 'Getreide': '🌾', 'Eingelegte Gurken': '🥒', 'Süßigkeiten': '🍬', 'Cosmetics': '🧴' };

function ensureData() {
  /* Produkte: altes flaches Schema → erweitertes Schema migrieren */
  const products = load('products', []);
  let changed = false;
  products.forEach((p, i) => {
    if (p.stock === undefined) {
      changed = true;
      Object.assign(p, {
        sku: p.sku || 'MAL-' + String(p.id).replace(/^p/, '').toUpperCase(),
        barcode: '', shortDescription: '', description: p.description || '',
        purchasePrice: round2((p.price || 0) * 0.6),
        stock: 10 + (i * 7) % 41, minStock: 5,
        subcategory: '', manufacturer: String(p.name).split(' ')[0], brand: String(p.name).split(' ')[0],
        weight: null, length: null, width: null, height: null,
        shippingClass: 'standard',
        taxRate: p.category === 'Cosmetics' ? 19 : 7,
        deliveryTime: '2–4 Werktage', active: true,
        images: p.image ? [p.image] : [], videoUrl: '',
        colors: [], sizes: [], material: '', tags: [p.category],
        seoTitle: '', seoDescription: '', slug: slugify(p.name),
        createdAt: Date.now() - (30 - i) * 86400000, updatedAt: Date.now()
      });
    }
  });
  if (changed) save('products');

  /* Kategorien */
  const categories = load('categories', []);
  if (!categories.length) {
    [...new Set(products.map(p => p.category))].forEach((c, i) =>
      categories.push({ id: newId('c'), name: c, parent: '', icon: CAT_ICONS[c] || '📦', image: '', sortOrder: i }));
    save('categories');
  }

  /* Benutzer */
  const users = load('users', []);
  if (!users.length) {
    users.push({
      id: newId('u'), username: process.env.ADMIN_USER || 'malak', name: 'Inhaber',
      role: 'admin', password: hashPassword(process.env.ADMIN_PASSWORD || 'malak2026'),
      totpSecret: '', totpEnabled: false, createdAt: Date.now()
    });
    save('users');
  }

  /* Einstellungen (fehlende Schlüssel ergänzen) */
  const s = load('settings', {});
  const def = {
    storeName: 'Malak GmbH', tagline: 'Günstig & gesund', currency: 'EUR', language: 'de',
    domain: 'malak-gmbh.de', logoUrl: '/malak-logo.jpg', faviconUrl: '', primaryColor: '#1F9B45',
    freeShipping: 50, shippingCost: 4.9, taxRateDefault: 7,
    deliveryInfo: 'Lieferung innerhalb von 2–4 Werktagen. Gratis Versand ab 50 €.',
    pickupInfo: 'Abholung im Lager in Aitrach nach Absprache möglich.',
    contactEmail: 'info@malak-gmbh.de', contactPhone: '+49 1575 4895590',
    address: 'Bahnhofstraße 19, 87527 Sonthofen', orderCounter: 10000,
    paymentMethods: [
      { id: 'paypal', label: 'PayPal', enabled: true },
      { id: 'card', label: 'Kreditkarte', enabled: true },
      { id: 'applepay', label: 'Apple Pay', enabled: false },
      { id: 'googlepay', label: 'Google Pay', enabled: false },
      { id: 'klarna', label: 'Klarna', enabled: false },
      { id: 'banktransfer', label: 'Banküberweisung', enabled: true },
      { id: 'cod', label: 'Barzahlung bei Abholung', enabled: true }
    ],
    shippingMethods: [
      { id: 'dhl', label: 'DHL Standard', cost: 4.9, enabled: true },
      { id: 'pickup', label: 'Abholung in Aitrach', cost: 0, enabled: true }
    ],
    shippingZones: [{ name: 'Deutschland', cost: 4.9 }, { name: 'EU', cost: 12.9 }],
    legal: {
      impressum: 'Malak GmbH\nBahnhofstraße 19\n87527 Sonthofen\n\nVertreten durch die Geschäftsführung.\nKontakt: info@malak-gmbh.de · +49 1575 4895590',
      datenschutz: 'Hier die Datenschutzerklärung einfügen (im Verwaltungssystem unter Einstellungen → Rechtliches bearbeitbar).',
      agb: 'Hier die AGB einfügen (im Verwaltungssystem unter Einstellungen → Rechtliches bearbeitbar).'
    }
  };
  let sChanged = false;
  for (const k of Object.keys(def)) if (s[k] === undefined) { s[k] = def[k]; sChanged = true; }
  if (sChanged) save('settings');

  /* Kunden + Demo-Bestellungen (damit Dashboard/Analytics nicht leer sind) */
  const customers = load('customers', []);
  const orders = load('orders', []);
  if (!orders.length && products.length) {
    const demoPeople = [
      ['Fatima Haddad', 'fatima.haddad@example.de', '+49 160 1112233', 'Lindenweg 4', '87527', 'Sonthofen'],
      ['Omar Khalil', 'omar.khalil@example.de', '+49 171 2223344', 'Bergstraße 12', '88316', 'Isny'],
      ['Sarah Weber', 'sarah.weber@example.de', '+49 152 3334455', 'Hauptstraße 88', '88299', 'Leutkirch'],
      ['Ali Nasser', 'ali.nasser@example.de', '+49 176 4445566', 'Am Anger 3', '87437', 'Kempten'],
      ['Julia Maier', 'julia.maier@example.de', '+49 157 5556677', 'Gartenstraße 21', '88410', 'Bad Wurzach'],
      ['Yusuf Demir', 'yusuf.demir@example.de', '+49 162 6667788', 'Mühlbachweg 7', '87509', 'Immenstadt']
    ];
    demoPeople.forEach(([name, email, phone, street, zip, city], i) => customers.push({
      id: newId('k') + i, name, email, phone, street, zip, city, country: 'Deutschland',
      status: 'aktiv', notes: '', createdAt: Date.now() - (25 - i * 3) * 86400000
    }));
    save('customers');

    const statuses = ['zugestellt', 'zugestellt', 'versendet', 'versendet', 'verpackt', 'in_bearbeitung', 'bezahlt', 'bezahlt', 'offen', 'offen', 'zugestellt', 'storniert'];
    const payments = ['paypal', 'card', 'banktransfer', 'cod'];
    let counter = s.orderCounter;
    for (let i = 0; i < 12; i++) {
      const created = Date.now() - Math.floor(i * 1.7 + 1) * 86400000 - (i * 7919) % 40000000;
      const cust = customers[i % customers.length];
      const nItems = 1 + (i * 3) % 4;
      const items = [];
      for (let j = 0; j < nItems; j++) {
        const p = products[(i * 5 + j * 7) % products.length];
        if (items.some(x => x.productId === p.id)) continue;
        const qty = 1 + (i + j) % 3;
        items.push({ productId: p.id, name: p.name, sku: p.sku, price: p.price, purchasePrice: p.purchasePrice, taxRate: p.taxRate, qty, image: (p.images && p.images[0]) || p.image || '' });
      }
      const subtotal = round2(items.reduce((t, x) => t + x.price * x.qty, 0));
      const shippingMethod = i % 4 === 0 ? 'pickup' : 'dhl';
      const shippingCost = shippingMethod === 'pickup' || subtotal >= s.freeShipping ? 0 : s.shippingCost;
      const status = statuses[i];
      counter += 1;
      orders.push({
        id: newId('o') + i, number: counter, createdAt: created,
        customerId: cust.id,
        customer: { name: cust.name, email: cust.email, phone: cust.phone, street: cust.street, zip: cust.zip, city: cust.city, country: 'Deutschland' },
        items, subtotal, discount: 0, couponCode: '', shippingMethod,
        shippingCost, total: round2(subtotal + shippingCost),
        paymentMethod: payments[i % payments.length], status,
        trackingNumber: ['versendet', 'zugestellt'].includes(status) ? '0034 4333 ' + (1000 + i * 37) : '',
        carrier: ['versendet', 'zugestellt'].includes(status) ? 'DHL' : '',
        note: 'Demo-Bestellung (Testdaten)', restocked: status === 'storniert',
        history: [{ status: 'offen', ts: created }, { status, ts: created + 86400000 }]
      });
    }
    s.orderCounter = counter;
    save('settings'); save('orders');
  }

  /* Gutscheine */
  const coupons = load('coupons', []);
  if (!coupons.length) {
    coupons.push({ id: newId('g'), code: 'WILLKOMMEN10', type: 'percent', value: 10, minOrder: 20, maxUses: 100, usedCount: 3, expiresAt: '', active: true, createdAt: Date.now() });
    save('coupons');
  }

  /* Besucher-Statistik (30 Tage) */
  const visits = load('visits', {});
  if (!Object.keys(visits).length) {
    for (let i = 0; i < 30; i++) {
      const d = dayKey(new Date(Date.now() - i * 86400000));
      visits[d] = 18 + (i * 13) % 52;
    }
    save('visits');
  }

  load('notifications', []);
  load('movements', []);
}

/* ═══════════════════ Benachrichtigungen ═══════════════════ */

function notify(type, text) {
  const list = store.notifications;
  list.unshift({ id: newId('n'), type, text, read: false, createdAt: Date.now() });
  if (list.length > 200) list.length = 200;
  save('notifications');
}

/* ═══════════════════ Middleware ═══════════════════ */

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(16).toString('hex'),
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 3600 * 1000 }
}));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

const storage = multer.diskStorage({
  destination: (req, f, cb) => cb(null, UPLOAD_DIR),
  filename: (req, f, cb) => cb(null, 'img_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex') + (path.extname(f.originalname) || '.jpg').toLowerCase())
});
const upload = multer({
  storage, limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, f, cb) => /^image\/(jpe?g|png|webp|gif|avif|svg\+xml)$|^video\/(mp4|webm)$/.test(f.mimetype)
    ? cb(null, true) : cb(new Error('Nur Bild- oder Videodateien sind erlaubt.'))
});

/* Rollen & Rechte */
const PERMS = {
  admin: ['*'],
  staff: ['dashboard', 'products', 'inventory', 'categories', 'orders', 'customers', 'coupons', 'media', 'search', 'notifications']
};
function can(req, perm) {
  if (!req.session || !req.session.isAdmin) return false;
  const list = PERMS[req.session.role] || [];
  return list.includes('*') || list.includes(perm);
}
const requirePerm = perm => (req, res, next) => {
  if (!req.session || !req.session.isAdmin) return res.status(401).json({ error: 'Nicht angemeldet.' });
  if (!can(req, perm)) return res.status(403).json({ error: 'Keine Berechtigung für diesen Bereich.' });
  next();
};

/* ═══════════════════ Auth ═══════════════════ */

const loginAttempts = new Map();

app.post('/api/login', (req, res) => {
  const ip = req.ip || 'unknown';
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  if (Date.now() < entry.lockedUntil) {
    const mins = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({ error: `Zu viele Fehlversuche. Bitte in ${mins} Min. erneut versuchen.` });
  }

  const { username, password, totp } = req.body || {};
  const user = store.users.find(u => u.username === String(username || '').trim());
  const pwOk = user && checkPassword(password, user.password);

  if (pwOk && user.totpEnabled && !verifyTotp(user.totpSecret, totp)) {
    // Passwort korrekt, aber 2FA-Code fehlt/falsch → zweiter Schritt nötig
    return res.status(401).json({ needTotp: true, error: totp ? 'Der 6-stellige Code ist ungültig.' : 'Bitte 2FA-Code eingeben.' });
  }

  if (pwOk) {
    loginAttempts.delete(ip);
    req.session.isAdmin = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    log('INFO', `Login: ${user.username} (${user.role})`);
    return res.json({ ok: true, username: user.username, name: user.name, role: user.role });
  }

  entry.count += 1;
  if (entry.count >= 5) { entry.lockedUntil = Date.now() + 5 * 60000; entry.count = 0; log('WARN', `Login gesperrt für IP ${ip}`); }
  loginAttempts.set(ip, entry);
  setTimeout(() => res.status(401).json({ error: 'Benutzername oder Passwort falsch.' }), 600);
});

app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get('/api/me', (req, res) => {
  if (!req.session || !req.session.isAdmin) return res.json({ isAdmin: false });
  const u = store.users.find(x => x.id === req.session.userId);
  res.json({ isAdmin: true, username: req.session.username, role: req.session.role, name: u ? u.name : '', userId: req.session.userId, totpEnabled: !!(u && u.totpEnabled) });
});

/* ═══════════════════ Öffentliche Shop-API ═══════════════════ */

const publicProduct = p => ({
  id: p.id, name: p.name, category: p.category, subcategory: p.subcategory,
  price: p.price, oldPrice: p.oldPrice, unit: p.unit,
  image: (p.images && p.images[0]) || p.image || '', images: p.images || [],
  badge: p.badge, stock: p.stock, slug: p.slug,
  shortDescription: p.shortDescription, description: p.description,
  deliveryTime: p.deliveryTime, brand: p.brand,
  colors: p.colors || [], sizes: p.sizes || [], tags: p.tags || [], videoUrl: p.videoUrl || ''
});

app.get('/api/products', (req, res) => {
  res.json(store.products
    .filter(p => p.available !== false && p.active !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(publicProduct));
});

app.get('/api/settings', (req, res) => {
  const s = store.settings;
  res.json({
    storeName: s.storeName, tagline: s.tagline, currency: s.currency,
    logoUrl: s.logoUrl, primaryColor: s.primaryColor,
    freeShipping: s.freeShipping, shippingCost: s.shippingCost,
    deliveryInfo: s.deliveryInfo, pickupInfo: s.pickupInfo,
    contactEmail: s.contactEmail, contactPhone: s.contactPhone, address: s.address,
    paymentMethods: (s.paymentMethods || []).filter(m => m.enabled),
    shippingMethods: (s.shippingMethods || []).filter(m => m.enabled),
    legal: s.legal
  });
});

/* Besucherzähler (1× pro Sitzung vom Shop aufgerufen) */
app.post('/api/track', (req, res) => {
  const k = dayKey();
  store.visits[k] = (store.visits[k] || 0) + 1;
  save('visits');
  res.json({ ok: true });
});

/* Gutschein prüfen */
function validateCoupon(code, subtotal) {
  const c = store.coupons.find(x => x.code.toUpperCase() === String(code || '').trim().toUpperCase());
  if (!c || !c.active) return { valid: false, message: 'Dieser Gutscheincode ist ungültig.' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { valid: false, message: 'Dieser Gutschein ist abgelaufen.' };
  if (c.maxUses > 0 && c.usedCount >= c.maxUses) return { valid: false, message: 'Dieser Gutschein wurde bereits zu oft eingelöst.' };
  if (subtotal < (c.minOrder || 0)) return { valid: false, message: `Mindestbestellwert ${c.minOrder.toFixed(2).replace('.', ',')} € nicht erreicht.` };
  const discount = c.type === 'percent' ? round2(subtotal * c.value / 100) : Math.min(c.value, subtotal);
  return { valid: true, discount: round2(discount), code: c.code, coupon: c };
}

app.get('/api/coupon/:code', (req, res) => {
  const r = validateCoupon(req.params.code, num(req.query.subtotal) || 0);
  if (!r.valid) return res.json({ valid: false, message: r.message });
  res.json({ valid: true, discount: r.discount, message: 'Gutschein angewendet.', code: r.code, type: r.coupon.type, value: r.coupon.value, minOrder: r.coupon.minOrder });
});

/* Checkout: legt Bestellung + Kunde an, bucht Lager ab */
app.post('/api/checkout', (req, res) => {
  const b = req.body || {};
  const c = b.customer || {};
  for (const f of ['name', 'email', 'street', 'zip', 'city']) {
    if (!String(c[f] || '').trim()) return res.status(400).json({ error: 'Bitte alle Pflichtfelder der Lieferadresse ausfüllen.' });
  }
  if (!Array.isArray(b.items) || !b.items.length) return res.status(400).json({ error: 'Der Warenkorb ist leer.' });

  const s = store.settings;
  const shipMethod = (s.shippingMethods || []).find(m => m.id === b.shippingMethod && m.enabled);
  if (!shipMethod) return res.status(400).json({ error: 'Bitte eine Versandart wählen.' });
  const payMethod = (s.paymentMethods || []).find(m => m.id === b.paymentMethod && m.enabled);
  if (!payMethod) return res.status(400).json({ error: 'Bitte eine Zahlungsart wählen.' });

  /* Positionen serverseitig validieren (Preise NIE vom Client übernehmen) */
  const items = [];
  for (const it of b.items) {
    const p = store.products.find(x => x.id === String(it.id));
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));
    if (!p || p.available === false || p.active === false) return res.status(400).json({ error: 'Ein Produkt im Warenkorb ist nicht mehr verfügbar.' });
    if (p.stock < qty) return res.status(409).json({ error: `„${p.name}" ist nur noch ${p.stock}× auf Lager.` });
    items.push({ productId: p.id, name: p.name, sku: p.sku, price: p.price, purchasePrice: p.purchasePrice, taxRate: p.taxRate, qty, image: (p.images && p.images[0]) || p.image || '' });
  }

  const subtotal = round2(items.reduce((t, x) => t + x.price * x.qty, 0));
  let discount = 0, couponCode = '';
  if (b.couponCode) {
    const r = validateCoupon(b.couponCode, subtotal);
    if (!r.valid) return res.status(400).json({ error: r.message });
    discount = r.discount; couponCode = r.code;
    r.coupon.usedCount += 1; save('coupons');
  }
  const shippingCost = shipMethod.id === 'pickup' || (subtotal - discount) >= s.freeShipping ? 0 : shipMethod.cost;
  const total = round2(subtotal - discount + shippingCost);

  /* Kunde anlegen oder wiederverwenden (per E-Mail) */
  let customer = store.customers.find(k => k.email.toLowerCase() === String(c.email).toLowerCase());
  if (!customer) {
    customer = { id: newId('k'), name: c.name.trim(), email: c.email.trim(), phone: String(c.phone || '').trim(), street: c.street.trim(), zip: c.zip.trim(), city: c.city.trim(), country: 'Deutschland', status: 'aktiv', notes: '', createdAt: Date.now() };
    store.customers.push(customer);
    save('customers');
    notify('customer', `Neuer Kunde: ${customer.name}`);
  }

  /* Lager abbuchen + Bewegungen protokollieren */
  s.orderCounter += 1;
  const number = s.orderCounter;
  for (const it of items) {
    const p = store.products.find(x => x.id === it.productId);
    p.stock -= it.qty; p.updatedAt = Date.now();
    store.movements.unshift({ id: newId('m'), ts: Date.now(), productId: p.id, name: p.name, delta: -it.qty, reason: 'Verkauf', note: 'Bestellung #' + number, stockAfter: p.stock, user: 'Shop' });
    if (p.stock <= p.minStock) notify('stock', `Niedriger Bestand: ${p.name} (${p.stock} übrig)`);
  }
  if (store.movements.length > 1000) store.movements.length = 1000;
  save('products'); save('movements'); save('settings');

  const order = {
    id: newId('o'), number, createdAt: Date.now(), customerId: customer.id,
    customer: { name: customer.name, email: customer.email, phone: customer.phone, street: c.street.trim(), zip: c.zip.trim(), city: c.city.trim(), country: 'Deutschland' },
    items, subtotal, discount, couponCode, shippingMethod: shipMethod.id,
    shippingCost, total, paymentMethod: payMethod.id, status: 'offen',
    trackingNumber: '', carrier: '', note: String(b.note || '').trim(), restocked: false,
    history: [{ status: 'offen', ts: Date.now() }]
  };
  store.orders.unshift(order);
  save('orders');
  notify('order', `Neue Bestellung #${number} von ${customer.name} (${total.toFixed(2).replace('.', ',')} €)`);
  log('INFO', `Bestellung #${number}: ${items.length} Positionen, ${total} €`);
  res.json({ ok: true, orderNumber: number, total });
});

/* ═══════════════════ Admin: Produkte ═══════════════════ */

app.get('/api/admin/products', requirePerm('products'), (req, res) =>
  res.json(store.products.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))));

function applyProductBody(p, b) {
  const strFields = ['name', 'category', 'subcategory', 'unit', 'description', 'shortDescription', 'sku', 'barcode', 'manufacturer', 'brand', 'shippingClass', 'deliveryTime', 'videoUrl', 'material', 'seoTitle', 'seoDescription'];
  for (const f of strFields) if (b[f] !== undefined) p[f] = String(b[f]).trim();
  const numFields = ['price', 'oldPrice', 'purchasePrice', 'stock', 'minStock', 'weight', 'length', 'width', 'height', 'taxRate'];
  for (const f of numFields) if (b[f] !== undefined) p[f] = b[f] === '' || b[f] === null ? null : num(b[f]);
  p.price = p.price || 0;
  p.stock = Math.max(0, Math.round(p.stock || 0));
  p.minStock = Math.max(0, Math.round(p.minStock || 0));
  if (b.badge !== undefined) p.badge = ['neu', 'sale'].includes(b.badge) ? b.badge : '';
  if (b.available !== undefined) p.available = !!b.available;
  if (b.active !== undefined) p.active = !!b.active;
  for (const f of ['images', 'colors', 'sizes', 'tags']) {
    if (b[f] !== undefined) p[f] = Array.isArray(b[f]) ? b[f].map(x => String(x).trim()).filter(Boolean) : [];
  }
  if (p.images && p.images.length) p.image = p.images[0];
  if (b.slug !== undefined) p.slug = slugify(b.slug || p.name);
  p.updatedAt = Date.now();
}

app.post('/api/admin/products', requirePerm('products'), (req, res) => {
  const b = req.body || {};
  if (!String(b.name || '').trim() || !String(b.category || '').trim()) return res.status(400).json({ error: 'Name und Kategorie sind Pflichtfelder.' });
  const p = {
    id: newId('p'), createdAt: Date.now(),
    sortOrder: store.products.length ? Math.max(...store.products.map(x => x.sortOrder ?? 0)) + 1 : 0,
    available: true, active: true, images: [], colors: [], sizes: [], tags: [],
    stock: 0, minStock: 5, taxRate: store.settings.taxRateDefault
  };
  applyProductBody(p, b);
  if (!p.sku) p.sku = 'MAL-' + String(store.settings.orderCounter + store.products.length + 1);
  if (!p.slug) p.slug = slugify(p.name);
  store.products.push(p);
  save('products');
  log('INFO', `Produkt angelegt: ${p.name}`);
  res.json(p);
});

app.put('/api/admin/products/:id', requirePerm('products'), (req, res) => {
  const p = store.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Produkt nicht gefunden.' });
  const b = req.body || {};
  if (b.name !== undefined && !String(b.name).trim()) return res.status(400).json({ error: 'Der Name darf nicht leer sein.' });
  applyProductBody(p, b);
  save('products');
  res.json(p);
});

app.patch('/api/admin/products/:id/toggle', requirePerm('products'), (req, res) => {
  const p = store.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Produkt nicht gefunden.' });
  p.available = !p.available; p.updatedAt = Date.now();
  save('products');
  res.json(p);
});

app.delete('/api/admin/products/:id', requirePerm('products'), (req, res) => {
  const before = store.products.length;
  store.products = store.products.filter(p => p.id !== req.params.id);
  if (store.products.length === before) return res.status(404).json({ error: 'Produkt nicht gefunden.' });
  save('products');
  res.json({ ok: true });
});

app.post('/api/admin/products/bulk', requirePerm('products'), (req, res) => {
  const { ids = [], action, value } = req.body || {};
  let count = 0;
  if (action === 'delete') {
    const before = store.products.length;
    store.products = store.products.filter(p => !ids.includes(p.id));
    count = before - store.products.length;
  } else {
    for (const p of store.products) {
      if (!ids.includes(p.id)) continue;
      if (action === 'show') p.available = true;
      else if (action === 'hide') p.available = false;
      else if (action === 'category' && value) p.category = String(value);
      else continue;
      p.updatedAt = Date.now(); count++;
    }
  }
  save('products');
  res.json({ ok: true, count });
});

/* ═══════════════════ Admin: Lager ═══════════════════ */

app.post('/api/admin/stock', requirePerm('inventory'), (req, res) => {
  const { productId, delta, reason, note } = req.body || {};
  const p = store.products.find(x => x.id === productId);
  const d = Math.round(num(delta) || 0);
  if (!p) return res.status(404).json({ error: 'Produkt nicht gefunden.' });
  if (!d) return res.status(400).json({ error: 'Bitte eine Menge ungleich 0 angeben.' });
  if (p.stock + d < 0) return res.status(400).json({ error: `Bestand kann nicht negativ werden (aktuell ${p.stock}).` });
  p.stock += d; p.updatedAt = Date.now();
  store.movements.unshift({
    id: newId('m'), ts: Date.now(), productId: p.id, name: p.name, delta: d,
    reason: String(reason || (d > 0 ? 'Wareneingang' : 'Warenausgang')),
    note: String(note || '').trim(), stockAfter: p.stock, user: req.session.username
  });
  if (store.movements.length > 1000) store.movements.length = 1000;
  if (p.stock <= p.minStock) notify('stock', `Niedriger Bestand: ${p.name} (${p.stock} übrig)`);
  save('products'); save('movements');
  res.json(p);
});

app.get('/api/admin/movements', requirePerm('inventory'), (req, res) =>
  res.json(store.movements.slice(0, parseInt(req.query.limit, 10) || 100)));

/* ═══════════════════ Admin: Kategorien ═══════════════════ */

app.get('/api/admin/categories', requirePerm('categories'), (req, res) =>
  res.json(store.categories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))));

app.post('/api/admin/categories', requirePerm('categories'), (req, res) => {
  const b = req.body || {};
  if (!String(b.name || '').trim()) return res.status(400).json({ error: 'Name ist Pflicht.' });
  const cat = { id: newId('c'), name: String(b.name).trim(), parent: String(b.parent || '').trim(), icon: String(b.icon || '📦').trim(), image: String(b.image || '').trim(), sortOrder: store.categories.length };
  store.categories.push(cat);
  save('categories');
  res.json(cat);
});

app.put('/api/admin/categories/:id', requirePerm('categories'), (req, res) => {
  const cat = store.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Kategorie nicht gefunden.' });
  const b = req.body || {}, oldName = cat.name;
  for (const f of ['name', 'parent', 'icon', 'image']) if (b[f] !== undefined) cat[f] = String(b[f]).trim();
  if (cat.name && cat.name !== oldName) {
    for (const p of store.products) if (p.category === oldName) p.category = cat.name;
    save('products');
  }
  save('categories');
  res.json(cat);
});

app.delete('/api/admin/categories/:id', requirePerm('categories'), (req, res) => {
  const before = store.categories.length;
  store.categories = store.categories.filter(c => c.id !== req.params.id);
  if (store.categories.length === before) return res.status(404).json({ error: 'Kategorie nicht gefunden.' });
  save('categories');
  res.json({ ok: true });
});

app.put('/api/admin/categories-order', requirePerm('categories'), (req, res) => {
  (req.body.order || []).forEach((cid, i) => { const c = store.categories.find(x => x.id === cid); if (c) c.sortOrder = i; });
  save('categories');
  res.json({ ok: true });
});

/* ═══════════════════ Admin: Bestellungen ═══════════════════ */

const ORDER_STATUSES = ['offen', 'bezahlt', 'in_bearbeitung', 'verpackt', 'versendet', 'zugestellt', 'storniert'];

app.get('/api/admin/orders', requirePerm('orders'), (req, res) => {
  let list = [...store.orders].sort((a, b) => b.createdAt - a.createdAt);
  if (req.query.status) list = list.filter(o => o.status === req.query.status);
  res.json(list);
});

app.get('/api/admin/orders/:id', requirePerm('orders'), (req, res) => {
  const o = store.orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Bestellung nicht gefunden.' });
  res.json(o);
});

app.put('/api/admin/orders/:id', requirePerm('orders'), (req, res) => {
  const o = store.orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Bestellung nicht gefunden.' });
  const b = req.body || {};
  if (b.status && ORDER_STATUSES.includes(b.status) && b.status !== o.status) {
    /* Bei Storno: Lagerbestand zurückbuchen (einmalig) */
    if (b.status === 'storniert' && !o.restocked) {
      for (const it of o.items) {
        const p = store.products.find(x => x.id === it.productId);
        if (p) {
          p.stock += it.qty;
          store.movements.unshift({ id: newId('m'), ts: Date.now(), productId: p.id, name: p.name, delta: it.qty, reason: 'Storno', note: 'Bestellung #' + o.number, stockAfter: p.stock, user: req.session.username });
        }
      }
      o.restocked = true;
      save('products'); save('movements');
    }
    o.status = b.status;
    o.history.push({ status: b.status, ts: Date.now() });
  }
  for (const f of ['trackingNumber', 'carrier', 'note']) if (b[f] !== undefined) o[f] = String(b[f]).trim();
  save('orders');
  res.json(o);
});

/* ═══════════════════ Admin: Kunden ═══════════════════ */

app.get('/api/admin/customers', requirePerm('customers'), (req, res) => {
  res.json(store.customers.map(k => {
    const kOrders = store.orders.filter(o => o.customerId === k.id && o.status !== 'storniert');
    return { ...k, ordersCount: kOrders.length, totalSpent: round2(kOrders.reduce((t, o) => t + o.total, 0)) };
  }).sort((a, b) => b.createdAt - a.createdAt));
});

app.get('/api/admin/customers/:id', requirePerm('customers'), (req, res) => {
  const k = store.customers.find(x => x.id === req.params.id);
  if (!k) return res.status(404).json({ error: 'Kunde nicht gefunden.' });
  res.json({ ...k, orders: store.orders.filter(o => o.customerId === k.id).sort((a, b) => b.createdAt - a.createdAt) });
});

app.put('/api/admin/customers/:id', requirePerm('customers'), (req, res) => {
  const k = store.customers.find(x => x.id === req.params.id);
  if (!k) return res.status(404).json({ error: 'Kunde nicht gefunden.' });
  const b = req.body || {};
  for (const f of ['name', 'email', 'phone', 'street', 'zip', 'city', 'country', 'notes']) if (b[f] !== undefined) k[f] = String(b[f]).trim();
  if (b.status !== undefined) k.status = ['aktiv', 'gesperrt'].includes(b.status) ? b.status : 'aktiv';
  save('customers');
  res.json(k);
});

app.delete('/api/admin/customers/:id', requirePerm('customers'), (req, res) => {
  const before = store.customers.length;
  store.customers = store.customers.filter(k => k.id !== req.params.id);
  if (store.customers.length === before) return res.status(404).json({ error: 'Kunde nicht gefunden.' });
  save('customers');
  res.json({ ok: true });
});

/* ═══════════════════ Admin: Gutscheine ═══════════════════ */

app.get('/api/admin/coupons', requirePerm('coupons'), (req, res) => res.json(store.coupons));

app.post('/api/admin/coupons', requirePerm('coupons'), (req, res) => {
  const b = req.body || {};
  const code = String(b.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Code ist Pflicht.' });
  if (store.coupons.some(c => c.code === code)) return res.status(400).json({ error: 'Diesen Code gibt es bereits.' });
  const c = {
    id: newId('g'), code, type: b.type === 'fixed' ? 'fixed' : 'percent',
    value: Math.max(0, num(b.value) || 0), minOrder: Math.max(0, num(b.minOrder) || 0),
    maxUses: Math.max(0, parseInt(b.maxUses, 10) || 0), usedCount: 0,
    expiresAt: String(b.expiresAt || ''), active: b.active !== false, createdAt: Date.now()
  };
  store.coupons.push(c);
  save('coupons');
  res.json(c);
});

app.put('/api/admin/coupons/:id', requirePerm('coupons'), (req, res) => {
  const c = store.coupons.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Gutschein nicht gefunden.' });
  const b = req.body || {};
  if (b.code !== undefined) c.code = String(b.code).trim().toUpperCase();
  if (b.type !== undefined) c.type = b.type === 'fixed' ? 'fixed' : 'percent';
  if (b.value !== undefined) c.value = Math.max(0, num(b.value) || 0);
  if (b.minOrder !== undefined) c.minOrder = Math.max(0, num(b.minOrder) || 0);
  if (b.maxUses !== undefined) c.maxUses = Math.max(0, parseInt(b.maxUses, 10) || 0);
  if (b.expiresAt !== undefined) c.expiresAt = String(b.expiresAt);
  if (b.active !== undefined) c.active = !!b.active;
  save('coupons');
  res.json(c);
});

app.delete('/api/admin/coupons/:id', requirePerm('coupons'), (req, res) => {
  store.coupons = store.coupons.filter(c => c.id !== req.params.id);
  save('coupons');
  res.json({ ok: true });
});

/* ═══════════════════ Admin: Analytics & Dashboard ═══════════════════ */

function analyticsData(days) {
  const from = Date.now() - days * 86400000;
  const orders = store.orders.filter(o => o.createdAt >= from && o.status !== 'storniert');
  const byDay = {};
  for (let i = days - 1; i >= 0; i--) byDay[dayKey(new Date(Date.now() - i * 86400000))] = { revenue: 0, orders: 0 };
  for (const o of orders) {
    const k = dayKey(new Date(o.createdAt));
    if (byDay[k]) { byDay[k].revenue = round2(byDay[k].revenue + o.total); byDay[k].orders += 1; }
  }
  const revenue = round2(orders.reduce((t, o) => t + o.total, 0));
  const profit = round2(orders.reduce((t, o) => t + o.items.reduce((s, it) => s + (it.price - (it.purchasePrice || 0)) * it.qty, 0) - o.discount, 0));
  const prodMap = {}, catMap = {};
  for (const o of orders) for (const it of o.items) {
    prodMap[it.name] = (prodMap[it.name] || 0) + it.qty;
    const p = store.products.find(x => x.id === it.productId);
    const cat = p ? p.category : 'Sonstiges';
    catMap[cat] = round2((catMap[cat] || 0) + it.price * it.qty);
  }
  const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, value]) => ({ name, value }));
  let visitors = 0;
  for (const [k, v] of Object.entries(store.visits)) if (new Date(k).getTime() >= from) visitors += v;
  return {
    days, revenue, profit, ordersCount: orders.length,
    aov: orders.length ? round2(revenue / orders.length) : 0,
    visitors, conversion: visitors ? round2(orders.length / visitors * 100) : 0,
    byDay: Object.entries(byDay).map(([d, v]) => ({ d, ...v })),
    topProducts: top(prodMap, 6), topCategories: top(catMap, 6)
  };
}

app.get('/api/admin/analytics', requirePerm('dashboard'), (req, res) =>
  res.json(analyticsData(Math.min(365, parseInt(req.query.days, 10) || 30))));

app.get('/api/admin/dashboard', requirePerm('dashboard'), (req, res) => {
  const today = dayKey();
  const todayOrders = store.orders.filter(o => dayKey(new Date(o.createdAt)) === today && o.status !== 'storniert');
  const lowStock = store.products.filter(p => p.stock <= p.minStock && p.active !== false);
  const week = Date.now() - 7 * 86400000;
  res.json({
    revenueToday: round2(todayOrders.reduce((t, o) => t + o.total, 0)),
    ordersToday: todayOrders.length,
    openOrders: store.orders.filter(o => ['offen', 'bezahlt', 'in_bearbeitung', 'verpackt'].includes(o.status)).length,
    lowStockCount: lowStock.length,
    newCustomers: store.customers.filter(k => k.createdAt >= week).length,
    visitorsToday: store.visits[today] || 0,
    unreadNotifications: store.notifications.filter(n => !n.read).length,
    recentOrders: [...store.orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6),
    lowStockList: lowStock.slice(0, 6).map(p => ({ id: p.id, name: p.name, stock: p.stock, minStock: p.minStock })),
    chart: analyticsData(14).byDay,
    topProducts: analyticsData(30).topProducts.slice(0, 5)
  });
});

/* ═══════════════════ Admin: Benachrichtigungen, Suche, Medien ═══════════════════ */

app.get('/api/admin/notifications', requirePerm('notifications'), (req, res) =>
  res.json({ list: store.notifications.slice(0, 30), unread: store.notifications.filter(n => !n.read).length }));

app.put('/api/admin/notifications/read-all', requirePerm('notifications'), (req, res) => {
  store.notifications.forEach(n => n.read = true);
  save('notifications');
  res.json({ ok: true });
});

app.get('/api/admin/search', requirePerm('search'), (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ products: [], orders: [], customers: [] });
  const match = s => String(s || '').toLowerCase().includes(q);
  res.json({
    products: store.products.filter(p => match(p.name) || match(p.sku) || match(p.category)).slice(0, 5)
      .map(p => ({ id: p.id, name: p.name, sku: p.sku, price: p.price })),
    orders: store.orders.filter(o => String(o.number).includes(q) || match(o.customer.name) || match(o.customer.email)).slice(0, 5)
      .map(o => ({ id: o.id, number: o.number, name: o.customer.name, total: o.total, status: o.status })),
    customers: store.customers.filter(k => match(k.name) || match(k.email)).slice(0, 5)
      .map(k => ({ id: k.id, name: k.name, email: k.email }))
  });
});

app.post('/api/admin/upload', requirePerm('media'), upload.array('files', 10), (req, res) => {
  res.json((req.files || []).map(f => ({ url: '/uploads/' + f.filename, name: f.originalname, size: f.size })));
});

app.get('/api/admin/media', requirePerm('media'), (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR).filter(f => f !== '.gitkeep').map(f => {
    const st = fs.statSync(path.join(UPLOAD_DIR, f));
    const url = '/uploads/' + f;
    const usedBy = store.products.filter(p => (p.images || []).includes(url) || p.image === url).length;
    return { name: f, url, size: st.size, mtime: st.mtimeMs, usedBy };
  }).sort((a, b) => b.mtime - a.mtime);
  res.json(files);
});

app.delete('/api/admin/media/:name', requirePerm('media'), (req, res) => {
  const name = path.basename(req.params.name); // Path-Traversal verhindern
  const full = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'Datei nicht gefunden.' });
  fs.unlinkSync(full);
  res.json({ ok: true });
});

/* ═══════════════════ Admin: Benutzer & 2FA ═══════════════════ */

const safeUser = u => ({ id: u.id, username: u.username, name: u.name, role: u.role, totpEnabled: !!u.totpEnabled, createdAt: u.createdAt });

app.get('/api/admin/users', requirePerm('users'), (req, res) => res.json(store.users.map(safeUser)));

app.post('/api/admin/users', requirePerm('users'), (req, res) => {
  const b = req.body || {};
  const username = String(b.username || '').trim().toLowerCase();
  if (!username || !b.password) return res.status(400).json({ error: 'Benutzername und Passwort sind Pflicht.' });
  if (String(b.password).length < 8) return res.status(400).json({ error: 'Das Passwort muss mindestens 8 Zeichen haben.' });
  if (store.users.some(u => u.username === username)) return res.status(400).json({ error: 'Diesen Benutzernamen gibt es bereits.' });
  const u = { id: newId('u'), username, name: String(b.name || username).trim(), role: b.role === 'admin' ? 'admin' : 'staff', password: hashPassword(b.password), totpSecret: '', totpEnabled: false, createdAt: Date.now() };
  store.users.push(u);
  save('users');
  res.json(safeUser(u));
});

app.put('/api/admin/users/:id', (req, res) => {
  if (!req.session || !req.session.isAdmin) return res.status(401).json({ error: 'Nicht angemeldet.' });
  const u = store.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
  const isSelf = u.id === req.session.userId;
  const isAdmin = req.session.role === 'admin';
  if (!isSelf && !isAdmin) return res.status(403).json({ error: 'Keine Berechtigung.' });
  const b = req.body || {};
  if (b.name !== undefined) u.name = String(b.name).trim();
  if (b.role !== undefined && isAdmin && !isSelf) u.role = b.role === 'admin' ? 'admin' : 'staff';
  if (b.password) {
    if (String(b.password).length < 8) return res.status(400).json({ error: 'Das Passwort muss mindestens 8 Zeichen haben.' });
    u.password = hashPassword(b.password);
  }
  save('users');
  res.json(safeUser(u));
});

app.delete('/api/admin/users/:id', requirePerm('users'), (req, res) => {
  const u = store.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
  if (u.id === req.session.userId) return res.status(400).json({ error: 'Sie können sich nicht selbst löschen.' });
  if (u.role === 'admin' && store.users.filter(x => x.role === 'admin').length <= 1) return res.status(400).json({ error: 'Der letzte Administrator kann nicht gelöscht werden.' });
  store.users = store.users.filter(x => x.id !== u.id);
  save('users');
  res.json({ ok: true });
});

/* 2FA einrichten (nur für den eigenen Account) */
app.post('/api/admin/users/:id/totp-setup', (req, res) => {
  if (!req.session || !req.session.isAdmin || req.params.id !== req.session.userId) return res.status(403).json({ error: 'Nur für den eigenen Account möglich.' });
  const u = store.users.find(x => x.id === req.params.id);
  u.totpSecret = base32Encode(crypto.randomBytes(20));
  u.totpEnabled = false;
  save('users');
  res.json({ secret: u.totpSecret, otpauth: `otpauth://totp/Malak%20Verwaltung:${encodeURIComponent(u.username)}?secret=${u.totpSecret}&issuer=Malak%20GmbH` });
});

app.post('/api/admin/users/:id/totp-confirm', (req, res) => {
  if (!req.session || !req.session.isAdmin || req.params.id !== req.session.userId) return res.status(403).json({ error: 'Nur für den eigenen Account möglich.' });
  const u = store.users.find(x => x.id === req.params.id);
  if (!u.totpSecret) return res.status(400).json({ error: 'Bitte zuerst die Einrichtung starten.' });
  if (!verifyTotp(u.totpSecret, req.body.code)) return res.status(400).json({ error: 'Der Code ist ungültig. Bitte erneut versuchen.' });
  u.totpEnabled = true;
  save('users');
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/totp-disable', (req, res) => {
  if (!req.session || !req.session.isAdmin) return res.status(401).json({ error: 'Nicht angemeldet.' });
  const isSelf = req.params.id === req.session.userId;
  if (!isSelf && req.session.role !== 'admin') return res.status(403).json({ error: 'Keine Berechtigung.' });
  const u = store.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
  u.totpEnabled = false; u.totpSecret = '';
  save('users');
  res.json({ ok: true });
});

/* ═══════════════════ Admin: Einstellungen ═══════════════════ */

app.get('/api/admin/settings', requirePerm('settings'), (req, res) => res.json(store.settings));

app.put('/api/admin/settings', requirePerm('settings'), (req, res) => {
  const s = store.settings, b = req.body || {};
  const strF = ['storeName', 'tagline', 'currency', 'language', 'domain', 'logoUrl', 'faviconUrl', 'primaryColor', 'deliveryInfo', 'pickupInfo', 'contactEmail', 'contactPhone', 'address'];
  for (const f of strF) if (b[f] !== undefined) s[f] = String(b[f]).trim();
  for (const f of ['freeShipping', 'shippingCost', 'taxRateDefault']) if (b[f] !== undefined) s[f] = num(b[f]) ?? s[f];
  if (Array.isArray(b.paymentMethods)) {
    s.paymentMethods = b.paymentMethods.map(m => ({ id: String(m.id), label: String(m.label || m.id), enabled: !!m.enabled }));
  }
  if (Array.isArray(b.shippingMethods)) {
    s.shippingMethods = b.shippingMethods.map(m => ({ id: String(m.id || slugify(m.label)), label: String(m.label || ''), cost: num(m.cost) || 0, enabled: !!m.enabled })).filter(m => m.label);
  }
  if (Array.isArray(b.shippingZones)) {
    s.shippingZones = b.shippingZones.map(z => ({ name: String(z.name || ''), cost: num(z.cost) || 0 })).filter(z => z.name);
  }
  if (b.legal && typeof b.legal === 'object') {
    s.legal = { impressum: String(b.legal.impressum ?? s.legal.impressum), datenschutz: String(b.legal.datenschutz ?? s.legal.datenschutz), agb: String(b.legal.agb ?? s.legal.agb) };
  }
  save('settings');
  res.json(s);
});

/* ═══════════════════ Statisch + Fehler ═══════════════════ */

app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
app.use('/', express.static(path.join(__dirname, 'public', 'shop')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Unbekannter API-Endpunkt.' }));

app.use((err, req, res, next) => {
  log('ERROR', `${req.method} ${req.url}: ${err.message}`);
  res.status(400).json({ error: err.message || 'Unerwarteter Fehler.' });
});

/* ═══════════════════ Start ═══════════════════ */

ensureData();
app.listen(PORT, () => {
  const user = store.users[0];
  log('INFO', `Malak-Backoffice gestartet auf Port ${PORT}`);
  console.log(`\n  → Shop:         http://localhost:${PORT}`);
  console.log(`  → Verwaltung:   http://localhost:${PORT}/admin`);
  console.log(`  → Benutzername: ${user ? user.username : 'malak'}`);
  console.log(`  → Passwort:     ${process.env.ADMIN_PASSWORD || 'malak2026 (Standard – bitte ändern)'}\n`);
});
