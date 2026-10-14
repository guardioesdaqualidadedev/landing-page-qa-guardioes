import React, { useEffect, useMemo, useRef, useState } from "react";
import { COLORS } from "../theme.js";
import { AreaRolavel } from "../components/Acessivel.jsx";
import { SEVERIDADES, STATUS, MODULOS } from "./dominio.js";
import { prepararTabela, filtrarDefeitos, resumoPorSeveridade } from "./tabela.js";
import { formatarDataBR } from "../utils/datas.js";

const POR_PAGINA = 5;

const COR_SEVERIDADE = {
  "Crítica": COLORS.critica,
  Alta: COLORS.alta,
  "Média": COLORS.media,
  Baixa: COLORS.baixa,
};

function Selo({ texto, cor }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".03em",
        color: cor,
        boxShadow: `inset 0 0 0 1px ${cor}`,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </span>
  );
}

const COLUNAS = [
  { campo: "id", rotulo: "ID" },
  { campo: "titulo", rotulo: "Título" },
  { campo: "modulo", rotulo: "Módulo" },
  { campo: "severidade", rotulo: "Severidade" },
  { campo: "status", rotulo: "Status" },
  { campo: "ocorrencias", rotulo: "Ocorr." },
  { campo: "data", rotulo: "Detecção" },
];

