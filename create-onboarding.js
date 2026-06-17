const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, LevelFormat, PageBreak
} = require("docx");
const fs = require("fs");

const BLUE="0078FF", DARK="0D0D1A", WHITE="FFFFFF", TEXT="1A1A2E";
const GRAY="F5F7FA", GRAY_TEXT="666680", LIGHT="EBF4FF", GREEN="00C47A", ORANGE="FF8C00";
const W=9360;
const brd={style:BorderStyle.SINGLE,size:1,color:"DDDDE8"};
const brds={top:brd,bottom:brd,left:brd,right:brd};
const nob={style:BorderStyle.NONE,size:0,color:"FFFFFF"};
const nobs={top:nob,bottom:nob,left:nob,right:nob};

const sp=(n=1)=>new Paragraph({spacing:{before:0,after:n*100},children:[new TextRun("")]});
const run=(text,opts={})=>new TextRun({text,font:"Arial",size:21,color:TEXT,...opts});

function phase(num, title, color=BLUE) {
  return new Paragraph({
    spacing:{before:500,after:0},
    children:[
      new TextRun({text:`PHASE ${num}  `, font:"Arial", size:20, bold:true, color:WHITE,
        highlight:"none", shading:{type:ShadingType.CLEAR, fill:color}}),
      new TextRun({text:`  ${title}`, font:"Arial", size:28, bold:true, color:DARK}),
    ],
    border:{
      bottom:{style:BorderStyle.SINGLE, size:4, color, space:4},
      left:{style:BorderStyle.SINGLE, size:12, color, space:6},
    },
    indent:{left:120}
  });
}

function taskRow(done, task, owner, day, note="") {
  return new TableRow({ children:[
    new TableCell({borders:brds, width:{size:600,type:WidthType.DXA}, shading:{fill:done?"EDFFF6":GRAY,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:100,right:100},
      children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:done?"☑":"☐", font:"Arial", size:22, color:done?GREEN:GRAY_TEXT})]})] }),
    new TableCell({borders:brds, width:{size:4600,type:WidthType.DXA}, shading:{fill:done?"EDFFF6":WHITE,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:140,right:140},
      children:[new Paragraph({children:[new TextRun({text:task, font:"Arial", size:21, color:TEXT})]}),
        ...(note ? [new Paragraph({spacing:{before:20,after:0}, children:[new TextRun({text:`→ ${note}`, font:"Arial", size:19, color:GRAY_TEXT, italics:true})]})] : [])
      ]}),
    new TableCell({borders:brds, width:{size:2200,type:WidthType.DXA}, shading:{fill:done?"EDFFF6":GRAY,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:140,right:140},
      children:[new Paragraph({children:[new TextRun({text:owner, font:"Arial", size:20, color:BLUE, bold:true})]})] }),
    new TableCell({borders:brds, width:{size:1960,type:WidthType.DXA}, shading:{fill:done?"EDFFF6":WHITE,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:140,right:140},
      children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:day, font:"Arial", size:20, color:GRAY_TEXT})]})] }),
  ]});
}

function tableHeader() {
  return new TableRow({ children:[
    new TableCell({borders:brds, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:600,type:WidthType.DXA}, margins:{top:100,bottom:100,left:100,right:100},
      children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"✓", font:"Arial", size:20, bold:true, color:WHITE})]})] }),
    new TableCell({borders:brds, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:4600,type:WidthType.DXA}, margins:{top:100,bottom:100,left:140,right:140},
      children:[new Paragraph({children:[new TextRun({text:"Aufgabe", font:"Arial", size:20, bold:true, color:WHITE})]})] }),
    new TableCell({borders:brds, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:2200,type:WidthType.DXA}, margins:{top:100,bottom:100,left:140,right:140},
      children:[new Paragraph({children:[new TextRun({text:"Verantwortlich", font:"Arial", size:20, bold:true, color:WHITE})]})] }),
    new TableCell({borders:brds, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:1960,type:WidthType.DXA}, margins:{top:100,bottom:100,left:140,right:140},
      children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Bis Tag", font:"Arial", size:20, bold:true, color:WHITE})]})] }),
  ]});
}

