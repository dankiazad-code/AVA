import { useState } from "react";

export default function ROICalc() {
  const [hours, setHours] = useState(20);
  const [wage, setWage] = useState(18);
  const [missed, setMissed] = useState(30);

  const staffCost = Math.round(hours * wage * 4.3);
  const missedRevenue = Math.round(missed * 120);
  const totalLoss = staffCost + missedRevenue;
  const saving = Math.max(0, totalLoss - 399);

  return (
    <div className="ava-roi">
      <div className="ava-roi__inputs">
        <label className="ava-roi__label">
          Telefonstunden Rezeption / Woche
          <span className="ava-roi__value-display">{hours} Std</span>
        </label>
        <input className="ava-roi__slider" type="range" min={5} max={60} step={1} value={hours} onChange={e => setHours(+e.target.value)} />

        <label className="ava-roi__label">
          Stundenlohn Rezeption
          <span className="ava-roi__value-display">€{wage}/Std</span>
        </label>
        <input className="ava-roi__slider" type="range" min={12} max={50} step={1} value={wage} onChange={e => setWage(+e.target.value)} />

        <label className="ava-roi__label">
          Verpasste Buchungen / Monat
          <span className="ava-roi__value-display">{missed}</span>
        </label>
        <input className="ava-roi__slider" type="range" min={5} max={200} step={5} value={missed} onChange={e => setMissed(+e.target.value)} />
      </div>
      <div className="ava-roi__output">
        <div className="ava-roi__row"><span>Monatliche Telefonkosten</span><strong>€{staffCost.toLocaleString()}</strong></div>
        <div className="ava-roi__row"><span>Entgangener Umsatz (à €120)</span><strong>€{missedRevenue.toLocaleString()}</strong></div>
        <div className="ava-roi__row"><span>AVA Starter (monatlich)</span><strong className="ava-roi__blue">€399</strong></div>
        <div className="ava-roi__result">
          <span>Monatliche Ersparnis</span>
          <strong className="ava-roi__result-value">€{saving.toLocaleString()}</strong>
        </div>
        <div style={{ marginTop: "1.5rem" }}>
          <a href="#contact" className="ava-btn ava-btn--primary ava-btn--lg" style={{ width: "100%", justifyContent: "center" }}>
            Jetzt sparen →
          </a>
        </div>
      </div>
    </div>
  );
}
