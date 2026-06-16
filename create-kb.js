const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, LevelFormat, ExternalHyperlink
} = require("docx");
const fs = require("fs");

const BLUE       = "0078FF";
const DARK       = "0E0E1A";
const LIGHT_BLUE = "EBF4FF";
const GRAY       = "F5F5F5";
const WHITE      = "FFFFFF";
const TEXT       = "1A1A2E";
const GRAY_TEXT  = "666680";

const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDEE" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: DARK })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: BLUE })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: TEXT })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: TEXT, ...opts })]
  });
}

function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: TEXT, bold })]
  });
}

function infoBox(title, lines, color = LIGHT_BLUE) {
  const rows = [];
  if (title) {
    rows.push(new TableRow({
      children: [new TableCell({
        borders, width: { size: 9360, type: WidthType.DXA },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 180, right: 180 },
        children: [new Paragraph({ children: [new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: WHITE })] })]
      })]
    }));
  }
  lines.forEach(line => {
    rows.push(new TableRow({
      children: [new TableCell({
        borders, width: { size: 9360, type: WidthType.DXA },
        shading: { fill: color, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 180, right: 180 },
        children: [new Paragraph({ children: [new TextRun({ text: line, font: "Arial", size: 21, color: TEXT })] })]
      })]
    }));
  });
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows });
}

function twoCol(left, right, leftW = 4500, rightW = 4860) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    rows: [new TableRow({
      children: [
        new TableCell({ borders: noBorders, width: { size: leftW, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 180 }, children: left }),
        new TableCell({ borders: noBorders, width: { size: rightW, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 180, right: 0 }, children: right }),
      ]
    })]
  });
}

function pricingTable() {
  const colW = [2200, 2580, 2580, 2000];
  const headerCells = ["Paket", "Starter", "Growth", "Enterprise"].map((t, i) => new TableCell({
    borders, width: { size: colW[i], type: WidthType.DXA },
    shading: { fill: i === 0 ? "E8EAF6" : BLUE, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: t, font: "Arial", size: 22, bold: true, color: i === 0 ? TEXT : WHITE })] })]
  }));

  const rows2 = [
    ["Preis/Monat", "€ 399", "€ 899", "Individuell"],
    ["Anrufe/Monat", "bis 500", "Unbegrenzt", "Unbegrenzt"],
    ["Sprachen", "DE + EN", "5+ Sprachen", "40+ Sprachen"],
    ["Reaktionszeit", "< 1 Sek", "< 1 Sek", "< 1 Sek"],
    ["Buchungsannahme", "—", "✓", "✓"],
    ["CRM-Integration", "—", "✓", "✓"],
    ["Dedizierter Support", "—", "—", "✓"],
    ["Einrichtungszeit", "48 Std", "48 Std", "Individuell"],
    ["Vertragsbindung", "Monatlich", "Monatlich", "Individuell"],
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colW,
    rows: [
      new TableRow({ children: headerCells }),
      ...rows2.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => new TableCell({
          borders, width: { size: colW[ci], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? WHITE : GRAY, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, font: "Arial", size: 21, color: TEXT, bold: ci === 0 })] })]
        }))
      }))
    ]
  });
}

