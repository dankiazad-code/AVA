const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, LevelFormat
} = require("docx");
const fs = require("fs");

const BLUE="0078FF", DARK="0D0D1A", WHITE="FFFFFF", TEXT="1A1A2E";
const GRAY="F5F7FA", LIGHT="EBF4FF";
const W=9360;
const brd={style:BorderStyle.SINGLE,size:1,color:"DDDDE8"};
const brds={top:brd,bottom:brd,left:brd,right:brd};

const sp=(n=1)=>new Paragraph({spacing:{before:0,after:n*100},children:[new TextRun("")]});
const run=(t,o={})=>new TextRun({text:t,font:"Arial",size:21,color:TEXT,...o});

function h1(title) {
  return new Paragraph({
    spacing:{before:400,after:160},
    border:{bottom:{style:BorderStyle.SINGLE,size:3,color:BLUE,space:3}},
    children:[
      new TextRun({text:"§ ",font:"Arial",size:26,bold:true,color:BLUE}),
      new TextRun({text:title,font:"Arial",size:26,bold:true,color:DARK}),
    ]
  });
}

function para(text) {
  return new Paragraph({
    spacing:{before:60,after:100},
    children:[run(text)]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering:{reference:"bullets",level:0},
    spacing:{before:40,after:40},
    children:[run(text)]
  });
}

function num(text) {
  return new Paragraph({
    numbering:{reference:"nums",level:0},
    spacing:{before:40,after:40},
    children:[run(text)]
  });
}

