import React from "react";
import simbolo from "../assets/marca-simbolo.png";
import { COLORS } from "../theme.js";

// Assinatura da marca no cabeçalho e no rodapé.
//
// O símbolo (escudo em avatar) é um PNG do manual de marca — funciona nos dois
// temas porque já vem sobre o azul-marinho. O nome é composto em tipografia
// condensada, seguindo o manual: "Sans-serif condensada em negrito" no nome e
// "sans-serif limpa" na assinatura de apoio.
export default function BrandMark({ tamanho = 40, mostrarTexto = true, cor, sobreFaixa = false }) {
  const corTitulo = cor || (sobreFaixa ? COLORS.onBand : COLORS.text);
  const corApoio = sobreFaixa ? COLORS.onBandMuted : COLORS.muted;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
      <img
        src={simbolo}
        alt="Símbolo da comunidade QA's Guardiões do Software"
        width={tamanho}
        height={tamanho}
        style={{
          borderRadius: "50%",
          display: "block",
          boxShadow: `0 0 0 2px ${COLORS.accent}`,
          flexShrink: 0,
        }}
      />
      {mostrarTexto && (
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            className="qa-display qa-brand-nome"
            style={{
              fontSize: Math.round(tamanho * 0.52),
              fontWeight: 700,
              letterSpacing: "0.01em",
              color: corTitulo,
              whiteSpace: "nowrap",
            }}
          >
            QA GUARDIÕES
          </span>
          <span
            className="qa-brand-tagline"
            style={{
              fontSize: Math.max(8, Math.round(tamanho * 0.21)),
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: corApoio,
              marginTop: 3,
              whiteSpace: "nowrap",
            }}
          >
            Qualidade de Software
          </span>
        </span>
      )}
    </span>
  );
}
