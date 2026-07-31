'use strict';
/* ═══════════ Malak Backoffice – App ═══════════ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = n => (Number(n) || 0).toFixed(2).replace('.', ',') + ' €';
const fdate = ts => new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fdt = ts => new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const STATUS = {
  offen: ['Offen', '#F59E0B'], bezahlt: ['Bezahlt', '#3B82F6'], in_bearbeitung: ['In Bearbeitung', '#8B5CF6'],
  verpackt: ['Verpackt', '#0EA5E9'], versendet: ['Versendet', '#10B981'], zugestellt: ['Zugestellt', '#1F9B45'],
  storniert: ['Storniert', '#E11B22']
};
const PAY_LABEL = { paypal: 'PayPal', card: 'Kreditkarte', applepay: 'Apple Pay', googlepay: 'Google Pay', klarna: 'Klarna', banktransfer: 'Überweisung', cod: 'Bar bei Abholung' };
const NOTIF_ICO = { order: '🛒', stock: '📦', customer: '👤', system: '⚙️' };
const PER_PAGE = 10;

const state = {
  me: null, products: null, categories: null, orders: null, customers: null,
  coupons: null, users: null, settings: null, media: null, movements: null,
  view: 'dashboard',
  t: { // Tabellen-Zustand je View
    products: { q: '', cat: '', sort: ['name', 1], page: 1, sel: new Set() },
    orders: { q: '', status: '', sort: ['createdAt', -1], page: 1 },
    customers: { q: '', sort: ['createdAt', -1], page: 1 },
    inventory: { q: '', page: 1 }
  }
};

/* ── API & Toast ── */
async function api(url, opts = {}) {
  if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== 'string') {
    opts.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(url, { credentials: 'same-origin', ...opts });
  if (res.status === 401 && !url.includes('/api/login')) { showLogin(); throw new Error('Sitzung abgelaufen – bitte neu anmelden.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Unerwarteter Fehler.'); e.data = data; throw e; }
  return data;
}
function toast(msg, isErr = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = (isErr ? '⚠ ' : '✓ ') + msg;
  $('#toastStack').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 2800);
}

/* ── Modal-Fabrik ── */
function modal({ title, body, foot, size = '' }) {
  const root = $('#modalRoot');
  root.innerHTML = `<div class="modal ${size}">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="modal-close" data-close>&times;</button></div>
    <div class="modal-body">${body}</div>
    ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
  </div>`;
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  root.onclick = e => { if (e.target === root || e.target.closest('[data-close]')) close(); };
  return { root, close, el: root.firstElementChild };
}

/* ── Login / Session ── */
function showLogin() { $('#loginView').hidden = false; $('#appView').hidden = true; }
async function showApp() {
  $('#loginView').hidden = true; $('#appView').hidden = false;
  $('#userAvatar').textContent = (state.me.name || state.me.username || '?')[0].toUpperCase();
  $('#userNameTop').textContent = state.me.name || state.me.username;
  $('#profileInfo').textContent = `${state.me.name} · ${state.me.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}`;
  buildSidebar();
  refreshBell();
  navigate(location.hash.replace('#/', '') || 'dashboard');
}

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('#loginError'); err.hidden = true;
  $('#loginBtn').disabled = true;
  try {
    await api('/api/login', { method: 'POST', body: { username: $('#username').value.trim(), password: $('#password').value, totp: $('#totp').value.trim() } });
    state.me = await api('/api/me');
    $('#password').value = ''; $('#totp').value = ''; $('#totpField').hidden = true;
    showApp();
  } catch (ex) {
    if (ex.data && ex.data.needTotp) { $('#totpField').hidden = false; $('#totp').focus(); }
    err.textContent = ex.message; err.hidden = false;
  } finally { $('#loginBtn').disabled = false; }
});

async function logout() { await api('/api/logout', { method: 'POST' }).catch(() => {}); state.me = null; showLogin(); }
$('#logoutBtn').addEventListener('click', logout);
$('#logoutBtn2').addEventListener('click', logout);

/* ── Router & Sidebar ── */
const ROUTES = {
  dashboard: { label: 'Übersicht', icon: '📊', perm: 'dashboard', render: renderDashboard, group: '' },
  orders: { label: 'Bestellungen', icon: '🛒', perm: 'orders', render: renderOrders, group: 'Verkauf' },
  customers: { label: 'Kunden', icon: '👥', perm: 'customers', render: renderCustomers, group: 'Verkauf' },
  coupons: { label: 'Gutscheine', icon: '🎟️', perm: 'coupons', render: renderCoupons, group: 'Verkauf' },
  products: { label: 'Produkte', icon: '📦', perm: 'products', render: renderProducts, group: 'Katalog' },
  categories: { label: 'Kategorien', icon: '🗂️', perm: 'categories', render: renderCategories, group: 'Katalog' },
  inventory: { label: 'Lager', icon: '🏬', perm: 'inventory', render: renderInventory, group: 'Katalog' },
  media: { label: 'Medien', icon: '🖼️', perm: 'media', render: renderMedia, group: 'Katalog' },
  analytics: { label: 'Analytics', icon: '📈', perm: 'dashboard', render: renderAnalytics, group: 'Auswertung' },
  shipping: { label: 'Versand & Zahlung', icon: '🚚', perm: 'settings', render: renderShipping, group: 'System' },
  users: { label: 'Benutzer', icon: '🔐', perm: 'users', render: renderUsers, group: 'System' },
  settings: { label: 'Einstellungen', icon: '⚙️', perm: 'settings', render: renderSettings, group: 'System' }
};
const canView = key => state.me.role === 'admin' || ['dashboard', 'products', 'inventory', 'categories', 'orders', 'customers', 'coupons', 'media'].includes(key);

function buildSidebar() {
  let html = '', lastGroup = null;
  for (const [key, r] of Object.entries(ROUTES)) {
    if (!canView(key)) continue;
    if (r.group !== lastGroup) { if (r.group) html += `<div class="side-sep">${r.group}</div>`; lastGroup = r.group; }
    html += `<button class="side-link" data-route="${key}"><span>${r.icon}</span> <span>${r.label}</span>${key === 'orders' ? '<span class="badge-count" id="openOrdersBadge" hidden></span>' : ''}</button>`;
  }
  $('#sideNav').innerHTML = html;
  $('#sideNav').onclick = e => { const b = e.target.closest('[data-route]'); if (b) { navigate(b.dataset.route); $('#sidebar').classList.remove('open'); } };
}

function navigate(view) {
  if (!ROUTES[view] || !canView(view)) view = 'dashboard';
  state.view = view;
  location.hash = '#/' + view;
  $$('#sideNav .side-link').forEach(b => b.classList.toggle('active', b.dataset.route === view));
  $('#crumbs').innerHTML = `Start / <b>${ROUTES[view].label}</b>`;
  $('#viewRoot').innerHTML = skeletonView();
  ROUTES[view].render().catch(ex => { $('#viewRoot').innerHTML = `<div class="card">Fehler: ${esc(ex.message)}</div>`; });
}
window.addEventListener('hashchange', () => { const v = location.hash.replace('#/', ''); if (v !== state.view) navigate(v); });
$('#burger').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

function skeletonView() {
  return `<div class="stat-grid">${'<div class="stat-card"><div style="width:100%"><div class="skel" style="width:60%;height:22px;margin-bottom:8px"></div><div class="skel" style="width:40%"></div></div></div>'.repeat(4)}</div>
  <div class="card">${'<div class="skel" style="height:38px;margin-bottom:10px"></div>'.repeat(6)}</div>`;
}

/* ── Daten-Cache ── */
async function ensure(name, url, force = false) {
  if (force || state[name] === null) state[name] = await api(url);
  return state[name];
}
const loadProducts = f => ensure('products', '/api/admin/products', f);
const loadCategories = f => ensure('categories', '/api/admin/categories', f);
const loadOrders = f => ensure('orders', '/api/admin/orders', f);
const loadCustomers = f => ensure('customers', '/api/admin/customers', f);
const loadCoupons = f => ensure('coupons', '/api/admin/coupons', f);
const loadUsers = f => ensure('users', '/api/admin/users', f);
const loadSettings = f => ensure('settings', '/api/admin/settings', f);

/* ── Tabellen-Utils ── */
function sortBy(list, [key, dir]) {
  return [...list].sort((a, b) => {
    const x = a[key], y = b[key];
    if (typeof x === 'string') return dir * String(x).localeCompare(String(y), 'de');
    return dir * ((x ?? 0) - (y ?? 0));
  });
}
function pager(total, page, onPage) {
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const p = Math.min(page, pages);
  let btns = '';
  const add = (n, label = n, cls = '') => btns += `<button class="${cls}" data-pg="${n}">${label}</button>`;
  add(p - 1, '‹'); btns = btns.replace('<button', `<button ${p <= 1 ? 'disabled' : ''}`);
  for (let i = 1; i <= pages; i++) {
    if (pages > 7 && i > 2 && i < pages - 1 && Math.abs(i - p) > 1) { if (!btns.endsWith('…</span>')) btns += '<span>…</span>'; continue; }
    add(i, i, i === p ? 'cur' : '');
  }
  add(p + 1, '›', p >= pages ? 'disabled' : '');
  setTimeout(() => { $$('.pager [data-pg]').forEach(b => b.onclick = () => { if (!b.disabled && !b.classList.contains('disabled')) onPage(Math.max(1, Math.min(pages, +b.dataset.pg))); }); });
  return `<div class="pager">${btns}</div>`;
}
const sortArrow = (t, key) => t.sort[0] === key ? (t.sort[1] === 1 ? ' ↑' : ' ↓') : '';
function bindSort(t, rerender) {
  $$('.tbl th.sortable').forEach(th => th.onclick = () => {
    const k = th.dataset.sort;
    t.sort = t.sort[0] === k ? [k, -t.sort[1]] : [k, 1];
    t.page = 1; rerender();
  });
}
const stockBadge = p => {
  const cls = p.stock <= 0 ? 'stock-out' : (p.stock <= p.minStock ? 'stock-low' : 'stock-ok');
  return `<span class="stock-badge ${cls}">${p.stock}</span>`;
};
const statusPill = st => { const [l, c] = STATUS[st] || [st, '#888']; return `<span class="status-pill" style="background:color-mix(in srgb,${c} 14%,transparent);color:${c}"><span class="dot"></span>${l}</span>`; };
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23DDE5D8'/%3E%3C/svg%3E";

/* ═══════════ VIEW: Dashboard ═══════════ */

