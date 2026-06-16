const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, LevelFormat, PageBreak
} = require("docx");
const fs = require("fs");

const BLUE      = "0078FF";
const DARK      = "0D0D1A";
const LIGHT     = "EBF4FF";
const GRAY      = "F7F7FA";
const WHITE     = "FFFFFF";
const TEXT      = "1A1A2E";
const GRAY_TEXT = "666680";
const RED       = "CC0000";

const brd  = { style: BorderStyle.SINGLE, size: 1, color: "CCCCDD" };
const brds = { top: brd, bottom: brd, left: brd, right: brd };
const nob  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const nobs = { top: nob, bottom: nob, left: nob, right: nob };

const W = 9360; // content width DXA (A4 with 1" margins)

function space(n = 1) {
  return new Paragraph({ spacing: { before: 0, after: n * 100 }, children: [new TextRun("")] });
}

function p(runs, opts = {}) {
  if (typeof runs === "string") runs = [new TextRun({ text: runs, font: "Arial", size: 21, color: TEXT })];
  return new Paragraph({ spacing: { before: 60, after: 100 }, ...opts, children: runs });
}

function pBold(text) {
  return p([new TextRun({ text, font: "Arial", size: 21, bold: true, color: TEXT })]);
}

function clause(num, title) {
  return new Paragraph({
    spacing: { before: 400, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: BLUE, space: 3 }
    },
    children: [
      new TextRun({ text: `§ ${num}  `, font: "Arial", size: 26, bold: true, color: BLUE }),
      new TextRun({ text: title, font: "Arial", size: 26, bold: true, color: DARK }),
    ]
  });
}

function sub(num, text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text: `(${num})  ${text}`, font: "Arial", size: 21, color: TEXT })]
  });
}

function subBold(num, text, rest = "") {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({ text: `(${num})  `, font: "Arial", size: 21, color: TEXT }),
      new TextRun({ text, font: "Arial", size: 21, bold: true, color: TEXT }),
      new TextRun({ text: rest, font: "Arial", size: 21, color: TEXT }),
    ]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 21, color: TEXT })]
  });
}

function infoBox(lines, color = LIGHT) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      borders: brds, width: { size: W, type: WidthType.DXA },
      shading: { fill: color, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 180, right: 180 },
      children: lines.map(l => new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: l, font: "Arial", size: 21, color: TEXT })]
      }))
    })]})],
  });
}

function fieldRow(label, width = 4500) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [width, W - width],
    rows: [new TableRow({ children: [
      new TableCell({ borders: nobs, width: { size: width, type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 0, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 21, bold: true, color: TEXT })] })] }),
      new TableCell({ borders: { top: nob, left: nob, right: nob, bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAACC" } },
        width: { size: W - width, type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 60, right: 0 },
        children: [new Paragraph({ children: [new TextRun({ text: "", font: "Arial", size: 21 })] })] })
    ]})],
  });
}

