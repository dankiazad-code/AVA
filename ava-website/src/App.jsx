import { useState, useEffect, useRef } from "react";
import "./App.css";

const ASSISTANT_ID = "75d1fe79-eb98-48e0-97dc-f917f5610725";
const VAPI_KEY    = "11a16c26-443f-4159-a318-204ec041741b";

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
    const onStart = () => { if (mountedRef.current) setStatus("active"); };
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

/* ── Stats Ticker ── */
const TICKER = ["● 500+ Hotels vertrauen AVA", "€2.1M eingespart", "99.9% Uptime", "40+ Sprachen", "< 1s Reaktionszeit", "24/7 verfügbar", "3 Wochen bis Go-Live", "Kein Langzeitvertrag"];
function StatsTicker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="ava-ticker" aria-hidden="true">
      <div className="ava-ticker__track">
        {items.map((s, i) => <span key={i} className="ava-ticker__item">{s}<span className="ava-ticker__sep">·</span></span>)}
      </div>
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
  { role: "ava", text: "Guten Morgen, Grand Vienna Hotel. Wie kann ich Ihnen helfen?" },
  { role: "caller", text: "Ich möchte eine Suite für nächsten Freitag buchen." },
  { role: "ava", text: "Natürlich! Die Executive Suite ist verfügbar. Soll ich diese für eine Nacht reservieren?" },
  { role: "caller", text: "Ja bitte, und kann ich einen Late Checkout haben?" },
  { role: "ava", text: "Erledigt — Suite gebucht mit Late Checkout um 14 Uhr. Bestätigung wurde an Ihre E-Mail gesendet." },
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
        <span className="ava-call__header-label">AVA · Live-Gespräch · Grand Vienna Hotel</span>
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