async function renderDashboard() {
  const d = await api('/api/admin/dashboard');
  const badge = $('#openOrdersBadge');
  if (badge) { badge.textContent = d.openOrders; badge.hidden = !d.openOrders; }

  const stat = (ico, color, num, label) => `<div class="stat-card"><div class="stat-ico" style="background:color-mix(in srgb,${color} 14%,transparent)">${ico}</div><div><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div></div>`;

  $('#viewRoot').innerHTML = `
    <div class="view-head"><div><h2>Übersicht</h2><p>Willkommen zurück, ${esc(state.me.name || state.me.username)}! Hier ist der aktuelle Stand Ihres Shops.</p></div>
    <button class="btn btn-primary" id="dashNewProduct">+ Neues Produkt</button></div>
    <div class="stat-grid">
      ${stat('💶', '#1F9B45', euro(d.revenueToday), 'Umsatz heute')}
      ${stat('🛒', '#3B82F6', d.ordersToday, 'Bestellungen heute')}
      ${stat('⏳', '#F59E0B', d.openOrders, 'Offene Bestellungen')}
      ${stat('📦', '#E11B22', d.lowStockCount, 'Niedriger Bestand')}
      ${stat('👥', '#8B5CF6', d.newCustomers, 'Neue Kunden (7 T.)')}
      ${stat('👁️', '#0EA5E9', d.visitorsToday, 'Besucher heute')}
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-head"><h3>Umsatz – letzte 14 Tage</h3></div><div class="chart-box">${lineChart(d.chart.map(x => ({ label: x.d.slice(8) + '.' + x.d.slice(5, 7), value: x.revenue })))}</div></div>
      <div class="card"><div class="card-head"><h3>Top-Produkte (30 Tage)</h3></div>${hbars(d.topProducts)}</div>
    </div>
    <div class="grid-2" style="margin-top:16px">
      <div class="card"><div class="card-head"><h3>Letzte Bestellungen</h3><button class="link-btn" data-goto="orders">Alle ansehen →</button></div>
        <table class="tbl"><tbody>
          ${d.recentOrders.map(o => `<tr class="clickable" data-order="${o.id}"><td><b>#${o.number}</b><div class="row-sub">${fdt(o.createdAt)}</div></td><td>${esc(o.customer.name)}</td><td class="ta-right price-cell">${euro(o.total)}</td><td class="ta-right">${statusPill(o.status)}</td></tr>`).join('') || '<tr><td class="empty">Noch keine Bestellungen.</td></tr>'}
        </tbody></table></div>
      <div class="card"><div class="card-head"><h3>Niedriger Lagerbestand</h3><button class="link-btn" data-goto="inventory">Zum Lager →</button></div>
        ${d.lowStockList.length ? `<table class="tbl"><tbody>${d.lowStockList.map(p => `<tr><td>${esc(p.name)}</td><td class="ta-right">${stockBadge({ stock: p.stock, minStock: p.minStock })}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Alle Bestände sind ausreichend. 👍</p>'}
      </div>
    </div>`;

  $('#dashNewProduct').onclick = () => openProductModal(null);
  $$('#viewRoot [data-goto]').forEach(b => b.onclick = () => navigate(b.dataset.goto));
  $$('#viewRoot [data-order]').forEach(tr => tr.onclick = () => openOrderModal(tr.dataset.order));
}

/* ═══════════ Charts ═══════════ */

function lineChart(points, h = 190) {
  if (!points.length) return '<p class="muted">Keine Daten.</p>';
  const w = 560, padL = 44, padB = 26, padT = 12;
  const max = Math.max(...points.map(p => p.value), 1);
  const iw = (w - padL - 10) / Math.max(points.length - 1, 1);
  const X = i => padL + i * iw, Y = v => padT + (h - padT - padB) * (1 - v / max);
  const path = points.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.value).toFixed(1)).join(' ');
  const area = path + ` L${X(points.length - 1)} ${h - padB} L${X(0)} ${h - padB} Z`;
  const gy = [0, .5, 1].map(f => { const v = max * f; return `<line x1="${padL}" y1="${Y(v)}" x2="${w - 8}" y2="${Y(v)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="${padL - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${v >= 100 ? Math.round(v) : v.toFixed(0)}€</text>`; }).join('');
  const labels = points.map((p, i) => (points.length <= 8 || i % Math.ceil(points.length / 8) === 0) ? `<text x="${X(i)}" y="${h - 8}" text-anchor="middle" font-size="10" fill="var(--muted)">${p.label}</text>` : '').join('');
  const dots = points.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.value)}" r="3" fill="var(--acc)"><title>${p.label}: ${euro(p.value)}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}">${gy}<path d="${area}" fill="color-mix(in srgb,var(--acc) 12%,transparent)"/><path d="${path}" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linecap="round"/>${dots}${labels}</svg>`;
}
function hbars(items) {
  if (!items || !items.length) return '<p class="muted">Noch keine Verkäufe.</p>';
  const max = Math.max(...items.map(i => i.value), 1);
  return items.map(i => `<div class="hbar"><div class="hbar-label" title="${esc(i.name)}">${esc(i.name)}</div><div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(8, i.value / max * 100)}%">${typeof i.value === 'number' && i.value % 1 !== 0 ? euro(i.value) : i.value}</div></div></div>`).join('');
}

/* ═══════════ VIEW: Produkte ═══════════ */

async function renderProducts() {
  await Promise.all([loadProducts(), loadCategories()]);
  const t = state.t.products;
  const root = $('#viewRoot');

  const draw = () => {
    let list = state.products.filter(p =>
      (!t.cat || p.category === t.cat) &&
      (!t.q || (p.name + ' ' + p.sku + ' ' + p.category).toLowerCase().includes(t.q)));
    list = sortBy(list, t.sort);
    const total = list.length;
    const rows = list.slice((t.page - 1) * PER_PAGE, t.page * PER_PAGE);

    root.innerHTML = `
      <div class="view-head"><div><h2>Produkte</h2><p>${state.products.length} Produkte · ${state.products.filter(p => p.available).length} im Shop sichtbar</p></div>
        <button class="btn btn-primary" id="addBtn">+ Neues Produkt</button></div>
      ${t.sel.size ? `<div class="bulkbar"><b>${t.sel.size} ausgewählt</b><div class="spacer"></div>
        <button class="btn btn-sm btn-ghost" data-bulk="show">Sichtbar</button>
        <button class="btn btn-sm btn-ghost" data-bulk="hide">Verbergen</button>
        <button class="btn btn-sm btn-danger" data-bulk="delete">Löschen</button></div>` : ''}
      <div class="toolbar">
        <input type="search" class="search" id="pq" placeholder="Suchen (Name, SKU)…" value="${esc(t.q)}" />
        <select id="pcat"><option value="">Alle Kategorien</option>${state.categories.map(c => `<option ${t.cat === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        <div class="toolbar-spacer"></div><span class="muted">${total} Treffer</span>
      </div>
      <div class="table-wrap">
        <table class="tbl"><thead><tr>
          <th style="width:36px"><input type="checkbox" id="selAll" ${rows.length && rows.every(p => t.sel.has(p.id)) ? 'checked' : ''}></th>
          <th style="width:56px"></th>
          <th class="sortable" data-sort="name">Produkt${sortArrow(t, 'name')}</th>
          <th class="sortable" data-sort="category">Kategorie${sortArrow(t, 'category')}</th>
          <th class="sortable ta-right" data-sort="price">Preis${sortArrow(t, 'price')}</th>
          <th class="sortable ta-center" data-sort="stock">Lager${sortArrow(t, 'stock')}</th>
          <th class="ta-center">Sichtbar</th>
          <th class="ta-right">Aktionen</th>
        </tr></thead><tbody>
          ${rows.map(p => `<tr class="clickable" data-id="${p.id}">
            <td><input type="checkbox" data-sel="${p.id}" ${t.sel.has(p.id) ? 'checked' : ''}></td>
            <td><img class="row-img" src="${esc((p.images && p.images[0]) || p.image || PLACEHOLDER)}" loading="lazy" onerror="this.src='${PLACEHOLDER}'"></td>
            <td><div class="row-name">${esc(p.name)}${p.badge ? `<span class="badge-mini ${p.badge}">${p.badge === 'neu' ? 'Neu' : 'Sale'}</span>` : ''}</div><div class="row-sub">SKU: ${esc(p.sku || '–')}</div></td>
            <td><span class="chip">${esc(p.category)}</span></td>
            <td class="ta-right"><span class="price-cell">${euro(p.price)}</span>${p.oldPrice ? `<span class="price-old">${euro(p.oldPrice)}</span>` : ''}</td>
            <td class="ta-center">${stockBadge(p)}</td>
            <td class="ta-center"><button class="avail-toggle ${p.available ? 'on' : ''}" data-toggle="${p.id}" title="Im Shop ein-/ausblenden"></button></td>
            <td><div class="row-actions"><button class="icon-btn" data-edit="${p.id}" title="Bearbeiten">✎</button><button class="icon-btn del" data-del="${p.id}" title="Löschen">🗑</button></div></td>
          </tr>`).join('') || ''}
        </tbody></table>
        ${rows.length ? '' : '<div class="empty">Keine Produkte gefunden.</div>'}
        ${pager(total, t.page, pg => { t.page = pg; draw(); })}
      </div>
      <p class="muted" style="margin-top:10px">💡 Klicken Sie auf eine Zeile, um das Produkt zu bearbeiten.</p>`;

    $('#addBtn').onclick = () => openProductModal(null);
    $('#pq').oninput = debounce(e => { t.q = e.target.value.trim().toLowerCase(); t.page = 1; draw(); }, 250);
    $('#pcat').onchange = e => { t.cat = e.target.value; t.page = 1; draw(); };
    bindSort(t, draw);
    $('#selAll').onchange = e => { rows.forEach(p => e.target.checked ? t.sel.add(p.id) : t.sel.delete(p.id)); draw(); };

    root.querySelector('tbody').onclick = async e => {
      const sel = e.target.closest('[data-sel]'), tog = e.target.closest('[data-toggle]'),
        edit = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
      if (sel) { sel.checked ? t.sel.add(sel.dataset.sel) : t.sel.delete(sel.dataset.sel); draw(); return; }
      if (tog) { try { await api(`/api/admin/products/${tog.dataset.toggle}/toggle`, { method: 'PATCH' }); await loadProducts(true); draw(); } catch (ex) { toast(ex.message, true); } return; }
      if (del) { deleteProduct(del.dataset.del, draw); return; }
      if (edit) { openProductModal(state.products.find(p => p.id === edit.dataset.edit)); return; }
      const tr = e.target.closest('tr[data-id]');
      if (tr) openProductModal(state.products.find(p => p.id === tr.dataset.id));
    };
    $$('#viewRoot [data-bulk]').forEach(b => b.onclick = async () => {
      const action = b.dataset.bulk;
      if (action === 'delete' && !confirm(`${t.sel.size} Produkte wirklich löschen?`)) return;
      try {
        await api('/api/admin/products/bulk', { method: 'POST', body: { ids: [...t.sel], action } });
        t.sel.clear(); await loadProducts(true); draw(); toast('Erledigt.');
      } catch (ex) { toast(ex.message, true); }
    });
  };
  draw();
}

async function deleteProduct(id, after) {
  const p = state.products.find(x => x.id === id);
  if (!confirm(`„${p ? p.name : '?'}“ wirklich löschen?`)) return;
  try { await api(`/api/admin/products/${id}`, { method: 'DELETE' }); await loadProducts(true); toast('Produkt gelöscht.'); if (after) after(); }
  catch (ex) { toast(ex.message, true); }
}

/* ── Produkt-Modal (Tabs + Galerie) ── */
function openProductModal(p) {
  const isNew = !p;
  const d = p || { name: '', category: '', subcategory: '', unit: '', price: '', oldPrice: '', purchasePrice: '', sku: '', barcode: '', stock: 0, minStock: 5, weight: '', length: '', width: '', height: '', shippingClass: 'standard', taxRate: 7, deliveryTime: '2–4 Werktage', available: true, active: true, badge: '', description: '', shortDescription: '', manufacturer: '', brand: '', images: [], videoUrl: '', colors: [], sizes: [], material: '', tags: [], seoTitle: '', seoDescription: '', slug: '' };
  let images = [...(d.images || [])];

  const tabs = { allgemein: 'Allgemein', preise: 'Preise & Steuern', lager: 'Lager', versand: 'Versand', medien: 'Medien', varianten: 'Varianten', seo: 'SEO' };
  const catOpts = (state.categories || []).map(c => `<option value="${esc(c.name)}">`).join('');

  const m = modal({
    title: isNew ? 'Neues Produkt' : `Produkt bearbeiten – ${d.name}`, size: 'xl',
    body: `
    <div class="mtabs">${Object.entries(tabs).map(([k, l], i) => `<button type="button" class="mtab ${i === 0 ? 'active' : ''}" data-mtab="${k}">${l}</button>`).join('')}</div>
    <form id="pform" style="display:flex;flex-direction:column;gap:13px">
      <div data-pane="allgemein" style="display:flex;flex-direction:column;gap:13px">
        <div class="field"><label>Produktname *</label><input name="name" required value="${esc(d.name)}"></div>
        <div class="field-row">
          <div class="field"><label>Kategorie *</label><input name="category" list="catList" required value="${esc(d.category)}"><datalist id="catList">${catOpts}</datalist></div>
          <div class="field"><label>Unterkategorie</label><input name="subcategory" value="${esc(d.subcategory)}"></div>
        </div>
        <div class="field-row-3">
          <div class="field"><label>Einheit / Menge</label><input name="unit" placeholder="z. B. 500 g" value="${esc(d.unit)}"></div>
          <div class="field"><label>Hersteller</label><input name="manufacturer" value="${esc(d.manufacturer)}"></div>
          <div class="field"><label>Marke</label><input name="brand" value="${esc(d.brand)}"></div>
        </div>
        <div class="field"><label>Kurzbeschreibung</label><input name="shortDescription" value="${esc(d.shortDescription)}"></div>
        <div class="field"><label>Beschreibung</label><textarea name="description" rows="3">${esc(d.description)}</textarea></div>
        <div class="field-row-3">
          <div class="field"><label>Badge</label><select name="badge"><option value="">– kein –</option><option value="neu" ${d.badge === 'neu' ? 'selected' : ''}>Neu</option><option value="sale" ${d.badge === 'sale' ? 'selected' : ''}>Angebot</option></select></div>
          <div class="field"><label>Im Shop sichtbar</label><label class="switch-label"><input type="checkbox" name="available" ${d.available !== false ? 'checked' : ''}> Sichtbar</label></div>
          <div class="field"><label>Aktiv</label><label class="switch-label"><input type="checkbox" name="active" ${d.active !== false ? 'checked' : ''}> Aktiv</label></div>
        </div>
      </div>
      <div data-pane="preise" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="field-row-3">
          <div class="field"><label>Verkaufspreis (€) *</label><input name="price" type="number" step="0.01" min="0" required value="${d.price ?? ''}"></div>
          <div class="field"><label>Streichpreis (€)</label><input name="oldPrice" type="number" step="0.01" min="0" value="${d.oldPrice ?? ''}"></div>
          <div class="field"><label>Einkaufspreis (€)</label><input name="purchasePrice" type="number" step="0.01" min="0" value="${d.purchasePrice ?? ''}"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Steuersatz (%)</label><select name="taxRate"><option value="7" ${d.taxRate == 7 ? 'selected' : ''}>7 % (Lebensmittel)</option><option value="19" ${d.taxRate == 19 ? 'selected' : ''}>19 % (Standard)</option><option value="0" ${d.taxRate == 0 ? 'selected' : ''}>0 %</option></select></div>
          <div class="field"><label>SKU (Artikelnummer)</label><input name="sku" value="${esc(d.sku)}"></div>
        </div>
        <div class="field"><label>Barcode (EAN/GTIN)</label><input name="barcode" value="${esc(d.barcode)}"></div>
      </div>
      <div data-pane="lager" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="field-row">
          <div class="field"><label>Lagerbestand</label><input name="stock" type="number" min="0" step="1" value="${d.stock ?? 0}"></div>
          <div class="field"><label>Mindestbestand (Warnung)</label><input name="minStock" type="number" min="0" step="1" value="${d.minStock ?? 5}"></div>
        </div>
        <p class="muted">Bei Bestellungen wird der Bestand automatisch reduziert. Fällt er auf den Mindestbestand, erhalten Sie eine Benachrichtigung. Für Wareneingänge nutzen Sie den Bereich <b>Lager</b>.</p>
      </div>
      <div data-pane="versand" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="field-row">
          <div class="field"><label>Gewicht (kg)</label><input name="weight" type="number" step="0.001" min="0" value="${d.weight ?? ''}"></div>
          <div class="field"><label>Versandklasse</label><select name="shippingClass"><option value="standard" ${d.shippingClass === 'standard' ? 'selected' : ''}>Standard</option><option value="sperrgut" ${d.shippingClass === 'sperrgut' ? 'selected' : ''}>Sperrgut</option><option value="kuehl" ${d.shippingClass === 'kuehl' ? 'selected' : ''}>Kühlware</option></select></div>
        </div>
        <div class="field-row-3">
          <div class="field"><label>Länge (cm)</label><input name="length" type="number" step="0.1" min="0" value="${d.length ?? ''}"></div>
          <div class="field"><label>Breite (cm)</label><input name="width" type="number" step="0.1" min="0" value="${d.width ?? ''}"></div>
          <div class="field"><label>Höhe (cm)</label><input name="height" type="number" step="0.1" min="0" value="${d.height ?? ''}"></div>
        </div>
        <div class="field"><label>Lieferzeit</label><input name="deliveryTime" value="${esc(d.deliveryTime)}"></div>
      </div>
      <div data-pane="medien" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="dropzone" id="dz">📷 Bilder hierher ziehen oder <b>klicken zum Auswählen</b><input type="file" id="dzInput" accept="image/*" multiple hidden></div>
        <div class="gallery" id="gallery"></div>
        <div class="field"><label>oder Bild-URL hinzufügen</label><div style="display:flex;gap:8px"><input id="imgUrlInput" placeholder="https://…"><button type="button" class="btn btn-ghost" id="imgUrlAdd">Hinzufügen</button></div></div>
        <div class="field"><label>Produktvideo (URL, z. B. YouTube)</label><input name="videoUrl" value="${esc(d.videoUrl)}"></div>
      </div>
      <div data-pane="varianten" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="field"><label>Farben (durch Komma getrennt)</label><input name="colors" value="${esc((d.colors || []).join(', '))}"></div>
        <div class="field"><label>Größen (durch Komma getrennt)</label><input name="sizes" value="${esc((d.sizes || []).join(', '))}"></div>
        <div class="field-row">
          <div class="field"><label>Material</label><input name="material" value="${esc(d.material)}"></div>
          <div class="field"><label>Tags (durch Komma getrennt)</label><input name="tags" value="${esc((d.tags || []).join(', '))}"></div>
        </div>
      </div>
      <div data-pane="seo" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="field"><label>SEO-Titel</label><input name="seoTitle" value="${esc(d.seoTitle)}"></div>
        <div class="field"><label>SEO-Beschreibung</label><textarea name="seoDescription" rows="2">${esc(d.seoDescription)}</textarea></div>
        <div class="field"><label>URL-Slug</label><input name="slug" value="${esc(d.slug)}"></div>
      </div>
      <div class="modal-error" id="pErr" hidden></div>
    </form>`,
    foot: `${isNew ? '' : '<button class="btn btn-danger-ghost" id="pDel">🗑 Löschen</button>'}<div class="spacer"></div><button class="btn btn-ghost" data-close>Abbrechen</button><button class="btn btn-primary" id="pSave">Speichern</button>`
  });

  /* Tabs */
  $$('.mtab', m.el).forEach(b => b.onclick = () => {
    $$('.mtab', m.el).forEach(x => x.classList.toggle('active', x === b));
    $$('[data-pane]', m.el).forEach(pane => pane.hidden = pane.dataset.pane !== b.dataset.mtab);
  });

  /* Galerie */
  const drawGallery = () => {
    $('#gallery', m.el).innerHTML = images.map((u, i) => `<div class="g-thumb ${i === 0 ? 'primary' : ''}" title="${i === 0 ? 'Titelbild' : ''}">
      <img src="${esc(u)}" onerror="this.src='${PLACEHOLDER}'">
      <button type="button" class="g-x" data-gx="${i}" title="Entfernen">✕</button>
      ${i > 0 ? `<button type="button" class="g-star" data-gs="${i}" title="Als Titelbild">★</button>` : ''}
    </div>`).join('') || '<p class="muted">Noch keine Bilder.</p>';
    $$('[data-gx]', m.el).forEach(b => b.onclick = () => { images.splice(+b.dataset.gx, 1); drawGallery(); });
    $$('[data-gs]', m.el).forEach(b => b.onclick = () => { const [u] = images.splice(+b.dataset.gs, 1); images.unshift(u); drawGallery(); });
  };
  drawGallery();

  const dz = $('#dz', m.el), dzInput = $('#dzInput', m.el);
  dz.onclick = () => dzInput.click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag'); };
  dz.ondragleave = () => dz.classList.remove('drag');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('drag'); uploadFiles(e.dataTransfer.files); };
  dzInput.onchange = () => uploadFiles(dzInput.files);
  async function uploadFiles(files) {
    if (!files || !files.length) return;
    const fd = new FormData();
    [...files].forEach(f => fd.append('files', f));
    dz.textContent = '⏳ Wird hochgeladen…';
    try { const up = await api('/api/admin/upload', { method: 'POST', body: fd }); images.push(...up.map(f => f.url)); drawGallery(); toast(`${up.length} Datei(en) hochgeladen.`); }
    catch (ex) { toast(ex.message, true); }
    dz.innerHTML = '📷 Bilder hierher ziehen oder <b>klicken zum Auswählen</b>';
    dz.appendChild(dzInput);
  }
  $('#imgUrlAdd', m.el).onclick = () => { const v = $('#imgUrlInput', m.el).value.trim(); if (v) { images.push(v); $('#imgUrlInput', m.el).value = ''; drawGallery(); } };

  if (!isNew) $('#pDel', m.el).onclick = () => { m.close(); deleteProduct(p.id, () => navigate('products')); };

  $('#pSave', m.el).onclick = async () => {
    const f = $('#pform', m.el);
    const err = $('#pErr', m.el); err.hidden = true;
    const val = n => f[n] ? f[n].value : '';
    const list = n => val(n).split(',').map(s => s.trim()).filter(Boolean);
    const body = {
      name: val('name'), category: val('category'), subcategory: val('subcategory'), unit: val('unit'),
      shortDescription: val('shortDescription'), description: val('description'),
      badge: val('badge'), available: f.available.checked, active: f.active.checked,
      price: val('price'), oldPrice: val('oldPrice') || null, purchasePrice: val('purchasePrice') || null,
      taxRate: val('taxRate'), sku: val('sku'), barcode: val('barcode'),
      stock: val('stock'), minStock: val('minStock'),
      weight: val('weight') || null, length: val('length') || null, width: val('width') || null, height: val('height') || null,
      shippingClass: val('shippingClass'), deliveryTime: val('deliveryTime'),
      images, videoUrl: val('videoUrl'),
      colors: list('colors'), sizes: list('sizes'), material: val('material'), tags: list('tags'),
      manufacturer: val('manufacturer'), brand: val('brand'),
      seoTitle: val('seoTitle'), seoDescription: val('seoDescription'), slug: val('slug')
    };
    if (!body.name.trim() || !body.category.trim()) { err.textContent = 'Name und Kategorie sind Pflichtfelder.'; err.hidden = false; return; }
    try {
      if (isNew) await api('/api/admin/products', { method: 'POST', body });
      else await api(`/api/admin/products/${p.id}`, { method: 'PUT', body });
      await loadProducts(true); await loadCategories(true);
      m.close(); toast(isNew ? 'Produkt angelegt.' : 'Änderungen gespeichert.');
      if (state.view === 'products' || state.view === 'inventory') navigate(state.view);
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  };
}

/* ═══════════ VIEW: Bestellungen ═══════════ */

async function renderOrders() {
  await loadOrders(true);
  const t = state.t.orders;
  const root = $('#viewRoot');

  const draw = () => {
    let list = state.orders.filter(o =>
      (!t.status || o.status === t.status) &&
      (!t.q || (String(o.number) + ' ' + o.customer.name + ' ' + o.customer.email).toLowerCase().includes(t.q)));
    const total = list.length;
    const rows = list.slice((t.page - 1) * PER_PAGE, t.page * PER_PAGE);

    root.innerHTML = `
      <div class="view-head"><div><h2>Bestellungen</h2><p>${state.orders.length} Bestellungen gesamt</p></div></div>
      <div class="toolbar">
        <input type="search" class="search" id="oq" placeholder="Suchen (Nr., Kunde)…" value="${esc(t.q)}" />
        <select id="ostatus"><option value="">Alle Status</option>${Object.entries(STATUS).map(([k, [l]]) => `<option value="${k}" ${t.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <div class="toolbar-spacer"></div><span class="muted">${total} Treffer</span>
      </div>
      <div class="table-wrap">
        <table class="tbl"><thead><tr>
          <th>Bestellung</th><th>Kunde</th><th>Artikel</th><th class="ta-right">Summe</th><th>Zahlung</th><th>Status</th><th class="ta-right">Aktionen</th>
        </tr></thead><tbody>
        ${rows.map(o => `<tr class="clickable" data-id="${o.id}">
          <td><b>#${o.number}</b><div class="row-sub">${fdt(o.createdAt)}</div></td>
          <td>${esc(o.customer.name)}<div class="row-sub">${esc(o.customer.city || '')}</div></td>
          <td>${o.items.reduce((s, i) => s + i.qty, 0)} Stück</td>
          <td class="ta-right price-cell">${euro(o.total)}</td>
          <td>${PAY_LABEL[o.paymentMethod] || o.paymentMethod}</td>
          <td>${statusPill(o.status)}</td>
          <td><div class="row-actions"><button class="icon-btn" data-view="${o.id}" title="Details">👁</button><button class="icon-btn" data-print="${o.id}" title="Rechnung">🧾</button></div></td>
        </tr>`).join('')}
        </tbody></table>
        ${rows.length ? '' : '<div class="empty">Keine Bestellungen gefunden.</div>'}
        ${pager(total, t.page, pg => { t.page = pg; draw(); })}
      </div>`;

    $('#oq').oninput = debounce(e => { t.q = e.target.value.trim().toLowerCase(); t.page = 1; draw(); }, 250);
    $('#ostatus').onchange = e => { t.status = e.target.value; t.page = 1; draw(); };
    root.querySelector('tbody').onclick = e => {
      const pr = e.target.closest('[data-print]');
      if (pr) { printDoc(pr.dataset.print, 'invoice'); return; }
      const v = e.target.closest('[data-view]') || e.target.closest('tr[data-id]');
      if (v) openOrderModal(v.dataset.view || v.dataset.id);
    };
  };
  draw();
}

async function openOrderModal(id) {
  const o = await api('/api/admin/orders/' + id);
  const m = modal({
    title: `Bestellung #${o.number}`, size: 'lg',
    body: `
      <div class="grid-2-even">
        <div>
          <h4 style="margin-bottom:8px">Kunde</h4>
          <p><b>${esc(o.customer.name)}</b><br>${esc(o.customer.street)}<br>${esc(o.customer.zip)} ${esc(o.customer.city)}<br>
          <span class="muted">${esc(o.customer.email)}${o.customer.phone ? ' · ' + esc(o.customer.phone) : ''}</span></p>
        </div>
        <div>
          <h4 style="margin-bottom:8px">Status</h4>
          <select id="oStatus" class="status-sel">${Object.entries(STATUS).map(([k, [l]]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <div class="row-sub" style="margin-top:8px">${o.history.map(h => `${STATUS[h.status] ? STATUS[h.status][0] : h.status} – ${fdt(h.ts)}`).join('<br>')}</div>
        </div>
      </div>
      <table class="tbl"><thead><tr><th>Artikel</th><th class="ta-center">Menge</th><th class="ta-right">Einzelpreis</th><th class="ta-right">Summe</th></tr></thead><tbody>
        ${o.items.map(i => `<tr><td>${esc(i.name)}<div class="row-sub">SKU: ${esc(i.sku || '–')}</div></td><td class="ta-center">${i.qty}</td><td class="ta-right">${euro(i.price)}</td><td class="ta-right price-cell">${euro(i.price * i.qty)}</td></tr>`).join('')}
        <tr><td colspan="3" class="ta-right muted">Zwischensumme</td><td class="ta-right">${euro(o.subtotal)}</td></tr>
        ${o.discount ? `<tr><td colspan="3" class="ta-right muted">Rabatt ${o.couponCode ? '(' + esc(o.couponCode) + ')' : ''}</td><td class="ta-right" style="color:var(--red)">−${euro(o.discount)}</td></tr>` : ''}
        <tr><td colspan="3" class="ta-right muted">Versand (${o.shippingMethod === 'pickup' ? 'Abholung' : 'Lieferung'})</td><td class="ta-right">${euro(o.shippingCost)}</td></tr>
        <tr><td colspan="3" class="ta-right"><b>Gesamt</b></td><td class="ta-right price-cell" style="font-size:1.05rem">${euro(o.total)}</td></tr>
      </tbody></table>
      <div class="field-row-3">
        <div class="field"><label>Versanddienst</label><input id="oCarrier" value="${esc(o.carrier)}" placeholder="z. B. DHL"></div>
        <div class="field"><label>Trackingnummer</label><input id="oTracking" value="${esc(o.trackingNumber)}"></div>
        <div class="field"><label>Zahlung</label><input value="${PAY_LABEL[o.paymentMethod] || o.paymentMethod}" disabled></div>
      </div>
      <div class="field"><label>Interne Notiz</label><textarea id="oNote" rows="2">${esc(o.note)}</textarea></div>`,
    foot: `<button class="btn btn-ghost" id="oInvoice">🧾 Rechnung</button><button class="btn btn-ghost" id="oSlip">📄 Lieferschein</button><div class="spacer"></div><button class="btn btn-ghost" data-close>Schließen</button><button class="btn btn-primary" id="oSave">Speichern</button>`
  });
  $('#oInvoice', m.el).onclick = () => printDoc(o.id, 'invoice');
  $('#oSlip', m.el).onclick = () => printDoc(o.id, 'slip');
  $('#oSave', m.el).onclick = async () => {
    try {
      await api('/api/admin/orders/' + o.id, { method: 'PUT', body: { status: $('#oStatus', m.el).value, carrier: $('#oCarrier', m.el).value, trackingNumber: $('#oTracking', m.el).value, note: $('#oNote', m.el).value } });
      await loadOrders(true); m.close(); toast('Bestellung aktualisiert.');
      if (state.view === 'orders' || state.view === 'dashboard') navigate(state.view);
    } catch (ex) { toast(ex.message, true); }
  };
}

/* Rechnung / Lieferschein drucken */
async function printDoc(orderId, type) {
  const [o, s] = await Promise.all([api('/api/admin/orders/' + orderId), loadSettings()]);
  const isInv = type === 'invoice';
  const taxSum = {};
  o.items.forEach(i => { const gross = i.price * i.qty; const tax = gross - gross / (1 + i.taxRate / 100); taxSum[i.taxRate] = (taxSum[i.taxRate] || 0) + tax; });
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${isInv ? 'Rechnung' : 'Lieferschein'} #${o.number}</title>
  <style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#1a1a1a;font-size:14px}h1{font-size:22px;color:#0C5223}
  table{width:100%;border-collapse:collapse;margin:22px 0}th{text-align:left;border-bottom:2px solid #0C5223;padding:8px 6px;font-size:12px;text-transform:uppercase}
  td{padding:8px 6px;border-bottom:1px solid #ddd}.r{text-align:right}.head{display:flex;justify-content:space-between;margin-bottom:30px}
  .muted{color:#777;font-size:12px}.total{font-size:16px;font-weight:bold}</style></head><body>
  <div class="head"><div><h1>${esc(s.storeName)}</h1><div class="muted">${esc(s.address)}<br>${esc(s.contactEmail)} · ${esc(s.contactPhone)}</div></div>
  <div style="text-align:right"><h2>${isInv ? 'RECHNUNG' : 'LIEFERSCHEIN'}</h2><div class="muted">Nr. ${o.number}<br>Datum: ${fdate(o.createdAt)}</div></div></div>
  <p><b>${isInv ? 'Rechnungs' : 'Liefer'}adresse:</b><br>${esc(o.customer.name)}<br>${esc(o.customer.street)}<br>${esc(o.customer.zip)} ${esc(o.customer.city)}</p>
  <table><thead><tr><th>Pos.</th><th>Artikel</th><th>SKU</th><th class="r">Menge</th>${isInv ? '<th class="r">Einzelpreis</th><th class="r">Gesamt</th>' : ''}</tr></thead><tbody>
  ${o.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.name)}</td><td>${esc(i.sku || '–')}</td><td class="r">${i.qty}</td>${isInv ? `<td class="r">${euro(i.price)}</td><td class="r">${euro(i.price * i.qty)}</td>` : ''}</tr>`).join('')}
  ${isInv ? `<tr><td colspan="5" class="r">Zwischensumme</td><td class="r">${euro(o.subtotal)}</td></tr>
  ${o.discount ? `<tr><td colspan="5" class="r">Rabatt ${o.couponCode ? '(' + esc(o.couponCode) + ')' : ''}</td><td class="r">−${euro(o.discount)}</td></tr>` : ''}
  <tr><td colspan="5" class="r">Versand</td><td class="r">${euro(o.shippingCost)}</td></tr>
  <tr><td colspan="5" class="r total">Gesamtbetrag</td><td class="r total">${euro(o.total)}</td></tr>
  ${Object.entries(taxSum).map(([r, t]) => `<tr><td colspan="5" class="r muted">enthaltene MwSt. (${r} %)</td><td class="r muted">${euro(t)}</td></tr>`).join('')}` : ''}
  </tbody></table>
  <p class="muted">${isInv ? `Zahlungsart: ${PAY_LABEL[o.paymentMethod] || o.paymentMethod}. Vielen Dank für Ihre Bestellung!` : 'Bitte prüfen Sie die Ware auf Vollständigkeit.'}</p>
  <script>window.print()<\/script></body></html>`);
  w.document.close();
}

/* ═══════════ VIEW: Lager ═══════════ */

async function renderInventory() {
  await loadProducts(true);
  const movements = await api('/api/admin/movements?limit=60');
  const t = state.t.inventory;
  const root = $('#viewRoot');
  const low = state.products.filter(p => p.stock <= p.minStock);
  const totalValue = state.products.reduce((s, p) => s + (p.purchasePrice || 0) * p.stock, 0);

  const draw = () => {
    const list = state.products.filter(p => !t.q || p.name.toLowerCase().includes(t.q));
    const rows = list.slice((t.page - 1) * PER_PAGE, t.page * PER_PAGE);
    root.innerHTML = `
      <div class="view-head"><div><h2>Lagerverwaltung</h2><p>Bestände, Wareneingang & -ausgang, Inventur</p></div></div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-ico" style="background:color-mix(in srgb,var(--acc) 14%,transparent)">🏬</div><div><div class="stat-num">${state.products.reduce((s, p) => s + p.stock, 0)}</div><div class="stat-label">Artikel auf Lager</div></div></div>
        <div class="stat-card"><div class="stat-ico" style="background:color-mix(in srgb,var(--blue) 14%,transparent)">💰</div><div><div class="stat-num">${euro(totalValue)}</div><div class="stat-label">Lagerwert (EK)</div></div></div>
        <div class="stat-card"><div class="stat-ico" style="background:color-mix(in srgb,var(--red) 14%,transparent)">⚠️</div><div><div class="stat-num">${low.length}</div><div class="stat-label">Unter Mindestbestand</div></div></div>
      </div>
      <div class="grid-2">
        <div>
          <div class="toolbar"><input type="search" class="search" id="iq" placeholder="Produkt suchen…" value="${esc(t.q)}"><div class="toolbar-spacer"></div><span class="muted">${list.length} Produkte</span></div>
          <div class="table-wrap"><table class="tbl"><thead><tr><th>Produkt</th><th class="ta-center">Bestand</th><th class="ta-center">Min.</th><th class="ta-right">Buchen</th></tr></thead><tbody>
            ${rows.map(p => `<tr><td>${esc(p.name)}<div class="row-sub">${esc(p.sku)}</div></td><td class="ta-center">${stockBadge(p)}</td><td class="ta-center muted">${p.minStock}</td>
            <td><div class="row-actions"><button class="icon-btn" data-in="${p.id}" title="Wareneingang">＋</button><button class="icon-btn del" data-out="${p.id}" title="Warenausgang">－</button></div></td></tr>`).join('')}
          </tbody></table>${pager(list.length, t.page, pg => { t.page = pg; draw(); })}</div>
        </div>
        <div class="card"><div class="card-head"><h3>Letzte Lagerbewegungen</h3></div>
          <table class="tbl"><tbody>
          ${movements.slice(0, 12).map(mv => `<tr><td>${esc(mv.name)}<div class="row-sub">${fdt(mv.ts)} · ${esc(mv.reason)}${mv.note ? ' · ' + esc(mv.note) : ''} · ${esc(mv.user)}</div></td>
            <td class="ta-right"><b style="color:${mv.delta > 0 ? 'var(--acc)' : 'var(--red)'}">${mv.delta > 0 ? '+' : ''}${mv.delta}</b><div class="row-sub">→ ${mv.stockAfter}</div></td></tr>`).join('') || '<tr><td class="empty">Noch keine Bewegungen.</td></tr>'}
          </tbody></table>
        </div>
      </div>`;
    $('#iq').oninput = debounce(e => { t.q = e.target.value.trim().toLowerCase(); t.page = 1; draw(); }, 250);
    root.querySelector('tbody').onclick = e => {
      const inn = e.target.closest('[data-in]'), out = e.target.closest('[data-out]');
      if (inn || out) stockModal(state.products.find(p => p.id === (inn || out).dataset[inn ? 'in' : 'out']), inn ? 1 : -1);
    };
  };
  draw();

  function stockModal(p, sign) {
    const m = modal({
      title: (sign > 0 ? 'Wareneingang' : 'Warenausgang') + ' – ' + p.name,
      body: `<p class="muted">Aktueller Bestand: <b>${p.stock}</b></p>
        <div class="field"><label>Menge</label><input id="stQty" type="number" min="1" step="1" value="1"></div>
        <div class="field"><label>Grund</label><select id="stReason">
          ${sign > 0 ? '<option>Wareneingang</option><option>Inventur-Korrektur</option><option>Retoure</option>' : '<option>Warenausgang</option><option>Inventur-Korrektur</option><option>Bruch/Verlust</option><option>Eigenbedarf</option>'}
        </select></div>
        <div class="field"><label>Notiz (optional)</label><input id="stNote"></div>`,
      foot: `<div class="spacer"></div><button class="btn btn-ghost" data-close>Abbrechen</button><button class="btn btn-primary" id="stSave">Buchen</button>`
    });
    $('#stSave', m.el).onclick = async () => {
      try {
        await api('/api/admin/stock', { method: 'POST', body: { productId: p.id, delta: sign * Math.abs(parseInt($('#stQty', m.el).value, 10) || 0), reason: $('#stReason', m.el).value, note: $('#stNote', m.el).value } });
        await loadProducts(true); m.close(); toast('Lagerbewegung gebucht.'); navigate('inventory');
      } catch (ex) { toast(ex.message, true); }
    };
  }
}

/* ═══════════ VIEW: Kategorien ═══════════ */

async function renderCategories() {
  await Promise.all([loadCategories(true), loadProducts()]);
  const root = $('#viewRoot');
  const count = name => state.products.filter(p => p.category === name).length;

  root.innerHTML = `
    <div class="view-head"><div><h2>Kategorien</h2><p>Per Ziehen am ☰-Symbol sortieren – die Reihenfolge gilt auch im Shop.</p></div>
    <button class="btn btn-primary" id="catAdd">+ Neue Kategorie</button></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th style="width:40px"></th><th style="width:56px">Icon</th><th>Name</th><th>Übergeordnet</th><th class="ta-right">Produkte</th><th class="ta-right">Aktionen</th></tr></thead>
    <tbody id="catBody">
    ${state.categories.map(c => `<tr class="cat-row" draggable="true" data-id="${c.id}">
      <td><span class="drag-handle">☰</span></td><td style="font-size:1.3rem">${esc(c.icon || '📦')}</td>
      <td class="row-name">${esc(c.name)}</td><td class="muted">${esc(c.parent || '–')}</td>
      <td class="ta-right"><span class="chip">${count(c.name)}</span></td>
      <td><div class="row-actions"><button class="icon-btn" data-edit="${c.id}">✎</button><button class="icon-btn del" data-del="${c.id}">🗑</button></div></td>
    </tr>`).join('')}
    </tbody></table></div>`;

  $('#catAdd').onclick = () => catModal(null);
  $('#catBody').onclick = e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) catModal(state.categories.find(c => c.id === ed.dataset.edit));
    if (del) {
      const c = state.categories.find(x => x.id === del.dataset.del);
      const n = count(c.name);
      if (!confirm(`„${c.name}“ löschen?${n ? `\n\nHinweis: ${n} Produkte behalten diese Kategorie als Text und sollten danach umsortiert werden.` : ''}`)) return;
      api('/api/admin/categories/' + c.id, { method: 'DELETE' }).then(() => { toast('Kategorie gelöscht.'); navigate('categories'); }).catch(ex => toast(ex.message, true));
    }
  };

  /* Drag & Drop Sortierung */
  let dragEl = null;
  const body = $('#catBody');
  body.addEventListener('dragstart', e => { dragEl = e.target.closest('tr'); dragEl.classList.add('dragging'); });
  body.addEventListener('dragend', async () => {
    if (!dragEl) return;
    dragEl.classList.remove('dragging'); dragEl = null;
    const order = $$('#catBody tr').map(tr => tr.dataset.id);
    await api('/api/admin/categories-order', { method: 'PUT', body: { order } }).catch(ex => toast(ex.message, true));
    await loadCategories(true);
    toast('Reihenfolge gespeichert.');
  });
  body.addEventListener('dragover', e => {
    e.preventDefault();
    const after = $$('#catBody tr:not(.dragging)').find(tr => e.clientY < tr.getBoundingClientRect().top + tr.offsetHeight / 2);
    if (after) body.insertBefore(dragEl, after); else body.appendChild(dragEl);
  });

  function catModal(c) {
    const isNew = !c;
    const m = modal({
      title: isNew ? 'Neue Kategorie' : 'Kategorie bearbeiten',
      body: `<div class="field-row"><div class="field"><label>Icon (Emoji)</label><input id="cIcon" value="${esc(c ? c.icon : '📦')}" maxlength="4"></div>
        <div class="field"><label>Name *</label><input id="cName" value="${esc(c ? c.name : '')}"></div></div>
        <div class="field"><label>Übergeordnete Kategorie (optional)</label><select id="cParent"><option value="">– keine –</option>
        ${state.categories.filter(x => !c || x.id !== c.id).map(x => `<option ${c && c.parent === x.name ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>`,
      foot: `<div class="spacer"></div><button class="btn btn-ghost" data-close>Abbrechen</button><button class="btn btn-primary" id="cSave">Speichern</button>`
    });
    $('#cSave', m.el).onclick = async () => {
      const body = { name: $('#cName', m.el).value, parent: $('#cParent', m.el).value, icon: $('#cIcon', m.el).value };
      try {
        if (isNew) await api('/api/admin/categories', { method: 'POST', body });
        else await api('/api/admin/categories/' + c.id, { method: 'PUT', body });
        await Promise.all([loadCategories(true), loadProducts(true)]);
        m.close(); toast('Gespeichert.'); navigate('categories');
      } catch (ex) { toast(ex.message, true); }
    };
  }
}

/* ═══════════ VIEW: Kunden ═══════════ */

async function renderCustomers() {
  await loadCustomers(true);
  const t = state.t.customers;
  const root = $('#viewRoot');
  const draw = () => {
    let list = state.customers.filter(k => !t.q || (k.name + ' ' + k.email + ' ' + k.city).toLowerCase().includes(t.q));
    list = sortBy(list, t.sort);
    const rows = list.slice((t.page - 1) * PER_PAGE, t.page * PER_PAGE);
    root.innerHTML = `
      <div class="view-head"><div><h2>Kunden</h2><p>${state.customers.length} Kunden · Klick auf eine Zeile für Details & Bestellhistorie</p></div></div>
      <div class="toolbar"><input type="search" class="search" id="kq" placeholder="Suchen…" value="${esc(t.q)}"><div class="toolbar-spacer"></div><span class="muted">${list.length} Treffer</span></div>
      <div class="table-wrap"><table class="tbl"><thead><tr>
        <th class="sortable" data-sort="name">Name${sortArrow(t, 'name')}</th><th>Kontakt</th><th>Ort</th>
        <th class="sortable ta-right" data-sort="ordersCount">Bestellungen${sortArrow(t, 'ordersCount')}</th>
        <th class="sortable ta-right" data-sort="totalSpent">Umsatz${sortArrow(t, 'totalSpent')}</th><th>Status</th>
      </tr></thead><tbody>
      ${rows.map(k => `<tr class="clickable" data-id="${k.id}">
        <td class="row-name">${esc(k.name)}</td>
        <td>${esc(k.email)}<div class="row-sub">${esc(k.phone || '')}</div></td>
        <td>${esc(k.city || '–')}</td>
        <td class="ta-right">${k.ordersCount}</td>
        <td class="ta-right price-cell">${euro(k.totalSpent)}</td>
        <td>${k.status === 'gesperrt' ? '<span class="status-pill" style="background:color-mix(in srgb,var(--red) 14%,transparent);color:var(--red)"><span class="dot"></span>Gesperrt</span>' : '<span class="status-pill" style="background:color-mix(in srgb,var(--acc) 14%,transparent);color:var(--acc)"><span class="dot"></span>Aktiv</span>'}</td>
      </tr>`).join('')}
      </tbody></table>
      ${rows.length ? '' : '<div class="empty">Keine Kunden gefunden.</div>'}
      ${pager(list.length, t.page, pg => { t.page = pg; draw(); })}</div>`;
    $('#kq').oninput = debounce(e => { t.q = e.target.value.trim().toLowerCase(); t.page = 1; draw(); }, 250);
    bindSort(t, draw);
    root.querySelector('tbody').onclick = e => { const tr = e.target.closest('tr[data-id]'); if (tr) customerModal(tr.dataset.id); };
  };
  draw();

  async function customerModal(id) {
    const k = await api('/api/admin/customers/' + id);
    const m = modal({
      title: k.name, size: 'lg',
      body: `
        <div class="field-row-3">
          <div class="field"><label>Name</label><input id="kName" value="${esc(k.name)}"></div>
          <div class="field"><label>E-Mail</label><input id="kEmail" value="${esc(k.email)}"></div>
          <div class="field"><label>Telefon</label><input id="kPhone" value="${esc(k.phone)}"></div>
        </div>
        <div class="field-row-3">
          <div class="field"><label>Straße</label><input id="kStreet" value="${esc(k.street)}"></div>
          <div class="field"><label>PLZ</label><input id="kZip" value="${esc(k.zip)}"></div>
          <div class="field"><label>Stadt</label><input id="kCity" value="${esc(k.city)}"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Status</label><select id="kStatus"><option value="aktiv" ${k.status !== 'gesperrt' ? 'selected' : ''}>Aktiv</option><option value="gesperrt" ${k.status === 'gesperrt' ? 'selected' : ''}>Gesperrt</option></select></div>
          <div class="field"><label>Kunde seit</label><input value="${fdate(k.createdAt)}" disabled></div>
        </div>
        <div class="field"><label>Notizen</label><textarea id="kNotes" rows="2">${esc(k.notes)}</textarea></div>
        <h4>Bestellhistorie (${k.orders.length})</h4>
        <table class="tbl"><tbody>
        ${k.orders.map(o => `<tr class="clickable" data-order="${o.id}"><td><b>#${o.number}</b><div class="row-sub">${fdt(o.createdAt)}</div></td><td>${o.items.reduce((s, i) => s + i.qty, 0)} Artikel</td><td class="ta-right price-cell">${euro(o.total)}</td><td class="ta-right">${statusPill(o.status)}</td></tr>`).join('') || '<tr><td class="empty">Noch keine Bestellungen.</td></tr>'}
        </tbody></table>`,
      foot: `<button class="btn btn-danger-ghost" id="kDel">🗑 Löschen</button><div class="spacer"></div><button class="btn btn-ghost" data-close>Schließen</button><button class="btn btn-primary" id="kSave">Speichern</button>`
    });
    $$('#modalRoot [data-order]').forEach(tr => tr.onclick = () => { m.close(); openOrderModal(tr.dataset.order); });
    $('#kDel', m.el).onclick = async () => {
      if (!confirm(`Kunde „${k.name}“ wirklich löschen?`)) return;
      try { await api('/api/admin/customers/' + k.id, { method: 'DELETE' }); m.close(); toast('Kunde gelöscht.'); navigate('customers'); } catch (ex) { toast(ex.message, true); }
    };
    $('#kSave', m.el).onclick = async () => {
      try {
        await api('/api/admin/customers/' + k.id, { method: 'PUT', body: { name: $('#kName', m.el).value, email: $('#kEmail', m.el).value, phone: $('#kPhone', m.el).value, street: $('#kStreet', m.el).value, zip: $('#kZip', m.el).value, city: $('#kCity', m.el).value, status: $('#kStatus', m.el).value, notes: $('#kNotes', m.el).value } });
        m.close(); toast('Kunde gespeichert.'); navigate('customers');
      } catch (ex) { toast(ex.message, true); }
    };
  }
}

/* ═══════════ VIEW: Gutscheine ═══════════ */

async function renderCoupons() {
  await loadCoupons(true);
  const root = $('#viewRoot');
  root.innerHTML = `
    <div class="view-head"><div><h2>Gutscheine</h2><p>Rabattcodes für Ihren Shop – Kunden geben den Code im Warenkorb ein.</p></div>
    <button class="btn btn-primary" id="gAdd">+ Neuer Gutschein</button></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Rabatt</th><th class="ta-right">Mindestbestellwert</th><th class="ta-center">Eingelöst</th><th>Gültig bis</th><th class="ta-center">Aktiv</th><th class="ta-right">Aktionen</th></tr></thead><tbody>
    ${state.coupons.map(c => `<tr>
      <td><b style="font-family:monospace;font-size:1rem">${esc(c.code)}</b></td>
      <td>${c.type === 'percent' ? c.value + ' %' : euro(c.value)}</td>
      <td class="ta-right">${c.minOrder ? euro(c.minOrder) : '–'}</td>
      <td class="ta-center">${c.usedCount}${c.maxUses ? ' / ' + c.maxUses : ''}</td>
      <td>${c.expiresAt ? fdate(c.expiresAt) : 'unbegrenzt'}</td>
      <td class="ta-center"><button class="avail-toggle ${c.active ? 'on' : ''}" data-tog="${c.id}"></button></td>
      <td><div class="row-actions"><button class="icon-btn" data-edit="${c.id}">✎</button><button class="icon-btn del" data-del="${c.id}">🗑</button></div></td>
    </tr>`).join('')}
    </tbody></table>${state.coupons.length ? '' : '<div class="empty">Noch keine Gutscheine.</div>'}</div>`;

  $('#gAdd').onclick = () => couponModal(null);
  root.querySelector('tbody').onclick = async e => {
    const tog = e.target.closest('[data-tog]'), ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (tog) { const c = state.coupons.find(x => x.id === tog.dataset.tog); try { await api('/api/admin/coupons/' + c.id, { method: 'PUT', body: { active: !c.active } }); navigate('coupons'); } catch (ex) { toast(ex.message, true); } }
    if (ed) couponModal(state.coupons.find(x => x.id === ed.dataset.edit));
    if (del) { const c = state.coupons.find(x => x.id === del.dataset.del); if (confirm(`Gutschein „${c.code}“ löschen?`)) { await api('/api/admin/coupons/' + c.id, { method: 'DELETE' }); toast('Gelöscht.'); navigate('coupons'); } }
  };

  function couponModal(c) {
    const isNew = !c;
    const m = modal({
      title: isNew ? 'Neuer Gutschein' : 'Gutschein bearbeiten',
      body: `<div class="field"><label>Code *</label><input id="gCode" style="text-transform:uppercase;font-family:monospace" value="${esc(c ? c.code : '')}" placeholder="z. B. SOMMER20"></div>
      <div class="field-row"><div class="field"><label>Art</label><select id="gType"><option value="percent" ${!c || c.type === 'percent' ? 'selected' : ''}>Prozent (%)</option><option value="fixed" ${c && c.type === 'fixed' ? 'selected' : ''}>Festbetrag (€)</option></select></div>
      <div class="field"><label>Wert *</label><input id="gValue" type="number" step="0.01" min="0" value="${c ? c.value : 10}"></div></div>
      <div class="field-row"><div class="field"><label>Mindestbestellwert (€)</label><input id="gMin" type="number" step="0.01" min="0" value="${c ? c.minOrder : 0}"></div>
      <div class="field"><label>Max. Einlösungen (0 = unbegrenzt)</label><input id="gMax" type="number" step="1" min="0" value="${c ? c.maxUses : 0}"></div></div>
      <div class="field"><label>Ablaufdatum (leer = unbegrenzt)</label><input id="gExp" type="date" value="${c && c.expiresAt ? c.expiresAt.slice(0, 10) : ''}"></div>`,
      foot: `<div class="spacer"></div><button class="btn btn-ghost" data-close>Abbrechen</button><button class="btn btn-primary" id="gSave">Speichern</button>`
    });
    $('#gSave', m.el).onclick = async () => {
      const body = { code: $('#gCode', m.el).value, type: $('#gType', m.el).value, value: $('#gValue', m.el).value, minOrder: $('#gMin', m.el).value, maxUses: $('#gMax', m.el).value, expiresAt: $('#gExp', m.el).value };
      try {
        if (isNew) await api('/api/admin/coupons', { method: 'POST', body });
        else await api('/api/admin/coupons/' + c.id, { method: 'PUT', body });
        await loadCoupons(true); m.close(); toast('Gespeichert.'); navigate('coupons');
      } catch (ex) { toast(ex.message, true); }
    };
  }
}

/* ═══════════ VIEW: Versand & Zahlung ═══════════ */

async function renderShipping() {
  const s = await loadSettings(true);
  const root = $('#viewRoot');
  root.innerHTML = `
    <div class="view-head"><div><h2>Versand & Zahlung</h2><p>Versandarten, Kosten und Zahlungsmethoden für den Shop.</p></div></div>
    <div class="grid-2-even">
      <div class="card"><div class="card-head"><h3>🚚 Versandarten</h3></div>
        <div id="shipRows">${s.shippingMethods.map((v, i) => shipRow(v, i)).join('')}</div>
        <button class="btn btn-ghost btn-sm" id="shipAdd">+ Versandart</button>
        <hr style="border:none;border-top:1px solid var(--line);margin:16px 0">
        <div class="field-row">
          <div class="field"><label>Gratis Versand ab (€)</label><input id="freeShip" type="number" step="0.01" value="${s.freeShipping}"></div>
          <div class="field"><label>Standard-Versandkosten (€)</label><input id="shipCost" type="number" step="0.01" value="${s.shippingCost}"></div>
        </div>
        <div class="card-head" style="margin-top:16px"><h3>🌍 Versandzonen</h3></div>
        <div id="zoneRows">${s.shippingZones.map((z, i) => `<div class="mini-row" style="grid-template-columns:1fr 110px 40px"><input data-zn="${i}" value="${esc(z.name)}" placeholder="Zone"><input data-zc="${i}" type="number" step="0.01" value="${z.cost}" placeholder="€"><button class="icon-btn del" data-zx="${i}">✕</button></div>`).join('')}</div>
        <button class="btn btn-ghost btn-sm" id="zoneAdd">+ Zone</button>
      </div>
      <div class="card"><div class="card-head"><h3>💳 Zahlungsmethoden</h3></div>
        <p class="muted" style="margin-bottom:10px">Aktivierte Methoden erscheinen im Checkout. Für PayPal/Stripe-Anbindung mit echtem Geldfluss werden API-Schlüssel des Anbieters benötigt.</p>
        ${s.paymentMethods.map((pm, i) => `<div class="pay-row"><span class="pay-name">${esc(pm.label)}</span><button class="avail-toggle ${pm.enabled ? 'on' : ''}" data-pay="${i}"></button></div>`).join('')}
      </div>
    </div>
    <div style="margin-top:16px;display:flex;justify-content:flex-end"><button class="btn btn-primary" id="shipSave">Änderungen speichern</button></div>`;

  function shipRow(v, i) {
    return `<div class="mini-row"><input data-sn="${i}" value="${esc(v.label)}" placeholder="Bezeichnung"><input data-sc="${i}" type="number" step="0.01" value="${v.cost}" placeholder="€"><button class="avail-toggle ${v.enabled ? 'on' : ''}" data-se="${i}" style="justify-self:center"></button><button class="icon-btn del" data-sx="${i}">✕</button></div>`;
  }
  const local = { ship: JSON.parse(JSON.stringify(s.shippingMethods)), zones: JSON.parse(JSON.stringify(s.shippingZones)), pay: JSON.parse(JSON.stringify(s.paymentMethods)) };

  root.onclick = e => {
    const se = e.target.closest('[data-se]'), sx = e.target.closest('[data-sx]'), pay = e.target.closest('[data-pay]'), zx = e.target.closest('[data-zx]');
    if (se) { const i = +se.dataset.se; local.ship[i].enabled = !local.ship[i].enabled; se.classList.toggle('on'); }
    if (sx) { local.ship.splice(+sx.dataset.sx, 1); $('#shipRows').innerHTML = local.ship.map((v, i) => shipRow(v, i)).join(''); }
    if (zx) { local.zones.splice(+zx.dataset.zx, 1); renderShipping(); }
    if (pay) { const i = +pay.dataset.pay; local.pay[i].enabled = !local.pay[i].enabled; pay.classList.toggle('on'); }
    if (e.target.id === 'shipAdd') { local.ship.push({ id: '', label: '', cost: 0, enabled: true }); $('#shipRows').innerHTML = local.ship.map((v, i) => shipRow(v, i)).join(''); }
    if (e.target.id === 'zoneAdd') { local.zones.push({ name: '', cost: 0 }); navigate('shipping'); }
    if (e.target.id === 'shipSave') saveAll();
  };
  root.oninput = e => {
    const d = e.target.dataset;
    if (d.sn !== undefined) local.ship[+d.sn].label = e.target.value;
    if (d.sc !== undefined) local.ship[+d.sc].cost = e.target.value;
    if (d.zn !== undefined) local.zones[+d.zn].name = e.target.value;
    if (d.zc !== undefined) local.zones[+d.zc].cost = e.target.value;
  };
  async function saveAll() {
    try {
      await api('/api/admin/settings', { method: 'PUT', body: { shippingMethods: local.ship, shippingZones: local.zones, paymentMethods: local.pay, freeShipping: $('#freeShip').value, shippingCost: $('#shipCost').value } });
      await loadSettings(true); toast('Gespeichert.'); navigate('shipping');
    } catch (ex) { toast(ex.message, true); }
  }
}

/* ═══════════ VIEW: Analytics ═══════════ */

async function renderAnalytics() {
  const days = state._anaDays || 30;
  const a = await api('/api/admin/analytics?days=' + days);
  const root = $('#viewRoot');
  const stat = (num, label, color) => `<div class="stat-card"><div class="stat-ico" style="background:color-mix(in srgb,${color} 14%,transparent)">📈</div><div><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div></div>`;
  root.innerHTML = `
    <div class="view-head"><div><h2>Analytics</h2><p>Auswertung der letzten ${days} Tage</p></div>
      <select id="anaDays" style="width:auto">${[7, 30, 90].map(d => `<option value="${d}" ${d === days ? 'selected' : ''}>Letzte ${d} Tage</option>`).join('')}</select></div>
    <div class="stat-grid">
      ${stat(euro(a.revenue), 'Umsatz', '#1F9B45')}
      ${stat(euro(a.profit), 'Gewinn (kalk.)', '#10B981')}
      ${stat(a.ordersCount, 'Bestellungen', '#3B82F6')}
      ${stat(euro(a.aov), 'Ø Bestellwert', '#8B5CF6')}
      ${stat(a.visitors, 'Besucher', '#0EA5E9')}
      ${stat(a.conversion + ' %', 'Conversion', '#F59E0B')}
    </div>
    <div class="card"><div class="card-head"><h3>Umsatzverlauf</h3></div><div class="chart-box">${lineChart(a.byDay.map(x => ({ label: x.d.slice(8) + '.' + x.d.slice(5, 7), value: x.revenue })), 220)}</div></div>
    <div class="grid-2-even" style="margin-top:16px">
      <div class="card"><div class="card-head"><h3>Top-Produkte (Stück)</h3></div>${hbars(a.topProducts)}</div>
      <div class="card"><div class="card-head"><h3>Top-Kategorien (Umsatz)</h3></div>${hbars(a.topCategories)}</div>
    </div>`;
  $('#anaDays').onchange = e => { state._anaDays = +e.target.value; renderAnalytics(); };
}

/* ═══════════ VIEW: Medien ═══════════ */

async function renderMedia() {
  const files = await api('/api/admin/media');
  const root = $('#viewRoot');
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
  root.innerHTML = `
    <div class="view-head"><div><h2>Medien</h2><p>${files.length} Dateien · hochgeladene Produktbilder</p></div></div>
    <div class="dropzone" id="mdz">📁 Dateien hierher ziehen oder <b>klicken zum Hochladen</b><input type="file" id="mdzInput" accept="image/*,video/mp4,video/webm" multiple hidden></div>
    <div class="stat-grid" style="margin-top:16px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">
      ${files.map(f => `<div class="card" style="padding:10px">
        <img src="${esc(f.url)}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:9px;background:var(--line-2)" loading="lazy" onerror="this.style.opacity=.3">
        <div class="row-sub" style="margin:7px 0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(f.name)}">${esc(f.name)}</div>
        <div class="row-sub">${kb(f.size)}${f.usedBy ? ` · in ${f.usedBy} Produkt(en)` : ''}</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-sm btn-ghost" data-copy="${esc(f.url)}" style="flex:1">URL kopieren</button>
          <button class="icon-btn del" data-del="${esc(f.name)}" ${f.usedBy ? 'title="Wird noch verwendet!"' : ''}>🗑</button>
        </div>
      </div>`).join('') || '<p class="muted">Noch keine Dateien hochgeladen.</p>'}
    </div>`;
  const dz = $('#mdz'), inp = $('#mdzInput');
  dz.onclick = () => inp.click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag'); };
  dz.ondragleave = () => dz.classList.remove('drag');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('drag'); up(e.dataTransfer.files); };
  inp.onchange = () => up(inp.files);
  async function up(fl) {
    if (!fl || !fl.length) return;
    const fd = new FormData(); [...fl].forEach(f => fd.append('files', f));
    try { const r = await api('/api/admin/upload', { method: 'POST', body: fd }); toast(`${r.length} Datei(en) hochgeladen.`); navigate('media'); }
    catch (ex) { toast(ex.message, true); }
  }
  root.onclick = async e => {
    const cp = e.target.closest('[data-copy]'), del = e.target.closest('[data-del]');
    if (cp) { try { await navigator.clipboard.writeText(location.origin + cp.dataset.copy); toast('URL kopiert.'); } catch { toast(cp.dataset.copy); } }
    if (del) {
      if (!confirm(`Datei „${del.dataset.del}“ löschen?`)) return;
      try { await api('/api/admin/media/' + encodeURIComponent(del.dataset.del), { method: 'DELETE' }); toast('Gelöscht.'); navigate('media'); }
      catch (ex) { toast(ex.message, true); }
    }
  };
}

/* ═══════════ VIEW: Benutzer ═══════════ */

async function renderUsers() {
  await loadUsers(true);
  const root = $('#viewRoot');
  root.innerHTML = `
    <div class="view-head"><div><h2>Benutzerverwaltung</h2><p>Administratoren haben vollen Zugriff, Mitarbeiter sehen Produkte, Lager, Bestellungen & Kunden.</p></div>
    <button class="btn btn-primary" id="uAdd">+ Neuer Benutzer</button></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Benutzer</th><th>Name</th><th>Rolle</th><th class="ta-center">2FA</th><th>Erstellt</th><th class="ta-right">Aktionen</th></tr></thead><tbody>
    ${state.users.map(u => `<tr>
      <td><b>${esc(u.username)}</b>${u.id === state.me.userId ? ' <span class="chip">Sie</span>' : ''}</td>
      <td>${esc(u.name)}</td>
      <td>${u.role === 'admin' ? '🛡 Administrator' : '👤 Mitarbeiter'}</td>
      <td class="ta-center">${u.totpEnabled ? '✅' : '–'}</td>
      <td class="muted">${fdate(u.createdAt)}</td>
      <td><div class="row-actions"><button class="icon-btn" data-edit="${u.id}">✎</button>${u.id !== state.me.userId ? `<button class="icon-btn del" data-del="${u.id}">🗑</button>` : ''}</div></td>
    </tr>`).join('')}
    </tbody></table></div>`;
  $('#uAdd').onclick = () => userModal(null);
  root.querySelector('tbody').onclick = async e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) userModal(state.users.find(u => u.id === ed.dataset.edit));
    if (del) {
      const u = state.users.find(x => x.id === del.dataset.del);
      if (!confirm(`Benutzer „${u.username}“ löschen?`)) return;
      try { await api('/api/admin/users/' + u.id, { method: 'DELETE' }); toast('Benutzer gelöscht.'); navigate('users'); } catch (ex) { toast(ex.message, true); }
    }
  };

  function userModal(u) {
    const isNew = !u;
    const m = modal({
      title: isNew ? 'Neuer Benutzer' : 'Benutzer bearbeiten – ' + u.username,
      body: `${isNew ? `<div class="field"><label>Benutzername *</label><input id="uUser"></div>` : ''}
        <div class="field"><label>Anzeigename</label><input id="uName" value="${esc(u ? u.name : '')}"></div>
        <div class="field"><label>Rolle</label><select id="uRole" ${u && u.id === state.me.userId ? 'disabled' : ''}>
          <option value="staff" ${u && u.role === 'staff' ? 'selected' : ''}>Mitarbeiter</option>
          <option value="admin" ${!u || u.role === 'admin' ? 'selected' : ''}>Administrator</option></select></div>
        <div class="field"><label>${isNew ? 'Passwort * (min. 8 Zeichen)' : 'Neues Passwort (leer = unverändert)'}</label><input id="uPw" type="password" autocomplete="new-password"></div>`,
      foot: `<div class="spacer"></div><button class="btn btn-ghost" data-close>Abbrechen</button><button class="btn btn-primary" id="uSave">Speichern</button>`
    });
    $('#uSave', m.el).onclick = async () => {
      try {
        if (isNew) await api('/api/admin/users', { method: 'POST', body: { username: $('#uUser', m.el).value, name: $('#uName', m.el).value, role: $('#uRole', m.el).value, password: $('#uPw', m.el).value } });
        else await api('/api/admin/users/' + u.id, { method: 'PUT', body: { name: $('#uName', m.el).value, role: $('#uRole', m.el).value, password: $('#uPw', m.el).value || undefined } });
        await loadUsers(true); m.close(); toast('Gespeichert.'); navigate('users');
      } catch (ex) { toast(ex.message, true); }
    };
  }
}

/* ═══════════ VIEW: Einstellungen ═══════════ */

async function renderSettings() {
  const s = await loadSettings(true);
  const root = $('#viewRoot');
  root.innerHTML = `
    <div class="view-head"><div><h2>Einstellungen</h2><p>Shop-Daten, Design, Steuern und rechtliche Texte.</p></div></div>
    <div class="mtabs" style="margin-bottom:16px">
      <button class="mtab active" data-stab="shop">Shop</button>
      <button class="mtab" data-stab="design">Design</button>
      <button class="mtab" data-stab="steuern">Steuern & Währung</button>
      <button class="mtab" data-stab="lieferung">Lieferung & Kontakt</button>
      <button class="mtab" data-stab="recht">Rechtliches</button>
    </div>
    <form id="sForm" class="card" style="display:flex;flex-direction:column;gap:13px">
      <div data-spane="shop" style="display:flex;flex-direction:column;gap:13px">
        <div class="field-row"><div class="field"><label>Shop-Name</label><input name="storeName" value="${esc(s.storeName)}"></div>
        <div class="field"><label>Slogan</label><input name="tagline" value="${esc(s.tagline)}"></div></div>
        <div class="field-row"><div class="field"><label>Domain</label><input name="domain" value="${esc(s.domain)}"></div>
        <div class="field"><label>Sprache</label><select name="language"><option value="de" selected>Deutsch</option></select></div></div>
      </div>
      <div data-spane="design" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="field-row"><div class="field"><label>Hauptfarbe (gilt auch im Shop)</label><input name="primaryColor" type="color" value="${esc(s.primaryColor || '#1F9B45')}"></div>
        <div class="field"><label>Logo-URL</label><input name="logoUrl" value="${esc(s.logoUrl)}"></div></div>
        <div class="field"><label>Favicon-URL</label><input name="faviconUrl" value="${esc(s.faviconUrl)}"></div>
        <p class="muted">Tipp: Laden Sie Logo/Favicon unter <b>Medien</b> hoch und fügen Sie hier die URL ein.</p>
      </div>
      <div data-spane="steuern" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="field-row"><div class="field"><label>Währung</label><select name="currency"><option value="EUR" selected>Euro (€)</option></select></div>
        <div class="field"><label>Standard-Steuersatz (%)</label><input name="taxRateDefault" type="number" step="1" value="${s.taxRateDefault}"></div></div>
        <p class="muted">Preise im Shop sind Bruttopreise. Der Steuersatz pro Produkt wird beim Produkt selbst gepflegt (7 % Lebensmittel, 19 % Standard).</p>
      </div>
      <div data-spane="lieferung" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="field"><label>Lieferinformationen</label><textarea name="deliveryInfo" rows="2">${esc(s.deliveryInfo)}</textarea></div>
        <div class="field"><label>Abholung</label><textarea name="pickupInfo" rows="2">${esc(s.pickupInfo)}</textarea></div>
        <div class="field-row"><div class="field"><label>E-Mail</label><input name="contactEmail" value="${esc(s.contactEmail)}"></div>
        <div class="field"><label>Telefon</label><input name="contactPhone" value="${esc(s.contactPhone)}"></div></div>
        <div class="field"><label>Adresse</label><input name="address" value="${esc(s.address)}"></div>
      </div>
      <div data-spane="recht" hidden style="display:flex;flex-direction:column;gap:13px">
        <div class="field"><label>Impressum</label><textarea name="impressum" rows="5">${esc(s.legal.impressum)}</textarea></div>
        <div class="field"><label>Datenschutzerklärung</label><textarea name="datenschutz" rows="5">${esc(s.legal.datenschutz)}</textarea></div>
        <div class="field"><label>AGB</label><textarea name="agb" rows="5">${esc(s.legal.agb)}</textarea></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:12px;align-items:center"><span class="save-hint muted" id="sHint"></span><button type="submit" class="btn btn-primary">Speichern</button></div>
    </form>`;

  $$('.mtab[data-stab]').forEach(b => b.onclick = () => {
    $$('.mtab[data-stab]').forEach(x => x.classList.toggle('active', x === b));
    $$('[data-spane]').forEach(p => p.hidden = p.dataset.spane !== b.dataset.stab);
  });
  $('#sForm').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    try {
      await api('/api/admin/settings', { method: 'PUT', body: {
        storeName: f.storeName.value, tagline: f.tagline.value, domain: f.domain.value, language: f.language.value,
        primaryColor: f.primaryColor.value, logoUrl: f.logoUrl.value, faviconUrl: f.faviconUrl.value,
        currency: f.currency.value, taxRateDefault: f.taxRateDefault.value,
        deliveryInfo: f.deliveryInfo.value, pickupInfo: f.pickupInfo.value,
        contactEmail: f.contactEmail.value, contactPhone: f.contactPhone.value, address: f.address.value,
        legal: { impressum: f.impressum.value, datenschutz: f.datenschutz.value, agb: f.agb.value }
      } });
      await loadSettings(true); $('#sHint').textContent = '✓ Gespeichert'; toast('Einstellungen gespeichert.');
      setTimeout(() => { const h = $('#sHint'); if (h) h.textContent = ''; }, 2500);
    } catch (ex) { toast(ex.message, true); }
  };
}

/* ═══════════ Topbar: Suche, Glocke, Profil, Theme ═══════════ */

const doSearch = debounce(async q => {
  const box = $('#searchResults');
  if (q.length < 2) { box.hidden = true; return; }
  const r = await api('/api/admin/search?q=' + encodeURIComponent(q)).catch(() => null);
  if (!r) return;
  const group = (label, items, fmt, act) => items.length ? `<div class="sr-group">${label}</div>` + items.map(i => `<button class="sr-item" data-act="${act}" data-id="${i.id}">${fmt(i)}</button>`).join('') : '';
  box.innerHTML =
    group('Produkte', r.products, p => `<span>📦 ${esc(p.name)}</span><small>${euro(p.price)}</small>`, 'product') +
    group('Bestellungen', r.orders, o => `<span>🛒 #${o.number} – ${esc(o.name)}</span><small>${euro(o.total)}</small>`, 'order') +
    group('Kunden', r.customers, k => `<span>👤 ${esc(k.name)}</span><small>${esc(k.email)}</small>`, 'customer')
    || '<div class="empty" style="padding:18px">Keine Treffer.</div>';
  box.hidden = false;
  $$('.sr-item', box).forEach(b => b.onclick = async () => {
    box.hidden = true; $('#globalSearch').value = '';
    if (b.dataset.act === 'product') { await loadProducts(); await loadCategories(); openProductModal(state.products.find(p => p.id === b.dataset.id)); }
    if (b.dataset.act === 'order') openOrderModal(b.dataset.id);
    if (b.dataset.act === 'customer') { navigate('customers'); }
  });
}, 280);
$('#globalSearch').addEventListener('input', e => doSearch(e.target.value.trim()));
document.addEventListener('click', e => { if (!e.target.closest('.topbar-search')) $('#searchResults').hidden = true; });
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#globalSearch').focus(); } });

async function refreshBell() {
  const n = await api('/api/admin/notifications').catch(() => null);
  if (!n) return;
  $('#bellDot').hidden = !n.unread;
  $('#bellList').innerHTML = n.list.map(x => `<div class="notif ${x.read ? '' : 'unread'}"><span class="notif-ico">${NOTIF_ICO[x.type] || '🔔'}</span><div>${esc(x.text)}<small>${fdt(x.createdAt)}</small></div></div>`).join('') || '<div class="empty" style="padding:20px">Keine Benachrichtigungen.</div>';
}
$('#bellBtn').addEventListener('click', async () => { const d = $('#bellDrop'); d.hidden = !d.hidden; if (!d.hidden) refreshBell(); $('#profileDrop').hidden = true; });
$('#readAllBtn').addEventListener('click', async () => { await api('/api/admin/notifications/read-all', { method: 'PUT' }); refreshBell(); });
$('#profileBtn').addEventListener('click', () => { const d = $('#profileDrop'); d.hidden = !d.hidden; $('#bellDrop').hidden = true; });
document.addEventListener('click', e => {
  if (!e.target.closest('.bell-wrap')) $('#bellDrop').hidden = true;
  if (!e.target.closest('.profile-wrap')) $('#profileDrop').hidden = true;
});
setInterval(() => { if (state.me) refreshBell(); }, 60000);

/* Theme */
const savedTheme = localStorage.getItem('malak_admin_theme') || 'light';
document.documentElement.dataset.theme = savedTheme;
$('#themeToggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
$('#themeToggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('malak_admin_theme', next);
  $('#themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
});

/* Passwort ändern + 2FA */
$('#pwChangeBtn').addEventListener('click', () => {
  $('#profileDrop').hidden = true;
  const m = modal({
    title: 'Passwort ändern',
    body: `<div class="field"><label>Neues Passwort (min. 8 Zeichen)</label><input id="npw" type="password" autocomplete="new-password"></div>
      <div class="field"><label>Wiederholen</label><input id="npw2" type="password" autocomplete="new-password"></div>
      <div class="modal-error" id="pwErr" hidden></div>`,
    foot: `<div class="spacer"></div><button class="btn btn-ghost" data-close>Abbrechen</button><button class="btn btn-primary" id="pwSave">Speichern</button>`
  });
  $('#pwSave', m.el).onclick = async () => {
    const e1 = $('#npw', m.el).value, e2 = $('#npw2', m.el).value, err = $('#pwErr', m.el);
    if (e1 !== e2) { err.textContent = 'Die Passwörter stimmen nicht überein.'; err.hidden = false; return; }
    try { await api('/api/admin/users/' + state.me.userId, { method: 'PUT', body: { password: e1 } }); m.close(); toast('Passwort geändert.'); }
    catch (ex) { err.textContent = ex.message; err.hidden = false; }
  };
});

$('#totpBtn').addEventListener('click', async () => {
  $('#profileDrop').hidden = true;
  const me = await api('/api/me');
  if (me.totpEnabled) {
    const m = modal({
      title: 'Zwei-Faktor-Authentifizierung',
      body: `<p>✅ 2FA ist für Ihren Account <b>aktiv</b>. Beim Login wird zusätzlich ein 6-stelliger Code aus Ihrer Authenticator-App abgefragt.</p>`,
      foot: `<button class="btn btn-danger-ghost" id="totpOff">2FA deaktivieren</button><div class="spacer"></div><button class="btn btn-ghost" data-close>Schließen</button>`
    });
    $('#totpOff', m.el).onclick = async () => {
      try { await api(`/api/admin/users/${state.me.userId}/totp-disable`, { method: 'POST' }); m.close(); toast('2FA deaktiviert.'); } catch (ex) { toast(ex.message, true); }
    };
    return;
  }
  const setup = await api(`/api/admin/users/${state.me.userId}/totp-setup`, { method: 'POST' });
  const m = modal({
    title: 'Zwei-Faktor-Authentifizierung einrichten',
    body: `<p>1. Öffnen Sie Ihre Authenticator-App (Google Authenticator, Microsoft Authenticator, Authy …)<br>2. Fügen Sie einen neuen Eintrag hinzu – manuell mit diesem Schlüssel:</p>
      <p style="font-family:monospace;font-size:1.05rem;background:var(--hover);padding:12px;border-radius:10px;text-align:center;letter-spacing:.12em">${setup.secret}</p>
      <p class="muted">Oder als Link: <span style="word-break:break-all;font-size:.78rem">${esc(setup.otpauth)}</span></p>
      <div class="field"><label>3. Geben Sie den aktuellen 6-stelligen Code ein</label><input id="totpConfirm" inputmode="numeric" maxlength="6" placeholder="123456"></div>
      <div class="modal-error" id="totpErr" hidden></div>`,
    foot: `<div class="spacer"></div><button class="btn btn-ghost" data-close>Abbrechen</button><button class="btn btn-primary" id="totpGo">Aktivieren</button>`
  });
  $('#totpGo', m.el).onclick = async () => {
    try { await api(`/api/admin/users/${state.me.userId}/totp-confirm`, { method: 'POST', body: { code: $('#totpConfirm', m.el).value } }); m.close(); toast('2FA ist jetzt aktiv.'); }
    catch (ex) { const err = $('#totpErr', m.el); err.textContent = ex.message; err.hidden = false; }
  };
});

/* ═══════════ Init ═══════════ */

(async () => {
  try {
    const me = await api('/api/me');
    if (me.isAdmin) { state.me = me; showApp(); } else showLogin();
  } catch { showLogin(); }
})();
