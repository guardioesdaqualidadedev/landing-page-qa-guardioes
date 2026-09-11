import React from "react";
import Reveal from "./Reveal.jsx";
import { COLORS } from "../theme.js";

// Cabeçalho padrão de seção: um "eyebrow" laranja, o título em tipografia
// condensada e, opcionalmente, uma linha de apoio. Usado em todas as páginas
// para o ritmo visual ser o mesmo do começo ao fim.
export default function SectionHeader({ eyebrow, titulo, apoio, id, sobreFaixa = false, align = "left" }) {
  return (
    <div style={{ textAlign: align, marginBottom: 34 }} id={id}>
      {eyebrow && (
        <Reveal as="p" className="qa-eyebrow" style={{ color: sobreFaixa ? COLORS.accent : COLORS.accentText, margin: 0 }}>
          {eyebrow}
        </Reveal>
      )}
      <Reveal
        as="h2"
        delay={0.05}
        className="qa-display"
        style={{
          fontSize: "clamp(1.75rem, 5vw, 2.45rem)",
          fontWeight: 700,
          margin: "10px 0 0",
          color: sobreFaixa ? COLORS.onBand : COLORS.text,
          letterSpacing: "0.005em",
        }}
      >
        {titulo}
      </Reveal>
      {apoio && (
        <Reveal
          as="p"
          delay={0.1}
          style={{
            fontSize: 16.5,
            lineHeight: 1.62,
            color: sobreFaixa ? COLORS.onBandBody : COLORS.textSoft,
            maxWidth: 720,
            marginTop: 14,
            marginLeft: align === "center" ? "auto" : 0,
            marginRight: align === "center" ? "auto" : 0,
          }}
        >
          {apoio}
        </Reveal>
      )}
    </div>
  );
}
