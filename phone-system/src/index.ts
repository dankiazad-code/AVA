import express, { type Request } from "express";
import { createServer } from "node:http";
import crypto from "node:crypto";
import { WebSocketServer } from "ws";
import twilio from "twilio";
import { config, wsRelayUrl } from "./config.js";
import { voiceTwiml, actionTwiml } from "./twiml.js";
import { handleRelayConnection } from "./relay.js";
import { dashboardRouter } from "./dashboard.js";
import { allTenants, getTenantById, resolveTenant } from "./tenants.js";
import * as db from "./db.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // hinter Reverse-Proxy: echte Client-IP + korrekte HTTPS-Erkennung
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/** Zeitkonstanter Vergleich zweier Geheimnisse (kein Timing-Orakel). */
function sicherGleich(a: string, b: string): boolean {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// Health-Check für Uptime-Monitoring, Load-Balancer und Docker HEALTHCHECK.
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    uptime_s: Math.round(process.uptime()),
    tenants: allTenants().filter((t) => t.active !== false).length,
  });
});

/** Prüft die X-Twilio-Signature, sofern Auth-Token + PUBLIC_URL gesetzt sind. */
function verifyTwilio(req: Request): boolean {
  if (
    !config.twilio.validateSignature ||
    !config.twilio.authToken ||
    !config.publicUrl
  ) {
    return true;
  }
  const signature = req.header("x-twilio-signature") ?? "";
  const url = config.publicUrl.replace(/\/+$/, "") + req.originalUrl;
  return twilio.validateRequest(
    config.twilio.authToken,
    signature,
    url,
    (req.body ?? {}) as Record<string, string>,
  );
}

// Twilio Voice-Webhook: liefert TwiML, das den Anruf mit /relay verbindet.
// Multi-Tenant: die angerufene Nummer (To) bestimmt den Kunden.
app.post("/voice", (req, res) => {
  if (!verifyTwilio(req)) {
    res.status(403).send("Ungültige Twilio-Signatur");
    return;
  }
  const body = req.body as Record<string, string>;
  const tenant = resolveTenant({ calledNumber: body.To });
  res.type("text/xml").send(voiceTwiml({ tenant }));
});

// Browser-Test nur, wenn ausdrücklich erlaubt (ALLOW_TEST_VOICE=true).
// Sonst deaktiviert – sonst würde das TwiML das Relay-Geheimnis öffentlich preisgeben.
if (process.env.ALLOW_TEST_VOICE === "true") {
  app.get("/voice", (req, res) => {
    const tenant = resolveTenant({ tenantId: String(req.query.tenant ?? "") });
    res.type("text/xml").send(voiceTwiml({ tenant }));
  });
}

// Wird von Twilio nach Ende der ConversationRelay-Sitzung aufgerufen.
// Bei handoffData {"type":"handoff"} wird der Anrufer zum Mitarbeiter des
// Tenants durchgestellt (?tenant=<id> aus dem TwiML), sonst wird aufgelegt.
app.post("/voice/action", (req, res) => {
  if (!verifyTwilio(req)) {
    res.status(403).send("Ungültige Twilio-Signatur");
    return;
  }
  const body = req.body as Record<string, string>;
  const tenant = resolveTenant({
    tenantId: String(req.query.tenant ?? ""),
    calledNumber: body.To,
  });
  let handoff = false;
  if (body.HandoffData) {
    try {
      handoff =
        (JSON.parse(body.HandoffData) as { type?: string }).type === "handoff";
    } catch {
      // ungültiges JSON → normal auflegen
    }
  }
  res.type("text/xml").send(actionTwiml(handoff, tenant));
});

// Status-Callback von Twilio (Dauer, Endstatus).
app.post("/voice/status", (req, res) => {
  if (!verifyTwilio(req)) {
    res.status(403).send("Ungültige Twilio-Signatur");
    return;
  }
  const body = req.body as Record<string, string>;
  if (body.CallSid) {
    db.updateCallStatus(
      body.CallSid,
      body.CallStatus ?? "completed",
      body.CallDuration ? Number(body.CallDuration) : undefined,
    );
  }
  res.sendStatus(204);
});

