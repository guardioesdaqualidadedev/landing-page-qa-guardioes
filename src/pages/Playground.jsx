import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Reveal from "../components/Reveal.jsx";
import OrbitBackground from "../components/OrbitBackground.jsx";
import { AreaRolavel, TituloSecao } from "../components/Acessivel.jsx";
import FormularioDefeito from "../playground/FormularioDefeito.jsx";
import TabelaDefeitos from "../playground/TabelaDefeitos.jsx";
import Cenarios from "../playground/Cenarios.jsx";
import Certificacao from "../playground/Certificacao.jsx";
import { DEFEITOS_INICIAIS, proximoId } from "../playground/dominio.js";
import { LIMITES } from "../playground/validacao.js";
import { formatarDataBR, FORMATO_DATA_BR } from "../utils/datas.js";
import { COLORS } from "../theme.js";
import { track } from "../firebase.js";

const ABAS = [
  { id: "registrar", rotulo: "Registrar defeito" },
  { id: "tabela", rotulo: "Tabela de defeitos" },
  { id: "cenarios", rotulo: "Cenários de teste" },
  { id: "certificado", rotulo: "Certificado" },
];

// "#certificado" → "certificado", se for uma aba que existe.
const abaDoHash = (hash) => {
  const id = (hash || "").slice(1);
  return ABAS.some((a) => a.id === id) ? id : null;
};

