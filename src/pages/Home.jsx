import React from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal.jsx";
import SectionHeader from "../components/Section.jsx";
import { SYLLABUS } from "../content/syllabus.js";
import OrbitBackground from "../components/OrbitBackground.jsx";
import Banner from "../components/Banner.jsx";
import Parceiros from "../components/Parceiros.jsx";
import { IconeSocial } from "../components/Icones.jsx";
import { LinkExterno, AreaRolavel, TituloSecao } from "../components/Acessivel.jsx";
import { COLORS } from "../theme.js";
import { track } from "../firebase.js";
import {
  LINKS,
  PRINCIPIO_CHAVE,
  MISSAO,
  STATS,
  OBJETIVOS,
  CANAIS_DISCORD,
  GRUPOS_WHATSAPP,
  ROTEAMENTO,
  PERFIS,
  REGRAS,
  NAO_SOMOS,
  ADMINS,
  METRICAS,
} from "../content/comunidade.js";

// ─── Hero ────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      data-testid="hero"
      className="qa-faixa"
      aria-labelledby="hero-titulo"
      style={{ background: COLORS.band, color: COLORS.onBand, position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", inset: 0, color: "#FFFFFF" }}>
        <OrbitBackground opacity={0.85} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${COLORS.band} 0%, rgba(${COLORS.bandRgb},.88) 42%, rgba(${COLORS.bandRgb},.35) 100%)`,
        }}
      />

      <div className="qa-wrap" style={{ position: "relative", paddingTop: 72, paddingBottom: 92 }}>
        <Reveal as="p" className="qa-eyebrow" style={{ color: COLORS.accent, marginBottom: 20 }}>
          <span aria-hidden="true">● </span>Comunidade brasileira · gratuita · aberta
        </Reveal>

        <Reveal delay={0.05}>
          {/* tabIndex -1: é para cá que o foco vai ao chegar nesta tela. */}
          <h1
            id="hero-titulo"
            tabIndex={-1}
            className="qa-display"
            style={{ fontSize: "clamp(2.6rem, 9vw, 5.4rem)", fontWeight: 700, margin: 0, maxWidth: 900 }}
          >
            Quem cuida da qualidade{" "}
            <span style={{ color: COLORS.accent }}>não precisa</span> fazer isso sozinho
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p style={{ fontSize: 19, lineHeight: 1.62, color: COLORS.onBandBody, maxWidth: 640, marginTop: 24 }}>
            QA's Guardiões do Software reúne profissionais e estudantes de Qualidade de
            Software em dois endereços com papéis complementares: o WhatsApp para o dia a
            dia, o Discord para o que precisa durar. Dúvidas respondidas, vagas curadas,
            automação de verdade — e um playground para praticar.
          </p>
        </Reveal>

        <Reveal delay={0.18} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 34 }}>
          <LinkExterno
            className="qa-btn qa-btn-primario"
            href={LINKS.discord}
            data-testid="cta-discord"
            onClick={() => track("hero_discord")}
          >
            Entrar no Discord <span aria-hidden="true">→</span>
          </LinkExterno>
          <Link
            className="qa-btn qa-btn-fantasma"
            to="/manifesto"
            data-testid="cta-manifesto"
            onClick={() => track("hero_manifesto")}
          >
            Ler o Manifesto
          </Link>
          <Link
            className="qa-btn qa-btn-fantasma"
            to="/playground"
            data-testid="cta-playground"
            onClick={() => track("hero_playground")}
          >
            <span aria-hidden="true">▶</span> Abrir o Playground QA
          </Link>
        </Reveal>

        {/* Princípio que resolve 80% das dúvidas de "onde posto isso?" */}
        <Reveal
          delay={0.24}
          style={{
            marginTop: 46,
            padding: "20px 24px",
            borderRadius: 14,
            borderLeft: `4px solid ${COLORS.accent}`,
            background: "rgba(255,255,255,.06)",
            maxWidth: 640,
          }}
        >
          <p className="qa-display" style={{ fontSize: 26, fontWeight: 700, margin: 0, color: COLORS.onBand }}>
            {PRINCIPIO_CHAVE.frase}
          </p>
          <p style={{ fontSize: 14.5, color: COLORS.onBandBody, margin: "9px 0 0", lineHeight: 1.6 }}>
            {PRINCIPIO_CHAVE.explicacao}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Números ─────────────────────────────────────────────────────────────
// Sem título visível (os cartões encostam no topo de propósito), mas com um
// título só para leitor de tela: a tecla H do NVDA também chega aqui.
function Numeros() {
  return (
    <section className="qa-wrap" aria-labelledby="numeros-titulo" style={{ marginTop: -34, position: "relative", zIndex: 2 }}>
      <h2 id="numeros-titulo" className="qa-sr-only">A comunidade em números</h2>
      <ul className="qa-grid4 qa-lista-limpa" data-testid="stats">
        {STATS.map((s, i) => (
          <Reveal as="li" key={s.label} delay={i * 0.06} className="qa-card" style={{ padding: "24px 18px", textAlign: "center" }}>
            <div className="qa-display" style={{ fontSize: "clamp(2rem, 6vw, 2.6rem)", fontWeight: 700, color: COLORS.accentText }}>
              {s.falado ? (
                <>
                  <span aria-hidden="true">{s.valor}</span>
                  <span className="qa-sr-only">{s.falado}</span>
                </>
              ) : (
                s.valor
              )}
            </div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: COLORS.muted,
                marginTop: 6,
              }}
            >
              {s.label}
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

// ─── Missão ──────────────────────────────────────────────────────────────
function Missao() {
  return (
    <section className="qa-wrap qa-section" id="missao" aria-labelledby="missao-titulo">
      <div className="qa-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 44, alignItems: "start" }}>
        <div>
          <SectionHeader eyebrow="Nossa missão" titulo="Aprender com prática real, sem hierarquia" tituloId="missao-titulo" />
          <p style={{ fontSize: 17.5, lineHeight: 1.68, color: COLORS.textSoft, margin: 0 }}>{MISSAO}</p>
        </div>
        <Reveal className="qa-card" delay={0.1} style={{ padding: "26px 26px 22px" }}>
          <h3 className="qa-eyebrow" style={{ color: COLORS.accentText, marginBottom: 14 }}>
            O que a comunidade não é
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {NAO_SOMOS.map((item) => (
              <li
                key={item}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: `1px solid ${COLORS.border}`,
                  fontSize: 14.5,
                  color: COLORS.textSoft,
                  lineHeight: 1.5,
                }}
              >
                {/* O título do cartão já diz que a lista é do que NÃO somos. */}
                <span aria-hidden="true" style={{ color: COLORS.erro, fontWeight: 700 }}>✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Objetivos ───────────────────────────────────────────────────────────
function Objetivos() {
  return (
    <section className="qa-wrap qa-section" id="objetivos" aria-labelledby="objetivos-titulo">
      <SectionHeader
        eyebrow="Objetivos"
        titulo="Seis objetivos, cada um com o canal que o sustenta"
        tituloId="objetivos-titulo"
        apoio="Sem indicador, objetivo é intenção. Cada linha abaixo tem onde acontece e como saber se está funcionando."
      />
      <ol className="qa-grid3 qa-lista-limpa" data-testid="objetivos">
        {OBJETIVOS.map((o, i) => (
          <Reveal as="li" key={o.n} delay={i * 0.05} className="qa-card" style={{ padding: "22px 22px 20px" }}>
            <span
              className="qa-display"
              style={{ fontSize: 30, fontWeight: 700, color: COLORS.accentText, display: "block", lineHeight: 1 }}
            >
              {o.n}
            </span>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: "12px 0 10px", color: COLORS.text, lineHeight: 1.3 }}>
              {o.titulo}
            </h3>
            <p style={{ fontSize: 13, color: COLORS.accentText, margin: "0 0 8px", fontWeight: 600, wordBreak: "break-word" }}>
              {o.onde}
            </p>
            <p style={{ fontSize: 13.5, color: COLORS.muted, margin: 0, lineHeight: 1.55 }}>{o.indicador}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

// ─── Canais ──────────────────────────────────────────────────────────────
function ListaCanais({ titulo, subtitulo, itens, chaveSecundaria, cor, testid }) {
  return (
    <Reveal className="qa-card" style={{ padding: "26px 24px" }} data-testid={testid}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: cor }} />
        <h3 className="qa-display" style={{ fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.text }}>
          {titulo}
        </h3>
      </div>
      <p style={{ fontSize: 13.5, color: COLORS.muted, margin: "0 0 16px" }}>{subtitulo}</p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {itens.map((c) => (
          <li key={c.nome} style={{ padding: "11px 0", borderTop: `1px solid ${COLORS.border}` }}>
            <span style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.accentText, wordBreak: "break-word" }}>
              {c.nome}
            </span>
            <p style={{ margin: "3px 0 0", fontSize: 14, color: COLORS.textSoft, lineHeight: 1.5 }}>{c.frase}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: COLORS.muted }}>{c[chaveSecundaria]}</p>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function Canais() {
  return (
    <section className="qa-wrap qa-section" id="canais" aria-labelledby="canais-titulo">
      <SectionHeader
        eyebrow="Estrutura"
        titulo="Duas plataformas, papéis diferentes"
        tituloId="canais-titulo"
        apoio="O Discord é a casa oficial: é onde o conhecimento fica pesquisável. O WhatsApp é o alcance que leva as pessoas até lá."
      />
      <div className="qa-grid2">
        <ListaCanais
          titulo="Discord · 8 canais"
          subtitulo="Casa do conteúdo, do histórico e da profundidade técnica"
          itens={CANAIS_DISCORD}
          chaveSecundaria="tipo"
          cor="#5865F2"
          testid="canais-discord"
        />
        <ListaCanais
          titulo="WhatsApp · 6 grupos"
          subtitulo="Alcance, presença diária e urgência"
          itens={GRUPOS_WHATSAPP}
          chaveSecundaria="quem"
          cor="#25D366"
          testid="grupos-whatsapp"
        />
      </div>
    </section>
  );
}

// ─── Roteamento ──────────────────────────────────────────────────────────
function Roteamento() {
  return (
    <section className="qa-wrap qa-section" id="roteamento" aria-labelledby="roteamento-titulo">
      <SectionHeader
        eyebrow="Onde posto isso?"
        titulo="A tabela que resolve a dúvida"
        tituloId="roteamento-titulo"
        apoio="Serve tanto para quem participa quanto para quem modera. Se bater dúvida, é esta tabela que decide."
      />
      <Reveal className="qa-card" style={{ padding: 4 }}>
        <AreaRolavel className="qa-tabela-scroll" rotulo="Tabela de roteamento — use as setas para ver as outras colunas">
          <table className="qa-tabela" data-testid="tabela-roteamento">
            <caption className="qa-sr-only">Onde cada tipo de conteúdo nasce e onde ele fica registrado</caption>
            <thead>
              <tr>
                <th scope="col">Tipo de conteúdo</th>
                <th scope="col">Onde nasce</th>
                <th scope="col">Onde fica registrado</th>
              </tr>
            </thead>
            <tbody>
              {ROTEAMENTO.map(([tipo, nasce, fica]) => (
                <tr key={tipo}>
                  <td style={{ fontWeight: 600, color: COLORS.text }}>{tipo}</td>
                  <td style={{ color: COLORS.textSoft }}>{nasce}</td>
                  <td style={{ color: COLORS.accentText, fontWeight: 600 }}>{fica}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AreaRolavel>
      </Reveal>
    </section>
  );
}

// ─── Perfis ──────────────────────────────────────────────────────────────
function Perfis() {
  return (
    <section
      className="qa-section qa-faixa"
      style={{ background: COLORS.band, color: COLORS.onBand, paddingBottom: 84, marginTop: 84, position: "relative", overflow: "hidden" }}
      id="perfis"
      aria-labelledby="perfis-titulo"
    >
      <div style={{ position: "absolute", inset: 0, color: "#FFFFFF", opacity: 0.5 }}>
        <OrbitBackground />
      </div>
      <div className="qa-wrap" style={{ position: "relative" }}>
        <SectionHeader
          eyebrow="Para quem é"
          titulo="O que você busca e o que a gente entrega"
          tituloId="perfis-titulo"
          apoio="Cada perfil chega com uma pergunta diferente. A estrutura da comunidade existe para responder todas elas."
          sobreFaixa
        />
        <ul className="qa-grid3 qa-lista-limpa" data-testid="perfis">
          {PERFIS.map((p, i) => (
            <Reveal
              as="li"
              key={p.perfil}
              delay={i * 0.05}
              style={{
                padding: "22px 22px 20px",
                borderRadius: 16,
                background: "rgba(255,255,255,.06)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)",
              }}
            >
              <h3 className="qa-display" style={{ fontSize: 21, fontWeight: 700, margin: "0 0 12px", color: COLORS.accent }}>
                {p.perfil}
              </h3>
              <p style={{ fontSize: 14, color: COLORS.onBandBody, margin: "0 0 12px", lineHeight: 1.55 }}>
                <strong style={{ color: COLORS.onBand }}>Busca:</strong> {p.busca}
              </p>
              <p style={{ fontSize: 14, color: COLORS.onBandBody, margin: 0, lineHeight: 1.55 }}>
                <strong style={{ color: COLORS.onBand }}>Entrega:</strong> {p.entrega}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ─── Regras ──────────────────────────────────────────────────────────────
function Regras() {
  return (
    <section className="qa-wrap qa-section" id="regras" aria-labelledby="regras-titulo">
      <SectionHeader
        eyebrow="Convivência"
        titulo="Dez regras que cabem em uma tela"
        tituloId="regras-titulo"
        apoio="Regra que não cabe em uma tela não é lida. Estas ficam fixadas em todos os canais."
      />
      <ol className="qa-grid2 qa-lista-limpa" data-testid="regras">
        {REGRAS.map((r, i) => (
          <Reveal
            as="li"
            key={r}
            delay={(i % 2) * 0.05}
            style={{
              display: "grid",
              gridTemplateColumns: "34px 1fr",
              gap: 12,
              alignItems: "start",
              padding: "14px 0",
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <span className="qa-display" style={{ fontSize: 19, fontWeight: 700, color: COLORS.accentText }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontSize: 15, color: COLORS.textSoft, lineHeight: 1.55 }}>{r}</span>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

// "Patrícia" → "patricia". Um data-testid com acento é um convite a erro de
// digitação no teste — e a acento perdido em terminal e log de CI.
const semAcento = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// ─── Governança e métricas ───────────────────────────────────────────────
function Governanca() {
  return (
    <section className="qa-wrap qa-section" id="governanca" aria-labelledby="governanca-titulo">
      <SectionHeader
        eyebrow="Governança"
        titulo="Quem cuida de quê"
        tituloId="governanca-titulo"
        apoio="Comunidade sem dono por canal tem dois destinos: alguém faz tudo até cansar, ou ninguém faz nada achando que outro está fazendo."
      />
      <ul className="qa-grid-admins qa-lista-limpa" style={{ marginBottom: 34 }} data-testid="admins">
        {ADMINS.map((a, i) => (
          <Reveal as="li" key={a.nome} delay={i * 0.05} className="qa-card" style={{ padding: "22px 22px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <h3 className="qa-display" style={{ fontSize: 25, fontWeight: 700, margin: 0, color: COLORS.text }}>
                {a.nome}
              </h3>
              {/* O rótulo nomeia a pessoa: três ícones iguais de LinkedIn na
                  mesma seção só se distinguem pelo nome de quem levam a ver. */}
              <IconeSocial
                tipo="linkedin"
                href={a.linkedin}
                rotulo={`LinkedIn de ${a.nome}`}
                evento="admin_linkedin"
                tamanho={32}
                testid={`admin-linkedin-${semAcento(a.nome)}`}
              />
            </div>
            <p style={{ fontSize: 12.5, color: COLORS.accentText, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", margin: "4px 0 12px" }}>
              {a.onde}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {a.papeis.map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "4px 9px",
                    borderRadius: 999,
                    background: COLORS.accentSoft,
                    color: COLORS.accentText,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 13.5, color: COLORS.muted, margin: 0, lineHeight: 1.55 }}>{a.escopo}</p>
          </Reveal>
        ))}
      </ul>

      <Reveal className="qa-card" style={{ padding: "24px 24px 12px" }}>
        <h3 className="qa-eyebrow" style={{ color: COLORS.accentText, marginBottom: 14 }}>
          Métricas de saúde revisadas a cada quinzena
        </h3>
        <ul className="qa-grid2 qa-lista-limpa" data-testid="metricas">
          {METRICAS.map((m) => (
            <li
              key={m.indicador}
              style={{ padding: "12px 0", borderTop: `1px solid ${COLORS.border}` }}
            >
              <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: COLORS.text }}>{m.indicador}</p>
              <p style={{ margin: "3px 0 0", fontSize: 13.5, color: COLORS.muted, lineHeight: 1.5 }}>{m.porque}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ─── Syllabus CTFL ───────────────────────────────────────────────────────
// A comunidade recomenda estudar pelo documento oficial, e ele é gratuito.
// Esta seção existe para tirar a desculpa de "não sei por onde começar".
function Syllabus() {
  return (
    <section className="qa-wrap qa-section" id="syllabus" aria-labelledby="syllabus-titulo">
      <SectionHeader
        eyebrow={`Estudo · ${SYLLABUS.sigla} ${SYLLABUS.versao}`}
        titulo="O programa oficial de quem testa software"
        tituloId="syllabus-titulo"
        apoio={SYLLABUS.resumo}
      />

      <Reveal className="qa-card" style={{ padding: "28px 28px 24px" }} data-testid="syllabus">
        <div className="qa-grid4" style={{ marginBottom: 28 }} data-testid="syllabus-exame">
          {SYLLABUS.exame.map((e) => (
            <div key={e.rotulo} style={{ paddingRight: 14 }}>
              <p className="qa-eyebrow" style={{ color: COLORS.muted, margin: 0, fontSize: 10.5 }}>
                {e.rotulo}
              </p>
              <p
                className="qa-display"
                style={{ fontSize: 26, fontWeight: 700, color: COLORS.accentText, margin: "6px 0 2px" }}
              >
                {e.valor}
              </p>
              <p style={{ fontSize: 12.5, color: COLORS.muted, margin: 0, lineHeight: 1.5 }}>{e.detalhe}</p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, margin: "0 0 16px" }}>
          Os seis capítulos da versão {SYLLABUS.versao}
        </h3>
        <ol
          className="qa-grid2"
          style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}
          data-testid="syllabus-capitulos"
        >
          {SYLLABUS.capitulos.map((c) => (
            <li key={c.n} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 13, alignItems: "start" }}>
              <span
                aria-hidden="true"
                className="qa-display"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.accentText,
                  background: COLORS.accentSoft,
                  borderRadius: 8,
                  padding: "5px 10px",
                  minWidth: 30,
                  textAlign: "center",
                }}
              >
                {c.n}
              </span>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, margin: "2px 0 3px", lineHeight: 1.35 }}>
                  {c.titulo}
                </p>
                <p style={{ fontSize: 13.5, color: COLORS.textSoft, margin: 0, lineHeight: 1.6 }}>{c.descricao}</p>
              </div>
            </li>
          ))}
        </ol>

        <div
          style={{
            marginTop: 26,
            paddingTop: 22,
            borderTop: `1px solid ${COLORS.border}`,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <LinkExterno
            className="qa-btn qa-btn-primario"
            href={SYLLABUS.links.pdfPt}
            data-testid="syllabus-pdf"
            onClick={() => track("syllabus_download", { origem: "home" })}
          >
            Baixar o PDF em português
          </LinkExterno>
          <LinkExterno
            className="qa-btn"
            href={SYLLABUS.links.oficial}
            style={{ background: COLORS.surfaceAlt, color: COLORS.text, boxShadow: `inset 0 0 0 1px ${COLORS.border}` }}
          >
            Página oficial do ISTQB
          </LinkExterno>
          <p style={{ fontSize: 12.5, color: COLORS.muted, margin: 0, lineHeight: 1.55, flex: "1 1 260px" }}>
            Tradução do {SYLLABUS.boardBr}. Quer aplicar na prática o capítulo 4?{" "}
            <Link to="/playground" style={{ color: COLORS.accentText, fontWeight: 600 }}>
              É o que o playground treina
            </Link>
            .
          </p>
        </div>
      </Reveal>
    </section>
  );
}

// ─── Chamada final ───────────────────────────────────────────────────────
function Chamada() {
  return (
    <section className="qa-wrap qa-section" id="participe" aria-labelledby="chamada-titulo">
      <Reveal
        className="qa-faixa-laranja"
        style={{
          borderRadius: 22,
          padding: "48px 40px",
          textAlign: "center",
          background: `linear-gradient(135deg, ${COLORS.accent} 0%, #D2610F 100%)`,
          color: COLORS.onAccent,
        }}
        data-testid="cta-final"
      >
        <TituloSecao id="chamada-titulo" className="qa-display" style={{ fontSize: "clamp(1.9rem, 6vw, 3rem)", fontWeight: 700, margin: 0 }}>
          Chegou até aqui? Então já é dos nossos
        </TituloSecao>
        <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 620, margin: "16px auto 28px", opacity: 0.92 }}>
          Entre no Discord para pegar seus cargos e liberar os canais — é lá que ficam
          automação, novidades, vagas e o banco de currículos. No WhatsApp você acompanha
          o dia a dia e fica sabendo na hora.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <LinkExterno
            className="qa-btn"
            href={LINKS.discord}
            data-testid="cta-final-discord"
            style={{ background: COLORS.band, color: COLORS.onBand }}
            onClick={() => track("cta_final_discord")}
          >
            Entrar no Discord
          </LinkExterno>
          <LinkExterno
            className="qa-btn"
            href={LINKS.whatsapp}
            data-testid="cta-final-whatsapp"
            style={{ background: "rgba(11,35,65,.14)", color: COLORS.onAccent, boxShadow: "inset 0 0 0 1.5px rgba(11,35,65,.4)" }}
            onClick={() => track("cta_final_whatsapp")}
          >
            Entrar no WhatsApp
          </LinkExterno>
          <LinkExterno
            className="qa-btn"
            href={LINKS.linkedin}
            data-testid="cta-final-linkedin"
            style={{ background: "rgba(11,35,65,.14)", color: COLORS.onAccent, boxShadow: "inset 0 0 0 1.5px rgba(11,35,65,.4)" }}
          >
            Seguir no LinkedIn
          </LinkExterno>
        </div>
      </Reveal>
    </section>
  );
}

export default function Home() {
  return (
    <div data-testid="pagina-home">
      <Hero />
      <Numeros />
      <Missao />
      <Banner />
      <Objetivos />
      <Canais />
      <Roteamento />
      <Perfis />
      <Regras />
      <Governanca />
      <Syllabus />
      <Chamada />
      {/* Última seção da página: logo acima do rodapé. */}
      <Parceiros />
    </div>
  );
}