function space(n = 1) {
  return new Paragraph({ spacing: { before: 0, after: n * 120 }, children: [new TextRun("")] });
}

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 560, hanging: 280 } } } }]
    }]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: TEXT } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: DARK }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: BLUE }, paragraph: { outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: TEXT }, paragraph: { outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
          children: [
            new TextRun({ text: "AVA AI  —  Interne Wissensdatenbank", font: "Arial", size: 18, color: GRAY_TEXT }),
            new TextRun({ text: "  |  Vertraulich", font: "Arial", size: 18, color: "CC0000", bold: true }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDEE", space: 4 } },
          children: [
            new TextRun({ text: "© AVA AI · ava-hq.com · Alle Rechte vorbehalten", font: "Arial", size: 18, color: GRAY_TEXT }),
            new TextRun({ text: "        Seite ", font: "Arial", size: 18, color: GRAY_TEXT }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: GRAY_TEXT }),
          ]
        })]
      })
    },
    children: [

      // ════ TITELSEITE ════
      space(4),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 240 },
        children: [new TextRun({ text: "AVA AI", font: "Arial", size: 72, bold: true, color: BLUE })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: "Interne Wissensdatenbank", font: "Arial", size: 36, color: TEXT })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "Intelligent Systems. Real Results.", font: "Arial", size: 24, color: GRAY_TEXT, italics: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 960 },
        children: [new TextRun({ text: "Stand: Juni 2025  ·  VERTRAULICH", font: "Arial", size: 20, color: "CC0000", bold: true })]
      }),

      infoBox("Was ist dieses Dokument?", [
        "Dieses Dokument ist die offizielle interne Wissensdatenbank von AVA AI.",
        "Es enthält alle wichtigen Informationen zu Produkt, Preisen, Prozessen,",
        "Vertrieb, Technik und Kommunikation — als zentrale Referenz für das Team.",
        "",
        "Website: ava-hq.com  ·  E-Mail: dankiazad@gmail.com",
      ]),
      space(8),

      // ════ 1. UNTERNEHMEN ════
      h1("1.  Unternehmen & Mission"),

      h2("1.1  Wer wir sind"),
      p("AVA AI ist ein Technologieunternehmen spezialisiert auf KI-gestützte Voice Agents für Hotels und Servicebetriebe. Wir automatisieren Gästekommunikation, Buchungsprozesse und Anrufmanagement — 24/7, mehrsprachig, ohne Personalaufwand."),
      space(),

      h2("1.2  Mission"),
      infoBox(null, [
        "\"Wir geben Hotels und Servicebetrieben die Werkzeuge einer Großkette —",
        "  zu einem Bruchteil der Kosten. Kein Anruf bleibt unbeantwortet.\"",
      ], LIGHT_BLUE),
      space(),

      h2("1.3  Kernwerte"),
      bullet("Qualität vor Quantität — lieber weniger Kunden, aber maximale Ergebnisse"),
      bullet("Transparenz — klare Zahlen, kein Verkäufer-Bullshit"),
      bullet("Geschwindigkeit — von Gespräch zu Go-Live in maximal 3 Wochen"),
      bullet("Ergebnisorientierung — positiver ROI ab dem ersten Monat oder Geld zurück"),
      space(),

      h2("1.4  Zielgruppe"),
      bullet("Hotels aller Größen: Boutique-Hotels, Pensionen, Resorts, Kettenhotels"),
      bullet("Restaurants mit hohem Anrufvolumen (Reservierungen, Abholungen)"),
      bullet("Spas, Wellnesszentren, Freizeitanlagen"),
      bullet("Alle Servicebetriebe, die täglich > 20 Anrufe erhalten"),
      space(2),

      // ════ 2. PRODUKT ════
      h1("2.  Produkt — AVA Voice Agent"),

      h2("2.1  Was macht AVA?"),
      p("AVA ist ein KI-Voice-Agent, der Telefonanrufe vollautomatisch entgegennimmt, bearbeitet und beantwortet. AVA klingt natürlich und menschlich — die meisten Anrufer bemerken nicht, dass sie mit einer KI sprechen."),
      space(),

      h2("2.2  Funktionen im Überblick"),
      twoCol([
        h3("Kern-Funktionen"),
        bullet("24/7 Anrufannahme — kein Anruf geht verloren"),
        bullet("FAQ-Beantwortung in Echtzeit"),
        bullet("Reservierungs- und Buchungsannahme"),
        bullet("Weiterleitung dringender Anrufe"),
        bullet("Mehrsprachig (40+ Sprachen, auto-erkannt)"),
        bullet("Reaktionszeit < 1 Sekunde"),
      ], [
        h3("Erweiterte Funktionen"),
        bullet("CRM-Integration (Salesforce, HubSpot, Mews, Opera)"),
        bullet("E-Mail-Bestätigungen automatisch"),
        bullet("Gesprächsprotokolle & Reports"),
        bullet("Individuelle Wissensdatenbank pro Hotel"),
        bullet("Anpassbare Stimme & Persönlichkeit"),
        bullet("Calendly / Buchungssystem-Anbindung"),
      ]),
      space(),

      h2("2.3  Technische Grundlage"),
      bullet("Voice AI: Vapi.ai (Spracherkennung + Sprachausgabe)"),
      bullet("LLM: GPT-4o (Sprachverständnis und Antwortgenerierung)"),
      bullet("Transcription: Deepgram (Echtzeit-Transkription)"),
      bullet("Voice Provider: ElevenLabs (menschliche Stimme)"),
      bullet("Infrastruktur: EU-Server, Ende-zu-Ende verschlüsselt"),
      bullet("Compliance: DSGVO-konform, ISO 27001 ready"),
      space(),

      h2("2.4  Was AVA NICHT kann"),
      bullet("Komplexe juristische oder medizinische Beratung"),
      bullet("Physische Aktionen (Zimmerschlüssel ausgeben etc.)"),
      bullet("Anrufe ohne Internetverbindung"),
      p("→ In diesen Fällen leitet AVA den Anruf automatisch an einen menschlichen Mitarbeiter weiter.", { color: BLUE, bold: true }),
      space(2),

      // ════ 3. PREISE ════
      h1("3.  Preise & Pakete"),

      h2("3.1  Übersicht"),
      pricingTable(),
      space(),

      h2("3.2  Was ist in jedem Paket enthalten?"),
      h3("Starter — € 399/Monat"),
      bullet("KI Voice Agent mit individueller Wissensdatenbank für das Hotel"),
      bullet("24/7 Anrufannahme, bis zu 500 Gespräche pro Monat"),
      bullet("FAQ-Beantwortung (Zeiten, Parken, WLAN, Preise, etc.)"),
      bullet("E-Mail-Benachrichtigung bei neuen Anfragen"),
      bullet("Basis-Reporting: Anrufvolumen, Häufigste Fragen"),
      bullet("Sprachen: Deutsch + Englisch"),
      bullet("Einrichtungszeit: 48 Stunden"),
      space(),

      h3("Growth — € 899/Monat"),
      bullet("Alles aus Starter, plus:"),
      bullet("Unbegrenzte Anrufe"),
      bullet("Buchungsannahme und Bestätigung per E-Mail"),
      bullet("5+ Sprachen (Deutsch, Englisch, Französisch, Italienisch, Spanisch)"),
      bullet("CRM-Integration (Mews, Opera, HubSpot oder Salesforce)"),
      bullet("Monatliche Optimierungssitzung (30 Min. mit Team)"),
      bullet("Prioritäts-Support (Antwort < 4 Stunden)"),
      space(),

      h3("Enterprise — Individuell"),
      bullet("Alles aus Growth, plus:"),
      bullet("Multi-Standort Support (Hotelgruppen, Ketten)"),
      bullet("40+ Sprachen"),
      bullet("Individuelle API-Integrationen und Workflows"),
      bullet("Dedizierter Account Manager"),
      bullet("SLA-Garantie 99.9% Uptime"),
      bullet("Enterprise-Sicherheit und Compliance"),
      space(),

      h2("3.3  Rabatte & Sonderkonditionen"),
      bullet("Jahresvertrag: 15% Rabatt auf alle Pakete"),
      bullet("Hotelgruppen ab 3 Standorten: individuelles Angebot"),
      bullet("Non-Profit / Jugendherbergen: auf Anfrage"),
      space(2),

      // ════ 4. VERTRIEB ════
      h1("4.  Vertriebsprozess"),

      h2("4.1  Der Sales-Funnel"),
      infoBox("Schritt-für-Schritt Prozess", [
        "1. ERSTKONTAKT     — Website, Kaltakquise, Empfehlung, LinkedIn",
        "2. QUALIFIKATION   — Passt der Betrieb? (Anrufvolumen > 20/Tag?)",
        "3. DEMO-CALL       — 30 Min. kostenlos via Calendly (ava-hq.com)",
        "4. ANALYSE         — ROI-Berechnung, individuelle Lösung vorstellen",
        "5. ANGEBOT         — Paket + Preise schriftlich senden",
        "6. ONBOARDING      — Einrichtung in 48 Std, Go-Live in 3 Wochen",
        "7. ERFOLG MESSEN   — Monatliches Reporting, Feedback, Upsell",
      ]),
      space(),

      h2("4.2  Qualifizierungsfragen (im ersten Gespräch)"),
      bullet("Wie viele Anrufe erhalten Sie täglich an der Rezeption?"),
      bullet("Haben Sie das Gefühl, Anrufe zu verpassen — vor allem abends/nachts/am Wochenende?"),
      bullet("Wie viele Mitarbeiter sind aktuell für Telefonkommunikation zuständig?"),
      bullet("Welche Buchungssoftware nutzen Sie? (Mews, Opera, etc.)"),
      bullet("Was ist Ihr größter Schmerzpunkt beim Thema Gästekommunikation?"),
      space(),

      h2("4.3  Häufige Einwände & Antworten"),
      twoCol([
        new Paragraph({ children: [new TextRun({ text: "Einwand", font: "Arial", size: 22, bold: true, color: WHITE })],
          shading: { fill: "CC0000", type: ShadingType.CLEAR } }),
        ...["\"Zu teuer\"", "\"Gäste wollen echte Menschen\"", "\"Wir haben schon Personal\"", "\"Was wenn AVA Fehler macht?\"", "\"Klingt das nicht roboterhaft?\""].map(t =>
          new Paragraph({ spacing: { before: 60, after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDEE" } },
            children: [new TextRun({ text: t, font: "Arial", size: 20, bold: true, color: TEXT })] }))
      ], [
        new Paragraph({ children: [new TextRun({ text: "Antwort", font: "Arial", size: 22, bold: true, color: WHITE })],
          shading: { fill: BLUE, type: ShadingType.CLEAR } }),
        ...["Ein Rezeptionist kostet €2.500–3.500/Monat. AVA ab €399.", "94% der Gäste bevorzugen sofortige Antwort über menschliche mit Wartezeit.", "Personal wird entlastet für Aufgaben, die wirklich Menschlichkeit erfordern.", "AVA erkennt Grenzen und leitet automatisch weiter — kein Fehler bleibt unbeantwortet.", "ElevenLabs-Technologie: identisch mit menschlicher Stimme. Wir zeigen gerne eine Demo."].map(t =>
          new Paragraph({ spacing: { before: 60, after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDEE" } },
            children: [new TextRun({ text: t, font: "Arial", size: 20, color: TEXT })] }))
      ], 3000, 6360),
      space(2),

      // ════ 5. ONBOARDING ════
      h1("5.  Onboarding & Einrichtung"),

      h2("5.1  Ablauf nach Vertragsabschluss"),
      twoCol([
        infoBox("Woche 1: Setup", [
          "Tag 1–2: Zugang zu Buchungssystem",
          "Tag 2–3: Wissensdatenbank befüllen",
          "Tag 3–4: AVA konfigurieren & testen",
          "Tag 5:   Stimme & Persönlichkeit anpassen",
        ])
      ], [
        infoBox("Woche 2–3: Launch", [
          "Woche 2: Interne Tests mit Team",
          "Woche 2: Feedbackrunde & Feintuning",
          "Woche 3: Soft Launch (10% der Anrufe)",
          "Woche 3: Vollständiger Go-Live",
        ])
      ]),
      space(),

      h2("5.2  Was wir vom Kunden brauchen"),
      bullet("Zugangsdaten zum Buchungssystem (nur Lesezugriff für Phase 1)"),
      bullet("Liste der häufigsten Gästefragen (ca. 20–30 Fragen)"),
      bullet("Aktuelle Preisliste, Check-in/Check-out-Zeiten, Policies"),
      bullet("Telefonnummer, die AVA übernehmen soll (oder Weiterleitung einrichten)"),
      bullet("Ansprechpartner für Eskalationen (wer wird kontaktiert bei dringenden Fällen?)"),
      space(),

      h2("5.3  Wissensdatenbank-Vorlage für Hotels"),
      p("Jeder Kunde bekommt eine individuelle Wissensdatenbank. Diese wird in Vapi.ai hochgeladen und enthält:"),
      bullet("Grundinfo: Name, Adresse, Telefon, E-Mail, Website"),
      bullet("Check-in/Check-out: Zeiten, Early/Late Check-in Policy"),
      bullet("Zimmertypen und Preise (saisonal)"),
      bullet("Frühstück: Zeiten, Optionen, Preise"),
      bullet("Parken: Verfügbarkeit, Kosten, Reservierung"),
      bullet("WLAN: Netzwerkname und Passwort (oder Beschreibung)"),
      bullet("Haustiere: Erlaubt? Kosten?"),
      bullet("Restaurantzeiten, Menü-Highlights"),
      bullet("Spa/Wellness: Buchung, Öffnungszeiten"),
      bullet("Stornierungsrichtlinien"),
      bullet("Lokale Tipps: Top-Restaurants, Sehenswürdigkeiten, Transfers"),
      space(2),

      // ════ 6. KOMMUNIKATION ════
      h1("6.  Kommunikation & Branding"),

      h2("6.1  Tonalität"),
      bullet("Professionell aber menschlich — kein Konzern-Deutsch"),
      bullet("Direkt und klar — keine langen Schachtelsätze"),
      bullet("Selbstbewusst — wir sind gut und wissen es"),
      bullet("Lösungsorientiert — wir nennen immer den nächsten Schritt"),
      space(),

      h2("6.2  Wie wir AVA beschreiben"),
      infoBox("Offiziell (kurz)", ["AVA ist der KI-Voice-Agent für Hotels und Servicebetriebe — 24/7, mehrsprachig, ohne Pause."]),
      space(),
      infoBox("Offiziell (lang)", [
        "AVA automatisiert die Gästekommunikation von Hotels vollständig:",
        "Anrufannahme, FAQ-Beantwortung, Buchungserfassung und Weiterleitung —",
        "rund um die Uhr, in 40+ Sprachen, ohne Wartezeit und ohne Personalkosten.",
      ]),
      space(),

      h2("6.3  Was wir NICHT sagen"),
      bullet("Nicht: \"unser Chatbot\" — AVA ist ein Voice Agent, kein Chat"),
      bullet("Nicht: \"KI-Roboter\" — AVA ist ein intelligenter Assistent"),
      bullet("Nicht: \"ersetzt Mitarbeiter\" — AVA entlastet Mitarbeiter"),
      bullet("Nicht: \"günstig\" — AVA ist kosteneffizient und ROI-stark"),
      space(),

      h2("6.4  Kontaktdaten"),
      bullet("Website: https://ava-hq.com"),
      bullet("E-Mail: dankiazad@gmail.com"),
      bullet("Demo buchen: https://calendly.com/dankiazad/30min"),
      space(2),

      // ════ 7. TECHNIK ════
      h1("7.  Technischer Überblick"),

      h2("7.1  Tech-Stack"),
      twoCol([
        infoBox("Frontend (Website)", [
          "Framework: React 19 + Vite 8",
          "Sprache: JavaScript (JSX)",
          "Styling: Custom CSS Design System",
          "Deployment: Vercel (CDN)",
          "Domain: ava-hq.com",
        ])
      ], [
        infoBox("Voice Agent", [
          "Platform: Vapi.ai",
          "LLM: GPT-4o (OpenAI)",
          "Voice: ElevenLabs",
          "Transcription: Deepgram",
          "WebRTC: Daily.co",
        ])
      ]),
      space(),

      h2("7.2  Sicherheit & Compliance"),
      bullet("HTTPS mit HSTS (2 Jahre) — alle Verbindungen verschlüsselt"),
      bullet("Content Security Policy — blockt fremde Scripts"),
      bullet("X-Frame-Options: DENY — verhindert Clickjacking"),
      bullet("Permissions Policy — Kamera/Standort gesperrt"),
      bullet("Gesprächsdaten auf EU-Servern gespeichert"),
      bullet("DSGVO-konform — Daten gehören dem Kunden"),
      space(),

      h2("7.3  Zugang & Logins (NUR intern — vertraulich!)"),
      infoBox("⚠️ ACHTUNG: Nur autorisierte Personen", [
        "Vercel Dashboard:    vercel.com → Team: dankiazad-5935s",
        "Vapi Dashboard:      dashboard.vapi.ai",
        "Vapi Public Key:     11a16c26-443f-4159-a318-204ec041741b",
        "Vapi Assistant ID:   75d1fe79-eb98-48e0-97dc-f917f5610725",
        "Calendly:            calendly.com/dankiazad",
        "Domain-Registrar:    Vercel Domains",
      ], "FFF3F3"),
      space(2),

      // ════ 8. FAQ INTERN ════
      h1("8.  Interne FAQ"),

      h2("Was passiert wenn AVA einen Anruf nicht versteht?"),
      p("AVA erkennt automatisch wenn eine Anfrage außerhalb seiner Wissensbasis liegt und leitet den Anruf an einen definierten menschlichen Ansprechpartner weiter. Kein Anruf bleibt unbearbeitet."),
      space(),

      h2("Wie lange dauert die Einrichtung wirklich?"),
      p("Technisch: 24–48 Stunden. Inkl. Wissensdatenbank befüllen, testen und optimieren: 2–3 Wochen bis zum vollständigen Go-Live."),
      space(),

      h2("Kann AVA in bestehende Telefonnummern integriert werden?"),
      p("Ja. Zwei Optionen: (1) Weiterleitung der bestehenden Nummer auf AVA, oder (2) AVA erhält eine eigene Nummer. Beides funktioniert ohne Hardwareänderung."),
      space(),

      h2("Was ist der Unterschied zu einem normalen Telefonmenü (IVR)?"),
      p("IVR: starr, frustrierend, \"Drücken Sie 1 für...\". AVA: echte Konversation, versteht natürliche Sprache, beantwortet Fragen direkt, klingt menschlich. Kein Vergleich."),
      space(),

      h2("Was wenn ein Kunde kündigt?"),
      p("Monatlich kündbar — kein Problem. Daten werden auf Wunsch vollständig gelöscht. Wir fragen nach dem Grund und verbessern uns."),
      space(2),

      // ════ 9. NOTFALLPLAN ════
      h1("9.  Notfallplan & Eskalation"),

      infoBox("Bei technischen Problemen", [
        "1. Website down:   Vercel Status prüfen → status.vercel.com",
        "2. Vapi down:      Vapi Status prüfen → status.vapi.ai",
        "3. Anrufausfall:   Kunden sofort informieren, manuelle Weiterleitung aktivieren",
        "4. Bug auf Website: Code prüfen, Hotfix deployen via: vercel --yes --prod",
      ], "FFF8E1"),
      space(2),

      // ════ ENDE ════
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 720, after: 120 },
        children: [new TextRun({ text: "— Ende der internen Wissensdatenbank —", font: "Arial", size: 20, color: GRAY_TEXT, italics: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "AVA AI  ·  ava-hq.com  ·  Intelligent Systems. Real Results.", font: "Arial", size: 20, color: BLUE, bold: true })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const path = "C:\\Users\\hss-azda3005\\OneDrive - Heinrich-Schickhardt-Schule\\Desktop\\AVA\\AVA_Wissensdatenbank.docx";
  fs.writeFileSync(path, buffer);
  console.log("✓ Dokument erstellt:", path);
}).catch(err => console.error("Fehler:", err));
