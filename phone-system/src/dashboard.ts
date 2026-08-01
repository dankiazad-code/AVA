import { Router, type Request, type Response, type NextFunction } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";
import * as db from "./db.js";
import { allTenants, getTenantById, type Tenant } from "./tenants.js";

/**
 * Dashboards:
 *  - "/"        Admin-Übersicht über alle Tenants (Passwort: DASHBOARD_PASSWORD).
 *  - "/t/<id>"  Kunden-Dashboard eines Tenants. Login per Basic-Auth mit
 *               Benutzername = Tenant-ID und dessen dashboardPassword
 *               (der Admin kommt mit seinem Passwort überall rein).
 * Ohne DASHBOARD_PASSWORD (lokale Entwicklung) ist alles offen – wie bisher.
 */
export const dashboardRouter = Router();

// Sicherheits-Header für alle Dashboard-Seiten: nicht einbettbar, nicht
// indexierbar, nicht cachen (Transkripte sind personenbezogene Daten).
dashboardRouter.use((_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'",
  });
  next();
});

// CSRF-Schutz für die Formular-Aktionen: moderne Browser senden Sec-Fetch-Site;
// alles außer same-origin/none wird abgelehnt.
function rejectCrossSite(req: Request, res: Response, next: NextFunction): void {
  const site = req.header("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    res.status(403).send("Cross-Site-Anfragen sind nicht erlaubt");
    return;
  }
  next();
}

type Auth = { role: "admin" } | { role: "tenant"; tenantId: string } | null;

/** Timing-sicherer Passwortvergleich (über SHA-256, damit Längen gleich sind). */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}

// Brute-Force-Bremse: max. 10 Fehlversuche pro IP in 15 Minuten.
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_FAILURES = 10;
const authFailures = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const entry = authFailures.get(ip);
  if (!entry || Date.now() > entry.resetAt) return false;
  return entry.count >= AUTH_MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const entry = authFailures.get(ip);
  if (!entry || Date.now() > entry.resetAt) {
    authFailures.set(ip, { count: 1, resetAt: Date.now() + AUTH_WINDOW_MS });
  } else {
    entry.count++;
  }
  // Speicher begrenzen: abgelaufene Einträge gelegentlich entsorgen.
  if (authFailures.size > 10_000) {
    for (const [k, v] of authFailures) {
      if (Date.now() > v.resetAt) authFailures.delete(k);
    }
  }
}

