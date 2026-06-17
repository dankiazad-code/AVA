const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, LevelFormat, PageBreak
} = require("docx");
const fs = require("fs");

const BLUE = "0078FF"; const DARK = "0D0D1A"; const WHITE = "FFFFFF";
const TEXT = "1A1A2E"; const GRAY = "F5F7FA"; const GRAY_TEXT = "666680";
const LIGHT = "EBF4FF"; const GREEN = "00C47A";
const W = 9360;

const brd  = { style: BorderStyle.SINGLE, size: 1, color: "DDDDE8" };
const brds = { top: brd, bottom: brd, left: brd, right: brd };
const nob  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const nobs = { top: nob, bottom: nob, left: nob, right: nob };

const sp = (n=1) => new Paragraph({ spacing:{before:0,after:n*100}, children:[new TextRun("")] });
const run = (text, opts={}) => new TextRun({ text, font:"Arial", size:21, color:TEXT, ...opts });
const p = (text, opts={}) => new Paragraph({ spacing:{before:60,after:100}, ...opts, children:[run(text)] });

function cell(text, w, opts={}) {
  return new TableCell({
    borders: brds, width:{ size:w, type:WidthType.DXA },
    margins:{ top:100, bottom:100, left:140, right:140 },
    ...opts,
    children:[new Paragraph({ children:[new TextRun({ text, font:"Arial", size:21, ...opts.runOpts })] })]
  });
}

function section(title) {
  return new Paragraph({
    spacing:{ before:400, after:160 },
    border:{ bottom:{ style:BorderStyle.SINGLE, size:3, color:BLUE, space:3 } },
    children:[
      new TextRun({ text:"▌ ", font:"Arial", size:24, color:BLUE }),
      new TextRun({ text:title, font:"Arial", size:24, bold:true, color:DARK }),
    ]
  });
}

function checkRow(label, starter, growth) {
  return new TableRow({ children:[
    new TableCell({ borders:brds, width:{size:4200,type:WidthType.DXA}, shading:{fill:GRAY,type:ShadingType.CLEAR}, margins:{top:90,bottom:90,left:140,right:140}, children:[new Paragraph({children:[run(label)]})] }),
    new TableCell({ borders:brds, width:{size:2580,type:WidthType.DXA}, shading:{fill:WHITE,type:ShadingType.CLEAR}, margins:{top:90,bottom:90,left:140,right:140}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:starter, font:"Arial", size:22, color:starter==="✓"?GREEN:GRAY_TEXT, bold:starter==="✓"})]})] }),
    new TableCell({ borders:brds, width:{size:2580,type:WidthType.DXA}, shading:{fill:LIGHT,type:ShadingType.CLEAR}, margins:{top:90,bottom:90,left:140,right:140}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:growth, font:"Arial", size:22, color:growth==="✓"?GREEN:GRAY_TEXT, bold:growth==="✓"})]})] }),
  ]});
}

