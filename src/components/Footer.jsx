import React from "react";
import { Link } from "react-router-dom";
import BrandMark from "./BrandMark.jsx";
import { COLORS } from "../theme.js";
import { LINKS } from "../content/comunidade.js";

export default function Footer() {
  const ano = new Date().getFullYear();

  const link = {
    color: COLORS.onBandBody,
    textDecoration: "none",
    fontSize: 14,
    display: "block",
    padding: "5px 0",
  };

  return (
    <footer data-testid="site-footer" style={{ background: COLORS.band, color: COLORS.onBand, marginTop: 90 }}>
      <div className="qa-wrap" style={{ paddingTop: 54, paddingBottom: 34 }}>
        <div className="qa-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 40 }}>
          <div>
            <BrandMark tamanho={48} sobreFaixa />
            <p style={{ color: COLORS.onBandBody, fontSize: 14.5, lineHeight: 1.65, maxWidth: 360, marginTop: 18 }}>
              Comunidade brasileira, gratuita e aberta de profissionais e estudantes de
              Qualidade de Software. Quem trabalha com QA protege o produto e o usuário —
              e aqui ninguém precisa fazer isso sozinho.
            </p>
            <p
              style={{
                marginTop: 20,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: COLORS.accent,
              }}
            >
              Mais qualidade. Mais conquistas.
            </p>
          </div>

          <div>
            <h3 className="qa-eyebrow" style={{ color: COLORS.onBandMuted, marginBottom: 10 }}>
              Navegar
            </h3>
            <Link to="/" style={link}>A comunidade</Link>
            <Link to="/manifesto" style={link}>Manifesto Ágil de Testes</Link>
            <Link to="/playground" style={link}>Playground QA</Link>
          </div>

          <div>
            <h3 className="qa-eyebrow" style={{ color: COLORS.onBandMuted, marginBottom: 10 }}>
              Participar
            </h3>
            <a href={LINKS.discord} target="_blank" rel="noopener noreferrer" style={link}>Servidor no Discord</a>
            <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer" style={link}>Comunidade no WhatsApp</a>
            <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" style={link}>Página no LinkedIn</a>
          </div>
        </div>

        <div
          style={{
            marginTop: 38,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,.12)",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 12.5,
            color: COLORS.onBandMuted,
          }}
        >
          <span>© {ano} QA's Guardiões do Software · Qualidade de Software</span>
          <span>Feito pela comunidade, para a comunidade.</span>
        </div>
      </div>
    </footer>
  );
}