function signBox() {
  const half = W / 2 - 180;
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [half, 360, half],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: nobs, width: { size: half, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 0 },
          children: [new Paragraph({ children: [new TextRun({ text: "Ort, Datum", font: "Arial", size: 19, color: GRAY_TEXT })] })] }),
        new TableCell({ borders: nobs, width: { size: 360, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ borders: nobs, width: { size: half, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 0 },
          children: [new Paragraph({ children: [new TextRun({ text: "Ort, Datum", font: "Arial", size: 19, color: GRAY_TEXT })] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: { top: nob, left: nob, right: nob, bottom: { style: BorderStyle.SINGLE, size: 6, color: "AAAACC" } },
          width: { size: half, type: WidthType.DXA }, margins: { top: 400, bottom: 60, left: 0, right: 0 },
          children: [new Paragraph({ children: [] })] }),
        new TableCell({ borders: nobs, width: { size: 360, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ borders: { top: nob, left: nob, right: nob, bottom: { style: BorderStyle.SINGLE, size: 6, color: "AAAACC" } },
          width: { size: half, type: WidthType.DXA }, margins: { top: 400, bottom: 60, left: 0, right: 0 },
          children: [new Paragraph({ children: [] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: nobs, width: { size: half, type: WidthType.DXA }, margins: { top: 60, bottom: 0, left: 0, right: 0 },
          children: [new Paragraph({ children: [new TextRun({ text: "Auftragnehmer (AVA AI)", font: "Arial", size: 19, color: GRAY_TEXT })] })] }),
        new TableCell({ borders: nobs, width: { size: 360, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ borders: nobs, width: { size: half, type: WidthType.DXA }, margins: { top: 60, bottom: 0, left: 0, right: 0 },
          children: [new Paragraph({ children: [new TextRun({ text: "Auftraggeber (Kunde)", font: "Arial", size: 19, color: GRAY_TEXT })] })] }),
      ]}),
    ],
  });
}

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 560, hanging: 280 } } } }]
    }]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 21, color: TEXT } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: DARK }, paragraph: { outlineLevel: 0 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1300, bottom: 1440, left: 1300 }
      }
    },
    headers: {
      default: new Header({ children: [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
          children: [
            new TextRun({ text: "AVA AI  —  Dienstleistungsvertrag", font: "Arial", size: 18, color: GRAY_TEXT }),
            new TextRun({ text: "   |   VERTRAULICH", font: "Arial", size: 18, color: RED, bold: true }),
          ]
        })
      ]})
    },
    footers: {
      default: new Footer({ children: [
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDEE", space: 4 } },
          children: [
            new TextRun({ text: "AVA AI  ·  ava-hq.com  ·  contact@ava-hq.com", font: "Arial", size: 17, color: GRAY_TEXT }),
            new TextRun({ text: "        Seite ", font: "Arial", size: 17, color: GRAY_TEXT }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 17, color: GRAY_TEXT }),
            new TextRun({ text: " / ", font: "Arial", size: 17, color: GRAY_TEXT }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 17, color: GRAY_TEXT }),
          ]
        })
      ]})
    },

    children: [

      // ══ TITELBLOCK ══
      space(2),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "DIENSTLEISTUNGSVERTRAG", font: "Arial", size: 44, bold: true, color: DARK })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "KI Voice Agent & Digitale Automatisierungsleistungen", font: "Arial", size: 24, color: GRAY_TEXT, italics: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 400 },
        children: [new TextRun({ text: "AVA AI  ·  ava-hq.com", font: "Arial", size: 22, color: BLUE, bold: true })]
      }),

      // ══ VERTRAGSPARTEIEN ══
      new Paragraph({
        spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: "VERTRAGSPARTEIEN", font: "Arial", size: 22, bold: true, color: BLUE,
          characterSpacing: 80 })]
      }),

      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [W / 2 - 180, 360, W / 2 - 180],
        rows: [new TableRow({ children: [
          new TableCell({ borders: brds, width: { size: W / 2 - 180, type: WidthType.DXA },
            shading: { fill: GRAY, type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 180, right: 180 },
            children: [
              new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "AUFTRAGNEHMER", font: "Arial", size: 18, bold: true, color: BLUE, characterSpacing: 60 })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "AVA AI", font: "Arial", size: 22, bold: true, color: TEXT })] }),
              new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: "Inhaber: Azad Danki & Benjamin Serifovic", font: "Arial", size: 20, color: TEXT })] }),
              new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: "Herzog-Eugen-Str. 56/58, 72250 Freudenstadt", font: "Arial", size: 20, color: TEXT })] }),
              new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: "USt-IdNr.: in Beantragung", font: "Arial", size: 20, color: TEXT })] }),
              new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: "Web: ava-hq.com", font: "Arial", size: 20, color: TEXT })] }),
              new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "E-Mail: contact@ava-hq.com", font: "Arial", size: 20, color: TEXT })] }),
            ]
          }),
          new TableCell({ borders: nobs, width: { size: 360, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
          new TableCell({ borders: brds, width: { size: W / 2 - 180, type: WidthType.DXA },
            shading: { fill: LIGHT, type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 180, right: 180 },
            children: [
              new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "AUFTRAGGEBER (KUNDE)", font: "Arial", size: 18, bold: true, color: BLUE, characterSpacing: 60 })] }),
              new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: "Unternehmen:", font: "Arial", size: 19, bold: true, color: GRAY_TEXT })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, border: { bottom: brd }, children: [new TextRun({ text: " ", font: "Arial", size: 21 })] }),
              new Paragraph({ spacing: { before: 60, after: 20 }, children: [new TextRun({ text: "Ansprechpartner:", font: "Arial", size: 19, bold: true, color: GRAY_TEXT })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, border: { bottom: brd }, children: [new TextRun({ text: " ", font: "Arial", size: 21 })] }),
              new Paragraph({ spacing: { before: 60, after: 20 }, children: [new TextRun({ text: "Adresse:", font: "Arial", size: 19, bold: true, color: GRAY_TEXT })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, border: { bottom: brd }, children: [new TextRun({ text: " ", font: "Arial", size: 21 })] }),
              new Paragraph({ spacing: { before: 60, after: 20 }, children: [new TextRun({ text: "E-Mail:", font: "Arial", size: 19, bold: true, color: GRAY_TEXT })] }),
              new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: brd }, children: [new TextRun({ text: " ", font: "Arial", size: 21 })] }),
            ]
          }),
        ]})]
      }),

      space(2),
      infoBox([
        'nachfolgend gemeinsam als „Vertragsparteien“ bezeichnet, schließen folgenden Dienstleistungsvertrag:',
      ], GRAY),
      space(2),

      // ══ §1 ══
      clause(1, "Vertragsgegenstand"),
      sub(1, "Der Auftragnehmer (AVA AI) erbringt für den Auftraggeber digitale Dienstleistungen im Bereich künstliche Intelligenz, Sprachautomatisierung und digitale Prozessoptimierung gemäß den in diesem Vertrag und der zugehörigen Leistungsbeschreibung (Anhang A) definierten Konditionen."),
      sub(2, "Der konkrete Leistungsumfang ergibt sich aus dem vom Auftraggeber gewählten Paket:"),
      bullet("Starter-Paket: KI Voice Agent mit bis zu 500 Gesprächen/Monat, FAQ-Beantwortung, Deutsch und Englisch"),
      bullet("Growth-Paket: Erweiterter KI Voice Agent mit unbegrenzten Gesprächen, Buchungsannahme, CRM-Integration, 5+ Sprachen"),
      bullet("Enterprise-Paket: Individuell vereinbarter Leistungsumfang gemäß separatem Angebot"),
      sub(3, "Änderungen oder Erweiterungen des Leistungsumfangs bedürfen der Schriftform und sind als Ergänzungsvereinbarung zu diesem Vertrag zu schließen."),

      // ══ §2 ══
      clause(2, "Vergütung und Zahlungsbedingungen"),
      sub(1, "Die monatliche Vergütung richtet sich nach dem gewählten Paket:"),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [3000, 2200, 4160],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: brds, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Paket", font: "Arial", size: 21, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: brds, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Monatliche Gebühr", font: "Arial", size: 21, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: brds, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, width: { size: 4160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Hinweis", font: "Arial", size: 21, bold: true, color: WHITE })] })] }),
          ]}),
          ...([
            ["Starter", "€ 399,00 zzgl. MwSt.", "Bis zu 500 Gespräche/Monat"],
            ["Growth", "€ 899,00 zzgl. MwSt.", "Unbegrenzte Gespräche"],
            ["Enterprise", "Individuell vereinbart", "Gemäß separatem Angebot"],
          ].map(([a, b, c], i) => new TableRow({ children: [
            new TableCell({ borders: brds, shading: { fill: i % 2 === 0 ? WHITE : GRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: a, font: "Arial", size: 21, bold: true, color: TEXT })] })] }),
            new TableCell({ borders: brds, shading: { fill: i % 2 === 0 ? WHITE : GRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: b, font: "Arial", size: 21, color: TEXT })] })] }),
            new TableCell({ borders: brds, shading: { fill: i % 2 === 0 ? WHITE : GRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 4160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: c, font: "Arial", size: 21, color: GRAY_TEXT })] })] }),
          ]}))),
        ]
      }),
      space(),
      sub(2, "Die Vergütung ist monatlich im Voraus fällig. Rechnungen werden zum Monatsersten ausgestellt und sind innerhalb von 14 Tagen ohne Abzug zu begleichen."),
      sub(3, "Bei Zahlungsverzug ist der Auftragnehmer berechtigt, Verzugszinsen in Höhe von 9 Prozentpunkten über dem jeweiligen Basiszinssatz gemäß § 247 BGB zu berechnen sowie eine Mahngebühr von € 5,00 je Mahnung zu erheben."),
      sub(4, "Alle genannten Preise verstehen sich netto zuzüglich der jeweils gültigen gesetzlichen Umsatzsteuer."),
      sub(5, "Der Auftragnehmer ist berechtigt, die Vergütung mit einer Ankündigungsfrist von 6 Wochen zum Beginn des nächsten Kalendermonats anzupassen. Der Auftraggeber hat in diesem Fall ein außerordentliches Kündigungsrecht zum Zeitpunkt der Preisanpassung."),

      // ══ §3 ══
      clause(3, "Vertragslaufzeit und Kündigung"),
      sub(1, "Dieser Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden Vertragsparteien mit einer Frist von 30 Tagen zum Ende eines Kalendermonats ordentlich gekündigt werden."),
      sub(2, "Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt für den Auftragnehmer insbesondere vor, wenn:"),
      bullet("der Auftraggeber mit mehr als einer Monatsvergütung in Zahlungsverzug gerät und trotz Mahnung mit angemessener Nachfrist nicht zahlt,"),
      bullet("der Auftraggeber gegen wesentliche Vertragspflichten verstößt und diesen Verstoß trotz schriftlicher Abmahnung nicht innerhalb von 14 Tagen behebt,"),
      bullet("über das Vermögen des Auftraggebers ein Insolvenzverfahren beantragt oder eröffnet wird."),
      sub(3, "Die Kündigung bedarf der Textform (E-Mail genügt). Maßgeblich ist der Zeitpunkt des Zugangs der Kündigung."),
      sub(4, "Nach Vertragsbeendigung sind alle dem Auftraggeber zur Verfügung gestellten Zugänge und Systeme zu deaktivieren. Bereits geleistete Vorauszahlungen für nicht erbrachte Leistungen werden anteilig zurückerstattet."),

      // ══ §4 ══
      clause(4, "Leistungserbringung und Verfügbarkeit"),
      sub(1, "Der Auftragnehmer strebt eine Systemverfügbarkeit von 99,0 % im monatlichen Mittel an (ausgenommen: angekündigte Wartungsfenster, höhere Gewalt, Ausfälle Drittanbieter)."),
      sub(2, "Geplante Wartungsarbeiten werden mindestens 48 Stunden im Voraus per E-Mail angekündigt und soweit möglich außerhalb der Hauptgeschäftszeiten (Mo–Fr, 08:00–20:00 Uhr) durchgeführt."),
      sub(3, "Der Auftraggeber ist verpflichtet, alle für die Leistungserbringung erforderlichen Informationen (insbesondere Wissensdatenbank, Zugangsdaten, FAQ-Listen) vollständig und rechtzeitig bereitzustellen. Verzögerungen durch mangelnde Mitwirkung des Auftraggebers gehen nicht zu Lasten des Auftragnehmers."),
      sub(4, "Der Auftragnehmer ist berechtigt, Subunternehmer und Drittanbieter (z. B. Vapi.ai, OpenAI, ElevenLabs, Vercel) zur Leistungserbringung einzusetzen, bleibt jedoch gegenüber dem Auftraggeber für die vertragsgemäße Leistung verantwortlich."),

      // ══ §5 ══
      clause(5, "Datenschutz und DSGVO"),
      sub(1, "Beide Vertragsparteien verpflichten sich, die anwendbaren datenschutzrechtlichen Bestimmungen, insbesondere die Datenschutz-Grundverordnung (DSGVO) und das Bundesdatenschutzgesetz (BDSG), einzuhalten."),
      sub(2, "Soweit der Auftragnehmer im Rahmen der Leistungserbringung personenbezogene Daten im Auftrag des Auftraggebers verarbeitet, wird eine gesonderte Auftragsverarbeitungsvereinbarung (AVV) gemäß Art. 28 DSGVO geschlossen, die Bestandteil dieses Vertrages wird."),
      sub(3, "Der Auftragnehmer verarbeitet personenbezogene Daten ausschließlich auf Servern innerhalb der Europäischen Union. Eine Übermittlung in Drittstaaten erfolgt nur unter den Voraussetzungen der Art. 44 ff. DSGVO."),
      sub(4, "Gesprächsdaten und Transkriptionen werden für die Dauer von 90 Tagen gespeichert, sofern keine abweichende schriftliche Vereinbarung getroffen wird. Der Auftraggeber kann jederzeit die Löschung sämtlicher seiner Daten verlangen."),
      sub(5, "Der Auftragnehmer setzt geeignete technische und organisatorische Maßnahmen (TOM) gemäß Art. 32 DSGVO ein, um die Sicherheit der verarbeiteten Daten zu gewährleisten, insbesondere Ende-zu-Ende-Verschlüsselung aller Kommunikationsdaten."),

      // ══ §6 ══
      clause(6, "Vertraulichkeit"),
      sub(1, "Beide Vertragsparteien verpflichten sich, alle im Rahmen dieses Vertrages erlangten vertraulichen Informationen der jeweils anderen Partei streng vertraulich zu behandeln, nicht an Dritte weiterzugeben und nur für die Zwecke dieses Vertrages zu verwenden."),
      sub(2, "Als vertraulich gelten insbesondere: Geschäftsgeheimnisse, Preiskalkulationen, technische Konzepte, Kundendaten, Zugangsdaten und Know-how beider Vertragsparteien."),
      sub(3, "Diese Verschwiegenheitspflicht gilt für die Dauer des Vertrages und darüber hinaus für weitere 3 (drei) Jahre nach Vertragsbeendigung."),
      sub(4, "Ausgenommen von der Vertraulichkeit sind Informationen, die (i) öffentlich bekannt sind oder werden, ohne dass eine Vertragspartei dagegen verstoßen hat, (ii) der empfangenden Partei bereits vor Vertragsabschluss bekannt waren oder (iii) von Dritten ohne Vertraulichkeitsverpflichtung rechtmäßig mitgeteilt wurden."),

      // ══ §7 ══
      clause(7, "Haftung und Haftungsbeschränkung"),
      sub(1, "Der Auftragnehmer haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für vorsätzlich oder grob fahrlässig verursachte Schäden."),
      sub(2, "Für leichte Fahrlässigkeit haftet der Auftragnehmer nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). In diesen Fällen ist die Haftung auf den typischerweise vorhersehbaren Schaden begrenzt, höchstens jedoch auf den Betrag der im betreffenden Monat gezahlten Vergütung."),
      sub(3, "Der Auftragnehmer haftet nicht für:"),
      bullet("Ausfälle oder Fehler von Drittanbietern (z. B. Vapi.ai, OpenAI, Telekommunikationsanbieter), sofern diese nicht vom Auftragnehmer verursacht wurden,"),
      bullet("fehlerhafte oder unvollständige Informationen, die der Auftraggeber für die Wissensdatenbank bereitgestellt hat,"),
      bullet("entgangenen Gewinn, mittelbare Schäden oder Folgeschäden jeglicher Art,"),
      bullet("höhere Gewalt (Pandemien, Naturkatastrophen, Krieg, Cyberangriffe auf Infrastruktur Dritter, behördliche Anordnungen)."),
      sub(4, "Der Auftraggeber ist verpflichtet, erkennbare Schäden unverzüglich zu melden und alle zumutbaren Maßnahmen zur Schadensminderung zu ergreifen."),

      // ══ §8 ══
      clause(8, "Nutzungsrechte und geistiges Eigentum"),
      sub(1, "Der Auftragnehmer räumt dem Auftraggeber für die Dauer des Vertragsverhältnisses ein nicht-exklusives, nicht übertragbares Nutzungsrecht an den erbrachten Dienstleistungen und den dafür entwickelten Systemen ein."),
      sub(2, "Alle vom Auftragnehmer entwickelten Systeme, Algorithmen, Softwarekomponenten und technischen Konzepte verbleiben im ausschließlichen geistigen Eigentum des Auftragnehmers. Mit Vertragsbeendigung erlischt das Nutzungsrecht."),
      sub(3, "Inhalte, Daten und Materialien, die der Auftraggeber für die Leistungserbringung bereitstellt, verbleiben im Eigentum des Auftraggebers. Der Auftragnehmer erhält hieran ein auf die Leistungserbringung beschränktes Nutzungsrecht."),
      sub(4, "Der Auftraggeber erklärt, dass er über alle erforderlichen Rechte an den bereitgestellten Inhalten verfügt und keine Rechte Dritter verletzt werden."),

      // ══ §9 ══
      clause(9, "Referenznennung"),
      sub(1, "Der Auftragnehmer ist berechtigt, den Namen und das Logo des Auftraggebers als Referenzkunden auf seiner Website (ava-hq.com) und in Marketingmaterialien zu verwenden, sofern der Auftraggeber nicht schriftlich widerspricht."),
      sub(2, "Ein Widerspruch ist jederzeit per E-Mail möglich und wirkt ab Zugang des Widerspruchs."),

      // ══ §10 ══
      clause(10, "Änderungen und Ergänzungen des Vertrages"),
      sub(1, "Änderungen und Ergänzungen dieses Vertrages bedürfen der Textform (E-Mail genügt). Mündliche Nebenabreden haben keine Gültigkeit."),
      sub(2, "Sollte eine Bestimmung dieses Vertrages ganz oder teilweise unwirksam oder undurchführbar sein oder werden, so berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. Die unwirksame Bestimmung ist durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt (Salvatorische Klausel)."),

      // ══ §11 ══
      clause(11, "Schlussbestimmungen"),
      sub(1, "Dieser Vertrag unterliegt ausschließlich dem Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG)."),
      sub(2, "Ausschließlicher Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist der Sitz des Auftragnehmers, sofern der Auftraggeber Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist."),
      sub(3, "Der Auftragnehmer ist nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."),
      sub(4, "Dieser Vertrag einschließlich aller Anhänge stellt die vollständige Vereinbarung zwischen den Parteien dar und ersetzt alle vorherigen mündlichen oder schriftlichen Vereinbarungen zum selben Gegenstand."),

      // ══ SEITENUMBRUCH ══
      new Paragraph({ children: [new PageBreak()] }),

      // ══ ANHANG A ══
      new Paragraph({
        spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: "ANHANG A — LEISTUNGSBESCHREIBUNG", font: "Arial", size: 28, bold: true, color: BLUE, characterSpacing: 60 })]
      }),
      infoBox(["Dieser Anhang ist fester Bestandteil des Dienstleistungsvertrages und konkretisiert die vereinbarten Leistungen."]),
      space(),

      new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Gewähltes Paket:", font: "Arial", size: 22, bold: true, color: TEXT })] }),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [W / 3, W / 3, W / 3],
        rows: [new TableRow({ children: ["Starter  [ ]", "Growth  [ ]", "Enterprise  [ ]"].map(t => new TableCell({
          borders: brds, shading: { fill: GRAY, type: ShadingType.CLEAR },
          width: { size: W / 3, type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 180, right: 180 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, font: "Arial", size: 24, bold: true, color: TEXT })] })]
        })) })],
      }),
      space(),
      pBold("Individuelle Vereinbarungen / Besonderheiten:"),
      ...Array(6).fill(null).map(() => new Paragraph({
        spacing: { before: 0, after: 0 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCDD" } },
        children: [new TextRun({ text: " ", font: "Arial", size: 28 })]
      })),
      space(),

      pBold("Vertragsbeginn:"),
      new Paragraph({
        spacing: { before: 0, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCDD" } },
        children: [new TextRun({ text: " ", font: "Arial", size: 28 })]
      }),

      space(2),

      // ══ UNTERSCHRIFTEN ══
      new Paragraph({
        spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: "UNTERSCHRIFTEN", font: "Arial", size: 22, bold: true, color: BLUE, characterSpacing: 60 })]
      }),
      infoBox(["Mit ihrer Unterschrift bestätigen beide Vertragsparteien, den vorliegenden Dienstleistungsvertrag gelesen, verstanden und akzeptiert zu haben."], GRAY),
      space(2),
      signBox(),
      space(3),

      infoBox([
        "Hinweis: Dieser Vertrag wurde sorgfältig erstellt, ersetzt jedoch keine individuelle Rechtsberatung.",
        "Bei Fragen empfehlen wir die Konsultation eines auf Vertragsrecht spezialisierten Rechtsanwalts.",
      ], "FFFBEA"),

      // ══ SEITENUMBRUCH ══
      new Paragraph({ children: [new PageBreak()] }),

      // ══ ANHANG B — AVV ══
      new Paragraph({
        spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: "ANHANG B — AUFTRAGSVERARBEITUNGSVERTRAG (AVV)", font: "Arial", size: 28, bold: true, color: BLUE, characterSpacing: 60 })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "gemäß Art. 28 Datenschutz-Grundverordnung (DSGVO)", font: "Arial", size: 22, italics: true, color: GRAY_TEXT })]
      }),
      infoBox(["Dieser Anhang B ist fester Bestandteil des Dienstleistungsvertrages zwischen AVA AI und dem Auftraggeber und regelt die Verarbeitung personenbezogener Daten im Auftrag gemäß Art. 28 DSGVO."]),
      space(),

      clause(1, "Gegenstand und Dauer der Verarbeitung"),
      sub(1, "Der Auftragnehmer (AVA AI) verarbeitet im Rahmen des Dienstleistungsvertrages personenbezogene Daten im Auftrag des Auftraggebers. Gegenstand der Verarbeitung sind Sprachdaten, Transkriptionen und Gesprächsinhalte von Anrufern des Auftraggebers."),
      sub(2, "Die Verarbeitung erfolgt für die Dauer des Dienstleistungsvertrages. Nach Vertragsende werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht oder — auf schriftlichen Wunsch des Auftraggebers — zurückgegeben."),

      clause(2, "Art und Zweck der Verarbeitung"),
      sub(1, "Die Verarbeitung umfasst folgende Tätigkeiten:"),
      bullet("Entgegennahme und Transkription von Telefonanrufen"),
      bullet("Sprachverarbeitung und automatische Antwortgenerierung mittels KI"),
      bullet("Speicherung von Gesprächsprotokollen und Anfragen"),
      bullet("Weiterleitung von Anrufzusammenfassungen per E-Mail an den Auftraggeber"),
      sub(2, "Zweck der Verarbeitung ist ausschließlich die Erbringung der im Dienstleistungsvertrag vereinbarten Leistungen. Eine Verarbeitung zu eigenen Zwecken des Auftragnehmers ist untersagt."),

      clause(3, "Art der personenbezogenen Daten und Kategorien betroffener Personen"),
      sub(1, "Verarbeitete Datenkategorien:"),
      bullet("Stimmdaten und Sprachaufzeichnungen von Anrufern"),
      bullet("Transkribierte Gesprächsinhalte (Name, Anliegen, Buchungsdaten)"),
      bullet("Kontaktdaten (Telefonnummer, E-Mail, soweit vom Anrufer mitgeteilt)"),
      bullet("Metadaten (Anrufdatum, -uhrzeit, -dauer)"),
      sub(2, "Kategorien betroffener Personen: Gäste, Kunden und sonstige Anrufer des Auftraggebers."),

      clause(4, "Pflichten des Auftragnehmers"),
      sub(1, "Der Auftragnehmer verpflichtet sich insbesondere:"),
      bullet("personenbezogene Daten ausschließlich auf dokumentierte Weisung des Auftraggebers zu verarbeiten (Art. 28 Abs. 3 lit. a DSGVO),"),
      bullet("zur Vertraulichkeit aller verarbeiteten Daten (Art. 28 Abs. 3 lit. b DSGVO),"),
      bullet("geeignete technische und organisatorische Maßnahmen (TOM) gemäß Art. 32 DSGVO umzusetzen,"),
      bullet("Unterauftragsverarbeiter nur mit vorheriger schriftlicher Genehmigung des Auftraggebers einzusetzen,"),
      bullet("den Auftraggeber bei der Erfüllung von Betroffenenrechten (Auskunft, Löschung, Berichtigung) zu unterstützen,"),
      bullet("alle erforderlichen Informationen zum Nachweis der Einhaltung dieser Vereinbarung bereitzustellen."),

      clause(5, "Unterauftragsverarbeiter"),
      sub(1, "Der Auftraggeber erteilt hiermit eine allgemeine Genehmigung zum Einsatz folgender Unterauftragsverarbeiter, die für die technische Leistungserbringung erforderlich sind:"),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [2800, 3000, 3560],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: brds, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Anbieter", font: "Arial", size: 21, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: brds, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Zweck", font: "Arial", size: 21, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: brds, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, width: { size: 3560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Sitz", font: "Arial", size: 21, bold: true, color: WHITE })] })] }),
          ]}),
          ...[
            ["Vapi.ai", "Voice-Agent-Plattform", "USA (SCCs vorhanden)"],
            ["OpenAI", "Sprachverarbeitung (GPT-4o)", "USA (SCCs vorhanden)"],
            ["ElevenLabs", "Sprachsynthese", "USA (SCCs vorhanden)"],
            ["Deepgram", "Spracherkennung", "USA (SCCs vorhanden)"],
            ["Vercel Inc.", "Website-Hosting", "USA (SCCs vorhanden)"],
          ].map(([a, b, c], i) => new TableRow({ children: [
            new TableCell({ borders: brds, shading: { fill: i % 2 === 0 ? WHITE : GRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: a, font: "Arial", size: 21, bold: true, color: TEXT })] })] }),
            new TableCell({ borders: brds, shading: { fill: i % 2 === 0 ? WHITE : GRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: b, font: "Arial", size: 21, color: TEXT })] })] }),
            new TableCell({ borders: brds, shading: { fill: i % 2 === 0 ? WHITE : GRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: c, font: "Arial", size: 21, color: GRAY_TEXT })] })] }),
          ]})),
        ]
      }),
      sub(2, "SCCs = Standardvertragsklauseln der EU-Kommission gemäß Art. 46 Abs. 2 lit. c DSGVO. Der Auftragnehmer informiert den Auftraggeber rechtzeitig über geplante Änderungen bei Unterauftragsverarbeitern."),

      clause(6, "Technische und organisatorische Maßnahmen (TOM)"),
      sub(1, "Der Auftragnehmer setzt folgende Sicherheitsmaßnahmen gemäß Art. 32 DSGVO um:"),
      bullet("Verschlüsselung aller Datenübertragungen via TLS 1.3"),
      bullet("Ende-zu-Ende-Verschlüsselung von Gesprächsdaten"),
      bullet("Zugriffsbeschränkung nach dem Prinzip der minimalen Rechtevergabe"),
      bullet("Regelmäßige Sicherheitsupdates und Patch-Management"),
      bullet("Automatische Datenlöschung nach 90 Tagen (konfigurierbar)"),
      bullet("Protokollierung aller Datenzugriffe"),

      clause(7, "Betroffenenrechte"),
      sub(1, "Der Auftragnehmer unterstützt den Auftraggeber bei der Bearbeitung von Anfragen betroffener Personen (Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit) gemäß Art. 15–22 DSGVO innerhalb von 72 Stunden nach Eingang der Anfrage."),

      clause(8, "Meldepflichten"),
      sub(1, "Der Auftragnehmer meldet Datenschutzverletzungen gemäß Art. 33 DSGVO unverzüglich, spätestens jedoch innerhalb von 24 Stunden nach Bekanntwerden, an den Auftraggeber, damit dieser seiner eigenen Meldepflicht gegenüber der Aufsichtsbehörde nachkommen kann."),

      space(2),
      new Paragraph({
        spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: "UNTERSCHRIFTEN ANHANG B (AVV)", font: "Arial", size: 22, bold: true, color: BLUE, characterSpacing: 60 })]
      }),
      infoBox(["Mit Unterzeichnung des Hauptvertrages gilt dieser Anhang B als mitunterzeichnet und rechtsverbindlich vereinbart."], GRAY),
      space(2),
      signBox(),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const path = "C:\\Users\\hss-azda3005\\OneDrive - Heinrich-Schickhardt-Schule\\Desktop\\AVA\\AVA_Dienstleistungsvertrag.docx";
  fs.writeFileSync(path, buffer);
  console.log("✓ Vertrag erstellt:", path);
}).catch(err => console.error("Fehler:", err));
