import React, { useState } from "react";
import { COLORS } from "../theme.js";
import { CENARIOS } from "./cenarios.js";

// Checklist de cenários. O estado fica em memória (nada de localStorage aqui —
// a ideia é que cada sessão de teste comece do zero, como uma sessão de teste
// exploratório de verdade).
export default function Cenarios() {
  const [feitos, setFeitos] = useState(() => new Set());

  const alternar = (id) => {
    setFeitos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  };

  const concluidos = feitos.size;
  const percentual = Math.round((concluidos / CENARIOS.length) * 100);

  return (
    <section data-testid="area-cenarios">
      <div className="qa-card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h3 className="qa-display" style={{ fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.text }}>
            Progresso da sessão
          </h3>
          <span style={{ fontSize: 14, color: COLORS.muted }} data-testid="progresso-cenarios">
            {concluidos} de {CENARIOS.length} cenários · {percentual}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percentual}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Cenários concluídos"
          style={{ height: 8, borderRadius: 999, background: COLORS.surfaceAlt, marginTop: 14, overflow: "hidden" }}
        >
          <div style={{ width: `${percentual}%`, height: "100%", background: COLORS.accent, transition: "width .3s ease" }} />
        </div>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }} data-testid="lista-cenarios">
        {CENARIOS.map((c) => {
          const feito = feitos.has(c.id);
          return (
            <li key={c.id} className="qa-card" style={{ padding: "16px 18px", opacity: feito ? 0.72 : 1 }}>
              <label style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 12, cursor: "pointer", alignItems: "start" }}>
                <input
                  type="checkbox"
                  checked={feito}
                  onChange={() => alternar(c.id)}
                  data-testid={`cenario-${c.id}`}
                  style={{ accentColor: COLORS.accent, width: 18, height: 18, marginTop: 3 }}
                />
                <span>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: COLORS.accentText,
                      background: COLORS.accentSoft,
                      padding: "3px 8px",
                      borderRadius: 999,
                      marginBottom: 7,
                    }}
                  >
                    {c.tecnica}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 15.5,
                      fontWeight: 600,
                      color: COLORS.text,
                      textDecoration: feito ? "line-through" : "none",
                      lineHeight: 1.4,
                    }}
                  >
                    {c.titulo}
                  </span>
                  <span style={{ display: "block", fontSize: 13.5, color: COLORS.muted, marginTop: 4, lineHeight: 1.5 }}>
                    Resultado esperado: {c.esperado}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
