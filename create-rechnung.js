const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, LevelFormat, VerticalAlign
} = require("docx");
const fs = require("fs");

const BLUE="0078FF", DARK="0D0D1A", WHITE="FFFFFF", TEXT="1A1A2E";
const GRAY="F5F7FA", LIGHT="EBF4FF", GRAY_TEXT="666680";
const W=9360;
const brd={style:BorderStyle.SINGLE,size:1,color:"DDDDE8"};
const brds={top:brd,bottom:brd,left:brd,right:brd};
const nob={style:BorderStyle.NONE,size:0,color:"FFFFFF"};
const nobs={top:nob,bottom:nob,left:nob,right:nob};

const run=(t,o={})=>new TextRun({text:t,font:"Arial",size:21,color:TEXT,...o});
const sp=(n=1)=>new Paragraph({spacing:{before:0,after:n*100},children:[new TextRun("")]});

function cell(text, opts={}) {
  const {w=2340, bold=false, align=AlignmentType.LEFT, bg=WHITE, color=TEXT, size=21, borders=brds} = opts;
  return new TableCell({
    borders,
    width:{size:w,type:WidthType.DXA},
    shading:{fill:bg,type:ShadingType.CLEAR},
    margins:{top:100,bottom:100,left:140,right:140},
    verticalAlign: VerticalAlign.CENTER,
    children:[new Paragraph({
      alignment:align,
      children:[new TextRun({text:String(text),font:"Arial",size,bold,color})]
    })]
  });
}