const doc = new Document({
  numbering:{config:[{reference:"bullets",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:560,hanging:280}}}}]}]},
  styles:{default:{document:{run:{font:"Arial",size:21,color:TEXT}}}},
  sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1200,right:1200,bottom:1200,left:1200}}},
    headers:{default:new Header({children:[new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:3,color:BLUE,space:3}},
      children:[
        new TextRun({text:"AVA AI  —  Kunden-Onboarding Checkliste", font:"Arial", size:18, color:GRAY_TEXT}),
        new TextRun({text:"   |   Intern & Vertraulich", font:"Arial", size:18, color:"CC0000", bold:true}),
      ]
    })]})},
    footers:{default:new Footer({children:[new Paragraph({
      border:{top:{style:BorderStyle.SINGLE,size:2,color:"DDDDE8",space:3}},
      children:[
        new TextRun({text:"AVA AI  ·  ava-hq.com  ·  contact@ava-hq.com", font:"Arial", size:17, color:GRAY_TEXT}),
        new TextRun({text:"        Seite ", font:"Arial", size:17, color:GRAY_TEXT}),
        new TextRun({children:[PageNumber.CURRENT], font:"Arial", size:17, color:GRAY_TEXT}),
      ]
    })]})},
    children:[

      // TITEL
      sp(2),
      new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:100},
        children:[new TextRun({text:"KUNDEN-ONBOARDING", font:"Arial", size:60, bold:true, color:BLUE})]}),
      new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:80},
        children:[new TextRun({text:"Checkliste — Von Vertragsabschluss bis Go-Live", font:"Arial", size:28, color:DARK})]}),
      new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:500},
        children:[new TextRun({text:"AVA AI  ·  Intern  ·  Stand: Juni 2025", font:"Arial", size:20, color:GRAY_TEXT, italics:true})]}),

      // KUNDENINFO BOX
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[W/2-180,360,W/2-180],
        rows:[new TableRow({children:[
          new TableCell({borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:W/2-180,type:WidthType.DXA}, margins:{top:160,bottom:160,left:200,right:200},
            children:[
              new Paragraph({spacing:{before:0,after:60}, children:[new TextRun({text:"KUNDE", font:"Arial", size:17, bold:true, color:BLUE, characterSpacing:60})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"Hotel / Firma:", font:"Arial", size:20, bold:true, color:GRAY_TEXT})]}),
              new Paragraph({spacing:{before:0,after:0}, border:{bottom:brd}, children:[new TextRun({text:" ", font:"Arial", size:28})]}),
              new Paragraph({spacing:{before:60,after:40}, children:[new TextRun({text:"Ansprechpartner:", font:"Arial", size:20, bold:true, color:GRAY_TEXT})]}),
              new Paragraph({spacing:{before:0,after:0}, border:{bottom:brd}, children:[new TextRun({text:" ", font:"Arial", size:28})]}),
            ]}),
          new TableCell({borders:nobs, width:{size:360,type:WidthType.DXA}, children:[new Paragraph({children:[]})]}),
          new TableCell({borders:brds, shading:{fill:LIGHT,type:ShadingType.CLEAR}, width:{size:W/2-180,type:WidthType.DXA}, margins:{top:160,bottom:160,left:200,right:200},
            children:[
              new Paragraph({spacing:{before:0,after:60}, children:[new TextRun({text:"VERTRAG", font:"Arial", size:17, bold:true, color:BLUE, characterSpacing:60})]}),
              new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:"Paket:", font:"Arial", size:20, bold:true, color:GRAY_TEXT})]}),
              new Paragraph({spacing:{before:0,after:0}, border:{bottom:brd}, children:[new TextRun({text:" ", font:"Arial", size:28})]}),
              new Paragraph({spacing:{before:60,after:40}, children:[new TextRun({text:"Startdatum:", font:"Arial", size:20, bold:true, color:GRAY_TEXT})]}),
              new Paragraph({spacing:{before:0,after:0}, border:{bottom:brd}, children:[new TextRun({text:" ", font:"Arial", size:28})]}),
            ]}),
        ]})]
      }),
      sp(2),

      // TIMELINE
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[W/4,W/4,W/4,W/4],
        rows:[new TableRow({children:[
          ...[[BLUE,"Tag 1–2","Vertragsabschluss & Kickoff"],[GREEN,"Tag 2–4","Setup & Konfiguration"],[ORANGE,"Tag 5–10","Tests & Feintuning"],["7B2D8B","Tag 11–21","Launch & Monitoring"]].map(([col,tag,label])=>
            new TableCell({borders:brds, shading:{fill:col,type:ShadingType.CLEAR}, width:{size:W/4,type:WidthType.DXA}, margins:{top:140,bottom:140,left:140,right:140},
              children:[
                new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:60}, children:[new TextRun({text:tag, font:"Arial", size:20, bold:true, color:WHITE})]}),
                new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:0}, children:[new TextRun({text:label, font:"Arial", size:19, color:WHITE})]}),
              ]})
          )
        ]})]
      }),
      sp(2),

      // PHASE 1
      phase(1, "Vertragsabschluss & Kickoff  (Tag 1–2)", BLUE),
      sp(),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[600,4600,2200,1960],
        rows:[
          tableHeader(),
          taskRow(false,"Vertrag unterzeichnet und zurückerhalten","AVA","Tag 1"),
          taskRow(false,"Erste Rechnung / Zahlungsbestätigung","AVA","Tag 1"),
          taskRow(false,"Willkommens-E-Mail an Kunden senden","AVA","Tag 1","Vorlage verwenden (siehe unten)"),
          taskRow(false,"Kickoff-Call vereinbaren (30 Min.)","AVA","Tag 1"),
          taskRow(false,"Kickoff-Call durchgeführt","AVA","Tag 2","Ziele, Erwartungen, Zeitplan besprechen"),
          taskRow(false,"Zugang zu Buchungssystem erhalten","Kunde","Tag 2"),
          taskRow(false,"FAQ-Liste vom Kunden erhalten (mind. 20 Fragen)","Kunde","Tag 2"),
          taskRow(false,"Preisliste & Policies erhalten","Kunde","Tag 2"),
          taskRow(false,"Eskalationskontakt festgelegt (wer bei dringenden Fällen)","Kunde","Tag 2"),
        ]
      }),
      sp(2),

      // PHASE 2
      phase(2, "Setup & Konfiguration  (Tag 2–4)", GREEN),
      sp(),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[600,4600,2200,1960],
        rows:[
          tableHeader(),
          taskRow(false,"Wissensdatenbank in Vapi befüllt","AVA","Tag 3","FAQs, Preise, Zeiten, Policies"),
          taskRow(false,"Assistenten-Stimme ausgewählt & konfiguriert","AVA","Tag 3"),
          taskRow(false,"Begrüßungstext (First Message) festgelegt","AVA","Tag 3"),
          taskRow(false,"System Prompt finalisiert","AVA","Tag 3"),
          taskRow(false,"Eskalationsregeln konfiguriert","AVA","Tag 3","Wann wird weitergeleitet?"),
          taskRow(false,"Telefonnummer eingerichtet / Weiterleitung aktiv","AVA","Tag 4"),
          taskRow(false,"CRM-Integration konfiguriert (falls Growth-Paket)","AVA","Tag 4"),
          taskRow(false,"E-Mail-Benachrichtigungen eingerichtet","AVA","Tag 4"),
          taskRow(false,"Interner Testanruf durchgeführt (AVA-Team)","AVA","Tag 4"),
        ]
      }),
      sp(2),
      new Paragraph({children:[new PageBreak()]}),

      // PHASE 3
      phase(3, "Tests & Feintuning  (Tag 5–10)", ORANGE),
      sp(),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[600,4600,2200,1960],
        rows:[
          tableHeader(),
          taskRow(false,"Testanruf mit Kunden gemeinsam durchgeführt","Beide","Tag 5"),
          taskRow(false,"Feedback vom Kunden eingeholt","Beide","Tag 5"),
          taskRow(false,"Anpassungen an Wissensdatenbank vorgenommen","AVA","Tag 6"),
          taskRow(false,"Sprachqualität & Reaktionszeit geprüft","AVA","Tag 6"),
          taskRow(false,"Edge Cases getestet (unbekannte Fragen, Stille, Sprache)","AVA","Tag 7"),
          taskRow(false,"Zweiter Testanruf mit Kunden","Beide","Tag 8"),
          taskRow(false,"Finale Freigabe durch Kunden","Kunde","Tag 9","Schriftliche Bestätigung per E-Mail"),
          taskRow(false,"Mitarbeiter des Kunden informiert & eingewiesen","Beide","Tag 10","Wer wird bei Eskalation kontaktiert?"),
        ]
      }),
      sp(2),

      // PHASE 4
      phase(4, "Launch & Monitoring  (Tag 11–21)", "7B2D8B"),
      sp(),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[600,4600,2200,1960],
        rows:[
          tableHeader(),
          taskRow(false,"Soft Launch: 10% der echten Anrufe an AVA","AVA","Tag 11"),
          taskRow(false,"Monitoring: Erste echte Gespräche geprüft","AVA","Tag 12"),
          taskRow(false,"Feedback nach ersten echten Anrufen eingeholt","AVA","Tag 13"),
          taskRow(false,"Vollständiger Go-Live (100% der Anrufe)","AVA","Tag 14"),
          taskRow(false,"Erste Woche Go-Live — tägliches Monitoring","AVA","Tag 14–21"),
          taskRow(false,"Erstes Reporting an Kunden geschickt","AVA","Tag 21","Anrufvolumen, häufigste Fragen, Bewertung"),
          taskRow(false,"Onboarding offiziell abgeschlossen","AVA","Tag 21"),
          taskRow(false,"Termin für monatliche Optimierungssitzung vereinbart","Beide","Tag 21","Nur Growth-Paket"),
        ]
      }),
      sp(2),

      // E-MAIL VORLAGEN
      new Paragraph({spacing:{before:400,after:160}, border:{bottom:{style:BorderStyle.SINGLE,size:3,color:BLUE,space:3}},
        children:[new TextRun({text:"▌ E-Mail Vorlagen", font:"Arial", size:24, bold:true, color:DARK})]}),
      sp(),

      new Paragraph({spacing:{before:0,after:100}, children:[new TextRun({text:"Willkommens-E-Mail (direkt nach Vertragsabschluss senden)", font:"Arial", size:21, bold:true, color:BLUE})]}),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[W],
        rows:[new TableRow({children:[new TableCell({borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:W,type:WidthType.DXA}, margins:{top:180,bottom:180,left:240,right:240},
          children:[
            new Paragraph({spacing:{before:0,after:60},  children:[new TextRun({text:'Betreff: Willkommen bei AVA AI — Ihr Onboarding startet jetzt 🚀', font:"Arial", size:20, bold:true, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:60},  children:[new TextRun({text:"Sehr geehrte/r [Name],", font:"Arial", size:20, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:60},  children:[new TextRun({text:"herzlich willkommen bei AVA AI! Wir freuen uns sehr, Sie an Bord zu haben.", font:"Arial", size:20, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:60},  children:[new TextRun({text:"In den nächsten 48 Stunden werden wir gemeinsam folgendes einrichten:", font:"Arial", size:20, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:20},  children:[new TextRun({text:"→ Ihren persönlichen KI-Voice-Agenten konfigurieren", font:"Arial", size:20, color:GRAY_TEXT})]}),
            new Paragraph({spacing:{before:0,after:20},  children:[new TextRun({text:"→ Ihre Wissensdatenbank befüllen", font:"Arial", size:20, color:GRAY_TEXT})]}),
            new Paragraph({spacing:{before:0,after:60},  children:[new TextRun({text:"→ Erste Tests durchführen", font:"Arial", size:20, color:GRAY_TEXT})]}),
            new Paragraph({spacing:{before:0,after:60},  children:[new TextRun({text:"Wir werden uns in Kürze für einen kurzen Kickoff-Call bei Ihnen melden.", font:"Arial", size:20, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:60},  children:[new TextRun({text:"Beste Grüße,", font:"Arial", size:20, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:0},   children:[new TextRun({text:"Azad Danki & Benjamin Serifovic — AVA AI", font:"Arial", size:20, bold:true, color:TEXT})]}),
          ]
        })]})]
      }),
      sp(2),

      new Paragraph({spacing:{before:0,after:100}, children:[new TextRun({text:"Go-Live-Bestätigung (an Tag 14 senden)", font:"Arial", size:21, bold:true, color:GREEN})]}),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[W],
        rows:[new TableRow({children:[new TableCell({borders:brds, shading:{fill:"EDFFF6",type:ShadingType.CLEAR}, width:{size:W,type:WidthType.DXA}, margins:{top:180,bottom:180,left:240,right:240},
          children:[
            new Paragraph({spacing:{before:0,after:60}, children:[new TextRun({text:"Betreff: AVA ist live — Ihr KI-Voice-Agent ist jetzt aktiv!", font:"Arial", size:20, bold:true, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:60}, children:[new TextRun({text:"Sehr geehrte/r [Name],", font:"Arial", size:20, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:60}, children:[new TextRun({text:"großartige Neuigkeit: AVA ist ab sofort live und nimmt Ihre ersten echten Anrufe entgegen!", font:"Arial", size:20, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:60}, children:[new TextRun({text:"Sie erhalten in 7 Tagen Ihr erstes Reporting mit allen Kennzahlen.", font:"Arial", size:20, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:60}, children:[new TextRun({text:"Bei Fragen jederzeit: contact@ava-hq.com", font:"Arial", size:20, color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:0},  children:[new TextRun({text:"Ihr AVA-Team", font:"Arial", size:20, bold:true, color:TEXT})]}),
          ]
        })]})]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync("C:\\Users\\hss-azda3005\\OneDrive - Heinrich-Schickhardt-Schule\\Desktop\\AVA\\AVA_Onboarding_Checkliste.docx",buf);
  console.log("✓ Onboarding Checkliste erstellt");
}).catch(console.error);
