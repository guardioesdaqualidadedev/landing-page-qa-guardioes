import React from "react";
import simboloClaro from "../assets/marca-simbolo-claro.png";
import simboloEscuro from "../assets/marca-simbolo-escuro.png";
import { useTema, porTema } from "../hooks/useTema.js";
import { COLORS } from "../theme.js";

// Assinatura da marca no cabeçalho e no rodapé.
//
// O símbolo (escudo em avatar) troca com o tema — é a diferença entre as duas
// aplicações do manual de marca:
//   • tema claro  → disco branco com a marca em azul-marinho (aplicação positiva)
//   • tema escuro → disco azul-marinho com a marca em branco (aplicação negativa)
//
// Cor não se resolve em PNG por CSS, então a escolha é feita em JS a partir do
// contexto de tema. O nome ao lado é composto em tipografia condensada,
// seguindo o manual: "sans-serif condensada em negrito" no nome e "sans-serif
// limpa" na assinatura de apoio.
export default function BrandMark({ tamanho = 40, mostrarTexto = true, cor, sobreFaixa = false }) {
  const tema = useTema();
  const simbolo = porTema(tema, { claro: simboloClaro, escuro: simboloEscuro });

  const corTitulo = cor || (sobreFaixa ? COLORS.onBand : COLORS.text);
  const corApoio = sobreFaixa ? COLORS.onBandMuted : COLORS.muted;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
      <img
        src={simbolo}
        alt="Símbolo da comunidade QA's Guardiões do Software"
        width={tamanho}
        height={tamanho}
        data-testid="brand-simbolo"
        data-variante={tema === "light" ? "claro" : "escuro"}
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