const doc = new Document({
  numbering:{config:[
    {reference:"bullets",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:560,hanging:280}}}}]},
    {reference:"nums",levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:560,hanging:280}}}}]},
  ]},
  styles:{default:{document:{run:{font:"Arial",size:21,color:TEXT}}}},
  sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1200,right:1300,bottom:1200,left:1300}}},
    headers:{default:new Header({children:[new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:3,color:BLUE,space:3}},
      children:[new TextRun({text:"AVA AI — Allgemeine Geschäftsbedingungen",font:"Arial",size:18,color:"666680"}),
                new TextRun({text:"   |   Stand: Juni 2026",font:"Arial",size:18,color:"666680"})]
    })]})},
    footers:{default:new Footer({children:[new Paragraph({
      border:{top:{style:BorderStyle.SINGLE,size:2,color:"DDDDE8",space:3}},
      children:[
        new TextRun({text:"AVA AI  ·  Herzog-Eugen-Str. 56/58, 72250 Freudenstadt  ·  contact@ava-hq.com  ·  ava-hq.com",font:"Arial",size:17,color:"666680"}),
        new TextRun({text:"   Seite ",font:"Arial",size:17,color:"666680"}),
        new TextRun({children:[PageNumber.CURRENT],font:"Arial",size:17,color:"666680"}),
      ]
    })]})},
    children:[

      // TITEL
      sp(2),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:80},
        children:[new TextRun({text:"Allgemeine Geschäftsbedingungen",font:"Arial",size:52,bold:true,color:DARK})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:80},
        children:[new TextRun({text:"AVA AI",font:"Arial",size:32,bold:true,color:BLUE})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:80},
        children:[new TextRun({text:"Azad Danki & Benjamin Serifovic GbR",font:"Arial",size:22,color:"666680"})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:600},
        children:[new TextRun({text:"Stand: Juni 2026",font:"Arial",size:20,color:"666680",italics:true})]}),

      // INFO-BOX
      new Table({width:{size:W,type:WidthType.DXA},columnWidths:[W],
        rows:[new TableRow({children:[new TableCell({
          borders:brds,shading:{fill:LIGHT,type:ShadingType.CLEAR},
          width:{size:W,type:WidthType.DXA},margins:{top:180,bottom:180,left:240,right:240},
          children:[
            new Paragraph({spacing:{before:0,after:60},children:[new TextRun({text:"Anbieter",font:"Arial",size:20,bold:true,color:BLUE})]}),
            new Paragraph({spacing:{before:0,after:40},children:[run("AVA AI — Azad Danki & Benjamin Serifovic (GbR)")]}),
            new Paragraph({spacing:{before:0,after:40},children:[run("Herzog-Eugen-Str. 56/58, 72250 Freudenstadt")]}),
            new Paragraph({spacing:{before:0,after:40},children:[run("E-Mail: contact@ava-hq.com  |  Web: ava-hq.com")]}),
          ]
        })]})]}),
      sp(2),

      // §1
      h1("1 Geltungsbereich"),
      para("(1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen AVA AI (nachfolgend \"Anbieter\") und Unternehmern im Sinne des § 14 BGB (nachfolgend \"Kunde\") über die Nutzung der angebotenen KI-Voice-Agent-Dienste."),
      para("(2) Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des Kunden werden nur dann Vertragsbestandteil, wenn der Anbieter ihrer Geltung ausdrücklich schriftlich zugestimmt hat."),
      para("(3) Diese AGB gelten ausschließlich im B2B-Bereich. Vertragsschlüsse mit Verbrauchern im Sinne des § 13 BGB sind ausgeschlossen."),
      sp(),

      // §2
      h1("2 Leistungsgegenstand"),
      para("(1) Der Anbieter stellt dem Kunden einen KI-basierten Voice-Agenten (nachfolgend \"AVA\") zur Verfügung, der eingehende Telefongespräche automatisiert entgegennimmt, beantwortet und verarbeitet."),
      para("(2) Der Leistungsumfang umfasst je nach gebuchtem Tarif:"),
      bullet("Bereitstellung eines konfigurierten KI-Sprachassistenten (24/7)"),
      bullet("Mehrsprachige Gesprächsführung (bis zu 40+ Sprachen)"),
      bullet("FAQ-Beantwortung, Buchungsannahme und Informationsweitergabe"),
      bullet("Technisches Onboarding und Einrichtung"),
      bullet("Laufender Support per E-Mail"),
      para("(3) Der genaue Leistungsumfang ergibt sich aus dem individuellen Angebot bzw. der Leistungsbeschreibung (Anhang A zum Dienstleistungsvertrag)."),
      para("(4) Der Anbieter ist berechtigt, Teilleistungen an qualifizierte Dritte (Unterauftragsverarbeiter) zu vergeben, sofern dies den Datenschutzanforderungen entspricht."),
      sp(),

      // §3
      h1("3 Vertragsschluss"),
      para("(1) Die Darstellung der Leistungen auf der Website des Anbieters stellt kein bindendes Angebot dar, sondern eine Aufforderung zur Abgabe eines Angebots (invitatio ad offerendum)."),
      para("(2) Der Vertrag kommt zustande durch:"),
      num("Übersendung eines schriftlichen Angebots durch den Anbieter"),
      num("Annahme des Angebots durch den Kunden in Textform (E-Mail genügt)"),
      num("Bestätigung durch den Anbieter per E-Mail"),
      para("(3) Änderungen oder Ergänzungen des Vertrages bedürfen der Schriftform oder Textform."),
      sp(),

      // §4
      h1("4 Preise und Zahlung"),
      para("(1) Es gelten die im jeweiligen Angebot ausgewiesenen Preise. Alle Preise verstehen sich in Euro zuzüglich der gesetzlichen Umsatzsteuer."),
      para("(2) Die monatliche Vergütung ist jeweils am Ersten des Kalendermonats im Voraus fällig und per SEPA-Lastschrift oder Überweisung zu entrichten."),
      para("(3) Bei Zahlungsverzug ist der Anbieter berechtigt:"),
      bullet("Verzugszinsen in Hoehe von 9 Prozentpunkten ueber dem Basiszinssatz gemaess § 288 Abs. 2 BGB zu berechnen"),
      bullet("Die Leistungserbringung bis zum Ausgleich der offenen Forderungen zu suspendieren"),
      bullet("Nach erfolgloser Mahnung den Vertrag fristlos zu kuendigen"),
      para("(4) Der Anbieter behält sich vor, Preise mit einer Ankündigungsfrist von 30 Tagen zum nächsten Abrechnungszeitraum anzupassen. Der Kunde hat in diesem Fall ein Sonderkündigungsrecht."),
      sp(),

      // §5
      h1("5 Vertragslaufzeit und Kündigung"),
      para("(1) Der Vertrag wird für die im Angebot vereinbarte Mindestlaufzeit geschlossen. Soweit nichts anderes vereinbart, beträgt die Mindestlaufzeit einen (1) Monat."),
      para("(2) Nach Ablauf der Mindestlaufzeit verlängert sich der Vertrag automatisch um jeweils einen weiteren Monat, sofern er nicht mit einer Frist von 14 Tagen zum Monatsende gekündigt wird."),
      para("(3) Die Kündigung bedarf der Textform (E-Mail an contact@ava-hq.com genügt)."),
      para("(4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt insbesondere vor, wenn:"),
      bullet("Der Kunde trotz Mahnung mit mehr als zwei Monatszahlungen in Verzug ist"),
      bullet("Der Kunde gegen wesentliche Vertragspflichten verstößt und die Verletzung nicht innerhalb von 14 Tagen nach Abmahnung beseitigt"),
      bullet("Über das Vermögen des Kunden ein Insolvenzverfahren beantragt oder eröffnet wird"),
      sp(),

      // §6
      h1("6 Mitwirkungspflichten des Kunden"),
      para("(1) Der Kunde ist verpflichtet, dem Anbieter alle für die Leistungserbringung notwendigen Informationen, Zugänge und Materialien rechtzeitig und vollständig zur Verfügung zu stellen."),
      para("(2) Der Kunde stellt sicher, dass die zur Verfügung gestellten Inhalte (Texte, Daten, Informationen) frei von Rechten Dritter sind und nicht gegen geltendes Recht verstoßen."),
      para("(3) Der Kunde benennt einen verantwortlichen Ansprechpartner, der für Rückfragen und Freigaben zur Verfügung steht."),
      para("(4) Verzögerungen in der Leistungserbringung, die auf mangelnder Mitwirkung des Kunden beruhen, gehen nicht zu Lasten des Anbieters."),
      sp(),

      // §7
      h1("7 Verfügbarkeit und Wartung"),
      para("(1) Der Anbieter strebt eine Systemverfügbarkeit von 99 % im Jahresdurchschnitt an. Hiervon ausgenommen sind:"),
      bullet("Geplante Wartungsfenster (werden mindestens 24 Stunden vorher angekündigt)"),
      bullet("Ausfälle aufgrund höherer Gewalt"),
      bullet("Störungen im Verantwortungsbereich von Drittanbietern (Telekommunikation, Cloud-Infrastruktur)"),
      para("(2) Der Anbieter ist berechtigt, die Dienste für notwendige Wartungsarbeiten vorübergehend einzuschränken."),
      para("(3) Meldungen über Störungen sind per E-Mail an contact@ava-hq.com zu richten. Der Anbieter bestätigt den Eingang innerhalb von 24 Stunden (werktags)."),
      sp(),

      // §8
      h1("8 Haftung"),
      para("(1) Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für vorsätzlich oder grob fahrlässig verursachte Schäden."),
      para("(2) Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung einer wesentlichen Vertragspflicht (Kardinalpflicht), und zwar begrenzt auf den typischerweise vorhersehbaren Schaden, maximal jedoch auf den Betrag der im betreffenden Vertragsjahr gezahlten Vergütung."),
      para("(3) Die Haftung für mittelbare Schäden, entgangenen Gewinn, Datenverlust und Schäden aus der fehlerhaften Ausgabe des KI-Systems ist auf Fälle von Vorsatz und grober Fahrlässigkeit beschränkt."),
      para("(4) Hinweis: AVA ist ein KI-basiertes System. Der Anbieter übernimmt keine Garantie für die inhaltliche Korrektheit der Antworten des Sprachassistenten. Der Kunde ist verantwortlich für die Qualitätskontrolle der konfigurierten Inhalte."),
      para("(5) Die vorstehenden Haftungsbeschränkungen gelten auch zugunsten der Erfüllungsgehilfen des Anbieters."),
      sp(),

      // §9
      h1("9 Datenschutz"),
      para("(1) Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzgrundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG)."),
      para("(2) Soweit der Anbieter im Auftrag des Kunden personenbezogene Daten verarbeitet (insbesondere Gesprächsdaten von Anrufern), wird ein gesonderter Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO abgeschlossen."),
      para("(3) Die Datenschutzerklärung des Anbieters ist unter ava-hq.com/datenschutz abrufbar."),
      para("(4) Der Kunde ist als Verantwortlicher im Sinne des Art. 4 Nr. 7 DSGVO verpflichtet, seine Anrufer über die Nutzung des KI-Sprachassistenten zu informieren (z.B. durch einen Hinweis zu Beginn des Gesprächs)."),
      sp(),

      // §10
      h1("10 Geheimhaltung"),
      para("(1) Beide Parteien verpflichten sich, alle im Rahmen der Zusammenarbeit erhaltenen vertraulichen Informationen der jeweils anderen Partei vertraulich zu behandeln und nicht an Dritte weiterzugeben."),
      para("(2) Als vertraulich gelten insbesondere: Geschäftsdaten, technische Informationen, Kundendaten, Preiskonditionen und Know-how."),
      para("(3) Diese Geheimhaltungspflicht gilt auch nach Beendigung des Vertragsverhältnisses für einen Zeitraum von drei (3) Jahren fort."),
      para("(4) Ausgenommen sind Informationen, die öffentlich bekannt sind oder es werden, ohne dass eine der Parteien dafür verantwortlich ist."),
      sp(),

      // §11
      h1("11 Schlussbestimmungen"),
      para("(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG)."),
      para("(2) Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist Freudenstadt, sofern der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist."),
      para("(3) Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden, so berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. Die unwirksame Bestimmung ist durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt."),
      para("(4) Änderungen dieser AGB werden dem Kunden mindestens 30 Tage vor Inkrafttreten in Textform mitgeteilt. Widerspricht der Kunde nicht innerhalb von 14 Tagen nach Zugang der Mitteilung, gelten die geänderten AGB als angenommen."),
      para("(5) Mündliche Nebenabreden bestehen nicht. Änderungen und Ergänzungen dieser AGB bedürfen der Textform."),
      sp(3),

      // UNTERSCHRIFT
      new Table({width:{size:W,type:WidthType.DXA},columnWidths:[4500,360,4500],
        rows:[new TableRow({children:[
          new TableCell({borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
            width:{size:4500,type:WidthType.DXA},margins:{top:0,bottom:0,left:0,right:0},
            children:[
              new Paragraph({spacing:{before:0,after:40},children:[run("")]}),
              new Paragraph({spacing:{before:0,after:40},children:[run("")]}),
              new Paragraph({spacing:{before:0,after:40},children:[run("")]}),
              new Paragraph({border:{top:{style:BorderStyle.SINGLE,size:2,color:"333333",space:3}},
                spacing:{before:0,after:40},children:[run("Azad Danki, AVA AI")]}),
              new Paragraph({spacing:{before:0,after:0},children:[run("Freudenstadt, ________________",{color:"999999"})]}),
            ]}),
          new TableCell({borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
            width:{size:360,type:WidthType.DXA},children:[new Paragraph({children:[run("")]})]  }),
          new TableCell({borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
            width:{size:4500,type:WidthType.DXA},margins:{top:0,bottom:0,left:0,right:0},
            children:[
              new Paragraph({spacing:{before:0,after:40},children:[run("")]}),
              new Paragraph({spacing:{before:0,after:40},children:[run("")]}),
              new Paragraph({spacing:{before:0,after:40},children:[run("")]}),
              new Paragraph({border:{top:{style:BorderStyle.SINGLE,size:2,color:"333333",space:3}},
                spacing:{before:0,after:40},children:[run("Benjamin Serifovic, AVA AI")]}),
              new Paragraph({spacing:{before:0,after:0},children:[run("Freudenstadt, ________________",{color:"999999"})]}),
            ]}),
        ]})]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync("C:\\Users\\hss-azda3005\\OneDrive - Heinrich-Schickhardt-Schule\\Desktop\\AVA\\AVA_AGB.docx", buf);
  console.log("✓ AGB erstellt");
}).catch(console.error);
