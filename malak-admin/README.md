# Malak GmbH – Backoffice & Online-Shop

Vollständiges E-Commerce-System: öffentlicher Shop mit echtem Checkout plus
professionelles Verwaltungssystem (Backoffice), mit dem der Shop-Besitzer
**ohne Programmierkenntnisse** alles selbst verwaltet.

## Demo starten (kostenlos, öffentlicher Link)

**Doppelklick auf `start-demo.bat`** — startet Server + kostenlosen Cloudflare-Tunnel
(kein Account nötig) und zeigt den öffentlichen Link an, der auch in `DEMO-URL.txt`
gespeichert wird. Fenster offen lassen; nach jedem Neustart gibt es eine neue Zufalls-URL.

> ⚠ **Der Tunnel-Link ist nur für kurze Live-Vorführungen gedacht.** Er stirbt, sobald
> der PC aus/im Standby ist, und die URL ändert sich bei jedem Neustart. Links, die man
> Kunden schickt, gehören auf das dauerhafte Hosting (siehe unten).

## Dauerhaft online (fester Link für Kunden)

Im Repo-Root liegt eine `render.yaml` (Blueprint für [Render](https://render.com), kostenlos):

1. Repo zu GitHub pushen (inkl. `malak-admin/`)
2. render.com → *Sign in with GitHub* → *New +* → *Blueprint* → Repo wählen → *Apply*
3. Feste URL, die immer erreichbar ist: `https://malak-demo.onrender.com` (Backoffice: `/admin`)

Free-Plan: schläft nach 15 Min. ohne Besucher ein, erster Aufruf danach dauert ~30–60 Sek.
Wer das nicht will: Starter-Plan (7 $/Monat) oder kostenlosen Ping-Dienst
(z. B. uptimerobot.com, alle 10 Min. anpingen) einrichten.

## Lokal starten

```bash
npm install
npm start
```

| Adresse | Bereich |
|---|---|
| http://localhost:4000 | Shop (mit Warenkorb, Gutscheinen & Checkout) |
| http://localhost:4000/admin | Backoffice |

**Standard-Zugang (Demo):** Benutzer `malak` · Passwort `malak2026`
(überschreibbar über `ADMIN_USER` / `ADMIN_PASSWORD` in `.env` bzw. Render → Environment).

## Funktionsumfang Backoffice

| Bereich | Funktionen |
|---|---|
| **Übersicht** | Umsatz/Bestellungen heute, offene Bestellungen, niedriger Bestand, neue Kunden, Besucher, Umsatz-Chart, Top-Produkte, letzte Bestellungen |
| **Bestellungen** | Statuswechsel (Offen→Bezahlt→…→Zugestellt/Storniert), Trackingnummer & Versanddienst, interne Notizen, **Rechnung & Lieferschein drucken**, Storno bucht Lager automatisch zurück |
| **Produkte** | Anlegen/Bearbeiten/Löschen mit 30+ Feldern in 7 Tabs: Allgemein, Preise & Steuern (EK/VK/Streichpreis/MwSt/SKU/Barcode), Lager, Versand (Gewicht/Maße/Klasse), Medien (**Drag-&-Drop-Upload, Mehrfachbilder, Video-URL**), Varianten (Farben/Größen/Material/Tags), SEO (Titel/Beschreibung/Slug). Bulk-Aktionen, Sortierung, Suche, Pagination |
| **Lager** | Wareneingang/-ausgang buchen, Inventur-Korrekturen, Bewegungsprotokoll, Lagerwert, automatische Warnungen bei Mindestbestand |
| **Kategorien** | Anlegen/Bearbeiten, Unterkategorien, Icons, **Drag-&-Drop-Sortierung** (gilt im Shop) |
| **Kunden** | Automatisch aus Bestellungen, Bestellhistorie, Adressen, Notizen, Sperren |
| **Gutscheine** | Prozent/Festbetrag, Mindestbestellwert, max. Einlösungen, Ablaufdatum |
| **Versand & Zahlung** | Versandarten mit Kosten, Gratis-Grenze, Zonen; Zahlungsmethoden per Schalter (PayPal, Karte, Klarna, Überweisung, Bar …) |
| **Analytics** | Umsatz, Gewinn, Ø Bestellwert, Besucher, Conversion, Top-Produkte/-Kategorien, 7/30/90 Tage |
| **Medien** | Zentrale Dateiverwaltung, Drag-&-Drop-Upload, Verwendungs-Anzeige |
| **Benutzer** | Mehrere Accounts, Rollen (**Admin/Mitarbeiter** mit echten Rechten), Passwort ändern, **2FA (TOTP)** mit Authenticator-App |
| **Einstellungen** | Shop-Name, Logo, **Hauptfarbe (färbt den Shop live um)**, Steuern, Währung, Kontakt, **Impressum/Datenschutz/AGB** (erscheinen im Shop) |
| **Komfort** | 🌙 Dark Mode, 🔍 globale Suche (Strg+K), 🔔 Benachrichtigungen (neue Bestellung, niedriger Bestand, neuer Kunde), Toasts, Skeleton-Loader, responsive |

## Shop-Features

Echter Checkout (Adresse → Versandart → Zahlart → Bestellung), Gutschein-Feld,
Lagerprüfung („Ausverkauft", „Nur noch X"), Bestellnummer-Bestätigung,
Rechtstexte-Popups, Besucherzähler. Bestellungen erscheinen sofort im Backoffice,
Bestände werden automatisch abgebucht.

## Technik & Sicherheit

- **Node.js + Express**, keine externen Dienste nötig
- Daten als JSON-Collections in `data/` (atomare Schreibvorgänge) — Backup = Ordner kopieren
- Passwörter mit **scrypt** gehasht, Login-Sperre nach 5 Fehlversuchen (5 Min.)
- **TOTP-2FA** (RFC 6238) ohne Drittanbieter implementiert
- Rollenbasierte Rechte auf API-Ebene (Mitarbeiter ↛ Einstellungen/Benutzer)
- Preise werden beim Checkout **serverseitig** validiert (nie vom Client übernommen)
- Upload-Filter (nur Bilder/Videos, max. 8 MB), Path-Traversal-Schutz
- Logging in `data/server.log`

## Bewusste Grenzen (nächste Ausbaustufe)

- **Zahlungsanbindung**: Zahlarten sind konfigurierbar und werden je Bestellung
  gespeichert; echter Geldfluss (Stripe/PayPal-API) braucht Händler-Accounts + API-Keys
- **E-Mail-Versand** (Bestellbestätigungen) braucht einen SMTP-Zugang
- Varianten sind Attribute (Farben/Größen), keine eigenen Lagerbestände je Variante
- Demo-Daten: 12 Bestellungen/6 Kunden sind als „Demo-Bestellung (Testdaten)" markiert und können gelöscht werden

## Live-Gang-Checkliste

1. `.env` anlegen: sicheres `ADMIN_PASSWORD`, festes `SESSION_SECRET`
2. Node-Hosting (Railway, Render, Hetzner …) — statisches Hosting reicht nicht
3. Demo-Bestellungen/-Kunden löschen, echte Rechtstexte eintragen
4. Produktbilder über Medien-Upload lokal hochladen (Unabhängigkeit vom alten Server)
