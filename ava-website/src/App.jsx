import { useState, useEffect, useRef, lazy, Suspense } from "react";
import "./App.css";

const ROICalc      = lazy(() => import("./components/ROICalc.jsx"));
const CalendlyEmbed = lazy(() => import("./components/CalendlyEmbed.jsx"));

const ASSISTANT_ID = "75d1fe79-eb98-48e0-97dc-f917f5610725";
const VAPI_KEY    = "11a16c26-443f-4159-a318-204ec041741b";

/* ── Google Analytics event helper ── */
function track(event, params = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, params);
  }
}

let vapiInstance = null;
let vapiLoadPromise = null;
function loadVapi() {
  if (!vapiLoadPromise) {
    vapiLoadPromise = import("@vapi-ai/web").then(m => {
      const Vapi = m.default?.default ?? m.default ?? m.Vapi ?? m;
      vapiInstance = new Vapi(VAPI_KEY);
      return vapiInstance;
    });
  }
  return vapiLoadPromise;
}

/* ── Scroll reveal ── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("ava-reveal--in"); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── SVG Icons ── */
const Icon = {
  mic:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  globe:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  link:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  zap:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  building: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M16 11h.01"/></svg>,
  shield:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

/* ── Vapi Call Button ── */
function VapiCallButton({ size = "md" }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | active
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const onStart = () => { if (mountedRef.current) setStatus("active"); track("vapi_call_start", { source: "web" }); };
    const onEnd   = () => { if (mountedRef.current) setStatus("idle"); };
    const onErr   = (e) => { console.error("Vapi error:", e); if (mountedRef.current) setStatus("idle"); };

    loadVapi().then(v => {
      if (!mountedRef.current) return;
      v.on("call-start", onStart);
      v.on("call-end",   onEnd);
      v.on("error",      onErr);
    }).catch(err => console.error("Vapi load failed:", err));

    return () => { mountedRef.current = false; };
  }, []);

  function toggle() {
    if (status === "connecting") return;
    if (status === "active") {
      loadVapi().then(v => v.stop());
      setStatus("idle");
    } else {
      setStatus("connecting");
      loadVapi().then(v => v.start(ASSISTANT_ID)).catch(err => {
        console.error("Vapi start failed:", err);
        setStatus("idle");
      });
    }
  }

  return (
    <button onClick={toggle} className={`ava-vapi ava-vapi--${status} ava-vapi--${size}`}>
      <span className="ava-vapi__dot" />
      <span className="ava-vapi__label">
        {status === "idle"       && "AVA jetzt anrufen"}
        {status === "connecting" && "Verbinde…"}
        {status === "active"     && "Gespräch beenden"}
      </span>
      <span className="ava-vapi__wave">
        {[0,1,2,3,4].map(i => <span key={i} style={{ animationDelay: `${i * 0.1}s` }} />)}
      </span>
    </button>
  );
}

/* ── Gradient Mesh ── */
function GradientMesh() {
  return (
    <div className="ava-mesh" aria-hidden="true">
      <div className="ava-mesh__blob ava-mesh__blob--1" />
      <div className="ava-mesh__blob ava-mesh__blob--2" />
      <div className="ava-mesh__blob ava-mesh__blob--3" />
    </div>
  );
}

/* ── Magnetic Button ── */
function MagBtn({ children, href, className, target, rel, style }) {
  const ref = useRef(null);
  function onMove(e) {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.25;
    ref.current.style.transform = `translate(${x}px,${y}px)`;
  }
  function onLeave() { ref.current.style.transform = ''; }
  return (
    <a ref={ref} href={href} className={className} target={target} rel={rel}
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)', ...style }}>
      {children}
    </a>
  );
}