// Tabela de defeitos com busca, filtros, ordenação por coluna, paginação e as
// ações de mudar status e excluir.
//
// A confirmação de exclusão é um bloco DENTRO da linha, não um window.confirm:
// diálogo nativo do navegador trava a automação e é impossível de estilizar.
export default function TabelaDefeitos({ defeitos, onAtualizarStatus, onExcluir }) {
  const [busca, setBusca] = useState("");
  const [severidade, setSeveridade] = useState("");
  const [status, setStatus] = useState("");
  const [modulo, setModulo] = useState("");
  const [ordenacao, setOrdenacao] = useState({ campo: "id", direcao: "asc" });
  const [pagina, setPagina] = useState(1);
  const [confirmando, setConfirmando] = useState(null);
  const botoesExcluir = useRef({});
  // Posição da linha recém-excluída, para o foco cair na linha que tomou o
  // lugar dela depois que a tabela redesenhar.
  const focoAposExcluir = useRef(null);

  const filtros = { busca, severidade, status, modulo };

  const resultado = useMemo(
    () => prepararTabela(defeitos, { filtros, ordenacao, pagina, porPagina: POR_PAGINA }),
    [defeitos, busca, severidade, status, modulo, ordenacao, pagina]
  );

  const resumo = useMemo(() => resumoPorSeveridade(filtrarDefeitos(defeitos, filtros)), [defeitos, busca, severidade, status, modulo]);

  const alternarOrdenacao = (campo) => {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { campo, direcao: "asc" }
    );
    setPagina(1);
  };

  const aoFiltrar = (setter) => (e) => {
    setter(e.target.value);
    setPagina(1);
    setConfirmando(null);
  };

  const limparFiltros = () => {
    setBusca("");
    setSeveridade("");
    setStatus("");
    setModulo("");
    setPagina(1);
  };

  const temFiltro = Boolean(busca || severidade || status || modulo);

  // Fechar a confirmação (Esc ou Cancelar) devolve o foco ao "Excluir" da
  // mesma linha. Sem isso o botão focado sumia junto com a confirmação e o
  // foco caía no <body>: quem usa teclado voltava para o topo da página.
  const fecharConfirmacao = (id) => {
    setConfirmando(null);
    botoesExcluir.current[id]?.focus();
  };

  const confirmarExclusao = (id, posicao) => {
    focoAposExcluir.current = posicao;
    onExcluir(id);
    setConfirmando(null);
  };

  // Depois de excluir, o foco vai para o "Excluir" da linha que ocupou a
  // posição da que saiu (ou da última, se a excluída era a última). Se a
  // página ficou vazia, vai para a busca.
  useEffect(() => {
    if (focoAposExcluir.current === null) return;
    const posicao = Math.min(focoAposExcluir.current, resultado.itens.length - 1);
    focoAposExcluir.current = null;
    const proxima = resultado.itens[posicao];
    (proxima ? botoesExcluir.current[proxima.id] : document.getElementById("filtro-busca"))?.focus();
  });

  return (
    <section data-testid="area-tabela">
      {/* Resumo por severidade */}
      <div className="qa-grid4 qa-resumo" style={{ marginBottom: 20 }} data-testid="resumo-severidade">
        {SEVERIDADES.map((s) => (
          <div key={s} className="qa-card" style={{ padding: "14px 16px" }}>
            <span className="qa-display qa-resumo-num" style={{ fontSize: 28, fontWeight: 700, color: COR_SEVERIDADE[s] }} data-testid={`resumo-${s}`}>
              {resumo[s] || 0}
            </span>
            <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: COLORS.muted }}>
              {s}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div
        className="qa-card qa-filtros"
        style={{ padding: "18px 18px 16px", marginBottom: 18, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}
        data-testid="filtros"
      >
        <div className="qa-field">
          <label className="qa-label" htmlFor="filtro-busca">Buscar</label>
          <input
            id="filtro-busca"
            className="qa-input"
            type="search"
            data-testid="filtro-busca"
            value={busca}
            onChange={aoFiltrar(setBusca)}
            placeholder="ID, título, módulo ou e-mail"
          />
        </div>
        <div className="qa-field">
          <label className="qa-label" htmlFor="filtro-severidade">Severidade</label>
          <select id="filtro-severidade" className="qa-select" data-testid="filtro-severidade" value={severidade} onChange={aoFiltrar(setSeveridade)}>
            <option value="">Todas</option>
            {SEVERIDADES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="qa-field">
          <label className="qa-label" htmlFor="filtro-status">Status</label>
          <select id="filtro-status" className="qa-select" data-testid="filtro-status" value={status} onChange={aoFiltrar(setStatus)}>
            <option value="">Todos</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="qa-field">
          <label className="qa-label" htmlFor="filtro-modulo">Módulo</label>
          <select id="filtro-modulo" className="qa-select" data-testid="filtro-modulo" value={modulo} onChange={aoFiltrar(setModulo)}>
            <option value="">Todos</option>
            {MODULOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button
          type="button"
          className="qa-btn qa-btn-pequeno qa-btn-limpar"
          data-testid="btn-limpar-filtros"
          onClick={limparFiltros}
          disabled={!temFiltro}
          style={{
            background: temFiltro ? COLORS.surfaceAlt : "transparent",
            color: temFiltro ? COLORS.text : COLORS.muted,
            boxShadow: `inset 0 0 0 1px ${COLORS.border}`,
            cursor: temFiltro ? "pointer" : "not-allowed",
            height: 42,
          }}
        >
          Limpar
        </button>
      </div>

      {/* Contagem de resultados — a frase que os testes leem para saber o estado.
          É uma mensagem de status (WCAG 4.1.3): a cada filtro, o leitor de
          tela anuncia quantos defeitos sobraram, sem tirar o foco da busca. */}
      <p role="status" style={{ fontSize: 13.5, color: COLORS.muted, margin: "0 0 10px" }} data-testid="contagem-resultados">
        {resultado.total === 0
          ? "Nenhum defeito encontrado com os filtros atuais."
          : `Exibindo ${resultado.primeiroItem}–${resultado.ultimoItem} de ${resultado.total} defeito(s).`}
      </p>

      <div className="qa-card qa-tabela-wrap" style={{ padding: 4 }}>
        <AreaRolavel className="qa-tabela-scroll" rotulo="Tabela de defeitos — use as setas para ver as outras colunas">
          <table className="qa-tabela" data-testid="tabela-defeitos">
            <caption className="qa-sr-only">Defeitos registrados no sistema fake do playground</caption>
            <thead>
              <tr>
                {COLUNAS.map((c) => {
                  const ativa = ordenacao.campo === c.campo;
                  return (
                    <th key={c.campo} scope="col" aria-sort={ativa ? (ordenacao.direcao === "asc" ? "ascending" : "descending") : "none"}>
                      <button
                        type="button"
                        className="qa-th-sort"
                        data-testid={`ordenar-${c.campo}`}
                        onClick={() => alternarOrdenacao(c.campo)}
                        aria-label={`Ordenar por ${c.rotulo}`}
                      >
                        {c.rotulo}
                        <span aria-hidden="true" style={{ color: ativa ? COLORS.accent : COLORS.muted, fontSize: 10 }}>
                          {ativa ? (ordenacao.direcao === "asc" ? "▲" : "▼") : "◆"}
                        </span>
                      </button>
                    </th>
                  );
                })}
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody
              onKeyDown={(e) => {
                if (e.key === "Escape" && confirmando) fecharConfirmacao(confirmando);
              }}
            >
              {resultado.itens.length === 0 && (
                <tr data-testid="linha-vazia">
                  <td colSpan={COLUNAS.length + 1} style={{ textAlign: "center", padding: "34px 12px", color: COLORS.muted }}>
                    Nada por aqui. Ajuste a busca ou limpe os filtros.
                  </td>
                </tr>
              )}

              {resultado.itens.map((d, posicao) => (
                <React.Fragment key={d.id}>
                  <tr data-testid={`linha-${d.id}`}>
                    <td style={{ fontWeight: 700, color: COLORS.accentText, whiteSpace: "nowrap" }}>{d.id}</td>
                    <td style={{ color: COLORS.text, minWidth: 260 }}>{d.titulo}</td>
                    <td style={{ color: COLORS.textSoft }}>{d.modulo}</td>
                    <td><Selo texto={d.severidade} cor={COR_SEVERIDADE[d.severidade] || COLORS.muted} /></td>
                    <td>
                      <label className="qa-sr-only" htmlFor={`status-${d.id}`}>Status de {d.id}</label>
                      <select
                        id={`status-${d.id}`}
                        className="qa-select"
                        data-testid={`status-${d.id}`}
                        value={d.status}
                        onChange={(e) => onAtualizarStatus(d.id, e.target.value)}
                        style={{ padding: "6px 8px", fontSize: 13, width: "auto", minWidth: 118 }}
                      >
                        {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ color: COLORS.textSoft, textAlign: "right" }}>{d.ocorrencias}</td>
                    {/* A data é guardada em ISO e SEMPRE exibida em dd/mm/aaaa,
                        pelo mesmo formatador do resto do site — o resultado não
                        pode depender do idioma do navegador de quem visita. */}
                    <td style={{ color: COLORS.muted, whiteSpace: "nowrap" }}>
                      {formatarDataBR(d.data)}
                    </td>
                    <td>
                      {/* O nome diz QUAL defeito: pelo Tab, o leitor de tela
                          só lê o botão, e oito "Excluir" iguais não dizem nada. */}
                      <button
                        type="button"
                        ref={(el) => {
                          botoesExcluir.current[d.id] = el;
                        }}
                        className="qa-btn qa-btn-pequeno"
                        data-testid={`excluir-${d.id}`}
                        aria-label={`Excluir ${d.id}`}
                        onClick={() => setConfirmando(confirmando === d.id ? null : d.id)}
                        aria-expanded={confirmando === d.id}
                        style={{ background: "transparent", color: COLORS.erro, boxShadow: `inset 0 0 0 1px ${COLORS.erro}` }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>

                  {confirmando === d.id && (
                    <tr data-testid={`confirmacao-${d.id}`}>
                      <td colSpan={COLUNAS.length + 1} style={{ background: COLORS.surfaceAlt }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "4px 0" }}>
                          <span style={{ fontSize: 14, color: COLORS.text }}>
                            Excluir <strong>{d.id}</strong> definitivamente? A ação não pode ser desfeita.
                          </span>
                          <span style={{ display: "inline-flex", gap: 8 }}>
                            <button
                              type="button"
                              className="qa-btn qa-btn-pequeno"
                              data-testid={`confirmar-exclusao-${d.id}`}
                              onClick={() => confirmarExclusao(d.id, posicao)}
                              style={{ background: COLORS.erro, color: COLORS.onErro }}
                            >
                              Confirmar exclusão
                            </button>
                            <button
                              type="button"
                              className="qa-btn qa-btn-pequeno"
                              data-testid={`cancelar-exclusao-${d.id}`}
                              onClick={() => fecharConfirmacao(d.id)}
                              style={{ background: "transparent", color: COLORS.text, boxShadow: `inset 0 0 0 1px ${COLORS.border}` }}
                            >
                              Cancelar
                            </button>
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </AreaRolavel>
      </div>

      {/* Dica de rolagem lateral — o CSS só a exibe em telas estreitas, onde a
          tabela realmente nao cabe inteira. */}
      <p
        className="qa-tabela-dica"
        data-testid="dica-rolagem"
        style={{ fontSize: 12.5, color: COLORS.muted, margin: "10px 0 0", textAlign: "center" }}
      >
        Arraste a tabela para o lado para ver as demais colunas
      </p>

      {/* Paginação */}
      <nav
        aria-label="Paginação da tabela de defeitos"
        data-testid="paginacao"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16, flexWrap: "wrap" }}
      >
        <span style={{ fontSize: 13.5, color: COLORS.muted }} data-testid="pagina-atual">
          Página {resultado.pagina} de {resultado.totalPaginas}
        </span>
        <span style={{ display: "inline-flex", gap: 8 }}>
          <button
            type="button"
            className="qa-btn qa-btn-pequeno"
            data-testid="btn-pagina-anterior"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={resultado.pagina <= 1}
            style={{
              background: COLORS.surfaceAlt,
              color: resultado.pagina <= 1 ? COLORS.muted : COLORS.text,
              cursor: resultado.pagina <= 1 ? "not-allowed" : "pointer",
            }}
          >
            <span aria-hidden="true">←</span> Anterior
          </button>
          <button
            type="button"
            className="qa-btn qa-btn-pequeno"
            data-testid="btn-pagina-proxima"
            onClick={() => setPagina((p) => Math.min(resultado.totalPaginas, p + 1))}
            disabled={resultado.pagina >= resultado.totalPaginas}
            style={{
              background: COLORS.surfaceAlt,
              color: resultado.pagina >= resultado.totalPaginas ? COLORS.muted : COLORS.text,
              cursor: resultado.pagina >= resultado.totalPaginas ? "not-allowed" : "pointer",
            }}
          >
            Próxima <span aria-hidden="true">→</span>
          </button>
        </span>
      </nav>
    </section>
  );
}