// Ausgehenden Anruf starten (z. B. Terminerinnerung an Bestandskunden).
// POST /api/calls  Header: x-api-key: <API_SECRET>
// Body: { "to": "+49...", "task": "Erinnere Herrn X an den Termin", "tenant": "fahrschule-heinzelmann" }
// Ohne "tenant" ruft AVA selbst an; mit "tenant" wird dessen Nummer und Prompt genutzt.
app.post("/api/calls", async (req, res) => {
  if (!config.apiSecret || !sicherGleich(req.header("x-api-key") ?? "", config.apiSecret)) {
    res.status(401).json({ error: "Nicht autorisiert (x-api-key fehlt/falsch oder API_SECRET nicht gesetzt)" });
    return;
  }
  const { to, task, tenant: tenantId } = (req.body ?? {}) as {
    to?: string;
    task?: string;
    tenant?: string;
  };
  if (!to || !/^\+[1-9]\d{6,14}$/.test(to)) {
    res.status(400).json({ error: "Feld 'to' fehlt oder ist keine gültige E.164-Nummer (z. B. +49123456789)" });
    return;
  }
  if (tenantId && !getTenantById(tenantId)) {
    res.status(400).json({ error: `Unbekannter Tenant: ${tenantId}` });
    return;
  }
  const tenant = resolveTenant({ tenantId });
  const { accountSid, authToken } = config.twilio;
  const fromNumber = tenant.phoneNumber ?? config.twilio.phoneNumber;
  if (!accountSid || !authToken || !fromNumber) {
    res.status(500).json({ error: "Twilio ist nicht konfiguriert (oder Tenant hat keine Rufnummer)" });
    return;
  }
  try {
    const client = twilio(accountSid, authToken);
    const call = await client.calls.create({
      to,
      from: fromNumber,
      twiml: voiceTwiml({ tenant, task }),
      statusCallback: config.publicUrl
        ? config.publicUrl.replace(/\/+$/, "") + "/voice/status"
        : undefined,
    });
    res.json({ callSid: call.sid, status: call.status, tenant: tenant.id });
  } catch (err) {
    console.error("[api] Outbound-Anruf fehlgeschlagen:", err);
    res.status(502).json({ error: "Anruf konnte nicht gestartet werden." });
  }
});

// Web-Dashboard (Admin-Übersicht + Kunden-Dashboards unter /t/<id>).
app.use(dashboardRouter);

const server = createServer(app);

// ConversationRelay-WebSocket – nur mit gültigem Geheim-Token (?t=...) aus dem TwiML.
// Verhindert, dass sich Unbefugte direkt einklinken (Kostenschutz + Fremd-Tenant-Missbrauch).
const wss = new WebSocketServer({
  server,
  path: "/relay",
  verifyClient: (info, cb) => {
    try {
      const url = new URL(info.req.url ?? "", "http://localhost");
      if (sicherGleich(url.searchParams.get("t") ?? "", config.relaySecret)) return cb(true);
    } catch { /* fällt unten durch */ }
    console.warn("[relay] Verbindung ohne gültiges Token abgelehnt");
    cb(false, 401, "Unauthorized");
  },
});
wss.on("connection", handleRelayConnection);

server.listen(config.port, () => {
  const tenants = allTenants();
  console.log(`AVA Telefonsystem läuft auf Port ${config.port}`);
  console.log(`  Dashboard:      http://localhost:${config.port}/`);
  console.log(`  Voice-Webhook:  ${config.publicUrl ? config.publicUrl.replace(/\/+$/, "") + "/voice" : "(PUBLIC_URL nicht gesetzt)"}`);
  console.log(`  Relay-WebSocket: ${wsRelayUrl() ?? "(PUBLIC_URL nicht gesetzt)"}`);
  console.log(
    `  Tenants (${tenants.length}): ` +
      tenants
        .map((t) => `${t.id}${t.phoneNumber ? ` (${t.phoneNumber})` : ""}`)
        .join(", "),
  );
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("  Hinweis: ANTHROPIC_API_KEY ist nicht gesetzt – Gespräche funktionieren erst mit API-Key.");
  }
  if (!config.dashboardPassword) {
    console.warn("  ⚠ SICHERHEIT: DASHBOARD_PASSWORD ist nicht gesetzt – das Dashboard ist GESPERRT, bis ein Passwort gesetzt wird.");
  }
  if (config.twilio.validateSignature && (!config.twilio.authToken || !config.publicUrl)) {
    console.warn("  ⚠ SICHERHEIT: Twilio-Signaturprüfung ist aktiv, aber TWILIO_AUTH_TOKEN/PUBLIC_URL fehlt – Webhooks können derzeit NICHT verifiziert werden. Vor Live-Gang setzen!");
  }
});

// Sauberes Herunterfahren (Deploy/Neustart): keine neuen Verbindungen mehr
// annehmen, laufende Anrufe bekommen kurz Zeit, dann Prozess beenden.
let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} empfangen – fahre herunter …`);
  server.close(() => process.exit(0));
  for (const client of wss.clients) client.close(1001, "Server wird neu gestartet");
  // Notbremse, falls Verbindungen nicht rechtzeitig schließen.
  setTimeout(() => process.exit(0), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
