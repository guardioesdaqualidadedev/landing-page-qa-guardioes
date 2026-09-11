import React from "react";
import Reveal from "./Reveal.jsx";
import { useTema, porTema } from "../hooks/useTema.js";
import { COLORS } from "../theme.js";
import bannerClaro from "../assets/banner-claro.png";
import bannerEscuro from "../assets/banner-escuro.png";

// Capa da marca, na versão certa para o tema em uso.
//
// As duas artes foram normalizadas na mesma proporção (1600×400) de propósito:
// se tivessem alturas diferentes, alternar o tema empurraria meia página para
// baixo. `aspect-ratio` reserva o espaço antes do PNG carregar, então também
// não há salto no primeiro carregamento.
export default function Banner() {
  const tema = useTema();
  const src = porTema(tema, { claro: bannerClaro, escuro: bannerEscuro });

  return (
    <Reveal
      className="qa-wrap"
      style={{ marginTop: 72 }}
      data-testid="banner-marca"
      data-variante={tema === "light" ? "claro" : "escuro"}
    >
      <img
        src={src}
        alt="QA Guardiões — Qualidade de Software com Clareza, Proteção e Confiança"
        width={1600}
        height={400}
        loading="lazy"
        decoding="async"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          aspectRatio: "4 / 1",
          objectFit: "cover",
          borderRadius: 18,
          border: `1px solid ${COLORS.border}`,
        }}
      />
    </Reveal>
  );
}
