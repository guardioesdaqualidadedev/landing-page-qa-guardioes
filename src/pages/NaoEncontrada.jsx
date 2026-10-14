import React from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../theme.js";

export default function NaoEncontrada() {
  return (
    <section className="qa-wrap qa-section" data-testid="pagina-404" aria-labelledby="titulo-404" style={{ paddingBottom: 60, textAlign: "center" }}>
      <p className="qa-eyebrow" style={{ color: COLORS.accentText }}>Erro 404</p>
      <h1 id="titulo-404" tabIndex={-1} className="qa-display" style={{ fontSize: "clamp(2.2rem, 8vw, 4rem)", fontWeight: 700, margin: "12px 0 14px" }}>
        Esta página não passou no teste
      </h1>
      <p style={{ color: COLORS.textSoft, fontSize: 17, maxWidth: 520, margin: "0 auto 30px" }}>
        O endereço que você abriu não existe por aqui. Bug reproduzido, severidade baixa —
        volte para o começo e siga o caminho feliz.
      </p>
      <Link to="/" className="qa-btn qa-btn-primario">Voltar para a página inicial</Link>
    </section>
  );
}
