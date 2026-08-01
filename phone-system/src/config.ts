import "dotenv/config";
import crypto from "node:crypto";

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

// Geheim-Token für den Relay-WebSocket. Aus der Umgebung (RELAY_SECRET) oder
// sonst einmalig pro Start erzeugt. Twilio holt sich das TwiML unmittelbar vor
// jedem Anruf frisch, daher ist ein Neustart-Token unkritisch – es verhindert,
// dass sich Unbefugte direkt mit /relay verbinden (Kostenschutz + Datenschutz).
const relaySecret = optional("RELAY_SECRET") ?? crypto.randomBytes(24).toString("hex");

export const config = {
  port: Number(process.env.PORT ?? 3100),
  publicUrl: optional("PUBLIC_URL"),
  claudeModel: process.env.CLAUDE_MODEL?.trim() || "claude-opus-4-8",
  claudeEffort: (process.env.CLAUDE_EFFORT?.trim() || "low") as
    | "low"
    | "medium"
    | "high",
  twilio: {
    accountSid: optional("TWILIO_ACCOUNT_SID"),
    authToken: optional("TWILIO_AUTH_TOKEN"),
    phoneNumber: optional("TWILIO_PHONE_NUMBER"),
    validateSignature: process.env.TWILIO_VALIDATE_SIGNATURE !== "false",
  },
  relay: {
    language: process.env.RELAY_LANGUAGE?.trim() || "de-DE",
    ttsProvider: optional("RELAY_TTS_PROVIDER"),
    ttsVoice: optional("RELAY_TTS_VOICE"),
    transcriptionProvider: optional("RELAY_STT_PROVIDER"),
    welcomeGreeting:
      process.env.WELCOME_GREETING?.trim() ||
      "Herzlich willkommen bei AVA. Was kann ich für Sie tun?",
  },
  dashboardPassword: optional("DASHBOARD_PASSWORD"),
  apiSecret: optional("API_SECRET"),
  relaySecret,
  dbPath: process.env.DB_PATH?.trim() || "data/phone.db",
  /** Kostenschutz: maximale Anzahl Anrufer-Äußerungen pro Gespräch, danach
   *  verabschiedet sich der Assistent höflich (Schutz vor Endlos-/Scherzanrufen). */
  maxTurnsPerCall: Number(process.env.MAX_TURNS_PER_CALL ?? 40),
  /** Nummer eines echten Mitarbeiters für die Weiterleitung (leer = Feature aus). */
  forwardPhoneNumber: optional("FORWARD_PHONE_NUMBER"),
  /** E-Mail-Benachrichtigungen bei neuen Rückrufen/Terminen (via Resend). */
  notify: {
    to: optional("NOTIFY_EMAIL_TO"),
    resendApiKey: optional("RESEND_API_KEY"),
    from:
      process.env.MAIL_FROM?.trim() ||
      "AVA Telefonsystem <onboarding@resend.dev>",
  },
};

/** WebSocket-URL für Twilio ConversationRelay inkl. Geheim-Token, abgeleitet aus PUBLIC_URL. */
export function wsRelayUrl(): string | undefined {
  if (!config.publicUrl) return undefined;
  return (
    config.publicUrl.replace(/^http/, "ws").replace(/\/+$/, "") +
    "/relay?t=" + encodeURIComponent(config.relaySecret)
  );
}