const doc = new Document({
  numbering:{ config:[{ reference:"num", levels:[{ level:0, format:LevelFormat.BULLET, text:"→", alignment:AlignmentType.LEFT, style:{paragraph:{indent:{left:560,hanging:280}}} }] }] },
  styles:{ default:{ document:{ run:{ font:"Arial", size:21, color:TEXT } } } },
  sections:[{
    properties:{ page:{ size:{width:11906,height:16838}, margin:{top:1200,right:1300,bottom:1200,left:1300} } },
    headers:{ default: new Header({ children:[
      new Paragraph({ border:{bottom:{style:BorderStyle.SINGLE,size:3,color:BLUE,space:3}},
        children:[
          new TextRun({text:"AVA AI  —  Individuelles Angebot", font:"Arial", size:18, color:GRAY_TEXT}),
          new TextRun({text:"   |   Vertraulich", font:"Arial", size:18, color:"CC0000", bold:true}),
        ]})
    ]})},
    footers:{ default: new Footer({ children:[
      new Paragraph({ border:{top:{style:BorderStyle.SINGLE,size:2,color:"DDDDE8",space:3}},
        children:[
          new TextRun({text:"AVA AI  ·  ava-hq.com  ·  contact@ava-hq.com", font:"Arial", size:17, color:GRAY_TEXT}),
          new TextRun({text:"        Seite ", font:"Arial", size:17, color:GRAY_TEXT}),
          new TextRun({children:[PageNumber.CURRENT], font:"Arial", size:17, color:GRAY_TEXT}),
        ]})
    ]})},

    children:[

      // COVER
      sp(3),
      new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:120},
        children:[new TextRun({text:"AVA AI", font:"Arial", size:80, bold:true, color:BLUE})] }),
      new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:80},
        children:[new TextRun({text:"Ihr individuelles Angebot", font:"Arial", size:32, color:DARK})] }),
      new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:600},
        children:[new TextRun({text:"KI Voice Agent & Digitale Automatisierung", font:"Arial", size:24, color:GRAY_TEXT, italics:true})] }),

      new Table({ width:{size:W,type:WidthType.DXA}, columnWidths:[W/2-180,360,W/2-180],
        rows:[new TableRow({ children:[
          new TableCell({ borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:W/2-180,type:WidthType.DXA}, margins:{top:180,bottom:180,left:200,right:200},
            children:[
              new Paragraph({spacing:{before:0,after:60}, children:[new TextRun({text:"ERSTELLT FÜR", font:"Arial", size:17, bold:true, color:BLUE, characterSpacing:60})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"[Name Hotel / Unternehmen]", font:"Arial", size:24, bold:true, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"[Ansprechpartner]", font:"Arial", size:20, color:GRAY_TEXT})]}),
              new Paragraph({spacing:{before:0,after:0},  children:[new TextRun({text:"[E-Mail / Telefon]", font:"Arial", size:20, color:GRAY_TEXT})]}),
            ]}),
          new TableCell({ borders:nobs, width:{size:360,type:WidthType.DXA}, children:[new Paragraph({children:[]})] }),
          new TableCell({ borders:brds, shading:{fill:LIGHT,type:ShadingType.CLEAR}, width:{size:W/2-180,type:WidthType.DXA}, margins:{top:180,bottom:180,left:200,right:200},
            children:[
              new Paragraph({spacing:{before:0,after:60}, children:[new TextRun({text:"VON", font:"Arial", size:17, bold:true, color:BLUE, characterSpacing:60})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"AVA AI", font:"Arial", size:24, bold:true, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"Azad Danki & Benjamin Serifovic", font:"Arial", size:20, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"contact@ava-hq.com", font:"Arial", size:20, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:0},  children:[new TextRun({text:"Datum: [TT.MM.JJJJ]", font:"Arial", size:20, color:GRAY_TEXT})]}),
            ]}),
        ]})]
      }),

      sp(6),
      new Paragraph({ children:[new PageBreak()] }),

      // SEITE 2 — PROBLEM
      section("Das Problem — Was Hotels täglich verlieren"),
      sp(),
      new Table({ width:{size:W,type:WidthType.DXA}, columnWidths:[W/2-180,360,W/2-180],
        rows:[new TableRow({ children:[
          new TableCell({ borders:brds, shading:{fill:"FFF3F3",type:ShadingType.CLEAR}, width:{size:W/2-180,type:WidthType.DXA}, margins:{top:160,bottom:160,left:180,right:180},
            children:[
              new Paragraph({spacing:{before:0,after:80}, children:[new TextRun({text:"62%", font:"Arial", size:56, bold:true, color:"CC0000"})]}),
              new Paragraph({spacing:{before:0,after:0}, children:[new TextRun({text:"der Anrufer, die auf eine Mailbox treffen, rufen nie zurück.", font:"Arial", size:21, color:TEXT})]}),
            ]}),
          new TableCell({ borders:nobs, width:{size:360,type:WidthType.DXA}, children:[new Paragraph({children:[]})] }),
          new TableCell({ borders:brds, shading:{fill:"FFF3F3",type:ShadingType.CLEAR}, width:{size:W/2-180,type:WidthType.DXA}, margins:{top:160,bottom:160,left:180,right:180},
            children:[
              new Paragraph({spacing:{before:0,after:80}, children:[new TextRun({text:"€ 15.000+", font:"Arial", size:48, bold:true, color:"CC0000"})]}),
              new Paragraph({spacing:{before:0,after:0}, children:[new TextRun({text:"monatliche Kosten durch manuelle Rezeptionsarbeit und verpasste Buchungen.", font:"Arial", size:21, color:TEXT})]}),
            ]}),
        ]})]
      }),
      sp(2),
      p("Jedes Hotel kennt das Problem: Die Rezeption ist besetzt, das Telefon klingelt — niemand nimmt ab. Oder es ist 22:30 Uhr, ein Gast möchte buchen — niemand ist erreichbar. Diese verpassten Momente kosten täglich Umsatz."),
      sp(),

      section("Unsere Lösung für [Hotel Name]"),
      sp(),
      p("AVA ist Ihr persönlicher KI-Voice-Agent — speziell konfiguriert für Ihr Haus, Ihre Preise, Ihre Policies. AVA nimmt jeden Anruf sofort entgegen, beantwortet Fragen und nimmt Buchungen entgegen — 24/7, in jeder Sprache, ohne Pause."),
      sp(),
      new Table({ width:{size:W,type:WidthType.DXA}, columnWidths:[W/4, W/4, W/4, W/4],
        rows:[new TableRow({ children:[
          ...[["< 1 Sek","Reaktionszeit"],["24 / 7","Verfügbar"],["40+","Sprachen"],["99%","Uptime"]].map(([val,lbl]) =>
            new TableCell({ borders:brds, shading:{fill:LIGHT,type:ShadingType.CLEAR}, width:{size:W/4,type:WidthType.DXA}, margins:{top:160,bottom:160,left:120,right:120},
              children:[
                new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:60}, children:[new TextRun({text:val, font:"Arial", size:44, bold:true, color:BLUE})]}),
                new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:0}, children:[new TextRun({text:lbl, font:"Arial", size:19, color:GRAY_TEXT})]}),
              ]})
          )
        ]})]
      }),

      sp(2),
      new Paragraph({ children:[new PageBreak()] }),

      // SEITE 3 — LEISTUNGEN
      section("Ihr Leistungspaket im Überblick"),
      sp(),
      new Table({ width:{size:W,type:WidthType.DXA}, columnWidths:[4200,2580,2580],
        rows:[
          new TableRow({ children:[
            new TableCell({ borders:brds, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:4200,type:WidthType.DXA}, margins:{top:120,bottom:120,left:140,right:140}, children:[new Paragraph({children:[new TextRun({text:"Leistung", font:"Arial", size:21, bold:true, color:WHITE})]})] }),
            new TableCell({ borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:2580,type:WidthType.DXA}, margins:{top:120,bottom:120,left:140,right:140}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Starter", font:"Arial", size:21, bold:true, color:TEXT})]})] }),
            new TableCell({ borders:brds, shading:{fill:BLUE,type:ShadingType.CLEAR}, width:{size:2580,type:WidthType.DXA}, margins:{top:120,bottom:120,left:140,right:140}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Growth ⭐", font:"Arial", size:21, bold:true, color:WHITE})]})] }),
          ]}),
          checkRow("24/7 KI-Anrufannahme", "✓", "✓"),
          checkRow("Individuelle Wissensdatenbank", "✓", "✓"),
          checkRow("FAQ-Beantwortung (Zeiten, WLAN, Parken…)", "✓", "✓"),
          checkRow("Sprachen", "DE + EN", "5+ Sprachen"),
          checkRow("Anrufe pro Monat", "bis 500", "Unbegrenzt"),
          checkRow("Buchungsannahme & Bestätigung", "—", "✓"),
          checkRow("CRM-Integration (Mews, Opera, HubSpot)", "—", "✓"),
          checkRow("E-Mail-Benachrichtigungen", "✓", "✓"),
          checkRow("Monatliches Reporting", "Basis", "Erweitert"),
          checkRow("Monatliche Optimierungssitzung", "—", "✓"),
          checkRow("Prioritäts-Support", "—", "✓"),
          checkRow("Einrichtungszeit", "48 Std", "48 Std"),
          checkRow("Vertragsbindung", "Monatlich", "Monatlich"),
        ]
      }),
      sp(2),

      section("Ihre Investition"),
      sp(),
      new Table({ width:{size:W,type:WidthType.DXA}, columnWidths:[3600,2880,2880],
        rows:[
          new TableRow({ children:[
            new TableCell({ borders:brds, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:3600,type:WidthType.DXA}, margins:{top:120,bottom:120,left:160,right:160}, children:[new Paragraph({children:[new TextRun({text:"Paket", font:"Arial", size:21, bold:true, color:WHITE})]})] }),
            new TableCell({ borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:2880,type:WidthType.DXA}, margins:{top:120,bottom:120,left:160,right:160}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Starter", font:"Arial", size:21, bold:true, color:TEXT})]})] }),
            new TableCell({ borders:brds, shading:{fill:BLUE,type:ShadingType.CLEAR}, width:{size:2880,type:WidthType.DXA}, margins:{top:120,bottom:120,left:160,right:160}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Growth", font:"Arial", size:21, bold:true, color:WHITE})]})] }),
          ]}),
          new TableRow({ children:[
            new TableCell({ borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:3600,type:WidthType.DXA}, margins:{top:120,bottom:120,left:160,right:160}, children:[new Paragraph({children:[new TextRun({text:"Monatliche Gebühr (zzgl. MwSt.)", font:"Arial", size:21, color:TEXT})]})] }),
            new TableCell({ borders:brds, shading:{fill:WHITE,type:ShadingType.CLEAR}, width:{size:2880,type:WidthType.DXA}, margins:{top:120,bottom:120,left:160,right:160}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"€ 399", font:"Arial", size:24, bold:true, color:TEXT})]})] }),
            new TableCell({ borders:brds, shading:{fill:LIGHT,type:ShadingType.CLEAR}, width:{size:2880,type:WidthType.DXA}, margins:{top:120,bottom:120,left:160,right:160}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"€ 899", font:"Arial", size:24, bold:true, color:BLUE})]})] }),
          ]}),
          new TableRow({ children:[
            new TableCell({ borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:3600,type:WidthType.DXA}, margins:{top:80,bottom:80,left:160,right:160}, children:[new Paragraph({children:[new TextRun({text:"Einrichtung", font:"Arial", size:21, color:TEXT})]})] }),
            new TableCell({ borders:brds, shading:{fill:WHITE,type:ShadingType.CLEAR}, width:{size:2880,type:WidthType.DXA}, margins:{top:80,bottom:80,left:160,right:160}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Kostenlos", font:"Arial", size:21, color:GREEN, bold:true})]})] }),
            new TableCell({ borders:brds, shading:{fill:LIGHT,type:ShadingType.CLEAR}, width:{size:2880,type:WidthType.DXA}, margins:{top:80,bottom:80,left:160,right:160}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Kostenlos", font:"Arial", size:21, color:GREEN, bold:true})]})] }),
          ]}),
          new TableRow({ children:[
            new TableCell({ borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:3600,type:WidthType.DXA}, margins:{top:80,bottom:80,left:160,right:160}, children:[new Paragraph({children:[new TextRun({text:"Kündigung", font:"Arial", size:21, color:TEXT})]})] }),
            new TableCell({ borders:brds, shading:{fill:WHITE,type:ShadingType.CLEAR}, width:{size:2880,type:WidthType.DXA}, margins:{top:80,bottom:80,left:160,right:160}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Monatlich", font:"Arial", size:21, color:TEXT})]})] }),
            new TableCell({ borders:brds, shading:{fill:LIGHT,type:ShadingType.CLEAR}, width:{size:2880,type:WidthType.DXA}, margins:{top:80,bottom:80,left:160,right:160}, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Monatlich", font:"Arial", size:21, color:TEXT})]})] }),
          ]}),
        ]
      }),
      sp(2),
      new Paragraph({ children:[new PageBreak()] }),

      // SEITE 4 — ROI + NÄCHSTE SCHRITTE
      section("Ihr ROI — Was AVA Ihnen konkret bringt"),
      sp(),
      new Table({ width:{size:W,type:WidthType.DXA}, columnWidths:[W/2-180,360,W/2-180],
        rows:[new TableRow({ children:[
          new TableCell({ borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:W/2-180,type:WidthType.DXA}, margins:{top:180,bottom:180,left:200,right:200},
            children:[
              new Paragraph({spacing:{before:0,after:80}, children:[new TextRun({text:"OHNE AVA", font:"Arial", size:18, bold:true, color:"CC0000", characterSpacing:60})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"Rezeptionist: €2.800 – €3.500/Monat", font:"Arial", size:21, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"Verpasste Anrufe außerhalb Öffnungszeiten", font:"Arial", size:21, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"Sprachbarrieren mit internationalen Gästen", font:"Arial", size:21, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:0},  children:[new TextRun({text:"Buchungsverluste durch Warteschleifen", font:"Arial", size:21, color:TEXT})]}),
            ]}),
          new TableCell({ borders:nobs, width:{size:360,type:WidthType.DXA}, children:[new Paragraph({children:[]})] }),
          new TableCell({ borders:brds, shading:{fill:LIGHT,type:ShadingType.CLEAR}, width:{size:W/2-180,type:WidthType.DXA}, margins:{top:180,bottom:180,left:200,right:200},
            children:[
              new Paragraph({spacing:{before:0,after:80}, children:[new TextRun({text:"MIT AVA", font:"Arial", size:18, bold:true, color:GREEN, characterSpacing:60})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"AVA Growth: € 899/Monat", font:"Arial", size:21, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"100% Anruferfassung, 24/7", font:"Arial", size:21, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"40+ Sprachen, automatisch erkannt", font:"Arial", size:21, color:TEXT})]}),
              new Paragraph({spacing:{before:0,after:0},  children:[new TextRun({text:"Sofortige Buchungsbestätigung", font:"Arial", size:21, color:TEXT})]}),
            ]}),
        ]})]
      }),
      sp(),
      new Table({ width:{size:W,type:WidthType.DXA}, columnWidths:[W],
        rows:[new TableRow({ children:[new TableCell({ borders:brds, shading:{fill:BLUE,type:ShadingType.CLEAR}, width:{size:W,type:WidthType.DXA}, margins:{top:180,bottom:180,left:240,right:240},
          children:[
            new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:60}, children:[new TextRun({text:"Typische Ersparnis unserer Kunden im ersten Monat", font:"Arial", size:20, color:"CCDDFF"})]}),
            new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:0}, children:[new TextRun({text:"€ 1.800 – € 3.200 / Monat", font:"Arial", size:44, bold:true, color:WHITE})]}),
          ]
        })]})]
      }),
      sp(2),

      section("Nächste Schritte — So geht es weiter"),
      sp(),
      new Table({ width:{size:W,type:WidthType.DXA}, columnWidths:[600,8760],
        rows:[
          ...["Paket auswählen — Starter oder Growth? Wir empfehlen Growth für maximale Wirkung.",
              "Vertrag unterzeichnen — digital per E-Mail, dauert 5 Minuten.",
              "Wissensdatenbank befüllen — Sie liefern uns Ihre FAQs, Preise und Policies.",
              "AVA konfigurieren — wir richten alles ein, Sie müssen nichts technisch tun.",
              "Go-Live in 48 Stunden — AVA nimmt Ihre ersten echten Anrufe entgegen.",
          ].map((text, i) => new TableRow({ children:[
            new TableCell({ borders:nobs, shading:{fill:BLUE,type:ShadingType.CLEAR}, width:{size:600,type:WidthType.DXA}, margins:{top:120,bottom:80,left:140,right:140},
              children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:`0${i+1}`, font:"Arial", size:24, bold:true, color:WHITE})]})] }),
            new TableCell({ borders:{top:nob,left:nob,right:nob,bottom:{style:BorderStyle.SINGLE,size:1,color:"DDDDE8"}}, width:{size:8760,type:WidthType.DXA}, margins:{top:120,bottom:80,left:180,right:0},
              children:[new Paragraph({children:[new TextRun({text, font:"Arial", size:21, color:TEXT})]})] }),
          ]}))
        ]
      }),
      sp(2),

      // CTA BOX
      new Table({ width:{size:W,type:WidthType.DXA}, columnWidths:[W],
        rows:[new TableRow({ children:[new TableCell({ borders:brds, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:W,type:WidthType.DXA}, margins:{top:240,bottom:240,left:300,right:300},
          children:[
            new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:80}, children:[new TextRun({text:"Bereit zu starten?", font:"Arial", size:32, bold:true, color:WHITE})]}),
            new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:120}, children:[new TextRun({text:"Dieses Angebot ist 14 Tage gültig.", font:"Arial", size:21, color:"AAAACC"})]}),
            new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:80}, children:[new TextRun({text:"contact@ava-hq.com  ·  ava-hq.com", font:"Arial", size:22, color:BLUE, bold:true})]}),
          ]
        })]})]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("C:\\Users\\hss-azda3005\\OneDrive - Heinrich-Schickhardt-Schule\\Desktop\\AVA\\AVA_Angebot_Vorlage.docx", buf);
  console.log("✓ Angebot erstellt");
}).catch(console.error);
