import { useState, useEffect, useRef } from 'react'
import './App.css'

const LOGO     = '/img/logo.png'
const HERO_IMG = '/img/hero.jpg'
const ABOUT_IMG= '/img/hero2.jpg'
const MOTO_IMG = '/img/motorrad.png'

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          setCount(Math.floor(p * p * target))
          if (p < 1) requestAnimationFrame(tick)
          else setCount(target)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])
  return [ref, count]
}

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
      <rect x="5" y="15" width="4" height="4" rx="1"/><rect x="15" y="15" width="4" height="4" rx="1"/>
      <path d="M5 9l2-4h10l2 4"/>
    </svg>
  )
}
function MotoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6H9l-2 7h10l-2-7z"/><path d="M9 6l3-3 3 3"/>
    </svg>
  )
}
function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function ScreenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
    </svg>
  )
}
function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

const FAQS = [
  { q: 'Wie viele Fahrstunden brauche ich?', a: 'Das hängt von Ihrem Talent und Lernfortschritt ab. Gesetzlich vorgeschrieben sind 12 Übungsstunden sowie Sonderfahrten (Autobahn, Nacht, Landstraße). Im Durchschnitt absolvieren Schüler bei uns 30–40 Fahrstunden.' },
  { q: 'Wie läuft der Theorie-Intensivkurs ab?', a: 'Der Intensivkurs findet an 3–5 Wochentagen statt und beinhaltet alle Lernbereiche komprimiert. Ideal, wenn Sie schnell Ihren Führerschein machen möchten. Kursbeginn ist flexibel – sprechen Sie uns an.' },
  { q: 'Bieten Sie Fahrstunden auf Motorrad an?', a: 'Ja! Wir bieten alle gängigen Motorradklassen an (A, A2, A1, AM). Unsere Instruktoren sind erfahrene Biker, die Ihnen sicher und gezielt die Motorradtechnik beibringen.' },
  { q: 'Wo finden die Fahrstunden statt?', a: 'Wir starten von unseren drei Standorten: Baiersbronn (Hauptsitz), Freudenstadt und Pfalzgrafenweiler. Abholung an vereinbarten Punkten ist möglich.' },
  { q: 'Was kostet die Anmeldung?', a: 'Die Anmeldegebühr beträgt einmalig 220 €. Darin enthalten sind Verwaltung, Lehrmaterial und die Prüfungsanmeldung. Fahrstunden werden separat abgerechnet.' },
]

const SERVICES = [
  { icon: <CarIcon/>, title: 'PKW – Klasse B', desc: 'Ihr Einstieg in die Fahrwelt. Wir begleiten Sie vom ersten Übungskilometer bis zur Prüfung – mit Geduld und System.', tags: ['Klasse B', 'Automat möglich'] },
  { icon: <MotoIcon/>, title: 'Motorrad – A / A2 / A1', desc: 'Freiheit auf zwei Rädern. Alle Motorradklassen, erfahrene Instruktoren, kleine Gruppen und Top-Schulungsmotorräder.', tags: ['A', 'A2', 'A1', 'AM'] },
  { icon: <BookIcon/>, title: 'Theorie-Intensivkurs', desc: 'Komprimierter Theorie-Unterricht an wenigen Tagen. Perfekt für Berufstätige und alle ohne Zeit für wochenlange Abendkurse.', tags: ['Intensiv', '3–5 Tage'] },
  { icon: <HeartIcon/>, title: 'Erste-Hilfe-Kurs', desc: 'Pflicht für die Führerscheinanmeldung und lebensrettend: unsere zertifizierten Erste-Hilfe-Kurse. Auch für externe Teilnehmer buchbar.', tags: ['Pflichtnachweis', 'Zertifiziert'] },
  { icon: <ScreenIcon/>, title: 'Fahrsimulator', desc: 'Gefahrensituationen sicher üben – unser moderner Fahrsimulator ermöglicht realitätsnahes Training ohne Risiko auf der Straße.', tags: ['Ohne Risiko', 'Technik-Training'] },
  { icon: <CarIcon/>, title: 'Weitere Klassen', desc: 'BE (Anhänger), L (Landwirtschaft) und weitere Klassen auf Anfrage. Fragen Sie uns – wir finden die passende Lösung.', tags: ['BE', 'L', 'auf Anfrage'] },
]

