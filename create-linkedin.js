const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, LevelFormat
} = require("docx");
const fs = require("fs");

const BLUE="0078FF",DARK="0D0D1A",WHITE="FFFFFF",TEXT="1A1A2E";
const GRAY="F5F7FA",GRAY_TEXT="666680",LIGHT="EBF4FF";
const W=9360;
const brd={style:BorderStyle.SINGLE,size:1,color:"DDDDE8"};
const brds={top:brd,bottom:brd,left:brd,right:brd};
const nob={style:BorderStyle.NONE,size:0,color:"FFFFFF"};
const nobs={top:nob,bottom:nob,left:nob,right:nob};

const sp=(n=1)=>new Paragraph({spacing:{before:0,after:n*100},children:[new TextRun("")]});
const run=(t,o={})=>new TextRun({text:t,font:"Arial",size:21,color:TEXT,...o});
const p=(t,o={})=>new Paragraph({spacing:{before:60,after:100},...o,children:[run(t)]});
const bold=(t)=>new Paragraph({spacing:{before:60,after:80},children:[run(t,{bold:true})]});

function h(title) {
  return new Paragraph({spacing:{before:400,after:160},
    border:{bottom:{style:BorderStyle.SINGLE,size:3,color:BLUE,space:3}},
    children:[
      new TextRun({text:"▌ ",font:"Arial",size:24,color:BLUE}),
      new TextRun({text:title,font:"Arial",size:24,bold:true,color:DARK}),
    ]
  });
}

function postBox(num, tag, text, tip="") {
  return new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[560,8800],
    rows:[
      new TableRow({children:[
        new TableCell({borders:{top:brd,left:brd,bottom:nob,right:nob}, shading:{fill:BLUE,type:ShadingType.CLEAR}, width:{size:560,type:WidthType.DXA}, margins:{top:120,bottom:0,left:120,right:120},
          children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:`#${num}`,font:"Arial",size:22,bold:true,color:WHITE})]})]}),
        new TableCell({borders:{top:brd,right:brd,bottom:nob,left:nob}, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:8800,type:WidthType.DXA}, margins:{top:100,bottom:100,left:180,right:180},
          children:[new Paragraph({children:[new TextRun({text:tag,font:"Arial",size:19,bold:true,color:BLUE}),new TextRun({text:`   ${tip}`,font:"Arial",size:18,color:GRAY_TEXT,italics:true})]})]}),
      ]}),
      new TableRow({children:[
        new TableCell({borders:{top:nob,left:brd,bottom:brd,right:nob}, shading:{fill:LIGHT,type:ShadingType.CLEAR}, width:{size:560,type:WidthType.DXA}, children:[new Paragraph({children:[]})]}),
        new TableCell({borders:{top:nob,left:nob,bottom:brd,right:brd}, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:8800,type:WidthType.DXA}, margins:{top:160,bottom:160,left:200,right:200},
          children:text.split("\n").map(line=>new Paragraph({spacing:{before:0,after:60},children:[new TextRun({text:line,font:"Arial",size:21,color:TEXT})]}))}),
      ]}),
    ]
  });
}

