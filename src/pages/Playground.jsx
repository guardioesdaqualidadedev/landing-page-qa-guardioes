import React, { useState, useCallback } from "react";
import Reveal from "../components/Reveal.jsx";
import OrbitBackground from "../components/OrbitBackground.jsx";
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

// Aviso que some sozinho depois de alguns segundos. Usa role="status" para
// leitores de tela anunciarem sem roubar o foco de quem está digitando.
function Aviso({ mensagem, onFechar }) {
  if (!mensagem) return null;
  return (
    <div
      role="status"
      data-testid="aviso-sucesso"
      style={{
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
      }}
    >
      <span>{mensagem}</span>
      <button
        type="button"
        onClick={onFechar}
        aria-label="Fechar aviso"
        data-testid="fechar-aviso"
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 18, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}

export default function Playground() {
  const [aba, setAba] = useState("registrar");
  const [defeitos, setDefeitos] = useState(DEFEITOS_INICIAIS);
  const [aviso, setAviso] = useState("");

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
      <section style={{ background: COLORS.band, color: COLORS.onBand, position: "relative", overflow: "hidden" }}>
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

      {/* Abas */}
      <div className="qa-wrap" style={{ paddingTop: 30 }}>
        <div
          role="tablist"
          aria-label="Áreas do playground"
          data-testid="abas-playground"
          className="qa-abas"
          style={{ display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 26 }}
        >
          {ABAS.map((a) => {
            const ativa = aba === a.id;
            return (
              <button
                key={a.id}
                type="button"
                role="tab"
                id={`aba-${a.id}`}
                aria-selected={ativa}
                aria-controls={`painel-${a.id}`}
                data-testid={`aba-${a.id}`}
                onClick={() => {
                  setAba(a.id);
                  track("playground_aba", { aba: a.id });
                }}
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
            ↺ Restaurar massa de dados
          </button>
        </div>

        <Aviso mensagem={aviso} onFechar={() => setAviso("")} />

        <div role="tabpanel" id="painel-registrar" aria-labelledby="aba-registrar" hidden={aba !== "registrar"}>
          {aba === "registrar" && (
            <div className="qa-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 24, alignItems: "start" }}>
              <FormularioDefeito onRegistrar={registrar} />

              <aside className="qa-card" style={{ padding: "24px 24px 20px" }} data-testid="painel-regras">
                <h3 className="qa-display" style={{ fontSize: 23, fontWeight: 700, margin: "0 0 14px", color: COLORS.text }}>
                  Regras de validação
                </h3>
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

        <div role="tabpanel" id="painel-tabela" aria-labelledby="aba-tabela" hidden={aba !== "tabela"}>
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
      <section className="qa-wrap qa-section" id="automatizar">
        <Reveal className="qa-card" style={{ padding: "28px 28px 24px" }}>
          <h2 className="qa-display" style={{ fontSize: 27, fontWeight: 700, margin: "0 0 10px", color: COLORS.text }}>
            Quer automatizar esta tela?
          </h2>
          <p style={{ fontSize: 15.5, color: COLORS.textSoft, lineHeight: 1.65, margin: "0 0 18px", maxWidth: 760 }}>
            Este repositório já vem com testes de interface em Playwright cobrindo a landing
            page, o manifesto e este playground. Rode-os, leia-os e use como ponto de partida
            para os seus.
          </p>
          <pre
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
npm run test        # testes unitários (Vitest)
npm run test:e2e    # testes de interface (Playwright)`}
          </pre>
        </Reveal>
      </section>
    </div>
  );
}
