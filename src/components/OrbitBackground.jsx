import React from "react";

// Fundo decorativo da marca: as órbitas tracejadas com pontos laranja que
// aparecem na capa do LinkedIn, redesenhadas em SVG para escalarem em qualquer
// tela e acompanharem o tema (o `currentColor` das linhas vem do container).
//
// É puramente decorativo: `aria-hidden` para leitores de tela pularem.
export default function OrbitBackground({ opacity = 1, style }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 520"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, ...style }}
    >
      {/* Escudo em marca d'água, à direita — o símbolo da marca reduzido a traço. */}
      <g stroke="currentColor" fill="none" strokeWidth="2" opacity=".18">
        <path d="M1010 90 L1120 138 L1120 250 Q1120 330 1010 380 Q900 330 900 250 L900 138 Z" />
        <path d="M1010 122 L1092 158 L1092 248 Q1092 310 1010 350 Q928 310 928 248 L928 158 Z" />
      </g>
      <path
        d="M965 240 L1000 276 L1062 200"
        stroke="#F47A20"
        strokeWidth="16"
        strokeLinecap="square"
        fill="none"
        opacity=".55"
      />

      {/* Órbita elíptica em volta do escudo. */}
      <ellipse
        cx="1010"
        cy="235"
        rx="175"
        ry="72"
        transform="rotate(-24 1010 235)"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        opacity=".22"
      />

      {/* Arcos tracejados com o ponto laranja — assinatura visual da capa. */}
      <path
        d="M-40 120 Q180 -10 420 60"
        stroke="#F47A20"
        strokeWidth="3"
        strokeDasharray="10 12"
        strokeLinecap="round"
        fill="none"
        opacity=".7"
      />
      <circle cx="420" cy="60" r="13" fill="#F47A20" opacity=".9" />

      <path
        d="M240 520 Q520 400 900 470"
        stroke="#F47A20"
        strokeWidth="3"
        strokeDasharray="10 12"
        strokeLinecap="round"
        fill="none"
        opacity=".45"
      />
      <circle cx="240" cy="520" r="10" fill="#F47A20" opacity=".6" />

      {/* Ondas suaves ao fundo, como na capa clara. */}
      <path
        d="M-40 430 Q260 330 620 400 T1240 360"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity=".16"
      />
      <path
        d="M-40 470 Q300 380 660 445 T1240 405"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity=".1"
      />
    </svg>
  );
}
