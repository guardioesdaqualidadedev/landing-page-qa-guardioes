import React, { useState } from "react";
import { COLORS } from "../theme.js";
import { CENARIOS } from "./cenarios.js";
import { SYLLABUS } from "../content/syllabus.js";
import { LINKS } from "../content/comunidade.js";
import {
  ETAPAS,
  ABAS_EXPLICADAS,
  BOTAO_RESTAURAR,
  COMO_GRAVAR,
  CABECALHO_DOCUMENTO,
  CAMPOS_CASO_TESTE,
  MODELO_DOCUMENTO,
  ESTRUTURA_DRIVE,
  PASSOS_COMPARTILHAMENTO,
  CRITERIOS_VALIDACAO,
  NAO_REPROVA,
  PRAZO_VALIDACAO,
  CARGA_HORARIA,
} from "../content/certificacao.js";
import { track } from "../firebase.js";

// ─────────────────────────────────────────────────────────────────────────────
// Aba "Certificado" — o passo a passo entre praticar no playground e receber o
// PDF assinado pela comunidade.
//
// É a página mais longa do site, e de propósito: a promessa é "não sobra
// dúvida". Para o tamanho não virar um paredão, o conteúdo está dividido em
// blocos dobráveis — só a trilha das sete etapas começa aberta.
// ─────────────────────────────────────────────────────────────────────────────

// Bloco dobrável. Usa <details>/<summary> nativos: acessível por teclado e
// pesquisável pelo Ctrl+F do navegador sem uma linha de JavaScript.
function Bloco({ id, numero, titulo, resumo, aberto = false, children }) {
  return (
    <details
      open={aberto}
      data-testid={`bloco-${id}`}
      className="qa-card"
      style={{ padding: 0, marginBottom: 14, overflow: "hidden" }}
    >
      <summary
        data-testid={`resumo-bloco-${id}`}
        style={{
          cursor: "pointer",
          listStyle: "none",
          padding: "20px 22px",
          display: "flex",
          alignItems: "baseline",
          gap: 14,
        }}
      >
        <span
          aria-hidden="true"
          className="qa-display"
          style={{ fontSize: 15, fontWeight: 700, color: COLORS.accentText, minWidth: 26 }}
        >
          {numero}
        </span>
        <span style={{ flex: 1 }}>
          <span
            className="qa-display"
            style={{ display: "block", fontSize: 21, fontWeight: 700, color: COLORS.text, lineHeight: 1.25 }}
          >
            {titulo}
          </span>
          {resumo && (
            <span style={{ display: "block", fontSize: 14, color: COLORS.muted, marginTop: 5, lineHeight: 1.5 }}>
              {resumo}
            </span>
          )}
        </span>
        <span aria-hidden="true" style={{ color: COLORS.muted, fontSize: 13, flexShrink: 0 }}>
          ▼
        </span>
      </summary>
      <div style={{ padding: "0 22px 22px", borderTop: `1px solid ${COLORS.border}`, paddingTop: 20 }}>{children}</div>
    </details>
  );
}

function Paragrafo({ children, style }) {
  return (
    <p style={{ fontSize: 14.5, lineHeight: 1.7, color: COLORS.textSoft, margin: "0 0 12px", ...style }}>{children}</p>
  );
}

function Etiqueta({ children, cor = COLORS.accentText, fundo = COLORS.accentSoft }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: ".1em",
        textTransform: "uppercase",
        color: cor,
        background: fundo,
        padding: "3px 9px",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

// Bloco de texto monoespaçado com botão de cópia. É como o modelo do documento
// e a árvore de pastas chegam ao aluno: um clique e está no Word.
function BlocoCopiavel({ texto, testid, rotuloBotao = "Copiar", evento }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      if (evento) track(evento);
      setTimeout(() => setCopiado(false), 2600);
    } catch {
      // Clipboard bloqueado (permissão negada ou contexto inseguro): o texto
      // está visível logo abaixo, então dá para selecionar e copiar na mão.
      setCopiado(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="qa-btn qa-btn-pequeno"
        data-testid={`copiar-${testid}`}
        onClick={copiar}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
          background: copiado ? COLORS.sucesso : COLORS.accent,
          color: COLORS.onAccent,
        }}
      >
        {copiado ? "✓ Copiado" : rotuloBotao}
      </button>
      <pre
        data-testid={testid}
        style={{
          margin: 0,
          padding: "18px 20px",
          paddingTop: 52,
          borderRadius: 12,
          background: COLORS.band,
          color: "#D6E4F5",
          fontSize: 12.5,
          lineHeight: 1.65,
          overflowX: "auto",
          maxHeight: 420,
          overflowY: "auto",
          fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace",
          whiteSpace: "pre",
        }}
      >
        {texto}
      </pre>
    </div>
  );
}