const LOCATIONS = [
  { city: 'Baiersbronn', street: 'Oberdorfstr. 12, 72270 Baiersbronn', main: true,
    hours: [{ day: 'Mo', time: '08:00–12:00 Uhr' }, { day: 'Di–Do', time: '15:00–18:00 Uhr' }],
    phone: '+49 170 20411197', email: 'info@fahrschule-heinzelmann.de' },
  { city: 'Freudenstadt', street: 'Auf Anfrage', main: false,
    hours: [{ day: 'Termine', time: 'auf Anfrage' }],
    phone: '+49 170 20411197', email: 'info@fahrschule-heinzelmann.de',
    note: 'Fahrstunden starten ab Freudenstadt nach Absprache möglich.' },
  { city: 'Pfalzgrafenweiler', street: 'Auf Anfrage', main: false,
    hours: [{ day: 'Termine', time: 'auf Anfrage' }],
    phone: '+49 170 20411197', email: 'info@fahrschule-heinzelmann.de',
    note: 'Fahrstunden starten ab Pfalzgrafenweiler nach Absprache möglich.' },
]

const EVENTS = [
  { date: 'Di, 01. Juli 2025', title: 'Theorie-Intensivkurs – Sommer', location: 'Baiersbronn' },
  { date: 'Sa, 12. Juli 2025', title: 'Erste-Hilfe-Kurs', location: 'Baiersbronn' },
  { date: 'Mo, 04. Aug 2025', title: 'Theorie-Intensivkurs – August', location: 'Baiersbronn' },
  { date: 'Sa, 16. Aug 2025', title: 'Erste-Hilfe-Kurs', location: 'Baiersbronn' },
]

function StatCard({ num, suffix = '', label }) {
  const [ref, count] = useCountUp(num)
  return (
    <div ref={ref}>
      <div className="stat__num">{count}{suffix}</div>
      <div className="stat__label">{label}</div>
    </div>
  )
}

function FAQ() {
  const [open, setOpen] = useState(null)
  return (
    <div className="faq">
      {FAQS.map((item, i) => (
        <div key={i} className={`faq__item${open === i ? ' faq__item--open' : ''}`}>
          <button className="faq__q" onClick={() => setOpen(open === i ? null : i)}>
            {item.q}
            <span className="faq__chevron"><ChevronIcon /></span>
          </button>
          <div className="faq__a"><p className="faq__a-inner">{item.a}</p></div>
        </div>
      ))}
    </div>
  )
}

function ContactForm() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', cls: '', msg: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  if (sent) return (
    <div className="contact__success">
      <div className="contact__success-icon">✓</div>
      <h3>Danke für Ihre Anfrage!</h3>
      <p>Wir melden uns innerhalb von 24 Stunden bei Ihnen.</p>
    </div>
  )
  return (
    <form className="contact__form" onSubmit={e => { e.preventDefault(); setSent(true) }}>
      <div className="contact__row">
        <label><span>Vorname &amp; Name *</span>
          <input required value={form.name} onChange={set('name')} placeholder="Max Mustermann" />
        </label>
        <label><span>E-Mail *</span>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="max@beispiel.de" />
        </label>
      </div>
      <div className="contact__row">
        <label><span>Telefon</span>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+49 170 ..." />
        </label>
        <label><span>Führerscheinklasse</span>
          <select value={form.cls} onChange={set('cls')}>
            <option value="">– bitte wählen –</option>
            <option>B – PKW</option><option>A – Motorrad</option><option>A2 – Motorrad</option>
            <option>A1 – Motorrad</option><option>Erste-Hilfe-Kurs</option><option>Sonstiges</option>
          </select>
        </label>
      </div>
      <label><span>Ihre Nachricht</span>
        <textarea rows="4" value={form.msg} onChange={set('msg')} placeholder="Ich interessiere mich für …" />
      </label>
      <button type="submit" className="btn btn--primary btn--full btn--lg">
        Anfrage senden <span className="btn__arrow">→</span>
      </button>
    </form>
  )
}