// Aviso de sucesso. A mensagem fica numa região role="status": o leitor de
// tela anuncia sem tirar o foco de quem está digitando.
//
// A região existe o tempo todo, mesmo vazia. Criada já com o texto dentro
// (como era antes), ela costuma passar em silêncio: o leitor só anuncia
// MUDANÇAS numa região que ele já conhecia.
function Aviso({ mensagem, onFechar }) {
  return (
    <div
      data-testid={mensagem ? "aviso-sucesso" : undefined}
      style={
        mensagem
          ? {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: "13px 16px",
              borderRadius: 10,
              marginBottom: 20,
              background: "rgba(95,211,160,.14)",
              borderLeft: `4px solid ${COLORS.sucesso}`,
              color: COLORS.sucesso,
              fontSize: 14.5,
              fontWeight: 600,
            }
          : undefined
      }
    >
      <span role="status" data-testid="aviso-status">
        {mensagem}
      </span>
      {mensagem && (
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar aviso"
          data-testid="fechar-aviso"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            fontSize: 18,
            lineHeight: 1,
            // Alvo mínimo de 24×24 px (WCAG 2.5.8); o "×" sozinho tinha 10.
            minWidth: 32,
            minHeight: 32,
            borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}

export default function Playground() {
  const { hash } = useLocation();
  const [aba, setAba] = useState(() => abaDoHash(hash) || "registrar");
  const [defeitos, setDefeitos] = useState(DEFEITOS_INICIAIS);
  const [aviso, setAviso] = useState("");
  const botoesDasAbas = useRef({});

  // O rodapé tem o link "Certificado do playground" (/playground#certificado):
  // ele abre a aba certa e põe o foco nela, em vez de deixar a pessoa no topo
  // da página procurando.
  useEffect(() => {
    const id = abaDoHash(hash);
    if (!id) return undefined;
    setAba(id);
    const quadro = requestAnimationFrame(() => {
      const botao = botoesDasAbas.current[id];
      botao?.scrollIntoView({ block: "start" });
      botao?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(quadro);
  }, [hash]);

  const escolherAba = (id) => {
    setAba(id);
    track("playground_aba", { aba: id });
  };

  // Padrão de abas do WAI-ARIA: só a aba ativa fica no caminho do Tab; as setas
  // trocam de aba (e já mostram o painel), Home e End vão para a primeira e a
  // última. Assim o Tab sai das abas em um passo e vai para o conteúdo.
  const aoTeclarNaAba = (e, indice) => {
    const destinos = {
      ArrowRight: (indice + 1) % ABAS.length,
      ArrowLeft: (indice - 1 + ABAS.length) % ABAS.length,
      Home: 0,
      End: ABAS.length - 1,
    };
    if (!(e.key in destinos)) return;
    e.preventDefault();
    const destino = ABAS[destinos[e.key]].id;
    escolherAba(destino);
    botoesDasAbas.current[destino]?.focus();
  };

  const registrar = useCallback((dados) => {
    // O ID sai de dentro do updater para a função continuar PURA: o React 18
    // em modo estrito executa o updater duas vezes, e mutar um objeto de fora
    // aqui produziria estado inconsistente.
    setDefeitos((atual) => [{ ...dados, id: proximoId(atual), status: "Aberto" }, ...atual]);
    setAviso(`Defeito registrado com sucesso. Ele já aparece na aba "Tabela de defeitos".`);
    track("playground_registrar_defeito", { severidade: dados.severidade });
  }, []);

  const atualizarStatus = useCallback((id, status) => {
    setDefeitos((atual) => atual.map((d) => (d.id === id ? { ...d, status } : d)));
  }, []);

  const excluir = useCallback((id) => {
    setDefeitos((atual) => atual.filter((d) => d.id !== id));
    setAviso(`Defeito ${id} excluído.`);
  }, []);

  const restaurar = () => {
    setDefeitos(DEFEITOS_INICIAIS);
    setAviso("Massa de dados restaurada ao estado inicial.");
  };

  return (
    <div data-testid="pagina-playground">
      {/* Cabeçalho da página */}
      <section
        className="qa-faixa"
        aria-labelledby="playground-titulo"
        style={{ background: COLORS.band, color: COLORS.onBand, position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", inset: 0, color: "#FFFFFF", opacity: 0.6 }}>
          <OrbitBackground />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${COLORS.band} 0%, rgba(${COLORS.bandRgb},.86) 52%, rgba(${COLORS.bandRgb},.4) 100%)`,
          }}
        />
        <div className="qa-wrap" style={{ position: "relative", paddingTop: 60, paddingBottom: 62 }}>
          <Reveal as="p" className="qa-eyebrow" style={{ color: COLORS.accent, marginBottom: 16 }}>
            Sistema fake · ambiente de treino
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              id="playground-titulo"
              tabIndex={-1}
              className="qa-display"
              data-testid="titulo-playground"
              style={{ fontSize: "clamp(2.2rem, 7.5vw, 4.2rem)", fontWeight: 700, margin: 0, maxWidth: 860 }}
            >
              Playground <span style={{ color: COLORS.accent }}>QA</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontSize: 17.5, lineHeight: 1.65, color: COLORS.onBandBody, maxWidth: 700, marginTop: 18 }}>
              O Guardião Tracker é um sistema de registro de defeitos que não existe —
              e é justamente por isso que você pode quebrar à vontade. Formulário com
              validações reais, tabela com filtro, ordenação, paginação e ações. Serve para
              praticar teste manual e para escrever seus primeiros testes com Playwright.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p
              style={{
                marginTop: 20,
                fontSize: 13.5,
                color: COLORS.onBandMuted,
                background: "rgba(255,255,255,.07)",
                display: "inline-block",
                padding: "9px 14px",
                borderRadius: 10,
              }}
            >
              Nenhum dado sai do seu navegador. Recarregar a página devolve tudo ao estado inicial.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Abas. O botão de restaurar fica ao lado da lista de abas, e não dentro
          dela: um tablist só pode conter abas, e um botão comum ali dentro
          confundia a contagem que o leitor de tela anuncia ("aba 2 de 4"). */}
      <div className="qa-wrap" style={{ paddingTop: 30 }}>
        <div
          className="qa-abas"
          style={{ display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 26 }}
        >
          <div
            role="tablist"
            aria-label="Áreas do playground"
            data-testid="abas-playground"
            className="qa-abas-lista"
            style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
          >
            {ABAS.map((a, indice) => {
              const ativa = aba === a.id;
              return (
                <button
                  key={a.id}
                  ref={(el) => {
                    botoesDasAbas.current[a.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`aba-${a.id}`}
                  aria-selected={ativa}
                  aria-controls={`painel-${a.id}`}
                  tabIndex={ativa ? 0 : -1}
                  data-testid={`aba-${a.id}`}
                  onClick={() => escolherAba(a.id)}
                  onKeyDown={(e) => aoTeclarNaAba(e, indice)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 15,
                    fontWeight: 700,
                    padding: "12px 18px",
                    color: ativa ? COLORS.accentText : COLORS.muted,
                    borderBottom: `3px solid ${ativa ? COLORS.accent : "transparent"}`,
                    marginBottom: -1,
                    transition: "color .2s, border-color .2s",
                  }}
                >
                  {a.rotulo}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="qa-btn qa-btn-pequeno qa-btn-restaurar"
            data-testid="btn-restaurar"
            onClick={restaurar}
            style={{
              marginLeft: "auto",
              alignSelf: "center",
              marginBottom: 8,
              background: "transparent",
              color: COLORS.muted,
              boxShadow: `inset 0 0 0 1px ${COLORS.border}`,
            }}
          >
            <span aria-hidden="true">↺</span> Restaurar massa de dados
          </button>
        </div>

        <Aviso mensagem={aviso} onFechar={() => setAviso("")} />

        <div role="tabpanel" id="painel-registrar" aria-labelledby="aba-registrar" hidden={aba !== "registrar"}>
          {aba === "registrar" && (
            <div className="qa-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 24, alignItems: "start" }}>
              <FormularioDefeito onRegistrar={registrar} />

              <aside className="qa-card" style={{ padding: "24px 24px 20px" }} data-testid="painel-regras" aria-labelledby="regras-validacao-titulo">
                <TituloSecao
                  id="regras-validacao-titulo"
                  className="qa-display"
                  style={{ fontSize: 23, fontWeight: 700, margin: "0 0 14px", color: COLORS.text }}
                >
                  Regras de validação
                </TituloSecao>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 14, color: COLORS.textSoft, lineHeight: 1.55 }}>
                  {[
                    ["Título", "obrigatório, de 5 a 80 caracteres"],
                    ["Módulo, severidade, ambiente", "obrigatórios, valores de lista fechada"],
                    ["Prioridade", "obrigatória: P1, P2 ou P3"],
                    ["E-mail", "formato nome@dominio.com"],
                    [
                      "Data de detecção",
                      // O limite vem da própria validação, no formato brasileiro:
                      // painel e mensagem de erro nunca podem divergir.
                      `obrigatória, no formato ${FORMATO_DATA_BR}; não pode ser futura nem anterior a ${formatarDataBR(LIMITES.dataMinima)}`,
                    ],
                    ["Ocorrências", "inteiro de 1 a 999"],
                    ["Passos", "de 20 a 600 caracteres"],
                    ["Aceite", "obrigatório marcar"],
                  ].map(([campo, regra]) => (
                    <li key={campo} style={{ padding: "9px 0", borderTop: `1px solid ${COLORS.border}` }}>
                      <strong style={{ color: COLORS.text }}>{campo}</strong>
                      <br />
                      {regra}
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 16, lineHeight: 1.55 }}>
                  Todos os controles têm <code style={{ color: COLORS.accentText }}>data-testid</code> estável —
                  use-os como seletores nos seus testes automatizados.
                </p>
              </aside>
            </div>
          )}
        </div>

        {/* Este painel entra no Tab porque o que vem primeiro nele (os cartões
            de resumo) não é focável — é a recomendação do padrão de abas do
            WAI-ARIA. Sem isso, o Tab ia direto para a busca e o leitor de tela
            não dizia em que painel a pessoa tinha chegado. Os outros painéis
            começam por um título que já é parada do Tab. */}
        <div role="tabpanel" id="painel-tabela" aria-labelledby="aba-tabela" hidden={aba !== "tabela"} tabIndex={0}>
          {aba === "tabela" && (
            <TabelaDefeitos defeitos={defeitos} onAtualizarStatus={atualizarStatus} onExcluir={excluir} />
          )}
        </div>

        <div role="tabpanel" id="painel-cenarios" aria-labelledby="aba-cenarios" hidden={aba !== "cenarios"}>
          {aba === "cenarios" && <Cenarios />}
        </div>

        <div role="tabpanel" id="painel-certificado" aria-labelledby="aba-certificado" hidden={aba !== "certificado"}>
          {aba === "certificado" && <Certificacao />}
        </div>
      </div>

      {/* Como automatizar */}
      <section className="qa-wrap qa-section" id="automatizar" aria-labelledby="automatizar-titulo">
        <Reveal className="qa-card" style={{ padding: "28px 28px 24px" }}>
          <TituloSecao id="automatizar-titulo" className="qa-display" style={{ fontSize: 27, fontWeight: 700, margin: "0 0 10px", color: COLORS.text }}>
            Quer automatizar esta tela?
          </TituloSecao>
          <p style={{ fontSize: 15.5, color: COLORS.textSoft, lineHeight: 1.65, margin: "0 0 18px", maxWidth: 760 }}>
            Este repositório já vem com testes de interface em Playwright cobrindo a landing
            page, o manifesto e este playground — inclusive uma suíte de acessibilidade com
            leitor de tela simulado (NVDA), axe-core e navegação só pelo teclado. Rode-os,
            leia-os e use como ponto de partida para os seus.
          </p>
          <AreaRolavel
            as="pre"
            rotulo="Comandos para rodar os testes"
            data-testid="bloco-codigo"
            style={{
              margin: 0,
              padding: "18px 20px",
              borderRadius: 12,
              background: COLORS.band,
              color: "#D6E4F5",
              fontSize: 13.5,
              lineHeight: 1.7,
              overflowX: "auto",
              fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace",
            }}
          >
{`npm install
npx playwright install chromium
npm run test                 # testes unitários (Vitest)
npm run test:e2e             # testes de interface (Playwright)
npm run test:acessibilidade  # NVDA simulado, axe-core e teclado`}
          </AreaRolavel>
        </Reveal>
      </section>
    </div>
  );
}
