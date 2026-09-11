import React from "react";
import Reveal from "../components/Reveal.jsx";
import SectionHeader from "../components/Section.jsx";
import OrbitBackground from "../components/OrbitBackground.jsx";
import { COLORS } from "../theme.js";
import { ABERTURA, FECHAMENTO, VALORES, PRINCIPIOS, ORIGINAL } from "../content/manifesto.js";
import { LINKS } from "../content/comunidade.js";

// Um valor no formato "X mais que Y". A hierarquia visual carrega o argumento:
// o item da esquerda em tipografia grande e laranja, o da direita menor e
// discreto — exatamente o que a frase de fechamento diz.
function Valor({ valor, indice }) {
  return (
    <Reveal delay={indice * 0.06} className="qa-card" style={{ padding: "26px 26px 24px" }} data-testid={`valor-${valor.n}`}>
      <span className="qa-display" style={{ fontSize: 26, fontWeight: 700, color: COLORS.accent, lineHeight: 1 }}>
        {valor.n}
      </span>
      <p
        className="qa-display"
        style={{
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: 700,
          color: COLORS.text,
          margin: "12px 0 6px",
          lineHeight: 1.1,
        }}
      >
        {valor.esquerda}
      </p>
      <p style={{ margin: "0 0 14px", fontSize: 15.5, color: COLORS.muted }}>
        <em style={{ fontStyle: "normal", fontWeight: 700, color: COLORS.accentText }}>mais que</em>{" "}
        {valor.direita}
      </p>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: COLORS.textSoft }}>{valor.explicacao}</p>
    </Reveal>
  );
}

export default function Manifesto() {
  return (
    <div data-testid="pagina-manifesto">
      {/* Cabeçalho da página */}
      <section style={{ background: COLORS.band, color: COLORS.onBand, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, color: "#FFFFFF", opacity: 0.7 }}>
          <OrbitBackground />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${COLORS.band} 0%, rgba(${COLORS.bandRgb},.85) 50%, rgba(${COLORS.bandRgb},.4) 100%)`,
          }}
        />
        <div className="qa-wrap" style={{ position: "relative", paddingTop: 66, paddingBottom: 70 }}>
          <Reveal as="p" className="qa-eyebrow" style={{ color: COLORS.accent, marginBottom: 18 }}>
            Versão da comunidade
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="qa-display"
              data-testid="titulo-manifesto"
              style={{ fontSize: "clamp(2.3rem, 8vw, 4.4rem)", fontWeight: 700, margin: 0, maxWidth: 860 }}
            >
              Manifesto Ágil de <span style={{ color: COLORS.accent }}>Testes</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: COLORS.onBandBody, maxWidth: 680, marginTop: 20 }}>
              {ABERTURA}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Os quatro valores */}
      <section className="qa-wrap qa-section" id="valores">
        <div className="qa-grid2" data-testid="valores">
          {VALORES.map((v, i) => (
            <Valor key={v.n} valor={v} indice={i} />
          ))}
        </div>

        <Reveal
          delay={0.1}
          data-testid="fechamento"
          style={{
            marginTop: 26,
            padding: "26px 28px",
            borderRadius: 16,
            background: COLORS.accentSoft,
            borderLeft: `4px solid ${COLORS.accent}`,
          }}
        >
          <p
            className="qa-display"
            style={{ margin: 0, fontSize: "clamp(1.25rem, 3.4vw, 1.7rem)", fontWeight: 700, color: COLORS.text, lineHeight: 1.25 }}
          >
            {FECHAMENTO}
          </p>
        </Reveal>
      </section>

      {/* Princípios */}
      <section className="qa-wrap qa-section" id="principios">
        <SectionHeader
          eyebrow="Princípios"
          titulo="Doze princípios por trás destes valores"
          apoio="A mesma estrutura do manifesto original, relida a partir do trabalho de quem garante qualidade."
        />
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }} data-testid="principios">
          {PRINCIPIOS.map((p, i) => (
            <Reveal
              key={p}
              as="li"
              delay={Math.min(i, 6) * 0.04}
              style={{
                display: "grid",
                gridTemplateColumns: "48px 1fr",
                gap: 14,
                alignItems: "start",
                padding: "16px 0",
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              <span className="qa-display" style={{ fontSize: 22, fontWeight: 700, color: COLORS.accentText, paddingTop: 2 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 16, lineHeight: 1.62, color: COLORS.textSoft }}>{p}</span>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Manifesto original, para comparação */}
      <section className="qa-wrap qa-section" id="original">
        <SectionHeader
          eyebrow="A origem"
          titulo="O Manifesto Ágil original"
          apoio="Nossa versão não substitui o manifesto de 2001 — ela o aplica ao trabalho de qualidade. Vale ler o original inteiro."
        />
        <Reveal className="qa-card" style={{ padding: "30px 30px 26px" }} data-testid="manifesto-original">
          <h3 className="qa-display" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 14px", color: COLORS.text }}>
            {ORIGINAL.titulo}
          </h3>
          <p style={{ fontSize: 15.5, lineHeight: 1.65, color: COLORS.textSoft, margin: "0 0 22px" }}>
            {ORIGINAL.abertura}
          </p>

          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {ORIGINAL.valores.map(([esq, dir]) => (
              <li
                key={esq}
                className="qa-original-linha"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: 14,
                  alignItems: "center",
                  padding: "14px 0",
                  borderTop: `1px solid ${COLORS.border}`,
                }}
              >
                <span style={{ fontSize: 16.5, fontWeight: 700, color: COLORS.text, textAlign: "right" }}>{esq}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: COLORS.accentText,
                    whiteSpace: "nowrap",
                  }}
                >
                  mais que
                </span>
                <span style={{ fontSize: 16, color: COLORS.muted }}>{dir}</span>
              </li>
            ))}
          </ul>

          <p style={{ fontSize: 15.5, lineHeight: 1.65, color: COLORS.textSoft, margin: "22px 0 0", fontStyle: "italic" }}>
            {ORIGINAL.fechamento}
          </p>

          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: COLORS.muted, margin: "22px 0 0" }}>{ORIGINAL.aviso}</p>

          <a
            className="qa-btn qa-btn-primario qa-btn-pequeno"
            href={ORIGINAL.fonte}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: 18 }}
            data-testid="link-manifesto-original"
          >
            Ler em agilemanifesto.org ↗
          </a>
        </Reveal>
      </section>

      {/* Como usar */}
      <section className="qa-wrap qa-section">
        <Reveal
          style={{
            borderRadius: 20,
            padding: "36px 32px",
            background: COLORS.band,
            color: COLORS.onBand,
            textAlign: "center",
          }}
        >
          <h2 className="qa-display" style={{ fontSize: "clamp(1.6rem, 5vw, 2.3rem)", fontWeight: 700, margin: 0 }}>
            Discorda de algum valor?
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: COLORS.onBandBody, maxWidth: 560, margin: "14px auto 24px" }}>
            Este manifesto é da comunidade e é um documento vivo. Todo item aqui pode ser
            questionado no canal <strong style={{ color: COLORS.accent }}>#feedbacks-melhorias</strong> —
            é exatamente para isso que ele existe.
          </p>
          <a className="qa-btn qa-btn-primario" href={LINKS.discord} target="_blank" rel="noopener noreferrer">
            Abrir discussão no Discord
          </a>
        </Reveal>
      </section>
    </div>
  );
}