export default function App() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('reveal--in') }),
      { threshold: 0.12 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 37 + 5) % 90 + 5}%`,
    width: `${4 + (i % 5) * 2}px`,
    height: `${4 + (i % 5) * 2}px`,
    animationDuration: `${6 + (i % 6) * 2}s`,
    animationDelay: `${(i * 0.7) % 8}s`,
    bottom: `${(i * 13 + 8) % 60 + 5}%`,
  }))

  return (
    <>
      <a href="#main" className="skip-link">Zum Inhalt springen</a>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' nav--scrolled' : ''}${menuOpen ? ' nav--open' : ''}`}>
        <div className="nav__inner">
          <a href="#" className="nav__logo">
            <img src={LOGO} alt="Fahrschule Heinzelmann" className="nav__logo-img" width="180" height="70" />
          </a>
          <div className="nav__links">
            <a href="#leistungen">Leistungen</a>
            <a href="#standorte">Standorte</a>
            <a href="#termine">Termine</a>
            <a href="#faq">FAQ</a>
          </div>
          <a href="#kontakt" className="btn btn--primary btn--sm nav__cta">Jetzt anmelden</a>
          <button className="nav__burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menü">
            <span/><span/><span/>
          </button>
        </div>
        <div className="nav__mobile">
          <a href="#leistungen" onClick={() => setMenuOpen(false)}>Leistungen</a>
          <a href="#standorte" onClick={() => setMenuOpen(false)}>Standorte</a>
          <a href="#termine" onClick={() => setMenuOpen(false)}>Termine</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          <a href="#kontakt" onClick={() => setMenuOpen(false)}>Jetzt anmelden →</a>
        </div>
      </nav>

      <main id="main">
        {/* HERO */}
        <section className="hero">
          <div className="hero__bg">
            <img src={HERO_IMG} alt="Robin Heinzelmann – Fahrlehrer" className="hero__img" />
            <div className="hero__overlay" />
            <div className="hero__particles">
              {PARTICLES.map((p, i) => <span key={i} className="hero__particle" style={p} />)}
            </div>
            <div className="hero__road">
              <div className="hero__road-line" />
              <div className="hero__road-line hero__road-line--2" />
            </div>
          </div>
          <div className="container hero__content">
            <div className="hero__badge">
              <span className="hero__badge-dot" />
              Fahrschule im Schwarzwald
            </div>
            <h1 className="hero__h1">
              <span className="hero__h1-top">Dein Führerschein –</span>
              <span className="hero__h1-bottom">Sicher. Persönlich. Heinzelmann.</span>
            </h1>
            <p className="hero__sub">
              PKW und Motorrad-Führerschein in entspannter Atmosphäre. Robin Heinzelmann begleitet Sie persönlich vom ersten Kilometer bis zur bestandenen Prüfung – in Baiersbronn, Freudenstadt &amp; Pfalzgrafenweiler.
            </p>
            <div className="hero__actions">
              <a href="#kontakt" className="btn btn--primary btn--lg">Kostenlos beraten lassen <span className="btn__arrow">→</span></a>
              <a href="#leistungen" className="btn btn--outline-white btn--lg">Alle Leistungen</a>
            </div>
            <div className="hero__quick">
              <span className="hero__quick-item"><PhoneIcon /><a href="tel:+4917020411197">+49 170 20411197</a></span>
              <span className="hero__quick-sep" />
              <span className="hero__quick-item"><MailIcon /><a href="mailto:info@fahrschule-heinzelmann.de">info@fahrschule-heinzelmann.de</a></span>
              <span className="hero__quick-sep" />
              <span className="hero__quick-item"><MapPinIcon /><span>3 Standorte im Schwarzwald</span></span>
            </div>
          </div>
          <div className="hero__scroll">
            <div className="hero__scroll-mouse"><div className="hero__scroll-wheel" /></div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats-band">
          <div className="container">
            <div className="stats-band__grid">
              <StatCard num={200} suffix="+" label="Erfolgreiche Prüflinge" />
              <StatCard num={98} suffix="%" label="Erstbestehensquote" />
              <StatCard num={3} label="Standorte im Schwarzwald" />
              <StatCard num={6} label="Führerscheinklassen" />
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="section">
          <div className="container">
            <div className="about">
              <div className="about__text">
                <span className="eyebrow reveal">Über uns</span>
                <h2 className="h2 reveal">Persönlich.<br /><em>Professionell. Erfolgreich.</em></h2>
                <p className="body-text reveal">Fahrschule Heinzelmann steht für individuell abgestimmten Unterricht im Herzen des Schwarzwalds. Fahrlehrer Robin Heinzelmann bringt persönliches Engagement, pädagogisches Feingefühl und echte Leidenschaft fürs Fahren mit.</p>
                <p className="body-text reveal">Kein Massengeschäft – persönliche Betreuung, kurze Wartezeiten und ein Unterricht, der wirklich auf Sie eingeht. So werden aus Fahrschülern sichere Autofahrer.</p>
                <div className="about__bullets reveal">
                  {['Staatlich geprüfter Fahrlehrer', 'Kleine Gruppen & kurze Wartezeiten', 'PKW & Motorrad unter einem Dach', '3 Standorte – flexible Abholung möglich'].map((b, i) => (
                    <div key={i} className="about__bullet">
                      <span className="about__check"><CheckIcon /></span>{b}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '2rem' }} className="reveal">
                  <a href="#kontakt" className="btn btn--primary">Jetzt Kontakt aufnehmen <span className="btn__arrow">→</span></a>
                </div>
              </div>
              <div className="about__visual reveal">
                <div className="about__img-wrap">
                  <img src={ABOUT_IMG} alt="Robin Heinzelmann Fahrlehrer" className="about__img" loading="lazy" />
                  <div className="about__img-badge">
                    <span className="about__img-badge-num">Robin Heinzelmann</span>
                    <span className="about__img-badge-text">Ihr Fahrlehrer im Schwarzwald</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="section section--dark" id="leistungen">
          <div className="container">
            <div className="section__head">
              <span className="eyebrow eyebrow--light reveal">Leistungen</span>
              <h2 className="h2 h2--light reveal">Alles was Sie für den<br /><em>Führerschein</em> brauchen</h2>
            </div>
            <div className="services__grid">
              {SERVICES.map((s, i) => (
                <div key={i} className="service-card reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="service-card__icon">{s.icon}</div>
                  <div className="service-card__title">{s.title}</div>
                  <div className="service-card__desc">{s.desc}</div>
                  <div className="service-card__tags">{s.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
                  <a href="#kontakt" className="service-card__link">Mehr erfahren →</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MOTO BANNER */}
        <div className="moto-banner">
          <img src={MOTO_IMG} alt="Motorrad Fahrschule Heinzelmann" className="moto-banner__img" loading="lazy" />
          <div className="moto-banner__overlay">
            <div className="container">
              <p className="moto-banner__label">Motorradführerschein</p>
              <h2 className="moto-banner__h2">Freiheit auf zwei Rädern<br />erwartet Sie.</h2>
              <a href="#kontakt" className="btn btn--primary btn--lg">Motorrad anfragen <span className="btn__arrow">→</span></a>
            </div>
          </div>
        </div>

        {/* LOCATIONS */}
        <section className="section section--light" id="standorte">
          <div className="container">
            <div className="section__head">
              <span className="eyebrow reveal">Standorte</span>
              <h2 className="h2 reveal">Drei Standorte –<br /><em>eine Fahrschule</em></h2>
            </div>
            <div className="locations__grid">
              {LOCATIONS.map((loc, i) => (
                <div key={i} className={`location-card${loc.main ? ' location-card--main' : ''} reveal`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="location-card__icon"><MapPinIcon /></div>
                  <div className="location-card__city">{loc.city}</div>
                  <div className="location-card__street">{loc.street}</div>
                  <div className="location-card__hours">
                    {loc.hours.map((h, j) => (
                      <div key={j} className="location-card__hours-row">
                        <ClockIcon /><span><strong>{h.day}:</strong> {h.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="location-card__contact">
                    <a href={`tel:${loc.phone.replace(/\s/g,'')}`} className="location-card__link"><PhoneIcon />{loc.phone}</a>
                    <a href={`mailto:${loc.email}`} className="location-card__link"><MailIcon />{loc.email}</a>
                  </div>
                  {loc.note && <p className="location-card__note">{loc.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EVENTS */}
        <section className="section section--accent" id="termine">
          <div className="container">
            <div className="section__head">
              <span className="eyebrow eyebrow--light reveal">Nächste Termine</span>
              <h2 className="h2 h2--light reveal">Intensivkurse &amp;<br /><em>Erste-Hilfe-Termine</em></h2>
            </div>
            <div className="events__grid">
              {EVENTS.map((ev, i) => (
                <div key={i} className="event-card reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="event-card__date">{ev.date}</div>
                  <div className="event-card__info">
                    <div className="event-card__title">{ev.title}</div>
                    <div className="event-card__location"><MapPinIcon />{ev.location}</div>
                  </div>
                  <a href="#kontakt" className="btn btn--outline-white btn--sm">Anmelden →</a>
                </div>
              ))}
            </div>
            <p className="events__note">Aktuelle Termine auch per E-Mail: <a href="mailto:info@fahrschule-heinzelmann.de">info@fahrschule-heinzelmann.de</a></p>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq">
          <div className="container">
            <div className="section__head">
              <span className="eyebrow reveal">FAQ</span>
              <h2 className="h2 reveal">Häufige <em>Fragen</em></h2>
            </div>
            <div className="faq-section reveal"><FAQ /></div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="section section--dark" id="kontakt">
          <div className="container">
            <div className="contact">
              <div>
                <span className="eyebrow eyebrow--light reveal">Kontakt</span>
                <h2 className="h2 h2--light reveal">Jetzt<br /><em>Führerschein starten</em></h2>
                <p className="body-text body-text--light reveal">Schreiben Sie uns oder rufen Sie an – wir melden uns schnell und unkompliziert zurück.</p>
                <div className="contact__details">
                  {[
                    { icon: <PhoneIcon />, label: 'Telefon', value: '+49 170 20411197', href: 'tel:+4917020411197' },
                    { icon: <MailIcon />, label: 'E-Mail', value: 'info@fahrschule-heinzelmann.de', href: 'mailto:info@fahrschule-heinzelmann.de' },
                    { icon: <MapPinIcon />, label: 'Hauptsitz', value: 'Oberdorfstr. 12, 72270 Baiersbronn' },
                    { icon: <ClockIcon />, label: 'Bürozeiten', value: 'Mo 08–12 Uhr · Di–Do 15–18 Uhr' },
                  ].map((d, i) => (
                    <div key={i} className="contact__detail reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                      <div className="contact__detail-icon">{d.icon}</div>
                      <span>
                        <strong>{d.label}</strong>
                        {d.href ? <a href={d.href}><span>{d.value}</span></a> : <span>{d.value}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="contact__form-wrap reveal"><ContactForm /></div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-band">
          <div className="cta-band__road">
            <div className="cta-band__road-line" />
            <div className="cta-band__road-line cta-band__road-line--2" />
          </div>
          <div className="container cta-band__content">
            <h2 className="cta-band__h2 reveal">Bereit für Ihren Führerschein?</h2>
            <p className="cta-band__sub reveal">Melden Sie sich noch heute an – persönlich, unkompliziert und ohne lange Wartezeit.</p>
            <div className="cta-band__actions reveal">
              <a href="#kontakt" className="btn btn--primary btn--lg">Jetzt anmelden <span className="btn__arrow">→</span></a>
              <a href="tel:+4917020411197" className="btn btn--outline btn--lg">+49 170 20411197</a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer__inner">
          <div>
            <img src={LOGO} alt="Fahrschule Heinzelmann" className="footer__logo" width="160" height="60" />
            <p className="footer__tagline">Ihr Fahrlehrer im Schwarzwald.</p>
            <p className="footer__address">Oberdorfstr. 12 · 72270 Baiersbronn</p>
          </div>
          <div className="footer__cols">
            <div className="footer__col">
              <span className="footer__col-label">Leistungen</span>
              <a href="#leistungen">PKW – Klasse B</a>
              <a href="#leistungen">Motorrad – A / A2</a>
              <a href="#leistungen">Theorie-Intensivkurs</a>
              <a href="#leistungen">Erste Hilfe</a>
              <a href="#leistungen">Fahrsimulator</a>
            </div>
            <div className="footer__col">
              <span className="footer__col-label">Standorte</span>
              <a href="#standorte"><MapPinIcon />Baiersbronn</a>
              <a href="#standorte"><MapPinIcon />Freudenstadt</a>
              <a href="#standorte"><MapPinIcon />Pfalzgrafenweiler</a>
            </div>
            <div className="footer__col">
              <span className="footer__col-label">Kontakt</span>
              <a href="tel:+4917020411197"><PhoneIcon />+49 170 20411197</a>
              <a href="mailto:info@fahrschule-heinzelmann.de"><MailIcon />info@fahrschule-heinzelmann.de</a>
              <span style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.35)', marginTop: '.25rem' }}>Mo 08–12 · Di–Do 15–18 Uhr</span>
            </div>
          </div>
        </div>
        <div className="container footer__bottom">
          <div className="footer__bottom-inner">
            <span>© {new Date().getFullYear()} Fahrschule Heinzelmann – Robin Heinzelmann</span>
            <div className="footer__bottom-links">
              <a href="/impressum">Impressum</a>
              <a href="/datenschutz">Datenschutz</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
