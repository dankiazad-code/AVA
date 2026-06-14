import { useState, useEffect, useRef } from "react";
import "./App.css";

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
function AVALogo({ height = 28 }) {
  const w = height * (320 / 90);
  return (
    <svg width={w} height={height} viewBox="0 0 320 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 76 L88 8 L158 76 L228 8 L298 76"
        stroke="white" strokeWidth="11" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="20"/>
      <line x1="3" y1="76" x2="33" y2="76" stroke="white" strokeWidth="11" strokeLinecap="butt"/>
      <line x1="143" y1="76" x2="173" y2="76" stroke="white" strokeWidth="11" strokeLinecap="butt"/>
      <line x1="283" y1="76" x2="313" y2="76" stroke="white" strokeWidth="11" strokeLinecap="butt"/>
    </svg>
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
  const [lines, setLines] = useState([]);
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    setLines([]); setDone(false); idxRef.current = 0;
    function addNext() {
      if (idxRef.current >= SCRIPT.length) { setTyping(false); setDone(true); return; }
      setTyping(true);
      setTimeout(() => {
        setLines(prev => [...prev, SCRIPT[idxRef.current]]);
        idxRef.current += 1;
        setTyping(false);
        setTimeout(addNext, 750);
      }, idxRef.current === 0 ? 400 : 950);
    }
    addNext();
  }, [open]);

  if (!open) {
    return (
      <button className="ava-call__trigger" onClick={() => setOpen(true)}>
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
        {done && (
          <div className="ava-call__done">
            <span className="ava-call__done-icon">✓</span>
            Buchung bestätigt · Kein Mensch benötigt
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
        <ParticleCanvas />
        <div className="ava-hero__glow" />
        <div className="ava-hero__grid-bg" />
        <div className="ava-hero__scan" />

        <div className="ava-container">
          <div className="ava-hero__badge">
            <span className="ava-hero__badge-dot" />
            Europas führende KI-Automation für Hotels
          </div>

          <h1 className="ava-hero__h1">
            <span className="ava-hero__h1-light">Intelligent Systems.</span>
            <span className="ava-hero__h1-bold">Real Results.</span>
          </h1>

          <p className="ava-hero__sub">
            AVA automatisiert Ihre Gästekommunikation, steigert Ihre Buchungsrate
            und spart tausende Euro monatlich — 24/7, in jeder Sprache, ohne Pause.
          </p>

          <div className="ava-hero__actions">
            <a href="https://calendly.com/dankiazad/30min" target="_blank" rel="noreferrer"
              className="ava-btn ava-btn--primary ava-btn--lg">
              Kostenloses Strategiegespräch
              <span className="ava-btn__arrow">→</span>
            </a>
            <a href="#why" className="ava-btn ava-btn--ghost ava-btn--lg">
              <span className="ava-btn__play">▶</span>
              Mehr erfahren
            </a>
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
            {["Grand Vienna", "Baba Ambiente", "EstateFlow", "MediCare Pro", "LegalEdge", "NexGen Clinics"].map(n => (
              <span key={n} className="ava-trusted__logo">{n}</span>
            ))}
          </div>
        </div>
      </section>

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
              { stat: "62%", desc: "der Gäste rufen nach Mailbox nicht mehr zurück" },
              { stat: "3 Sek", desc: "genügen, um einen Interessenten zu verlieren" },
              { stat: "€15k", desc: "monatliche Kosten für manuelle Rezeptionsarbeit" },
              { stat: "0%", desc: "der verpassten Anrufe werden nach Feierabend beantwortet" },
            ].map(({ stat, desc }) => (
              <div key={stat} className="ava-problem__card">
                <div className="ava-problem__stat">{stat}</div>
                <p className="ava-problem__desc">{desc}</p>
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
              { icon: "🎙️", title: "KI Voice Agent", body: "Gespräche auf menschlichem Niveau — bucht, qualifiziert und konvertiert rund um die Uhr." },
              { icon: "🌐", title: "Premium Websites", body: "Hochkonvertierende Websites für moderne Hotels — designed für Vertrauen und Performance." },
              { icon: "🔗", title: "CRM-Integration", body: "Nahtlose Anbindung an Salesforce, HubSpot, Mews, Opera und 200+ weitere Systeme." },
              { icon: "⚡", title: "Workflow-Automation", body: "End-to-End-Automatisierung von Buchungen, E-Mails, Follow-ups und Reports." },
              { icon: "🏨", title: "Hotel AI System", body: "Speziell entwickelt für Hospitality: Concierge-AI, Room Service, Gästebetreuung." },
              { icon: "🔐", title: "DSGVO & Sicherheit", body: "Ende-zu-Ende verschlüsselt, EU-Server, vollständig DSGVO-konform. Ihre Daten bleiben Ihre Daten." },
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
          <div className="ava-testimonials" style={{ marginTop: "4rem" }}>
            {[
              { quote: "AVA nimmt jeden Anruf sofort an. Wir sind von 40% verpasster Buchungen auf 100% Erfassungsrate gegangen. Umsatz +€28k im ersten Monat.", name: "Markus H.", role: "GM · Grand Vienna Hotel", initials: "MH" },
              { quote: "Unsere Website-Conversion hat sich verdreifacht. Das Design ist unreal — Gäste erwähnen es ständig als erstes Argument für unser Haus.", name: "Sarah L.", role: "CEO · EstateFlow Realty", initials: "SL" },
              { quote: "Das Automationssystem von AVA spart unserem Team 40+ Stunden pro Woche. Wie fünf neue Mitarbeiter für €399 im Monat.", name: "Dr. Karim R.", role: "Direktor · NexGen Clinics", initials: "KR" },
            ].map(({ quote, name, role, initials }) => (
              <div key={name} className="ava-testimonial">
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
