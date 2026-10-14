import React from "react";
import { Link } from "react-router-dom";
import BrandMark from "./BrandMark.jsx";
import { LinkExterno } from "./Acessivel.jsx";
import { COLORS } from "../theme.js";
import { LINKS } from "../content/comunidade.js";
import { SYLLABUS } from "../content/syllabus.js";
import useVisitorCount from "../hooks/useVisitorCount.js";

// Contador total de visitantes. Vive no rodapé porque o número só interessa a
// quem chegou ao fim da página — e aqui cabe por extenso, sem disputar espaço
// com o menu. Fica invisível enquanto o Firebase não responde (ou quando o site
// roda sem `.env`): melhor não mostrar nada do que mostrar zero.
function ContadorVisitas() {
  const total = useVisitorCount();
  // Esconde enquanto o Firebase não responde e também no zero — "0 visitas
  // desde o lançamento" diz menos do que não dizer nada.
  if (total === null || total === 0) return null;

  return (
    <p
      data-testid="visitor-count"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        margin: "22px 0 0",
        padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.10)",
        fontSize: 13,
        color: COLORS.onBandBody,
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent, flexShrink: 0 }}
      />
      <span>
        <strong style={{ color: COLORS.onBand, fontWeight: 700 }}>{total.toLocaleString("pt-BR")}</strong>{" "}
        {total === 1 ? "visita" : "visitas"} desde o lançamento
      </span>
    </p>
  );
}

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
    <footer data-testid="site-footer" className="qa-faixa" style={{ background: COLORS.band, color: COLORS.onBand, marginTop: 90 }}>
      <div className="qa-wrap" style={{ paddingTop: 54, paddingBottom: 34 }}>
        <div className="qa-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.1fr", gap: 36 }}>
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
            <ContadorVisitas />
          </div>

          {/* Títulos das colunas em h2: no rodapé eles são o primeiro nível — e
              na página 404, que só tem o h1, um h3 aqui pularia um nível. */}
          <nav aria-labelledby="rodape-navegar">
            <h2 id="rodape-navegar" className="qa-eyebrow" style={{ color: COLORS.onBandMuted, marginBottom: 10 }}>
              Navegar
            </h2>
            <ul className="qa-lista-limpa">
              <li><Link to="/" style={link}>A comunidade</Link></li>
              <li><Link to="/manifesto" style={link}>Manifesto Ágil de Testes</Link></li>
              <li><Link to="/playground" style={link}>Playground QA</Link></li>
              <li><Link to="/#parceiros" style={link}>Parceiros</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="qa-eyebrow" style={{ color: COLORS.onBandMuted, marginBottom: 10 }}>
              Participar
            </h2>
            <ul className="qa-lista-limpa">
              <li><LinkExterno href={LINKS.discord} style={link}>Servidor no Discord</LinkExterno></li>
              <li><LinkExterno href={LINKS.whatsapp} style={link}>Comunidade no WhatsApp</LinkExterno></li>
              <li><LinkExterno href={LINKS.linkedin} style={link}>Página no LinkedIn</LinkExterno></li>
              <li><LinkExterno href={LINKS.github} style={link}>Código no GitHub</LinkExterno></li>
            </ul>
          </div>

          <div>
            <h2 className="qa-eyebrow" style={{ color: COLORS.onBandMuted, marginBottom: 10 }}>
              Estudar
            </h2>
            <ul className="qa-lista-limpa">
              <li>
                <LinkExterno href={SYLLABUS.links.pdfPt} style={link} data-testid="footer-syllabus-pdf">
                  Syllabus CTFL {SYLLABUS.versao} em PDF
                </LinkExterno>
              </li>
              <li>
                <LinkExterno href={SYLLABUS.links.oficial} style={link}>
                  Certificação no ISTQB
                </LinkExterno>
              </li>
              <li>
                <LinkExterno href={SYLLABUS.links.bstqb} style={link}>
                  BSTQB — board brasileiro
                </LinkExterno>
              </li>
              <li>
                <Link to="/playground#certificado" style={link}>
                  Certificado do playground
                </Link>
              </li>
            </ul>
            <p style={{ fontSize: 12, color: COLORS.onBandMuted, margin: "10px 0 0", lineHeight: 1.55 }}>
              O programa oficial do exame, gratuito e em português.
            </p>
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