/* ── Count-up animation ── */
function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !startedRef.current) {
        startedRef.current = true;
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCount(Math.round(ease * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return [count, ref];
}

/* ── Typewriter ── */
function Typewriter({ words }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [del, setDel] = useState(false);
  const mountedRef = useRef(true);
  const t = useRef(null);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; clearTimeout(t.current); }; }, []);
  useEffect(() => {
    const word = words[idx];
    if (!del) {
      if (text.length < word.length) {
        t.current = setTimeout(() => { if (mountedRef.current) setText(word.slice(0, text.length + 1)); }, 75);
      } else {
        t.current = setTimeout(() => { if (mountedRef.current) setDel(true); }, 2200);
      }
    } else {
      if (text.length > 0) {
        t.current = setTimeout(() => { if (mountedRef.current) setText(text.slice(0, -1)); }, 38);
      } else { setDel(false); setIdx((idx + 1) % words.length); }
    }
  }, [text, del, idx, words]);
  return <span className="ava-typewriter">{text}<span className="ava-typewriter__cursor">|</span></span>;
}

/* ── Particle canvas ── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,120,255,${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="ava-hero__canvas" style={{ width: "100%", height: "100%" }} />;
}

/* ── AVA Wordmark Logo ── */
function AVALogo({ height = 52 }) {
  return (
    <img src="/ava-icon.png" alt="AVA" height={height} width={height}
      style={{ display: 'block', borderRadius: '11px' }} />
  );
}

/* ── Live call demo ── */
const SCRIPT = [
  { role: "ava", text: "Malerbetrieb Weber, guten Tag! Wie kann ich Ihnen helfen?" },
  { role: "caller", text: "Ich bräuchte ein Angebot – wir wollen das Wohnzimmer streichen lassen." },
  { role: "ava", text: "Gerne! Wie groß ist der Raum ungefähr, und bis wann soll es fertig sein?" },
  { role: "caller", text: "Etwa 25 Quadratmeter, am besten noch diesen Monat." },
  { role: "ava", text: "Notiert. Herr Weber ruft Sie heute noch zurück – Ihre Anfrage ist bereits bei ihm im Postfach." },
];