function checkAuth(req: Request): Auth | "rate-limited" {
  // Fail-closed: ohne gesetztes Admin-Passwort gibt es KEINEN offenen Admin-Zugang.
  // (Früher wurde bei fehlendem Passwort jedem Admin-Rechte gewährt – DSGVO-Risiko.)
  const ip = req.ip ?? "unbekannt";
  if (isRateLimited(ip)) return "rate-limited";
  const header = req.header("authorization") ?? "";
  if (!header.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString();
  const idx = decoded.indexOf(":");
  const user = idx >= 0 ? decoded.slice(0, idx) : "";
  const pass = idx >= 0 ? decoded.slice(idx + 1) : "";
  if (config.dashboardPassword && safeEqual(pass, config.dashboardPassword)) return { role: "admin" };
  const tenant = getTenantById(user);
  if (tenant?.dashboardPassword && safeEqual(pass, tenant.dashboardPassword)) {
    return { role: "tenant", tenantId: tenant.id };
  }
  recordFailure(ip);
  return null;
}

function unauthorized(res: Response): void {
  res
    .status(401)
    .set("WWW-Authenticate", 'Basic realm="AVA Telefonsystem"')
    .send("Anmeldung erforderlich");
}

/** Auth prüfen und Fehlerantworten (401/429) direkt senden. */
function requireAuth(req: Request, res: Response): Exclude<Auth, null> | undefined {
  const auth = checkAuth(req);
  if (auth === "rate-limited") {
    res
      .status(429)
      .send("Zu viele fehlgeschlagene Anmeldeversuche. Bitte in 15 Minuten erneut versuchen.");
    return undefined;
  }
  if (!auth) {
    unauthorized(res);
    return undefined;
  }
  return auth;
}

/** Darf diese Auth diesen Tenant sehen? */
function canAccess(auth: Exclude<Auth, null>, tenantId: string): boolean {
  return auth.role === "admin" || auth.tenantId === tenantId;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtTime(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function fmtDuration(call: db.CallRow): string {
  let seconds = call.duration_s;
  if (seconds == null && call.ended_at) {
    seconds = Math.round(
      (new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) /
        1000,
    );
  }
  if (seconds == null) return "–";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")} min`;
}

function tenantLabel(id: string): string {
  return getTenantById(id)?.name ?? id;
}

function page(title: string, subtitle: string, body: string): string {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { --bg:#0f1115; --card:#181b22; --line:#2a2f3a; --text:#e8eaf0; --muted:#9aa3b2; --accent:#4f8cff; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background:var(--bg); color:var(--text); }
  header { padding:20px 28px; border-bottom:1px solid var(--line); display:flex; align-items:baseline; gap:14px; }
  header h1 { margin:0; font-size:20px; }
  header span { color:var(--muted); font-size:14px; }
  main { padding:24px 28px; max-width:1100px; margin:0 auto; }
  h2 { font-size:16px; margin:28px 0 10px; }
  table { width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  th, td { text-align:left; padding:9px 12px; font-size:14px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
  tr:last-child td { border-bottom:none; }
  a { color:var(--accent); text-decoration:none; }
  a:hover { text-decoration:underline; }
  .muted { color:var(--muted); }
  .pill { display:inline-block; padding:2px 8px; border-radius:99px; font-size:12px; border:1px solid var(--line); }
  .in  { color:#7dd3a0; } .out { color:#f0b458; }
  .bubble { padding:10px 14px; border-radius:10px; margin:8px 0; max-width:75%; white-space:pre-wrap; }
  .caller { background:#22304a; }
  .agent  { background:#1e242e; margin-left:auto; }
  .chat { display:flex; flex-direction:column; }
  .empty { color:var(--muted); padding:14px; background:var(--card); border:1px solid var(--line); border-radius:8px; }
  .btn { background:#232936; border:1px solid var(--line); color:var(--text); padding:4px 10px; border-radius:6px; cursor:pointer; font-size:13px; }
  .btn:hover { border-color:var(--accent); }
  form.inline { display:inline; margin-right:6px; }
  tr.done td { opacity:.45; }
  tr.done td:nth-child(2) { text-decoration:line-through; }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin:6px 0 10px; }
  .tile { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px 16px; }
  .tile b { display:block; font-size:26px; font-weight:700; line-height:1.2; }
  .tile span { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
  .tablewrap { overflow-x:auto; border-radius:8px; }
  footer { padding:26px 28px 34px; text-align:center; color:var(--muted); font-size:12px; }
  @media (max-width: 700px) { header, main { padding-left:16px; padding-right:16px; } th, td { padding:8px 8px; font-size:13px; } }
</style>
</head>
<body>
<header><h1>📞 ${escapeHtml(title)}</h1><span>${escapeHtml(subtitle)}</span></header>
<main>${body}</main>
<footer>AVA Empfang · Ihr KI-Telefonassistent · contact@ava-hq.com</footer>
</body>
</html>`;
}

/** Tabelle horizontal scrollbar machen (Mobil). */
function wrap(tableHtml: string): string {
  return `<div class="tablewrap">${tableHtml}</div>`;
}

/** Versteckter Rücksprung-Pfad für die Formulare (nur lokale Pfade). */
function backField(back: string): string {
  return `<input type="hidden" name="back" value="${escapeHtml(back)}">`;
}

function safeBack(raw: unknown): string {
  const s = String(raw ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

interface ListOptions {
  showTenant: boolean;
  back: string;
  callLinkPrefix?: string;
}

function renderLists(
  calls: db.CallRow[],
  callbacks: db.CallbackRow[],
  appointments: db.AppointmentRow[],
  o: ListOptions,
): string {
  const tenantTh = o.showTenant ? `<th>Kunde</th>` : "";
  const tenantTd = (id: string) =>
    o.showTenant
      ? `<td><a href="/t/${encodeURIComponent(id)}">${escapeHtml(tenantLabel(id))}</a></td>`
      : "";

  const callRows = calls
    .map(
      (c) => `<tr>
        <td>${fmtTime(c.started_at)}</td>
        ${tenantTd(c.tenant_id)}
        <td><span class="pill ${c.direction === "inbound" ? "in" : "out"}">${c.direction === "inbound" ? "eingehend" : "ausgehend"}</span></td>
        <td>${escapeHtml(c.from_number || "unterdrückt")}</td>
        <td>${fmtDuration(c)}</td>
        <td>${escapeHtml(c.summary ?? "")}<div class="muted"><a href="/call/${encodeURIComponent(c.call_sid)}">Transkript ansehen</a></div></td>
      </tr>`,
    )
    .join("");

  const cbRows = callbacks
    .map(
      (cb) => `<tr${cb.done ? ' class="done"' : ""}>
        <td>${fmtTime(cb.created_at)}</td>
        <td>${escapeHtml(cb.name)}</td>
        <td>${escapeHtml(cb.phone)}</td>
        <td>${escapeHtml(cb.topic)}</td>
        ${tenantTd(cb.tenant_id)}
        <td>${
          cb.done
            ? `<span class="muted">✓ erledigt</span>`
            : `<form class="inline" method="post" action="/callbacks/${cb.id}/done">${backField(o.back)}<button class="btn">✓ Erledigt</button></form>`
        }</td>
      </tr>`,
    )
    .join("");

  const apRows = appointments
    .map(
      (a) => `<tr>
        <td>${fmtTime(a.created_at)}</td>
        <td>${escapeHtml(a.name)}</td>
        <td>${escapeHtml(a.phone)}</td>
        <td>${escapeHtml(a.preferred_time)}</td>
        <td>${escapeHtml(a.topic)}</td>
        ${tenantTd(a.tenant_id)}
        <td>${escapeHtml(a.status)}</td>
        <td>${
          a.status === "angefragt"
            ? `<form class="inline" method="post" action="/appointments/${a.id}/status">${backField(o.back)}<button class="btn" name="status" value="bestätigt">✓ Bestätigen</button></form>` +
              `<form class="inline" method="post" action="/appointments/${a.id}/status">${backField(o.back)}<button class="btn" name="status" value="abgesagt">✕ Absagen</button></form>`
            : ""
        }</td>
      </tr>`,
    )
    .join("");

  return `
    <h2>Rückrufwünsche (${callbacks.filter((c) => !c.done).length} offen)</h2>
    ${
      callbacks.length
        ? wrap(`<table><tr><th>Zeit</th><th>Name</th><th>Telefon</th><th>Anliegen</th>${tenantTh}<th></th></tr>${cbRows}</table>`)
        : `<div class="empty">Noch keine Rückrufwünsche.</div>`
    }
    <h2>Terminanfragen (${appointments.filter((a) => a.status === "angefragt").length} offen)</h2>
    ${
      appointments.length
        ? wrap(`<table><tr><th>Zeit</th><th>Name</th><th>Telefon</th><th>Wunschzeit</th><th>Anliegen</th>${tenantTh}<th>Status</th><th></th></tr>${apRows}</table>`)
        : `<div class="empty">Noch keine Terminanfragen.</div>`
    }
    <h2>Anrufe (${calls.length})</h2>
    ${
      calls.length
        ? wrap(`<table><tr><th>Zeit</th>${tenantTh}<th>Richtung</th><th>Nummer</th><th>Dauer</th><th>Zusammenfassung</th></tr>${callRows}</table>`)
        : `<div class="empty">Noch keine Anrufe.</div>`
    }`;
}

/** Kennzahlen-Kacheln (laufender Monat) für ein Kunden-Dashboard. */
function statTiles(tenantId: string): string {
  const ym = new Date().toISOString().slice(0, 7);
  const s = db.monthlyStats(tenantId, ym);
  const label = new Date().toLocaleString("de-DE", { month: "long", year: "numeric" });
  return `
    <h2>Ihr Assistent im ${escapeHtml(label)}</h2>
    <div class="tiles">
      <div class="tile"><b>${s.calls}</b><span>Anrufe</span></div>
      <div class="tile"><b>${Math.round(s.totalSeconds / 60)}</b><span>Gesprächsminuten</span></div>
      <div class="tile"><b>${s.callbacks}</b><span>Rückrufwünsche</span></div>
      <div class="tile"><b>${s.appointments}</b><span>Terminanfragen</span></div>
    </div>`;
}

// ── Admin-Übersicht ───────────────────────────────────────────────────────────

dashboardRouter.get("/", (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role === "tenant") {
    // Kunden landen direkt auf ihrem eigenen Dashboard.
    res.redirect(`/t/${encodeURIComponent(auth.tenantId)}`);
    return;
  }

  const tenants = allTenants();
  const stats = new Map(db.tenantStats().map((s) => [s.tenant_id, s]));
  const tenantRows = tenants
    .map((t) => {
      const s = stats.get(t.id);
      return `<tr>
        <td><a href="/t/${encodeURIComponent(t.id)}">${escapeHtml(t.name)}</a> <span class="muted">(${escapeHtml(t.id)})</span></td>
        <td>${escapeHtml(t.phoneNumber ?? "–")}</td>
        <td>${t.active === false ? '<span class="muted">inaktiv</span>' : "aktiv"}</td>
        <td>${s?.calls ?? 0}</td>
        <td>${s?.open_callbacks ?? 0}</td>
        <td>${s?.open_appointments ?? 0}</td>
      </tr>`;
    })
    .join("");

  const body = `
    <h2>Kunden (${tenants.length})</h2>
    ${wrap(`<table><tr><th>Kunde</th><th>Rufnummer</th><th>Status</th><th>Anrufe</th><th>Offene Rückrufe</th><th>Offene Termine</th></tr>${tenantRows}</table>`)}
    ${renderLists(db.listCalls(), db.listCallbacks(), db.listAppointments(), {
      showTenant: true,
      back: "/",
    })}`;

  res.send(page("AVA Telefonsystem", "Alle Kunden · Anrufe, Rückrufe & Terminanfragen", body));
});

// ── Kunden-Dashboard ─────────────────────────────────────────────────────────

dashboardRouter.get("/t/:id", (req, res) => {
  const tenant: Tenant | undefined = getTenantById(String(req.params.id));
  if (!tenant) {
    res.status(404).send(page("Nicht gefunden", "", `<div class="empty">Unbekannter Kunde.</div>`));
    return;
  }
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (!canAccess(auth, tenant.id)) return unauthorized(res);

  const back = `/t/${encodeURIComponent(tenant.id)}`;
  const body =
    (auth.role === "admin"
      ? `<p><a href="/">&larr; Alle Kunden</a></p>`
      : "") +
    statTiles(tenant.id) +
    renderLists(
      db.listCalls(100, tenant.id),
      db.listCallbacks(100, tenant.id),
      db.listAppointments(100, tenant.id),
      { showTenant: false, back },
    );

  res.send(page(tenant.name, "Telefonassistent · Anrufe, Rückrufe & Terminanfragen", body));
});

// ── Aktionen ─────────────────────────────────────────────────────────────────

dashboardRouter.post("/callbacks/:id/done", rejectCrossSite, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  db.markCallbackDone(
    Number(req.params.id),
    auth.role === "tenant" ? auth.tenantId : undefined,
  );
  res.redirect(safeBack((req.body as Record<string, string>)?.back));
});

dashboardRouter.post("/appointments/:id/status", rejectCrossSite, (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const status = String((req.body as Record<string, string>)?.status ?? "");
  if (["bestätigt", "abgesagt"].includes(status)) {
    db.setAppointmentStatus(
      Number(req.params.id),
      status,
      auth.role === "tenant" ? auth.tenantId : undefined,
    );
  }
  res.redirect(safeBack((req.body as Record<string, string>)?.back));
});

// ── Transkript ───────────────────────────────────────────────────────────────

dashboardRouter.get("/call/:sid", (req, res) => {
  const call = db.getCall(String(req.params.sid));
  if (!call) {
    res.status(404).send(page("Nicht gefunden", "", `<div class="empty">Anruf nicht gefunden.</div>`));
    return;
  }
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (!canAccess(auth, call.tenant_id)) return unauthorized(res);

  const msgs = db.getMessages(call.call_sid);
  const chat = msgs
    .map(
      (m) =>
        `<div class="bubble ${m.role === "user" ? "caller" : "agent"}"><strong>${
          m.role === "user" ? "Anrufer" : "Assistent"
        }</strong><br>${escapeHtml(m.content)}</div>`,
    )
    .join("");

  const backHref = `/t/${encodeURIComponent(call.tenant_id)}`;
  const body = `
    <p><a href="${backHref}">&larr; Zurück zur Übersicht</a></p>
    <h2>Anruf von ${escapeHtml(call.from_number || "unterdrückt")} am ${fmtTime(call.started_at)} (${fmtDuration(call)})</h2>
    <p class="muted">Kunde: ${escapeHtml(tenantLabel(call.tenant_id))}</p>
    ${call.summary ? `<p class="muted">${escapeHtml(call.summary)}</p>` : ""}
    <div class="chat">${chat || `<div class="empty">Kein Transkript vorhanden.</div>`}</div>`;

  res.send(page("Transkript", tenantLabel(call.tenant_id), body));
});