const doc = new Document({
  styles:{default:{document:{run:{font:"Arial",size:21,color:TEXT}}}},
  sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1000,right:1200,bottom:1000,left:1200}}},
    footers:{default:new Footer({children:[new Paragraph({
      border:{top:{style:BorderStyle.SINGLE,size:2,color:"DDDDE8",space:3}},
      spacing:{before:80,after:0},
      children:[
        new TextRun({text:"AVA AI  ·  Azad Danki & Benjamin Serifovic  ·  Herzog-Eugen-Str. 56/58, 72250 Freudenstadt",font:"Arial",size:16,color:GRAY_TEXT}),
        new TextRun({text:"   |   Seite ",font:"Arial",size:16,color:GRAY_TEXT}),
        new TextRun({children:[PageNumber.CURRENT],font:"Arial",size:16,color:GRAY_TEXT}),
      ]
    })]})},
    children:[

      // HEADER: Logo-Bereich + Rechnungsinfo nebeneinander
      new Table({width:{size:W,type:WidthType.DXA},columnWidths:[5200,4160],
        rows:[new TableRow({children:[
          // Links: Absender
          new TableCell({borders:nobs,width:{size:5200,type:WidthType.DXA},margins:{top:0,bottom:0,left:0,right:0},
            children:[
              new Paragraph({spacing:{before:0,after:60},children:[
                new TextRun({text:"AVA AI",font:"Arial",size:52,bold:true,color:BLUE})
              ]}),
              new Paragraph({spacing:{before:0,after:40},children:[run("Azad Danki & Benjamin Serifovic",{bold:true,size:20})]}),
              new Paragraph({spacing:{before:0,after:40},children:[run("Herzog-Eugen-Str. 56/58",{size:19,color:GRAY_TEXT})]}),
              new Paragraph({spacing:{before:0,after:40},children:[run("72250 Freudenstadt",{size:19,color:GRAY_TEXT})]}),
              new Paragraph({spacing:{before:0,after:40},children:[run("contact@ava-hq.com",{size:19,color:GRAY_TEXT})]}),
              new Paragraph({spacing:{before:0,after:0},children:[run("ava-hq.com",{size:19,color:GRAY_TEXT})]}),
            ]}),
          // Rechts: Rechnungsdetails
          new TableCell({borders:nobs,width:{size:4160,type:WidthType.DXA},margins:{top:0,bottom:0,left:0,right:0},
            children:[
              new Paragraph({alignment:AlignmentType.RIGHT,spacing:{before:0,after:40},children:[
                new TextRun({text:"RECHNUNG",font:"Arial",size:36,bold:true,color:DARK})
              ]}),
              new Table({width:{size:4160,type:WidthType.DXA},columnWidths:[2000,2160],
                rows:[
                  ...[
                    ["Rechnungsnummer","AVA-2026-001"],
                    ["Rechnungsdatum","[TT.MM.JJJJ]"],
                    ["Leistungszeitraum","[Monat JJJJ]"],
                    ["Kundennummer","[KD-001]"],
                    ["Zahlungsziel","14 Tage netto"],
                  ].map(([label,val],i)=>new TableRow({children:[
                    new TableCell({borders:nobs,width:{size:2000,type:WidthType.DXA},margins:{top:60,bottom:20,left:0,right:80},
                      children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[run(label+":",{size:18,color:GRAY_TEXT})]})]
                    }),
                    new TableCell({borders:nobs,width:{size:2160,type:WidthType.DXA},margins:{top:60,bottom:20,left:0,right:0},
                      children:[new Paragraph({children:[run(val,{size:18,bold:label==="Rechnungsnummer"})]})]
                    }),
                  ]}))
                ]
              }),
            ]}),
        ]})]
      }),

      sp(2),

      // TRENNLINIE
      new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:BLUE,space:1}},spacing:{before:0,after:0},children:[new TextRun("")]}),
      sp(),

      // EMPFÄNGER
      new Paragraph({spacing:{before:0,after:40},children:[run("Rechnungsempfänger",{bold:true,color:BLUE,size:18})]}),
      new Paragraph({spacing:{before:0,after:40},children:[run("[Firmenname Hotel]",{bold:true,size:22})]}),
      new Paragraph({spacing:{before:0,after:40},children:[run("z. Hd. [Ansprechpartner]",{color:GRAY_TEXT})]}),
      new Paragraph({spacing:{before:0,after:40},children:[run("[Straße und Hausnummer]",{color:GRAY_TEXT})]}),
      new Paragraph({spacing:{before:0,after:40},children:[run("[PLZ] [Ort]",{color:GRAY_TEXT})]}),
      new Paragraph({spacing:{before:0,after:0},children:[run("[Land]",{color:GRAY_TEXT})]}),

      sp(2),

      // LEISTUNGSTABELLE
      new Table({width:{size:W,type:WidthType.DXA},columnWidths:[400,4060,1000,1500,1500,900],
        rows:[
          // Kopfzeile
          new TableRow({children:[
            cell("Pos.",{w:400,bold:true,bg:DARK,color:WHITE,align:AlignmentType.CENTER}),
            cell("Leistungsbeschreibung",{w:4060,bold:true,bg:DARK,color:WHITE}),
            cell("Menge",{w:1000,bold:true,bg:DARK,color:WHITE,align:AlignmentType.CENTER}),
            cell("Einheit",{w:1500,bold:true,bg:DARK,color:WHITE,align:AlignmentType.CENTER}),
            cell("Einzelpreis",{w:1500,bold:true,bg:DARK,color:WHITE,align:AlignmentType.RIGHT}),
            cell("Gesamt",{w:900,bold:true,bg:DARK,color:WHITE,align:AlignmentType.RIGHT}),
          ]}),
          // Position 1
          new TableRow({children:[
            cell("1",{w:400,align:AlignmentType.CENTER,bg:WHITE}),
            new TableCell({borders:brds,width:{size:4060,type:WidthType.DXA},shading:{fill:WHITE,type:ShadingType.CLEAR},
              margins:{top:100,bottom:100,left:140,right:140},
              children:[
                new Paragraph({spacing:{before:0,after:40},children:[run("AVA AI Voice Agent — Starter Paket",{bold:true})]}),
                new Paragraph({spacing:{before:0,after:0},children:[run("KI-Sprachassistent 24/7, bis zu 40 Sprachen,",{size:19,color:GRAY_TEXT})]}),
                new Paragraph({spacing:{before:0,after:0},children:[run("FAQ-Beantwortung, Buchungsannahme, Support",{size:19,color:GRAY_TEXT})]}),
              ]}),
            cell("1",{w:1000,align:AlignmentType.CENTER,bg:WHITE}),
            cell("Monat",{w:1500,align:AlignmentType.CENTER,bg:WHITE}),
            cell("399,00 €",{w:1500,align:AlignmentType.RIGHT,bg:WHITE}),
            cell("399,00 €",{w:900,align:AlignmentType.RIGHT,bg:WHITE}),
          ]}),
          // Position 2 (optional)
          new TableRow({children:[
            cell("2",{w:400,align:AlignmentType.CENTER,bg:GRAY}),
            new TableCell({borders:brds,width:{size:4060,type:WidthType.DXA},shading:{fill:GRAY,type:ShadingType.CLEAR},
              margins:{top:100,bottom:100,left:140,right:140},
              children:[
                new Paragraph({spacing:{before:0,after:40},children:[run("[Weitere Position — z.B. Einrichtungsgebühr]",{bold:true})]}),
                new Paragraph({spacing:{before:0,after:0},children:[run("[Beschreibung der Leistung]",{size:19,color:GRAY_TEXT})]}),
              ]}),
            cell("[1]",{w:1000,align:AlignmentType.CENTER,bg:GRAY,color:GRAY_TEXT}),
            cell("[Einheit]",{w:1500,align:AlignmentType.CENTER,bg:GRAY,color:GRAY_TEXT}),
            cell("[0,00 €]",{w:1500,align:AlignmentType.RIGHT,bg:GRAY,color:GRAY_TEXT}),
            cell("[0,00 €]",{w:900,align:AlignmentType.RIGHT,bg:GRAY,color:GRAY_TEXT}),
          ]}),
        ]
      }),

      sp(),

      // SUMMENBLOCK
      new Table({width:{size:W,type:WidthType.DXA},columnWidths:[6360,1500,1500],
        rows:[
          new TableRow({children:[
            new TableCell({borders:nobs,width:{size:6360,type:WidthType.DXA},children:[new Paragraph({children:[run("")]})]  }),
            new TableCell({borders:brds,width:{size:1500,type:WidthType.DXA},shading:{fill:GRAY,type:ShadingType.CLEAR},
              margins:{top:100,bottom:100,left:140,right:140},
              children:[new Paragraph({children:[run("Nettobetrag",{bold:true})]})]  }),
            new TableCell({borders:brds,width:{size:1500,type:WidthType.DXA},shading:{fill:GRAY,type:ShadingType.CLEAR},
              margins:{top:100,bottom:100,left:140,right:140},
              children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[run("399,00 €")]})]  }),
          ]}),
          new TableRow({children:[
            new TableCell({borders:nobs,width:{size:6360,type:WidthType.DXA},children:[new Paragraph({children:[run("")]})]  }),
            new TableCell({borders:brds,width:{size:1500,type:WidthType.DXA},shading:{fill:GRAY,type:ShadingType.CLEAR},
              margins:{top:100,bottom:100,left:140,right:140},
              children:[new Paragraph({children:[run("USt. 19 %")]})]  }),
            new TableCell({borders:brds,width:{size:1500,type:WidthType.DXA},shading:{fill:GRAY,type:ShadingType.CLEAR},
              margins:{top:100,bottom:100,left:140,right:140},
              children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[run("75,81 €")]})]  }),
          ]}),
          new TableRow({children:[
            new TableCell({borders:nobs,width:{size:6360,type:WidthType.DXA},children:[new Paragraph({children:[run("")]})]  }),
            new TableCell({borders:brds,width:{size:1500,type:WidthType.DXA},shading:{fill:BLUE,type:ShadingType.CLEAR},
              margins:{top:120,bottom:120,left:140,right:140},
              children:[new Paragraph({children:[run("Gesamtbetrag",{bold:true,color:WHITE})]})]  }),
            new TableCell({borders:brds,width:{size:1500,type:WidthType.DXA},shading:{fill:BLUE,type:ShadingType.CLEAR},
              margins:{top:120,bottom:120,left:140,right:140},
              children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[run("474,81 €",{bold:true,color:WHITE})]})]  }),
          ]}),
        ]
      }),

      sp(2),

      // HINWEIS Kleinunternehmer (auskommentierbar)
      new Table({width:{size:W,type:WidthType.DXA},columnWidths:[W],
        rows:[new TableRow({children:[new TableCell({
          borders:{top:brd,bottom:brd,left:{style:BorderStyle.SINGLE,size:8,color:BLUE},right:brd},
          shading:{fill:LIGHT,type:ShadingType.CLEAR},width:{size:W,type:WidthType.DXA},
          margins:{top:140,bottom:140,left:200,right:200},
          children:[
            new Paragraph({spacing:{before:0,after:60},children:[run("Hinweis zur Umsatzsteuer",{bold:true,color:BLUE,size:19})]}),
            new Paragraph({spacing:{before:0,after:0},children:[run("Die ausgewiesene Umsatzsteuer wird abgeführt gemäß § 14 UStG. Steuernummer: [beim Finanzamt Freudenstadt in Beantragung]. Sobald die USt-ID vorliegt, wird sie hier eingetragen.",{size:19,color:TEXT})]}),
          ]
        })]})]}),

      sp(2),

      // ZAHLUNGSINFORMATIONEN
      new Paragraph({spacing:{before:0,after:80},children:[run("Zahlungsinformationen",{bold:true,color:BLUE,size:22})]}),
      new Table({width:{size:W,type:WidthType.DXA},columnWidths:[2400,6960],
        rows:[
          ...[
            ["Kontoinhaber","Azad Danki / Benjamin Serifovic"],
            ["Bank","[Ihre Bank]"],
            ["IBAN","[DE00 0000 0000 0000 0000 00]"],
            ["BIC","[XXXXXXXX]"],
            ["Zahlungsziel","14 Tage nach Rechnungsdatum"],
            ["Verwendungszweck","Rechnungsnr. AVA-2026-001 / [Firmenname]"],
          ].map(([a,b],i)=>new TableRow({children:[
            new TableCell({borders:brds,width:{size:2400,type:WidthType.DXA},
              shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR},
              margins:{top:80,bottom:80,left:140,right:140},
              children:[new Paragraph({children:[run(a,{bold:true,size:20})]})]  }),
            new TableCell({borders:brds,width:{size:6960,type:WidthType.DXA},
              shading:{fill:i%2===0?WHITE:GRAY,type:ShadingType.CLEAR},
              margins:{top:80,bottom:80,left:140,right:140},
              children:[new Paragraph({children:[run(b,{size:20})]})]  }),
          ]}))
        ]
      }),

      sp(2),

      // DANKE
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:40},
        children:[run("Vielen Dank für Ihr Vertrauen in AVA AI.",{bold:true,size:22,color:DARK})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:0},
        children:[run("Bei Fragen stehen wir Ihnen jederzeit zur Verfügung: contact@ava-hq.com",{size:19,color:GRAY_TEXT})]}),

    ]
  }]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync("C:\\Users\\hss-azda3005\\OneDrive - Heinrich-Schickhardt-Schule\\Desktop\\AVA\\AVA_Rechnung_Vorlage.docx", buf);
  console.log("✓ Rechnungsvorlage erstellt");
}).catch(console.error);