function CallDemo() {
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [lines, setLines] = useState([]);
  const [typing, setTyping] = useState(false);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  function start() {
    clearTimeout(timerRef.current);
    setLines([]);
    setTyping(false);
    setPhase("running");
    let idx = 0;
    function step() {
      if (!mountedRef.current) return;
      if (idx >= SCRIPT.length) { setTyping(false); setPhase("done"); return; }
      setTyping(true);
      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        const entry = SCRIPT[idx];
        idx++;
        setLines(prev => [...prev, entry]);
        setTyping(false);
        timerRef.current = setTimeout(step, 750);
      }, idx === 0 ? 400 : 950);
    }
    step();
  }

  if (phase === "idle") {
    return (
      <button className="ava-call__trigger" onClick={start}>
        <span className="ava-call__trigger-icon">📞</span>
        <span>
          <strong>AVA live erleben — echtes Gespräch</strong>
          <em>Klicken um KI-Voice-Agent in Aktion zu sehen</em>
        </span>
        <span className="ava-call__trigger-arrow">▶</span>
      </button>
    );
  }

  return (
    <div className="ava-call__window">
      <div className="ava-call__header">
        <span className="ava-call__header-dot ava-call__header-dot--green" />
        <span className="ava-call__header-label">AVA · Beispiel-Gespräch · Malerbetrieb</span>
        <div className="ava-call__waveform">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="ava-call__waveform-bar" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      </div>
      <div className="ava-call__transcript">
        {lines.map((l, i) => (
          <div key={i} className={`ava-call__line ava-call__line--${l.role}`}>
            <span className="ava-call__speaker">{l.role === "ava" ? "AVA" : "Anrufer"}</span>
            <span className="ava-call__text">{l.text}</span>
          </div>
        ))}
        {typing && (
          <div className="ava-call__line ava-call__line--ava">
            <span className="ava-call__speaker">AVA</span>
            <span className="ava-call__text"><span className="ava-call__cursor" /></span>
          </div>
        )}
        {phase === "done" && (
          <div className="ava-call__done">
            <span className="ava-call__done-icon">✓</span>
            Buchung bestätigt · Kein Mensch benötigt
            <button onClick={start} style={{ marginLeft: '12px', background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '6px', padding: '2px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>↺ Nochmal</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── FAQ ── */
const FAQS = [
  { q: "Was kostet mich der Einstieg?", a: "Das Erstgespräch ist kostenlos und unverbindlich. Danach wissen Sie genau, was Ihr Projekt kostet: Websites ab 699 € einmalig, der Telefonassistent ab 149 €/Monat, Company OS ab 99 €/Monat. Abos sind monatlich kündbar." },
  { q: "Wie schnell bin ich startklar?", a: "Websites und Telefonassistent sind in der Regel innerhalb einer Woche einsatzbereit, Company OS oft am selben Tag. Wir übernehmen die Einrichtung – Sie liefern nur Ihre Informationen." },
  { q: "Brauche ich technisches Wissen?", a: "Nein. Wir richten alles ein und erklären es verständlich. Danach genügt es, E-Mails lesen zu können – den Rest erledigen die Systeme." },
  { q: "Gibt es einen Langzeitvertrag?", a: "Nein. Unsere Abos laufen monatlich kündbar. Wir verdienen Ihr Vertrauen jeden Monat neu – durch Ergebnisse, nicht durch Vertragsbindung." },
  { q: "Wie werden Datenschutz und DSGVO gehandhabt?", a: "Ihre Daten werden auf Servern in Deutschland bzw. der EU verarbeitet, Verbindungen sind verschlüsselt, und Sie erhalten von uns einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO." },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <div className="ava-faq">
      {FAQS.map((f, i) => (
        <div key={i} className="ava-faq__item">
          <button className="ava-faq__q" onClick={() => setOpen(open === i ? null : i)}>
            {f.q}
            <span className="ava-faq__icon">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <div className="ava-faq__a">{f.a}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Animated stat card ── */
function StatCard({ target, prefix, suffix, desc }) {
  const [count, ref] = useCountUp(target);
  return (
    <div ref={ref} className="ava-problem__card">
      <div className="ava-problem__stat">{prefix}{count}{suffix}</div>
      <p className="ava-problem__desc">{desc}</p>
    </div>
  );
}


/* ── Produkte & Preise ── */
const PLANS = [
  {
    tier: "Premium Website",
    price: "ab 699 €",
    period: " einmalig",
    sub: "Ihr Auftritt, der Kunden gewinnt",
    popular: false,
    href: "/website-erstellen-lassen-freudenstadt.html",
    features: [
      "Design, Texte & Aufbau komplett von uns",
      "Mobil-optimiert und blitzschnell",
      "Kontakt, Anfahrt & Google-Auffindbarkeit",
      "Impressum & Datenschutz inklusive",
      "Auf Wunsch: Pflege & Hosting",
    ],
    cta: "Mehr zur Website",
  },
  {
    tier: "KI-Telefonassistent",
    price: "ab 149 €",
    period: "/Monat",
    sub: "Nie wieder einen Anruf verpassen",
    popular: true,
    href: "/ki-telefonassistent-freudenstadt.html",
    features: [
      "Nimmt jeden Anruf an — 24/7, auf Deutsch",
      "Erfasst Rückrufwünsche & Terminanfragen",
      "Sofortige Benachrichtigung per E-Mail",
      "Einrichtung einmalig ab 99 €",
      "Monatlich kündbar",
    ],
    cta: "Mehr zum Telefonassistenten",
  },
  {
    tier: "Company OS",
    price: "ab 99 €",
    period: "/Monat",
    sub: "Ihre Firma läuft automatisch",
    popular: false,
    href: "/company-os.html",
    features: [
      "Über 90 Abläufe: Rechnungen, Mahnungen, Anfragen",
      "Antwortet Kunden in Sekunden — automatisch",
      "Ihr eigenes E-Mail-Postfach angebunden",
      "Server in Deutschland, 2FA, tägliche Backups",
      "Monatlich kündbar",
    ],
    cta: "Mehr zu Company OS",
  },
];

/* ── Contact Form (Netlify Forms) ── */
function encodeForm(data) {
  return Object.keys(data)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&");
}

function ContactForm() {
  const [state, setState] = useState({ name: "", email: "", unternehmen: "", telefon: "", nachricht: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [bot, setBot] = useState("");

  function update(e) { setState(s => ({ ...s, [e.target.name]: e.target.value })); }

  function submit(e) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeForm({ "form-name": "kontakt", "bot-field": bot, ...state }),
    })
      .then(res => { if (!res.ok) throw new Error(res.status); setStatus("success"); track("generate_lead", { form: "kontakt" }); })
      .catch(() => setStatus("error"));
  }

  if (status === "success") {
    return (
      <div className="ava-contact__success">
        <span className="ava-contact__success-icon">✓</span>
        <h3>Nachricht gesendet!</h3>
        <p>Danke{state.name ? `, ${state.name}` : ""}. Wir melden uns innerhalb von 24 Stunden bei Ihnen.</p>
      </div>
    );
  }

  return (
    <form name="kontakt" className="ava-contact__form" onSubmit={submit} data-netlify="true" netlify-honeypot="bot-field">
      <input type="hidden" name="form-name" value="kontakt" />
      <p className="ava-form__hp" aria-hidden="true">
        <label>Bitte nicht ausfüllen: <input name="bot-field" tabIndex={-1} autoComplete="off" value={bot} onChange={e => setBot(e.target.value)} /></label>
      </p>
      <div className="ava-form__row">
        <div className="ava-form__group">
          <label htmlFor="cf-name">Name *</label>
          <input id="cf-name" name="name" required value={state.name} onChange={update} placeholder="Max Mustermann" />
        </div>
        <div className="ava-form__group">
          <label htmlFor="cf-email">E-Mail *</label>
          <input id="cf-email" type="email" name="email" required value={state.email} onChange={update} placeholder="max@ihr-betrieb.de" />
        </div>
      </div>
      <div className="ava-form__row">
        <div className="ava-form__group">
          <label htmlFor="cf-unternehmen">Unternehmen</label>
          <input id="cf-unternehmen" name="unternehmen" value={state.unternehmen} onChange={update} placeholder="Ihr Betrieb" />
        </div>
        <div className="ava-form__group">
          <label htmlFor="cf-telefon">Telefon</label>
          <input id="cf-telefon" type="tel" name="telefon" value={state.telefon} onChange={update} placeholder="+49 …" />
        </div>
      </div>
      <div className="ava-form__group">
        <label htmlFor="cf-nachricht">Nachricht *</label>
        <textarea id="cf-nachricht" name="nachricht" rows={4} required value={state.nachricht} onChange={update} placeholder="Worum geht es? Erzählen Sie uns kurz von Ihrem Vorhaben." />
      </div>
      {status === "error" && (
        <p className="ava-form__error">Etwas ist schiefgelaufen. Bitte erneut versuchen oder direkt an <a href="mailto:contact@ava-hq.com">contact@ava-hq.com</a> schreiben.</p>
      )}
      <button type="submit" className="ava-btn ava-btn--primary ava-btn--lg" disabled={status === "sending"}
        style={{ width: "100%", justifyContent: "center" }}>
        {status === "sending" ? "Wird gesendet…" : "Nachricht senden"}
        {status !== "sending" && <span className="ava-btn__arrow">→</span>}
      </button>
      <p className="ava-form__note">Mit dem Absenden stimmen Sie unserer <a href="/datenschutz.html">Datenschutzerklärung</a> zu.</p>
    </form>
  );
}

/* ════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════ */
export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Calendly booking → GA conversion event
  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin.includes("calendly.com") && e.data?.event === "calendly.event_scheduled") {
        track("calendly_booking", { source: "calendly" });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(),
        r4 = useReveal(), r5 = useReveal(), r6 = useReveal(),
        r7 = useReveal(), r8 = useReveal(), r9 = useReveal(),
        r10 = useReveal(), r11 = useReveal(), rP = useReveal();

  return (
    <div className="app">
      <a href="#main-content" className="ava-skip-link">Zum Inhalt springen</a>

      {/* ── NAV ── */}
      <nav className={`ava-nav${scrolled ? " ava-nav--scrolled" : ""}`}>
        <div className="ava-nav__inner">
          <a href="#" className="ava-nav__logo">
            <AVALogo size={28} />
          </a>
          <ul className="ava-nav__links">
            <li><a href="#why">Warum AVA</a></li>
            <li><a href="#services">Produkte &amp; Preise</a></li>
            <li><a href="#roi">ROI</a></li>
            <li><a href="#ueber">Über uns</a></li>
            <li><a href="#contact">Kontakt</a></li>
          </ul>
          <a href="https://calendly.com/dankiazad/30min" target="_blank" rel="noreferrer" className="ava-btn ava-btn--nav">
            Termin buchen
          </a>
          <button className="ava-nav__burger" aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="ava-nav__mobile">
            {[["#why","Warum AVA"],["#services","Produkte & Preise"],["#roi","ROI"],["#ueber","Über uns"],["#contact","Kontakt"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="ava-hero" id="main-content" aria-label="Hero">
        <GradientMesh />
        <div className="ava-hero__orb" />
        <div className="ava-hero__glow" />
        <div className="ava-hero__grid-bg" />
        <div className="ava-hero__scan" />

        <div className="ava-container">
          <div className="ava-hero__badge">
            <span className="ava-hero__badge-dot" />
            Digitalagentur · Freudenstadt
          </div>

          <h1 className="ava-hero__h1">
            <span className="ava-hero__h1-light">Wir bauen</span>
            <span className="ava-hero__h1-bold"><Typewriter words={["Websites.", "KI-Telefonassistenten.", "Company OS.", "Ihre Zukunft."]} /></span>
          </h1>

          <p className="ava-hero__sub">
            Drei Produkte, ein Versprechen: Ihre Firma gewinnt Kunden und spart Zeit —
            während Sie Ihre eigentliche Arbeit machen.
          </p>

          <div className="ava-hero__actions">
            <MagBtn href="#services" className="ava-btn ava-btn--primary ava-btn--lg">
              Produkte &amp; Preise
              <span className="ava-btn__arrow">→</span>
            </MagBtn>
            <MagBtn href="https://calendly.com/dankiazad/30min" target="_blank" rel="noreferrer"
              className="ava-btn ava-btn--ghost ava-btn--lg">
              Kostenloses Erstgespräch
            </MagBtn>
          </div>

          <div className="ava-hero__scroll">
            <div className="ava-hero__scroll-line" />
            Scroll
          </div>
        </div>
      </section>

      {/* ── WHY AVA ── */}
      <section className="ava-section" id="why">
        <div className="ava-container">
          <div ref={r1} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">Warum AVA</p>
            <h2 className="ava-h2">
              Gebaut für den Mittelstand.<br />
              <em>Ergebnisse, keine Versprechen.</em>
            </h2>
            <p className="ava-body" style={{ margin: "0 auto 0", maxWidth: "560px" }}>
              Jeder Anruf, jede Anfrage, jede Rechnung zählt. AVA stellt sicher, dass nichts verloren geht.
            </p>
          </div>

          <div className="ava-why__grid" style={{ marginTop: "4rem" }}>
            {[
              { num: "01", icon: "📈", title: "Mehr Aufträge", body: "Anfragen, die sonst verloren gehen, werden erfasst und beantwortet. Kein Anruf bleibt unbeantwortet." },
              { num: "02", icon: "⚡", title: "Sofortige Antworten", body: "Ihre Kunden erhalten in Sekunden eine Antwort — rund um die Uhr, auch nachts und an Feiertagen." },
              { num: "03", icon: "🤖", title: "Weniger Papierkram", body: "Rechnungen, Mahnungen und Formulare laufen automatisch. Ihr Team hat den Kopf frei fürs Wesentliche." },
              { num: "04", icon: "🇩🇪", title: "Vor Ort & erreichbar", body: "Eine Agentur aus Freudenstadt, ein Ansprechpartner, Server in Deutschland. Kein anonymer Support." },
            ].map(({ num, icon, title, body }) => (
              <div key={title} className="ava-why__card">
                <span className="ava-why__num">{num}</span>
                <span className="ava-why__icon">{icon}</span>
                <h3 className="ava-why__title">{title}</h3>
                <p className="ava-why__body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUKTE & PREISE ── */}
      <section className="ava-section ava-section--dark" id="services">
        <span id="pricing" />
        <div className="ava-container">
          <div ref={r2} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">Produkte &amp; Preise</p>
            <h2 className="ava-h2">
              Drei Produkte.<br />
              <em>Klare Preise.</em>
            </h2>
            <p className="ava-body" style={{ margin: "0 auto 0", maxWidth: "540px" }}>
              Sie sehen sofort, was Sie bekommen und was es kostet. Keine versteckten Kosten, monatlich kündbar.
            </p>
          </div>

          <div className="ava-pricing__grid">
            {PLANS.map(plan => (
              <div key={plan.tier} className={`ava-pricing__card${plan.popular ? " ava-pricing__card--popular" : ""}`}>
                {plan.popular && <div className="ava-pricing__badge">⭐ Meistgewählt</div>}
                <div className="ava-pricing__tier">{plan.tier}</div>
                <div className="ava-pricing__price">
                  {plan.price}
                  {plan.period && <span>{plan.period}</span>}
                </div>
                <div className="ava-pricing__sub">{plan.sub}</div>
                <div className="ava-pricing__divider" />
                <ul className="ava-pricing__features">
                  {plan.features.map(f => (
                    <li key={f} className="ava-pricing__feature">
                      <span className="ava-pricing__check">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="ava-pricing__cta">
                  <a
                    href={plan.href}
                    className={`ava-btn ava-btn--lg ${plan.popular ? "ava-btn--primary" : "ava-btn--ghost"}`}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="ava-section" id="solution">
        <div className="ava-container">
          <div className="ava-solution__split">
            <div ref={r3} className="ava-reveal ava-solution__copy">
              <p className="ava-eyebrow">Live erleben</p>
              <h2 className="ava-h2">
                AVA nimmt jeden Anruf an.<br />
                <em>Sofort. Freundlich. 24/7.</em>
              </h2>
              <p className="ava-body">
                Ihr KI-Telefonassistent nimmt Anrufe an, beantwortet Fragen zu Ihrem
                Betrieb und erfasst Rückrufwünsche und Terminanfragen — in natürlichem
                Deutsch, vollkommen automatisch.
              </p>
              <p className="ava-body">
                Keine Warteschleife. Kein Anrufbeantworter, auf den niemand spricht.
                Probieren Sie es aus — rufen Sie AVA direkt hier im Browser an.
              </p>
              <a href="/ki-telefonassistent-freudenstadt.html" className="ava-btn ava-btn--primary" style={{ marginTop: "0.5rem" }}>
                Mehr zum Telefonassistenten →
              </a>
              <div style={{ marginTop: "1.75rem" }}>
                <VapiCallButton size="md" />
                <p style={{ fontSize: "0.78rem", color: "var(--gray-2)", marginTop: "0.6rem" }}>
                  Live-Demo direkt im Browser — sprechen Sie mit AVA.
                </p>
              </div>
            </div>

            <div ref={r4} className="ava-reveal ava-solution__visual">
              <div className="ava-phone">
                <div className="ava-phone__notch" />
                <div className="ava-phone__screen">
                  <div className="ava-phone__call-ui">
                    <span className="ava-phone__caller">Eingehender Anruf</span>
                    <span className="ava-phone__hotel">+43 1 2345 6789</span>
                    <div className="ava-phone__ava-ring">
                      <div className="ava-phone__ring ava-phone__ring--1" />
                      <div className="ava-phone__ring ava-phone__ring--2" />
                      <div className="ava-phone__ring ava-phone__ring--3" />
                      <div className="ava-phone__ava-icon">AVA</div>
                    </div>
                    <span className="ava-phone__status">● Verbunden</span>
                    <div className="ava-phone__waveform">
                      {Array.from({ length: 14 }, (_, i) => (
                        <div key={i} className="ava-phone__bar"
                          style={{ animationDelay: `${(i * 0.07).toFixed(2)}s`, animationDuration: `${0.6 + (i % 4) * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ava-solution__stats">
                {[
                  { value: "< 1s", label: "Reaktionszeit", sub: "Sofortige Annahme" },
                  { value: "24/7", label: "Verfügbarkeit", sub: "Auch nachts & feiertags" },
                  { value: "DE", label: "Natürliches Deutsch", sub: "Weitere Sprachen möglich" },
                  { value: "DSGVO", label: "Datenschutz", sub: "EU-Server, AV-Vertrag" },
                ].map(({ value, label, sub }) => (
                  <div key={label} className="ava-solution__metric">
                    <div className="ava-solution__metric-value">{value}</div>
                    <div className="ava-solution__metric-label">{label}</div>
                    <div className="ava-solution__metric-sub">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ── */}
      <section className="ava-section ava-section--dark" id="roi">
        <div className="ava-container">
          <div ref={r7} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">ROI-Rechner</p>
            <h2 className="ava-h2">Sehen Sie Ihre <em>genaue Ersparnis</em><br />bevor Sie sich entscheiden.</h2>
            <p className="ava-body" style={{ margin: "0 auto 3rem", maxWidth: "480px" }}>
              Bewegen Sie die Regler auf Ihre Situation. AVA amortisiert sich bereits in der ersten Woche.
            </p>
          </div>
          <div ref={r8} className="ava-reveal">
            <Suspense fallback={<div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-2)" }}>Lädt…</div>}>
              <ROICalc />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── NEXT STEPS ── */}
      <section className="ava-section">
        <div className="ava-container">
          <div ref={r9} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">So läuft es ab</p>
            <h2 className="ava-h2">Vom ersten Gespräch <em>zum fertigen System.</em></h2>
          </div>
          <div className="ava-steps__grid">
            {[
              { num: "01", title: "Kostenloses Erstgespräch", body: "30 Minuten: Wir hören zu und zeigen, was für Ihren Betrieb sinnvoll ist — ehrlich, ohne Verkaufsdruck." },
              { num: "02", title: "Klares Angebot", body: "Sie bekommen einen festen Preis und wissen genau, was Sie erhalten. Keine Überraschungen." },
              { num: "03", title: "Wir bauen", body: "Website, Telefonassistent oder Company OS — wir richten alles ein, Sie liefern nur Ihre Infos." },
              { num: "04", title: "Live & betreut", body: "In wenigen Tagen einsatzbereit. Danach sind wir weiter erreichbar — ein Ansprechpartner, vor Ort." },
            ].map(({ num, title, body }) => (
              <div key={num} className="ava-step">
                <div className="ava-step__num">{num}</div>
                <div className="ava-step__title">{title}</div>
                <p className="ava-step__body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÜBER AVA ── */}
      <section className="ava-section" id="ueber">
        <div className="ava-container" style={{ maxWidth: "760px", textAlign: "center" }}>
          <div ref={rP} className="ava-reveal">
            <p className="ava-eyebrow">Über AVA</p>
            <h2 className="ava-h2">Eine Agentur.<br /><em>Ein Anspruch.</em></h2>
            <p className="ava-body" style={{ margin: "1.5rem auto 0" }}>
              AVA ist eine Digitalagentur aus Freudenstadt im Nordschwarzwald.
              Wir glauben, dass jeder Betrieb Technologie verdient, die sich anfühlt
              wie von den ganz Großen — klar, schnell und zuverlässig.
            </p>
            <p className="ava-body" style={{ margin: "1rem auto 0" }}>
              Deshalb bauen wir unsere Produkte selbst, hosten auf Servern in Deutschland
              und bleiben persönlich erreichbar. Kein Callcenter, keine Warteschleife —
              ein Team aus der Region, das liefert.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="ava-section">
        <div className="ava-container" style={{ maxWidth: "760px" }}>
          <div ref={r11} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">FAQ</p>
            <h2 className="ava-h2">Fragen beantwortet.<br /><em>Zweifel beseitigt.</em></h2>
          </div>
          <div style={{ marginTop: "3rem" }}><FAQ /></div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="ava-section ava-section--dark" id="contact">
        <div className="ava-container">
          <div className="ava-contact">
            <div>
              <p className="ava-eyebrow">Kontakt</p>
              <h2 className="ava-h2">Lassen Sie uns etwas<br /><em>Außergewöhnliches bauen.</em></h2>
              <p className="ava-body">
                Buchen Sie ein kostenloses 30-Minuten-Erstgespräch oder schreiben Sie uns.
                Wir zeigen Ihnen genau, was sich in Ihrem Betrieb automatisieren lässt.
              </p>
              <div className="ava-contact__trust">
                {[
                  "Kostenloses Erstgespräch — keine Verpflichtung",
                  "Live-Demo von Telefonassistent & Company OS",
                  "Fester Preis vor Projektstart",
                  "Antwort innerhalb von 24 Stunden",
                ].map(item => (
                  <div key={item} className="ava-contact__trust-item">
                    <span>✓</span> {item}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "2rem" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--gray-2)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Oder sprechen Sie jetzt mit AVA</p>
                <VapiCallButton size="md" />
              </div>
              <div className="ava-contact__form-wrap">
                <p className="ava-contact__form-label">Oder schreiben Sie uns direkt</p>
                <ContactForm />
              </div>
            </div>
            <div className="ava-contact__calendly">
              <Suspense fallback={<div style={{ height: 660, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-2)" }}>Lädt…</div>}>
                <CalendlyEmbed />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="ava-cta-band">
        <div className="ava-cta-band__orb" />
        <div className="ava-container" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <p className="ava-eyebrow" style={{ color: "rgba(255,255,255,0.45)" }}>Bereit für den nächsten Schritt?</p>
          <h2 className="ava-cta-band__h2">Ihr Betrieb verdient<br />das Beste.</h2>
          <p className="ava-cta-band__sub">
            Ein Gespräch genügt, um zu sehen, was möglich ist — kostenlos und ohne Verpflichtung.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://calendly.com/dankiazad/30min" target="_blank" rel="noreferrer"
              className="ava-btn ava-btn--primary ava-btn--lg">
              Kostenloses Gespräch buchen <span className="ava-btn__arrow">→</span>
            </a>
            <a href="#pricing" className="ava-btn ava-btn--ghost ava-btn--lg">Preise ansehen</a>
          </div>
          <p className="ava-cta-band__note">Keine Kreditkarte · Keine Bindung · Antwort in 24h</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ava-footer">
        <div className="ava-container">
          <div className="ava-footer__top">
            <div className="ava-footer__brand">
              <a href="#" className="ava-nav__logo">
                <AVALogo size={22} />
              </a>
              <span className="ava-footer__tagline">Intelligent Systems. Real Results.</span>
              <span style={{ fontSize: "0.8rem", color: "var(--gray-2)" }}>www.ava-hq.com</span>
            </div>
            <div className="ava-footer__links">
              <div>
                <span className="ava-footer__col-label">Services</span>
                <a href="#services">KI Voice Agent</a>
                <a href="#services">Premium Websites</a>
                <a href="/company-os.html">Company OS</a>
                <a href="/ki-telefonassistent-freudenstadt.html">KI-Telefonassistent</a>
              </div>
              <div>
                <span className="ava-footer__col-label">Unternehmen</span>
                <a href="#why">Warum AVA</a>
                <a href="#pricing">Preise</a>
                <a href="#ueber">Über uns</a>
                <a href="#contact">Kontakt</a>
              </div>
              <div>
                <span className="ava-footer__col-label">Webdesign vor Ort</span>
                <a href="/website-erstellen-lassen-freudenstadt.html">Website Freudenstadt</a>
                <a href="/website-handwerker-nordschwarzwald.html">Website für Handwerker</a>
                <a href="/fahrschul-website-freudenstadt.html">Fahrschul-Website</a>
              </div>
              <div>
                <span className="ava-footer__col-label">Social</span>
                <a href="/">Instagram</a>
                <a href="/">LinkedIn</a>
                <a href="/">X / Twitter</a>
              </div>
            </div>
          </div>
          <div className="ava-footer__bottom">
            <span>© {new Date().getFullYear()} AVA AI. Alle Rechte vorbehalten.</span>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              <a href="/impressum.html" style={{ color: "var(--gray-2)", fontSize: "0.82rem" }}>Impressum</a>
              <a href="/datenschutz.html" style={{ color: "var(--gray-2)", fontSize: "0.82rem" }}>Datenschutz</a>
              <span style={{ color: "var(--blue-bright)", fontWeight: "500" }}>Intelligent Systems. Real Results.</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