export default function Certificacao() {
  return (
    <section data-testid="area-certificacao">
      {/* ── Chamada ── */}
      <div
        className="qa-card"
        style={{
          padding: "26px 26px 24px",
          marginBottom: 22,
          borderLeft: `4px solid ${COLORS.accent}`,
        }}
      >
        <Etiqueta>Certificado da comunidade</Etiqueta>
        <h3
          className="qa-display"
          style={{ fontSize: 27, fontWeight: 700, margin: "12px 0 10px", color: COLORS.text, lineHeight: 1.2 }}
        >
          Complete os 12 desafios e receba seu certificado
        </h3>
        <Paragrafo style={{ maxWidth: 780, fontSize: 15.5 }}>
          Quem executa os {CENARIOS.length} cenários desta página, documenta cada um no padrão
          abaixo e envia os vídeos das execuções recebe um certificado de conclusão em PDF
          de <strong style={{ color: COLORS.text }}>{CARGA_HORARIA} horas</strong>, com a marca
          da comunidade, assinado pelo instrutor e com código de verificação.
        </Paragrafo>
        <Paragrafo style={{ margin: 0, maxWidth: 780 }}>
          Não é um certificado de participação: ele lista no verso as técnicas de teste que
          você exercitou. Para ele valer alguma coisa, o trabalho precisa estar feito de
          verdade — e é isso que a validação confere.
        </Paragrafo>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 20,
            paddingTop: 18,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          {[
            [`${CENARIOS.length}`, "casos de teste"],
            [`${CENARIOS.length}`, "vídeos de evidência"],
            ["1", "documento"],
            [PRAZO_VALIDACAO, "para a validação"],
          ].map(([valor, rotulo]) => (
            <div key={rotulo} style={{ paddingRight: 20 }}>
              <p className="qa-display" style={{ fontSize: 21, fontWeight: 700, color: COLORS.accentText, margin: 0 }}>
                {valor}
              </p>
              <p style={{ fontSize: 12.5, color: COLORS.muted, margin: "2px 0 0" }}>{rotulo}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 1. A trilha ── */}
      <Bloco
        id="trilha"
        numero="1"
        titulo="A trilha, do começo ao fim"
        resumo="As sete etapas entre abrir o playground e receber o PDF."
        aberto
      >
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 18 }} data-testid="lista-etapas">
          {ETAPAS.map((e) => (
            <li key={e.n} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "start" }}>
              <span
                className="qa-display"
                aria-hidden="true"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.onAccent,
                  background: COLORS.accent,
                  borderRadius: 999,
                  width: 34,
                  height: 34,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {e.n}
              </span>
              <div>
                <h4 style={{ fontSize: 16.5, fontWeight: 700, color: COLORS.text, margin: "5px 0 4px", lineHeight: 1.35 }}>
                  {e.titulo}
                </h4>
                <p style={{ fontSize: 13.5, color: COLORS.accentText, margin: "0 0 9px", fontWeight: 600 }}>{e.resumo}</p>
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
                  {e.detalhes.map((d) => (
                    <li key={d} style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.textSoft }}>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Bloco>

      {/* ── 2. As abas ── */}
      <Bloco
        id="abas"
        numero="2"
        titulo="O que é cada aba do playground"
        resumo="Registrar defeito, Tabela de defeitos, Cenários de teste — e o botão que quase todo mundo ignora."
      >
        <div style={{ display: "grid", gap: 16 }} data-testid="lista-abas">
          {ABAS_EXPLICADAS.map((a) => (
            <div
              key={a.id}
              data-testid={`aba-explicada-${a.id}`}
              style={{
                padding: "18px 20px",
                borderRadius: 12,
                background: COLORS.surfaceAlt,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <h4 className="qa-display" style={{ fontSize: 19, fontWeight: 700, color: COLORS.text, margin: 0 }}>
                  Aba “{a.rotulo}”
                </h4>
                {a.cenarios.length > 0 && (
                  <Etiqueta>
                    {a.cenarios.length} {a.cenarios.length === 1 ? "cenário" : "cenários"}
                  </Etiqueta>
                )}
              </div>

              <Paragrafo style={{ marginBottom: 10 }}>{a.oQueE}</Paragrafo>

              <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.textSoft, margin: "0 0 10px" }}>
                <strong style={{ color: COLORS.text }}>O que testar aqui: </strong>
                {a.oQueTestar}
              </p>

              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: COLORS.textSoft,
                  margin: 0,
                  padding: "11px 14px",
                  borderRadius: 9,
                  background: COLORS.accentSoft,
                  borderLeft: `3px solid ${COLORS.accent}`,
                }}
              >
                <strong style={{ color: COLORS.accentText }}>Atenção: </strong>
                {a.atencao}
              </p>

              {a.cenarios.length > 0 && (
                <p style={{ fontSize: 13, color: COLORS.muted, margin: "11px 0 0", lineHeight: 1.6 }}>
                  Cenários que você executa nesta aba:{" "}
                  {a.cenarios
                    .map((id) => `CT-${String(CENARIOS.findIndex((c) => c.id === id) + 1).padStart(2, "0")}`)
                    .join(", ")}
                  .
                </p>
              )}
            </div>
          ))}

          {/* O botão de restaurar não é uma aba, mas é parte da mecânica. */}
          <div
            data-testid="explicacao-restaurar"
            style={{
              padding: "18px 20px",
              borderRadius: 12,
              background: COLORS.surfaceAlt,
              border: `1px dashed ${COLORS.accent}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <h4 className="qa-display" style={{ fontSize: 19, fontWeight: 700, color: COLORS.text, margin: 0 }}>
                Botão “{BOTAO_RESTAURAR.rotulo}”
              </h4>
              <Etiqueta>Use antes de cada cenário</Etiqueta>
            </div>
            <Paragrafo style={{ marginBottom: 10 }}>{BOTAO_RESTAURAR.oQueFaz}</Paragrafo>
            <Paragrafo style={{ marginBottom: 10 }}>{BOTAO_RESTAURAR.porQueImporta}</Paragrafo>
            <Paragrafo style={{ margin: 0 }}>
              <strong style={{ color: COLORS.text }}>Quando usar: </strong>
              {BOTAO_RESTAURAR.quandoUsar}
            </Paragrafo>
          </div>
        </div>
      </Bloco>

      {/* ── 3. O documento ── */}
      <Bloco
        id="documento"
        numero="3"
        titulo="Como documentar cada caso de teste"
        resumo="O padrão que a entrega precisa seguir, com o modelo pronto para copiar."
      >
        <Paragrafo>
          A estrutura abaixo segue o vocabulário do syllabus CTFL {SYLLABUS.versao} — condição
          prévia, dados de teste, resultado esperado, resultado real e status de execução. Não é
          burocracia: é o formato que você vai encontrar em qualquer ferramenta de gestão de teste
          no primeiro emprego, e é o que permite outra pessoa repetir o que você fez.
        </Paragrafo>

        <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: "22px 0 12px" }}>
          Cabeçalho do documento
        </h4>
        <div className="qa-tabela-wrap" style={{ overflowX: "auto" }}>
          <table className="qa-tabela" data-testid="tabela-cabecalho">
            <thead>
              <tr>
                <th scope="col">Campo</th>
                <th scope="col">O que preencher</th>
              </tr>
            </thead>
            <tbody>
              {CABECALHO_DOCUMENTO.map((c) => (
                <tr key={c.campo}>
                  <td style={{ fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap" }}>{c.campo}</td>
                  <td style={{ color: COLORS.textSoft }}>{c.exemplo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: "26px 0 12px" }}>
          Os campos de cada caso de teste
        </h4>
        <div className="qa-tabela-wrap" style={{ overflowX: "auto" }}>
          <table className="qa-tabela" data-testid="tabela-campos-caso">
            <thead>
              <tr>
                <th scope="col">Campo</th>
                <th scope="col">Como preencher</th>
              </tr>
            </thead>
            <tbody>
              {CAMPOS_CASO_TESTE.map((c) => (
                <tr key={c.campo}>
                  <td style={{ fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap" }}>
                    {c.campo}
                    {!c.obrigatorio && (
                      <span style={{ display: "block", fontSize: 11, fontWeight: 500, color: COLORS.muted }}>
                        opcional
                      </span>
                    )}
                  </td>
                  <td style={{ color: COLORS.textSoft }}>{c.explicacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: "26px 0 6px" }}>
          Modelo pronto — copie e cole no Word
        </h4>
        <Paragrafo>
          Clique em copiar, cole no Word ou no Google Docs e preencha. O primeiro caso já vem
          preenchido como exemplo; repita o bloco até o CT-12, seguindo a ordem da aba
          “Cenários de teste”.
        </Paragrafo>
        <BlocoCopiavel
          texto={MODELO_DOCUMENTO}
          testid="modelo-documento"
          rotuloBotao="Copiar modelo"
          evento="certificacao_copiar_modelo"
        />
      </Bloco>

      {/* ── 4. As evidências ── */}
      <Bloco
        id="evidencias"
        numero="4"
        titulo="Como gravar as evidências em vídeo"
        resumo="Um vídeo por caso, começando na massa restaurada e terminando no resultado."
      >
        <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: "0 0 12px" }}>
          Com o que gravar
        </h4>
        <div className="qa-grid2" style={{ display: "grid", gap: 10, marginBottom: 24 }} data-testid="ferramentas-gravacao">
          {COMO_GRAVAR.ferramentas.map((f) => (
            <div
              key={f.onde}
              style={{ padding: "12px 15px", borderRadius: 10, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, margin: 0 }}>{f.onde}</p>
              <p style={{ fontSize: 13.5, color: COLORS.textSoft, margin: "3px 0 0", lineHeight: 1.55 }}>{f.como}</p>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: "0 0 12px" }}>
          As regras da gravação
        </h4>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }} data-testid="regras-gravacao">
          {COMO_GRAVAR.regras.map((r, i) => (
            <li key={r.titulo} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 13, alignItems: "start" }}>
              <span
                aria-hidden="true"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS.accentText,
                  background: COLORS.accentSoft,
                  borderRadius: 7,
                  padding: "4px 8px",
                  minWidth: 26,
                  textAlign: "center",
                }}
              >
                {i + 1}
              </span>
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text, margin: "1px 0 3px" }}>{r.titulo}</p>
                <p style={{ fontSize: 14, color: COLORS.textSoft, margin: 0, lineHeight: 1.65 }}>{r.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </Bloco>

      {/* ── 5. A entrega ── */}
      <Bloco
        id="entrega"
        numero="5"
        titulo="Como organizar e compartilhar no Google Drive"
        resumo="A estrutura de pastas, a permissão certa e para quem enviar o link."
      >
        <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: "0 0 6px" }}>
          A estrutura da pasta
        </h4>
        <Paragrafo>Troque o nome de exemplo pelo seu nome completo — o mesmo que vai sair no certificado.</Paragrafo>
        <BlocoCopiavel
          texto={ESTRUTURA_DRIVE}
          testid="estrutura-drive"
          rotuloBotao="Copiar estrutura"
          evento="certificacao_copiar_estrutura"
        />

        <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: "26px 0 12px" }}>
          Compartilhando o link
        </h4>
        <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 9 }} data-testid="passos-compartilhamento">
          {PASSOS_COMPARTILHAMENTO.map((p) => (
            <li key={p} style={{ fontSize: 14.5, lineHeight: 1.7, color: COLORS.textSoft }}>
              {p}
            </li>
          ))}
        </ol>

        <div
          style={{
            marginTop: 22,
            padding: "18px 20px",
            borderRadius: 12,
            background: COLORS.accentSoft,
            border: `1px solid ${COLORS.accent}`,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, margin: "0 0 8px" }}>
            Para quem enviar
          </p>
          <Paragrafo style={{ margin: "0 0 14px" }}>
            Mande o link para qualquer administrador da comunidade, com o seu nome completo do
            jeito que deve sair impresso. A revisão é do Douglas e sai em até {PRAZO_VALIDACAO}.
          </Paragrafo>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              className="qa-btn qa-btn-primario"
              href={LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="enviar-discord"
              onClick={() => track("certificacao_enviar_discord")}
            >
              Enviar pelo Discord
            </a>
            <a
              className="qa-btn"
              href={LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="enviar-whatsapp"
              style={{ background: COLORS.surfaceAlt, color: COLORS.text, boxShadow: `inset 0 0 0 1px ${COLORS.border}` }}
            >
              Enviar pelo WhatsApp
            </a>
          </div>
        </div>
      </Bloco>

      {/* ── 6. A validação ── */}
      <Bloco
        id="validacao"
        numero="6"
        titulo="O que é conferido na validação"
        resumo="Os critérios da revisão — e o que definitivamente não reprova ninguém."
      >
        <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: "0 0 12px" }}>
          O que o Douglas confere
        </h4>
        <ul style={{ margin: "0 0 26px", padding: 0, listStyle: "none", display: "grid", gap: 10 }} data-testid="criterios-validacao">
          {CRITERIOS_VALIDACAO.map((c) => (
            <li key={c.criterio} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "start" }}>
              <span aria-hidden="true" style={{ color: COLORS.sucesso, fontSize: 16, lineHeight: 1.5 }}>
                ✓
              </span>
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 600, color: COLORS.text, margin: 0 }}>{c.criterio}</p>
                <p style={{ fontSize: 13.5, color: COLORS.muted, margin: "2px 0 0", lineHeight: 1.6 }}>{c.detalhe}</p>
              </div>
            </li>
          ))}
        </ul>

        <div
          style={{
            padding: "18px 20px",
            borderRadius: 12,
            background: "rgba(95,211,160,.10)",
            borderLeft: `4px solid ${COLORS.sucesso}`,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, margin: "0 0 10px" }}>
            O que não reprova ninguém
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 7 }} data-testid="nao-reprova">
            {NAO_REPROVA.map((n) => (
              <li key={n} style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.textSoft }}>
                {n}
              </li>
            ))}
          </ul>
        </div>
      </Bloco>

      {/* ── 7. Estudo ── */}
      <Bloco
        id="syllabus"
        numero="7"
        titulo={`Estude pelo syllabus CTFL ${SYLLABUS.versao}`}
        resumo="O programa oficial do exame, de graça e em português."
      >
        <Paragrafo>
          Este exercício inteiro é uma aplicação prática do capítulo 4 do syllabus — análise e
          modelagem de teste. Se você quer seguir da prática para a certificação, o documento
          oficial é gratuito e está em português pelo {SYLLABUS.boardBr}.
        </Paragrafo>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <a
            className="qa-btn qa-btn-primario"
            href={SYLLABUS.links.pdfPt}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="syllabus-pdf-playground"
            onClick={() => track("syllabus_download", { origem: "playground" })}
          >
            Baixar o syllabus em PDF
          </a>
          <a
            className="qa-btn"
            href={SYLLABUS.links.oficial}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: COLORS.surfaceAlt, color: COLORS.text, boxShadow: `inset 0 0 0 1px ${COLORS.border}` }}
          >
            Página oficial do ISTQB
          </a>
        </div>
      </Bloco>
    </section>
  );
}
