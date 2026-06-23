# Oest Gruppe – Website (Demo)

Moderne, technisch optimierte Neugestaltung der Website der **Oest Gruppe** (Freudenstadt) –
erstellt von **AVA** als Verkaufs-Demo.

Reine statische Website **ohne Build-Step** – einfach hochladen, fertig.

## Inhalt

| Datei | Beschreibung |
|-------|--------------|
| `index.html` | Startseite (Hero, Geschäftsbereiche, Über uns, E-Fuels, Downloads-Teaser, Kontakt) |
| `downloads.html` | Download-Bereich mit Filter-Tabs & Live-Suche über alle Broschüren/Flyer |
| `netlify.toml` | Security-Header, Caching & saubere URL `/downloads` |
| `oest-logo.svg` | Offizielles Oest-Logo (von oest.de) |
| `favicon.svg` | Favicon (= offizielles Logo) |
| `site.webmanifest` | PWA-Manifest |
| `robots.txt`, `sitemap.xml` | SEO |

## Online stellen (Netlify – einfachster Weg)

**Variante A – Drag & Drop (ohne Account-Setup):**
1. Auf <https://app.netlify.com/drop> gehen.
2. Den **gesamten Ordner `oest-website`** in das Browserfenster ziehen.
3. Fertig – die Seite ist sofort unter einer `*.netlify.app`-Adresse live.

**Variante B – Netlify CLI:**
```bash
cd oest-website
netlify deploy --prod
```
(`publish` ist in `netlify.toml` bereits auf `.` gesetzt.)

> Funktioniert genauso bei **Vercel**, **Cloudflare Pages** oder **GitHub Pages** –
> es sind nur statische Dateien. Auf Plattformen ohne `netlify.toml`-Support muss
> `/downloads` ggf. als `/downloads.html` verlinkt werden.

## Technische Highlights

- **0 Dependencies / 0 Build** – nur HTML, CSS & ein wenig Vanilla-JS → Top-Ladezeiten & Lighthouse-Werte
- **Responsive** mobile-first inkl. Mobile-Menü
- **Accessibility:** Skip-Link, ARIA-Rollen (Tabs/Dialog), `:focus-visible`, `prefers-reduced-motion`, kontrastreiche Farben
- **SEO:** sprechende Titel/Descriptions, Canonical, Open-Graph, `sitemap.xml`, `robots.txt`
- **Structured Data (JSON-LD):** `Organization` + `BreadcrumbList`
- **Security-Header** via `netlify.toml` (CSP, HSTS, X-Frame-Options, …)
- **Performance:** Font-`preconnect`, System-Font-Fallback, IntersectionObserver-Reveals

## Anpassen

- **Branding:** Es werden das offizielle Oest-Logo (`oest-logo.svg`) und die offiziellen Markenfarben verwendet – Blau `#034EA2` (Primär) und Rot `#ED1C24` (Akzent) auf Weiß.
- Farben/Abstände: CSS-Variablen im `:root`-Block (jede HTML-Datei).
- Download-Liste: Array `DOCS` unten in `downloads.html` – Titel, Kategorie und später die echten PDF-Links (`href`) eintragen.
- Echte Domain: in `sitemap.xml`, `robots.txt` und den `canonical`/`og:url`-Tags ist bereits `https://www.oest.de` hinterlegt.
