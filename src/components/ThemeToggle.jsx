import React from "react";
import { COLORS } from "../theme.js";

// Botão que alterna entre os temas. Mostra o ícone e o NOME do modo para onde o
// clique leva — sol/"Claro" quando está escuro, lua/"Escuro" quando está claro —
// para não deixar dúvida sobre o que o botão faz.
export default function ThemeToggle({ theme, onToggle, sobreFaixa = true }) {
  const escuro = theme === "dark";
  const destino = escuro ? "Claro" : "Escuro";
  const rotulo = escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro";

  const corBase = sobreFaixa ? COLORS.onBand : COLORS.text;
  const fundoBase = sobreFaixa ? "rgba(255,255,255,.08)" : COLORS.surfaceAlt;
  const anelBase = sobreFaixa ? "inset 0 0 0 1px rgba(255,255,255,.18)" : `inset 0 0 0 1px ${COLORS.border}`;

  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid="theme-toggle"
      aria-label={rotulo}
      title={rotulo}
      aria-pressed={!escuro}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        height: 38,
        padding: "0 15px 0 12px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color: corBase,
        background: fundoBase,
        boxShadow: anelBase,
        transition: "color .2s, background .2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = COLORS.onAccent;
        e.currentTarget.style.background = COLORS.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = corBase;
        e.currentTarget.style.background = fundoBase;
      }}
    >
      {escuro ? (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
          <path d="M21 14.2a8.6 8.6 0 0 1-11.2-11 8.8 8.8 0 1 0 11.2 11z" />
        </svg>
      )}
      <span className="qa-theme-label" data-testid="theme-label">{destino}</span>
    </button>
  );
}