const doc = new Document({
  numbering:{config:[{reference:"b",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:560,hanging:280}}}}]}]},
  styles:{default:{document:{run:{font:"Arial",size:21,color:TEXT}}}},
  sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1200,right:1300,bottom:1200,left:1300}}},
    headers:{default:new Header({children:[new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:3,color:BLUE,space:3}},
      children:[new TextRun({text:"AVA AI  —  LinkedIn Leitfaden",font:"Arial",size:18,color:GRAY_TEXT}),
                new TextRun({text:"   |   Intern",font:"Arial",size:18,color:"CC0000",bold:true})]
    })]})},
    footers:{default:new Footer({children:[new Paragraph({
      border:{top:{style:BorderStyle.SINGLE,size:2,color:"DDDDE8",space:3}},
      children:[new TextRun({text:"AVA AI  ·  ava-hq.com  ·  contact@ava-hq.com",font:"Arial",size:17,color:GRAY_TEXT}),
                new TextRun({text:"   Seite ",font:"Arial",size:17,color:GRAY_TEXT}),
                new TextRun({children:[PageNumber.CURRENT],font:"Arial",size:17,color:GRAY_TEXT})]
    })]})},
    children:[

      sp(2),
      new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:100},
        children:[new TextRun({text:"LINKEDIN LEITFADEN",font:"Arial",size:60,bold:true,color:BLUE})]}),
      new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:80},
        children:[new TextRun({text:"AVA AI — Aufbau, Strategie & Inhalte",font:"Arial",size:28,color:DARK})]}),
      new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:600},
        children:[new TextRun({text:"B2B-Kanal für Hotels & Servicebetriebe",font:"Arial",size:21,color:GRAY_TEXT,italics:true})]}),

      // SEITE EINRICHTEN
      h("1. LinkedIn-Unternehmensseite einrichten"),
      sp(),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[400,8960],
        rows:[
          ...["Gehe auf linkedin.com → Oben rechts → \"Produkte\" → \"Unternehmensseite erstellen\"",
              "Wähle: \"Kleinunternehmen\"",
              "Unternehmensname: AVA AI",
              "LinkedIn-URL: linkedin.com/company/ava-ai-de   (oder ähnlich, prüfen ob frei)",
              "Website: https://ava-hq.com",
              "Branche: \"Informationstechnologie und -dienste\"",
              "Unternehmensgröße: 1–10 Mitarbeiter",
              "Unternehmenstyp: Privatunternehmen",
          ].map((t,i)=>new TableRow({children:[
            new TableCell({borders:brds, shading:{fill:BLUE,type:ShadingType.CLEAR}, width:{size:400,type:WidthType.DXA}, margins:{top:80,bottom:80,left:100,right:100},
              children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:`${i+1}`,font:"Arial",size:21,bold:true,color:WHITE})]})]}),
            new TableCell({borders:brds, shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR}, width:{size:8960,type:WidthType.DXA}, margins:{top:80,bottom:80,left:160,right:160},
              children:[new Paragraph({children:[new TextRun({text:t,font:"Arial",size:21,color:TEXT})]})]}),
          ]}))
        ]
      }),
      sp(2),

      // TEXTE
      h("2. Pflichtfelder — Diese Texte exakt eintragen"),
      sp(),
      bold("Tagline (120 Zeichen):"),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[W],
        rows:[new TableRow({children:[new TableCell({borders:brds, shading:{fill:LIGHT,type:ShadingType.CLEAR}, width:{size:W,type:WidthType.DXA}, margins:{top:140,bottom:140,left:200,right:200},
          children:[new Paragraph({children:[new TextRun({text:"KI Voice Agent für Hotels — 24/7, mehrsprachig, ohne Personalkosten. Kein Anruf bleibt unbeantwortet.",font:"Arial",size:21,bold:true,color:DARK})]})]
        })]})]
      }),
      sp(),
      bold("Unternehmensbeschreibung (vollständig):"),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[W],
        rows:[new TableRow({children:[new TableCell({borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:W,type:WidthType.DXA}, margins:{top:160,bottom:160,left:200,right:200},
          children:[
            new Paragraph({spacing:{before:0,after:80}, children:[new TextRun({text:"AVA AI automatisiert die Gästekommunikation von Hotels und Servicebetrieben vollständig.",font:"Arial",size:21,bold:true,color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:80}, children:[new TextRun({text:"Unser KI-Voice-Agent nimmt Anrufe sofort entgegen, beantwortet Fragen und nimmt Buchungen entgegen — rund um die Uhr, in 40+ Sprachen, ohne Pause. Kein Personal nötig. Keine Warteschleife. Kein verpasster Anruf mehr.",font:"Arial",size:21,color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:80}, children:[new TextRun({text:"Was AVA für Ihr Hotel tut:",font:"Arial",size:21,bold:true,color:TEXT})]}),
            ...["✓ 24/7 Anrufannahme — auch nachts, am Wochenende, an Feiertagen",
                "✓ FAQ-Beantwortung in Echtzeit (Zimmerpreise, Check-in, Parken, WLAN…)",
                "✓ Buchungsannahme und automatische Bestätigung",
                "✓ 40+ Sprachen — automatisch erkannt",
                "✓ Integration in Mews, Opera, HubSpot & 200+ Systeme",
                "✓ Ab € 399/Monat — monatlich kündbar",
            ].map(t=>new Paragraph({spacing:{before:0,after:40}, children:[new TextRun({text:t,font:"Arial",size:21,color:TEXT})]})),
            new Paragraph({spacing:{before:80,after:0}, children:[new TextRun({text:"Kostenloses Strategiegespräch: ava-hq.com",font:"Arial",size:21,bold:true,color:BLUE})]}),
          ]
        })]})]
      }),
      sp(2),

      // BILD GUIDE
      h("3. Bilder & Profiloptimierung"),
      sp(),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[3000,6360],
        rows:[
          new TableRow({children:[
            new TableCell({borders:brds, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:3000,type:WidthType.DXA}, margins:{top:100,bottom:100,left:140,right:140},
              children:[new Paragraph({children:[new TextRun({text:"Element",font:"Arial",size:20,bold:true,color:WHITE})]})]}),
            new TableCell({borders:brds, shading:{fill:DARK,type:ShadingType.CLEAR}, width:{size:6360,type:WidthType.DXA}, margins:{top:100,bottom:100,left:140,right:140},
              children:[new Paragraph({children:[new TextRun({text:"Vorgabe",font:"Arial",size:20,bold:true,color:WHITE})]})]}),
          ]}),
          ...[
            ["Logo (Profilbild)","ava-icon.png — 300×300px — schwarzer Hintergrund mit AVA-Schrift"],
            ["Titelbild (Banner)","1128×191px — dunkler Hintergrund, blauer Text: \"KI Voice Agent für Hotels — ava-hq.com\""],
            ["Hauptsprache","Deutsch"],
            ["Hashtags (folgen)","#HotelTech #KI #VoiceAgent #Hospitality #HotelManagement"],
            ["Branche-Keywords","KI, Voice Agent, Hotel Automation, AI Rezeption, Sprachassistent"],
          ].map(([a,b],i)=>new TableRow({children:[
            new TableCell({borders:brds, shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR}, width:{size:3000,type:WidthType.DXA}, margins:{top:90,bottom:90,left:140,right:140},
              children:[new Paragraph({children:[new TextRun({text:a,font:"Arial",size:21,bold:true,color:TEXT})]})]}),
            new TableCell({borders:brds, shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR}, width:{size:6360,type:WidthType.DXA}, margins:{top:90,bottom:90,left:140,right:140},
              children:[new Paragraph({children:[new TextRun({text:b,font:"Arial",size:21,color:TEXT})]})]}),
          ]}))
        ]
      }),
      sp(2),

      // CONTENT STRATEGIE
      h("4. Content-Strategie — Was & Wie oft posten"),
      sp(),
      p("Ziel: 2–3 Posts pro Woche. Hotels, Hotelmanager und Gastgewerbe ansprechen. Kein Fachjargon — klare Botschaften, echte Zahlen."),
      sp(),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[1600,2600,5160],
        rows:[
          new TableRow({children:[
            new TableCell({borders:brds,shading:{fill:DARK,type:ShadingType.CLEAR},width:{size:1600,type:WidthType.DXA},margins:{top:100,bottom:100,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:"Häufigkeit",font:"Arial",size:20,bold:true,color:WHITE})]})]  }),
            new TableCell({borders:brds,shading:{fill:DARK,type:ShadingType.CLEAR},width:{size:2600,type:WidthType.DXA},margins:{top:100,bottom:100,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:"Post-Typ",font:"Arial",size:20,bold:true,color:WHITE})]})]  }),
            new TableCell({borders:brds,shading:{fill:DARK,type:ShadingType.CLEAR},width:{size:5160,type:WidthType.DXA},margins:{top:100,bottom:100,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:"Beispiel-Thema",font:"Arial",size:20,bold:true,color:WHITE})]})]  }),
          ]}),
          ...[
            ["1× pro Woche","Problem/Lösung","\"62% der Hotelgäste rufen nicht zurück wenn eine Mailbox antwortet. Was kostet Sie das?\""],
            ["1× pro Woche","Ergebnis/Statistik","\"Unser Kunde: +€28.000 Mehrumsatz im ersten Monat mit AVA\""],
            ["1× pro Woche","Edukation","\"5 Fragen, die AVA jeden Tag für Hotels beantwortet (die Rezeption eigentlich nicht will)\""],
            ["1× pro Monat","Hinter den Kulissen","\"So klingen 3 Sekunden KI-Telefon vs. 3 Minuten Warteschleife\""],
            ["1× pro Monat","Kundenreferenz","\"[Hotelname] spart 40h/Woche mit AVA — hier ist wie\""],
          ].map(([a,b,c],i)=>new TableRow({children:[
            new TableCell({borders:brds,shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR},width:{size:1600,type:WidthType.DXA},margins:{top:80,bottom:80,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:a,font:"Arial",size:20,color:BLUE,bold:true})]})]}),
            new TableCell({borders:brds,shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR},width:{size:2600,type:WidthType.DXA},margins:{top:80,bottom:80,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:b,font:"Arial",size:20,color:TEXT,bold:true})]})]}),
            new TableCell({borders:brds,shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR},width:{size:5160,type:WidthType.DXA},margins:{top:80,bottom:80,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:c,font:"Arial",size:20,color:TEXT})]})]}),
          ]}))
        ]
      }),
      sp(2),

      // 5 FERTIGE POSTS
      h("5. Fertige Post-Vorlagen — Sofort kopieren & posten"),
      sp(),
      postBox(1,"Eröffnungs-Post (Tag 1)","AVA AI ist jetzt auf LinkedIn. 👋\n\nWir bauen den KI-Voice-Agenten für Hotels — einer der wenigen, der wirklich funktioniert.\n\nDas Problem das wir lösen:\nJedes Hotel verliert täglich Buchungen durch verpasste Anrufe.\n62% der Gäste rufen nach einer Mailbox nie zurück.\n\nDie Lösung:\nAVA nimmt jeden Anruf sofort entgegen. 24/7. In 40+ Sprachen. Ab €399/Monat.\n\nWenn Sie Hotelier sind und das kennen — schreiben Sie uns.\n\n🔗 ava-hq.com\n\n#HotelTech #KIVoiceAgent #Hospitality #AVA","→ Als erster Post, direkt nach Seitenerstellung"),
      sp(),
      postBox(2,"Problem-Post","Die teuerste Stunde im Hotel ist nicht die mit dem meisten Personal.\n\nEs ist die, in der das Telefon klingelt — und niemand abnimmt.\n\n→ Gast ruft an\n→ Niemand da\n→ Mailbox\n→ Gast bucht woanders\n\nDas passiert in jedem Hotel. Jeden Tag. Mehrmals.\n\nAVA löst das. Automatisch. Sofort.\n\nKostenloses Gespräch: ava-hq.com\n\n#Hotel #Rezeption #Buchung #KI #HotelManagement","→ Woche 2"),
      sp(),
      postBox(3,"Zahlen-Post","Was kostet ein Rezeptionist?\n\n→ Gehalt: €2.800 – €3.500/Monat\n→ Lohnnebenkosten: +20%\n→ Urlaub, Krankheit: unbezahlte Lücken\n→ Sprachkenntnisse: begrenzt\n→ Verfügbar: 8h/Tag, 5 Tage/Woche\n\nWas kostet AVA?\n\n→ €399/Monat\n→ Keine Nebenkosten\n→ 40+ Sprachen\n→ 24/7 verfügbar\n→ Reaktionszeit: < 1 Sekunde\n\nKein Vergleich.\n\n#HotelCosts #KI #Automatisierung #AVA","→ Woche 3"),
      sp(),
      postBox(4,"Frage-Post (Engagement)","Kurze Frage an alle Hoteliers hier:\n\nWie viele Anrufe verpasst Ihr Hotel pro Woche schätzungsweise?\n\n□ 0–5\n□ 5–20\n□ 20–50\n□ Ich will das gar nicht wissen 😅\n\nUnsere Erfahrung: die meisten Hotels unterschätzen die Zahl um Faktor 3.\n\nAVA zählt jeden Anruf. Und beantwortet jeden.\n\n👇 Kommentar sehr willkommen.\n\n#Hotel #Hotelier #Rezeption #AVA","→ Woche 4 — generiert Kommentare"),
      sp(),
      postBox(5,"Social Proof Post","\"Wir sind von 40% verpassten Buchungen auf 100% Erfassungsrate gegangen.\"\n— Markus H., General Manager\n\nEin Monat AVA. €28.000 Mehrumsatz.\n\nDas ist keine Werbung. Das sind echte Zahlen.\n\nWenn Sie ähnliche Ergebnisse wollen:\n🔗 ava-hq.com/demo\n\n#HotelSuccess #KI #Buchungen #AVA","→ Sobald erste Kundenreferenz vorhanden"),
      sp(2),

      // NETZWERK AUFBAUEN
      h("6. Netzwerk aufbauen — Wen verbinden"),
      sp(),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[3200,6160],
        rows:[
          new TableRow({children:[
            new TableCell({borders:brds,shading:{fill:DARK,type:ShadingType.CLEAR},width:{size:3200,type:WidthType.DXA},margins:{top:100,bottom:100,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:"Zielgruppe",font:"Arial",size:20,bold:true,color:WHITE})]})]}),
            new TableCell({borders:brds,shading:{fill:DARK,type:ShadingType.CLEAR},width:{size:6160,type:WidthType.DXA},margins:{top:100,bottom:100,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:"LinkedIn-Suche / Vorgehen",font:"Arial",size:20,bold:true,color:WHITE})]})]}),
          ]}),
          ...[
            ["General Manager Hotels","Suche: \"General Manager Hotel\" + Deutschland/Österreich/Schweiz"],
            ["Hotel-Besitzer","Suche: \"Hotelier\" oder \"Hotelinhaber\""],
            ["Revenue Manager","Suche: \"Revenue Manager Hotel\""],
            ["Hospitality-Verbände","DEHOGA, ÖHV, HotellerieSuisse — Seiten folgen"],
            ["Hotel-Tech-Blogs","Hospitality Technology, Hotel Management — folgen & kommentieren"],
          ].map(([a,b],i)=>new TableRow({children:[
            new TableCell({borders:brds,shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR},width:{size:3200,type:WidthType.DXA},margins:{top:80,bottom:80,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:a,font:"Arial",size:21,bold:true,color:BLUE})]})]}),
            new TableCell({borders:brds,shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR},width:{size:6160,type:WidthType.DXA},margins:{top:80,bottom:80,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:b,font:"Arial",size:21,color:TEXT})]})]}),
          ]}))
        ]
      }),
      sp(2),

      // CONNECTION MESSAGE
      h("7. Verbindungsanfrage-Vorlage"),
      sp(),
      new Table({width:{size:W,type:WidthType.DXA}, columnWidths:[W],
        rows:[new TableRow({children:[new TableCell({borders:brds, shading:{fill:GRAY,type:ShadingType.CLEAR}, width:{size:W,type:WidthType.DXA}, margins:{top:180,bottom:180,left:240,right:240},
          children:[
            new Paragraph({spacing:{before:0,after:80}, children:[new TextRun({text:"Hallo [Name],",font:"Arial",size:21,bold:true,color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:80}, children:[new TextRun({text:"ich bin Azad von AVA AI — wir bauen KI-Voice-Agenten speziell für Hotels. Ich vernetze mich gerne mit erfahrenen Hoteliers und würde mich über den Austausch freuen.",font:"Arial",size:21,color:TEXT})]}),
            new Paragraph({spacing:{before:0,after:0}, children:[new TextRun({text:"Viele Grüße, Azad",font:"Arial",size:21,color:TEXT})]}),
          ]
        })]})]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync("C:\\Users\\hss-azda3005\\OneDrive - Heinrich-Schickhardt-Schule\\Desktop\\AVA\\AVA_LinkedIn_Leitfaden.docx",buf);
  console.log("✓ LinkedIn Leitfaden erstellt");
}).catch(console.error);
