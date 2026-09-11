import React, { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal.jsx";
import SectionHeader from "./Section.jsx";
import { Icone } from "./Icones.jsx";
import { COLORS } from "../theme.js";
import { track } from "../firebase.js";
import { PARCEIROS } from "../content/comunidade.js";

// ─────────────────────────────────────────────────────────────────────────────
// Carrossel de parceiros.
//
// Nasce com um parceiro só, e é justamente por isso que já é carrossel: quando
// entrar o segundo, muda uma linha em `comunidade.js` e nada mais.
//
// Com um único item os controles (setas e indicadores) não são renderizados —
// seta desabilitada é ruído para quem usa leitor de tela e alvo morto para quem
// usa o dedo. O padrão de acessibilidade segue o de carrossel com abas:
// `aria-roledescription="carrossel"` na região, slides em `group` numerados
// ("1 de 3") e os que estão fora de vista escondidos com `display: none` — que
// já os tira da ordem de Tab e da árvore de acessibilidade.
// ─────────────────────────────────────────────────────────────────────────────

function CartaoParceiro({ parceiro, posicao, total, ativo }) {
  return (
    <li
      className="qa-card qa-parceiro"
      role="group"
      aria-roledescription="slide"
      aria-label={`${posicao} de ${total}: ${parceiro.nome}`}
      aria-hidden={ativo ? undefined : "true"}
      data-testid={`parceiro-${parceiro.id}`}
      data-ativo={ativo ? "sim" : "nao"}
      style={{
        listStyle: "none",
        padding: "30px 30px 26px",
        display: ativo ? "block" : "none",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
        <h3 className="qa-display" style={{ fontSize: 30, fontWeight: 700, margin: 0, color: COLORS.text }}>
          {parceiro.nome}
        </h3>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.onAccent,
            background: COLORS.accent,
            borderRadius: 999,
            padding: "4px 10px",
          }}
        >
          Parceiro
        </span>
      </div>

      <p
        style={{
          margin: "0 0 14px",
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: COLORS.accentText,
        }}
      >
        {parceiro.chamada}
      </p>

      <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.66, color: COLORS.textSoft, maxWidth: 680 }}>
        {parceiro.descricao}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
        {parceiro.links.map((l) => (
          <a
            key={l.tipo}
            className="qa-btn qa-btn-pequeno qa-parceiro-link"
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`parceiro-${parceiro.id}-${l.tipo}`}
            onClick={() => track("parceiro_link", { parceiro: parceiro.id, destino: l.tipo })}
            style={{
              gap: 8,
              padding: "10px 16px",
              fontSize: 13.5,
              background: COLORS.surfaceAlt,
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {/* O ícone é decorativo: o rótulo do link já diz para onde vai. */}
            <Icone tipo={l.tipo} tamanho={16} />
            {l.rotulo}
          </a>
        ))}
      </div>
    </li>
  );
}

function Setas({ aoVoltar, aoAvancar, indice, total }) {
  const botao = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.text,
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        style={botao}
        onClick={aoVoltar}
        aria-label={`Parceiro anterior (${indice + 1} de ${total})`}
        data-testid="parceiros-anterior"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        style={botao}
        onClick={aoAvancar}
        aria-label={`Próximo parceiro (${indice + 1} de ${total})`}
        data-testid="parceiros-proximo"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export default function Parceiros() {
  const [indice, setIndice] = useState(0);
  const total = PARCEIROS.length;
  const regiao = useRef(null);

  const ir = useCallback(
    (passo) => {
      setIndice((atual) => (atual + passo + total) % total);
      track("parceiro_navegar", { passo });
    },
    [total]
  );

  // Setas do teclado navegam o carrossel quando o foco está dentro dele — é o
  // comportamento que leitor de tela e usuário de teclado esperam de um
  // `aria-roledescription="carrossel"`.
  useEffect(() => {
    const el = regiao.current;
    if (!el || total < 2) return;

    const aoTeclar = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        ir(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        ir(1);
      }
    };
    el.addEventListener("keydown", aoTeclar);
    return () => el.removeEventListener("keydown", aoTeclar);
  }, [ir, total]);

  if (total === 0) return null;

  return (
    <section className="qa-wrap qa-section" id="parceiros" data-testid="secao-parceiros">
      <SectionHeader
        eyebrow="Parceiros"
        titulo="Quem caminha junto com a comunidade"
        apoio="Iniciativas que compartilham o mesmo propósito: abrir a porta da tecnologia para mais gente, sem cobrar por isso."
      />

      <div
        ref={regiao}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Parceiros da comunidade"
        data-testid="carrossel-parceiros"
      >
        <Reveal as="ul" style={{ margin: 0, padding: 0 }} data-testid="parceiros-lista">
          {PARCEIROS.map((p, i) => (
            <CartaoParceiro key={p.id} parceiro={p} posicao={i + 1} total={total} ativo={i === indice} />
          ))}
        </Reveal>

        {total > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 18,
              flexWrap: "wrap",
            }}
            data-testid="parceiros-controles"
          >
            <div style={{ display: "flex", gap: 8 }} role="tablist" aria-label="Escolher parceiro">
              {PARCEIROS.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === indice}
                  aria-label={`Mostrar ${p.nome}`}
                  data-testid={`parceiros-indicador-${i}`}
                  onClick={() => setIndice(i)}
                  style={{
                    width: i === indice ? 26 : 10,
                    height: 10,
                    padding: 0,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: i === indice ? COLORS.accent : COLORS.border,
                    transition: "width .2s, background .2s",
                  }}
                />
              ))}
            </div>
            <Setas aoVoltar={() => ir(-1)} aoAvancar={() => ir(1)} indice={indice} total={total} />
          </div>
        )}
      </div>

      {/* Anuncia a troca para quem usa leitor de tela, sem roubar o foco. */}
      <span className="qa-sr-only" aria-live="polite" data-testid="parceiros-status">
        {`Parceiro ${indice + 1} de ${total}: ${PARCEIROS[indice].nome}`}
      </span>
    </section>
  );
}