/* ── ROI Calculator ── */
function ROICalc() {
  const [hours, setHours] = useState(20);
  const [wage, setWage] = useState(18);
  const [missed, setMissed] = useState(30);

  const staffCost = Math.round(hours * wage * 4.3);
  const missedRevenue = Math.round(missed * 120);
  const totalLoss = staffCost + missedRevenue;
  const saving = Math.max(0, totalLoss - 399);

  return (
    <div className="ava-roi">
      <div className="ava-roi__inputs">
        <label className="ava-roi__label">
          Telefonstunden Rezeption / Woche
          <span className="ava-roi__value-display">{hours} Std</span>
        </label>
        <input className="ava-roi__slider" type="range" min={5} max={60} step={1} value={hours} onChange={e => setHours(+e.target.value)} />

        <label className="ava-roi__label">
          Stundenlohn Rezeption
          <span className="ava-roi__value-display">€{wage}/Std</span>
        </label>
        <input className="ava-roi__slider" type="range" min={12} max={50} step={1} value={wage} onChange={e => setWage(+e.target.value)} />

        <label className="ava-roi__label">
          Verpasste Buchungen / Monat
          <span className="ava-roi__value-display">{missed}</span>
        </label>
        <input className="ava-roi__slider" type="range" min={5} max={200} step={5} value={missed} onChange={e => setMissed(+e.target.value)} />
      </div>
      <div className="ava-roi__output">
        <div className="ava-roi__row"><span>Monatliche Telefonkosten</span><strong>€{staffCost.toLocaleString()}</strong></div>
        <div className="ava-roi__row"><span>Entgangener Umsatz (à €120)</span><strong>€{missedRevenue.toLocaleString()}</strong></div>
        <div className="ava-roi__row"><span>AVA Starter (monatlich)</span><strong className="ava-roi__blue">€399</strong></div>
        <div className="ava-roi__result">
          <span>Monatliche Ersparnis</span>
          <strong className="ava-roi__result-value">€{saving.toLocaleString()}</strong>
        </div>
        <div style={{ marginTop: "1.5rem" }}>
          <a href="#contact" className="ava-btn ava-btn--primary ava-btn--lg" style={{ width: "100%", justifyContent: "center" }}>
            Jetzt sparen →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── FAQ ── */
const FAQS = [
  { q: "Wie schnell ist AVA einsatzbereit?", a: "Die meisten Kunden gehen innerhalb von 3 Werktagen live. Wir übernehmen die komplette Einrichtung, Stimmtraining und Integration in Ihre bestehenden Systeme." },
  { q: "Funktioniert AVA mit meiner Hotelsoftware?", a: "Ja. AVA integriert sich mit allen gängigen PMS-, CRM- und Buchungsplattformen per API. Individuelle Integrationen sind ebenfalls möglich." },
  { q: "Welche Sprachen unterstützt AVA?", a: "AVA spricht 40+ Sprachen auf menschlichem Niveau. Die Spracherkennung erfolgt automatisch beim Anruf." },
  { q: "Gibt es einen Langzeitvertrag?", a: "Keine Bindung. Unsere Pakete laufen monatlich kündbar. Wir verdienen Ihr Vertrauen jeden Monat durch messbare Ergebnisse." },
  { q: "Wie werden Datenschutz und DSGVO gehandhabt?", a: "Alle Gesprächsdaten sind Ende-zu-Ende verschlüsselt, werden auf EU-Servern gespeichert und sind vollständig DSGVO-konform. Ihre Daten gehören Ihnen." },
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

/* ── Calendly Embed ── */
function CalendlyEmbed() {
  return (
    <div
      className="calendly-inline-widget"
      data-url="https://calendly.com/dankiazad/30min?hide_event_type_details=1&hide_gdpr_banner=1&background_color=0E0E1A&text_color=F2F2F8&primary_color=0078FF"
      style={{ minWidth: "280px", height: "660px" }}
    />
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

/* ── Press bar ── */
function PressBar() {
  const items = ["Hospitality Tech", "Hotel Management", "AI Business Review", "Future Hospitality", "TechCrunch"];
  return (
    <div className="ava-press">
      <div className="ava-container">
        <p className="ava-press__label">Bekannt aus</p>
        <div className="ava-press__logos">
          {items.map(n => <span key={n} className="ava-press__logo">{n}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ── Testimonials data ── */
const TESTIMONIALS = [
  { quote: "AVA nimmt jeden Anruf sofort an. Wir sind von 40% verpasster Buchungen auf 100% Erfassungsrate gegangen. Umsatz +€28k im ersten Monat.", name: "Markus H.", role: "GM · Grand Vienna Hotel", initials: "MH" },
  { quote: "Unsere Website-Conversion hat sich verdreifacht. Gäste erwähnen das Design ständig als erstes Argument für unser Haus.", name: "Sarah L.", role: "CEO · EstateFlow Realty", initials: "SL" },
  { quote: "Das Automationssystem von AVA spart unserem Team 40+ Stunden pro Woche. Wie fünf neue Mitarbeiter für €399 im Monat.", name: "Dr. Karim R.", role: "Direktor · NexGen Clinics", initials: "KR" },
  { quote: "Innerhalb von 3 Tagen war AVA live. Reibungslose Einrichtung, das Team war immer erreichbar. Wir würden es jedem Hotel empfehlen.", name: "Lisa M.", role: "Inhaberin · Boutique Hotel Salzburg", initials: "LM" },
  { quote: "AVA beantwortet Anfragen auf Deutsch, Englisch und Japanisch — unsere internationalen Gäste lieben es. Kein verpasster Anruf mehr.", name: "Thomas K.", role: "Manager · Alpine Resort", initials: "TK" },
];

/* ── Pricing data ── */
const PLANS = [
  {
    tier: "Starter",
    price: "€399",
    period: "/Monat",
    sub: "Für kleine Hotels",
    popular: false,
    features: [
      "KI Voice Agent",
      "24/7 Anrufannahme",
      "FAQ-Beantwortung",
      "E-Mail-Benachrichtigungen",
      "Basis-Reporting",
    ],
    cta: "Starter wählen",
  },
  {
    tier: "Growth",
    price: "€899",
    period: "/Monat",
    sub: "Meistgewählt",
    popular: true,
    features: [
      "Alles aus Starter",
      "Reservierungs-Automation",
      "CRM-Integration",
      "Website-Integration",
      "Mehrsprachiger Support",
      "Monatliche Optimierung",
    ],
    cta: "Growth wählen",
  },
  {
    tier: "Enterprise",
    price: "Custom",
    period: "",
    sub: "Für Hotelgruppen",
    popular: false,
    features: [
      "Alles aus Growth",
      "Multi-Standort Support",
      "Individuelle Integrationen",
      "Advanced Workflows",
      "Dedizierter Support",
      "Enterprise-Infrastruktur",
    ],
    cta: "Kontakt aufnehmen",
  },
];

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

  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(),
        r4 = useReveal(), r5 = useReveal(), r6 = useReveal(),
        r7 = useReveal(), r8 = useReveal(), r9 = useReveal(),
        r10 = useReveal(), r11 = useReveal();

  return (
    <div className="app">

      <StatsTicker />

      {/* ── NAV ── */}
      <nav className={`ava-nav${scrolled ? " ava-nav--scrolled" : ""}`}>
        <div className="ava-nav__inner">
          <a href="#" className="ava-nav__logo">
            <AVALogo size={28} />
          </a>
          <ul className="ava-nav__links">
            <li><a href="#why">Warum AVA</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#pricing">Preise</a></li>
            <li><a href="#roi">ROI</a></li>
            <li><a href="#contact">Kontakt</a></li>
          </ul>
          <a href="https://calendly.com/dankiazad/30min" target="_blank" rel="noreferrer" className="ava-btn ava-btn--nav">
            Termin buchen
          </a>
          <button className="ava-nav__burger" aria-label="Menü" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="ava-nav__mobile">
            {[["#why","Warum AVA"],["#services","Services"],["#pricing","Preise"],["#roi","ROI"],["#contact","Kontakt"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="ava-hero">
        <GradientMesh />
        <div className="ava-hero__orb" />
        <div className="ava-hero__glow" />
        <div className="ava-hero__grid-bg" />
        <div className="ava-hero__scan" />

        <div className="ava-container">
          <div className="ava-hero__badge">
            <span className="ava-hero__badge-dot" />
            Europas führende KI-Automation für Hotels
          </div>

          <h1 className="ava-hero__h1">
            <span className="ava-hero__h1-light">Der KI-Agent für</span>
            <span className="ava-hero__h1-bold"><Typewriter words={["Hotels.", "Resorts.", "Restaurants.", "Spas.", "Ihr Haus."]} /></span>
          </h1>

          <p className="ava-hero__sub">
            AVA automatisiert Ihre Gästekommunikation, steigert Ihre Buchungsrate
            und spart tausende Euro monatlich — 24/7, in jeder Sprache, ohne Pause.
          </p>

          <div className="ava-hero__actions">
            <MagBtn href="https://calendly.com/dankiazad/30min" target="_blank" rel="noreferrer"
              className="ava-btn ava-btn--primary ava-btn--lg">
              Kostenloses Strategiegespräch
              <span className="ava-btn__arrow">→</span>
            </MagBtn>
            <MagBtn href="#why" className="ava-btn ava-btn--ghost ava-btn--lg">
              <span className="ava-btn__play">▶</span>
              Mehr erfahren
            </MagBtn>
          </div>

          <div className="ava-vapi__hero-wrap">
            <VapiCallButton size="lg" />
            <span className="ava-vapi__hint">Sprich jetzt live mit AVA — direkt im Browser</span>
          </div>

          <div className="ava-call">
            <CallDemo />
          </div>

          <div className="ava-hero__scroll">
            <div className="ava-hero__scroll-line" />
            Scroll
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section className="ava-trusted">
        <div className="ava-container">
          <p className="ava-trusted__label">Vertraut von Hotels und Servicebetrieben</p>
          <div className="ava-trusted__logos">
            {["Grand Vienna", "EstateFlow", "MediCare Pro", "LegalEdge", "NexGen Clinics"].map(n => (
              <span key={n} className="ava-trusted__logo">{n}</span>
            ))}
          </div>
        </div>
      </section>

      <PressBar />

      {/* ── WHY AVA ── */}
      <section className="ava-section" id="why">
        <div className="ava-container">
          <div ref={r1} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">Warum AVA</p>
            <h2 className="ava-h2">
              Gebaut für moderne Hospitality.<br />
              <em>Ergebnisse, keine Versprechen.</em>
            </h2>
            <p className="ava-body" style={{ margin: "0 auto 0", maxWidth: "560px" }}>
              Jede Gästeinteraktion zählt. AVA stellt sicher, dass keine einzige verloren geht.
            </p>
          </div>

          <div className="ava-why__grid" style={{ marginTop: "4rem" }}>
            {[
              { num: "01", icon: "📈", title: "Mehr Buchungen", body: "Erfassen Sie Anfragen, die sonst verloren gehen. Kein Anruf bleibt unbeantwortet." },
              { num: "02", icon: "⚡", title: "Sofortige Antworten", body: "Gäste erhalten in Sekunden eine Antwort — rund um die Uhr, auch nachts und an Feiertagen." },
              { num: "03", icon: "🤖", title: "Intelligente Automation", body: "Reduziert repetitive Aufgaben und entlastet Ihr Team für das Wesentliche." },
              { num: "04", icon: "💶", title: "Messbares Wachstum", body: "Positiver ROI ab dem ersten Monat. Transparente Zahlen, klare Ergebnisse." },
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

      {/* ── PROBLEM STATS ── */}
      <section className="ava-section ava-section--dark" id="services">
        <div className="ava-container">
          <div ref={r2} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">Das Problem</p>
            <h2 className="ava-h2">
              Ihr Hotel verliert Geld<br />
              <em>jede Stunde ohne AVA.</em>
            </h2>
            <p className="ava-body" style={{ margin: "0 auto 0", maxWidth: "540px" }}>
              Verpasste Anrufe, langsame Reaktionszeiten und manuelle Prozesse kosten Hotels
              tausende Euro monatlich. AVA löst das — komplett automatisiert.
            </p>
          </div>

          <div className="ava-problem__grid">
            {[
              { target: 62, prefix: "", suffix: "%", desc: "der Gäste rufen nach Mailbox nicht mehr zurück" },
              { target: 3,  prefix: "", suffix: " Sek", desc: "genügen, um einen Interessenten zu verlieren" },
              { target: 15, prefix: "€", suffix: "k",   desc: "monatliche Kosten für manuelle Rezeptionsarbeit" },
              { target: 0,  prefix: "", suffix: "%",    desc: "der verpassten Anrufe werden nach Feierabend beantwortet" },
            ].map((item) => (
              <StatCard key={item.desc} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="ava-section" id="solution">
        <div className="ava-container">
          <div className="ava-solution__split">
            <div ref={r3} className="ava-reveal ava-solution__copy">
              <p className="ava-eyebrow">Die Lösung</p>
              <h2 className="ava-h2">
                AVA nimmt jeden Anruf an.<br />
                <em>Sofort. Perfekt. 24/7.</em>
              </h2>
              <p className="ava-body">
                Unser KI-Voice-Agent nimmt Anrufe an, qualifiziert Anfragen,
                nimmt Buchungen entgegen und beantwortet FAQs — in Echtzeit,
                in 40+ Sprachen, vollkommen automatisch.
              </p>
              <p className="ava-body">
                Keine Warteschleife. Kein verpasster Lead. Kein müdes Personal.
                Nur nahtlose, intelligente Gespräche, die konvertieren.
              </p>
              <a href="#contact" className="ava-btn ava-btn--primary" style={{ marginTop: "0.5rem" }}>
                AVA für Ihr Hotel →
              </a>
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
                  { value: "24/7", label: "Verfügbarkeit", sub: "Kein Ausfall" },
                  { value: "40+", label: "Sprachen", sub: "Auto-Erkennung" },
                  { value: "98%", label: "Zufriedenheit", sub: "Kundenbewertung" },
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

      {/* ── FEATURES ── */}
      <section className="ava-section ava-section--dark">
        <div className="ava-container">
          <div ref={r5} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">Leistungen</p>
            <h2 className="ava-h2">Alles was Sie brauchen.<br /><em>Nichts was Sie nicht brauchen.</em></h2>
          </div>
          <div className="ava-features__grid" style={{ marginTop: "4rem" }}>
            {[
              { icon: Icon.mic,      title: "KI Voice Agent",      body: "Gespräche auf menschlichem Niveau — bucht, qualifiziert und konvertiert rund um die Uhr." },
              { icon: Icon.globe,    title: "Premium Websites",    body: "Hochkonvertierende Websites für moderne Hotels — designed für Vertrauen und Performance." },
              { icon: Icon.link,     title: "CRM-Integration",     body: "Nahtlose Anbindung an Salesforce, HubSpot, Mews, Opera und 200+ weitere Systeme." },
              { icon: Icon.zap,      title: "Workflow-Automation", body: "End-to-End-Automatisierung von Buchungen, E-Mails, Follow-ups und Reports." },
              { icon: Icon.building, title: "Hotel AI System",     body: "Speziell entwickelt für Hospitality: Concierge-AI, Room Service, Gästebetreuung." },
              { icon: Icon.shield,   title: "DSGVO & Sicherheit",  body: "Ende-zu-Ende verschlüsselt, EU-Server, vollständig DSGVO-konform. Ihre Daten bleiben Ihre Daten." },
            ].map(({ icon, title, body }) => (
              <div key={title} className="ava-feature">
                <span className="ava-feature__icon">{icon}</span>
                <h3 className="ava-feature__title">{title}</h3>
                <p className="ava-feature__body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="ava-section" id="pricing">
        <div className="ava-container">
          <div ref={r6} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">Preise</p>
            <h2 className="ava-h2">
              Einfache Preise.<br />
              <em>Messbarer Return.</em>
            </h2>
            <p className="ava-body" style={{ margin: "0 auto 0", maxWidth: "480px" }}>
              Jedes Paket ist darauf ausgelegt, einen positiven Return on Investment zu generieren.
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
                    href={plan.tier === "Enterprise" ? "#contact" : "https://calendly.com/dankiazad/30min"}
                    target={plan.tier === "Enterprise" ? "_self" : "_blank"}
                    rel="noreferrer"
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
          <div ref={r8} className="ava-reveal"><ROICalc /></div>
        </div>
      </section>

      {/* ── NEXT STEPS ── */}
      <section className="ava-section">
        <div className="ava-container">
          <div ref={r9} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">Nächste Schritte</p>
            <h2 className="ava-h2">Von Gespräch zu <em>Go-Live in 3 Wochen.</em></h2>
          </div>
          <div className="ava-steps__grid">
            {[
              { num: "01", title: "Kostenloses Gespräch", body: "Wir analysieren Ihr Geschäft, Herausforderungen und Ziele." },
              { num: "02", title: "Business-Analyse", body: "Wir überprüfen Workflows, Gästekommunikation und Potenziale." },
              { num: "03", title: "Individuelles Angebot", body: "Sie erhalten eine maßgeschneiderte KI-Lösung für Ihr Haus." },
              { num: "04", title: "Go Live", body: "Implementierung, Onboarding und Launch — alles inklusive." },
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

      {/* ── TESTIMONIALS ── */}
      <section className="ava-section ava-section--dark">
        <div className="ava-container">
          <div ref={r10} className="ava-reveal" style={{ textAlign: "center" }}>
            <p className="ava-eyebrow">Kundenstimmen</p>
            <h2 className="ava-h2">Echte Betriebe.<br /><em>Echtes Wachstum.</em></h2>
          </div>
          <div className="ava-carousel" style={{ marginTop: "4rem" }}>
            <div className="ava-carousel__track">
              {[...TESTIMONIALS, ...TESTIMONIALS].map(({ quote, name, role, initials }, i) => (
                <div key={i} className="ava-testimonial">
                  <div className="ava-testimonial__stars">★★★★★</div>
                  <p className="ava-testimonial__quote">"{quote}"</p>
                  <div className="ava-testimonial__author">
                    <div className="ava-testimonial__avatar">{initials}</div>
                    <div>
                      <div className="ava-testimonial__name">{name}</div>
                      <div className="ava-testimonial__role">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                Buchen Sie ein kostenloses 30-Minuten-Strategiegespräch oder schreiben Sie uns.
                Wir zeigen Ihnen genau, wie AVA Ihr Hotel transformiert.
              </p>
              <div className="ava-contact__trust">
                {[
                  "Kostenloses Strategiegespräch — keine Verpflichtung",
                  "Live-Demo des AVA Voice Agents",
                  "Individuelle ROI-Prognose für Ihr Haus",
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
              <p style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--gray-2)" }}>
                ↗ Wählen Sie rechts direkt Ihren Wunschtermin aus.
              </p>
            </div>
            <div className="ava-contact__calendly">
              <CalendlyEmbed />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="ava-cta-band">
        <div className="ava-cta-band__orb" />
        <div className="ava-container" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <p className="ava-eyebrow" style={{ color: "rgba(255,255,255,0.45)" }}>Bereit für den nächsten Schritt?</p>
          <h2 className="ava-cta-band__h2">Ihr Hotel verdient<br />das Beste.</h2>
          <p className="ava-cta-band__sub">
            Schließen Sie sich den Hotels an, die AVA bereits nutzen — und nie zurückblicken.
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
                <a href="#services">CRM-Integration</a>
                <a href="#services">Hotel AI</a>
              </div>
              <div>
                <span className="ava-footer__col-label">Unternehmen</span>
                <a href="#why">Warum AVA</a>
                <a href="#pricing">Preise</a>
                <a href="#contact">Kontakt</a>
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
            <span>© {new Date().getFullYear()} AVA Agency. Alle Rechte vorbehalten.</span>
            <span style={{ color: "var(--blue-bright)", fontWeight: "500" }}>Intelligent Systems. Real Results.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
