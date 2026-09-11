// ─────────────────────────────────────────────────────────────────────────────
// Filtro, ordenação e paginação da tabela de defeitos.
//
// Também funções puras — recebem a lista e devolvem outra lista, sem tocar em
// estado. A tela apenas combina as três na ordem certa: filtrar → ordenar →
// paginar. É essa separação que torna a tabela testável sem renderizar nada.
// ─────────────────────────────────────────────────────────────────────────────
import { PESO_SEVERIDADE } from "./dominio.js";

// Remove acentos e caixa para a busca não falhar por "relatorio" x "relatório".
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function filtrarDefeitos(lista, { busca = "", severidade = "", status = "", modulo = "" } = {}) {
  const termo = normalizar(busca);
  return lista.filter((d) => {
    if (severidade && d.severidade !== severidade) return false;
    if (status && d.status !== status) return false;
    if (modulo && d.modulo !== modulo) return false;
    if (!termo) return true;
    const alvo = normalizar([d.id, d.titulo, d.modulo, d.reporter].join(" "));
    return alvo.includes(termo);
  });
}

export function ordenarDefeitos(lista, campo = "id", direcao = "asc") {
  const fator = direcao === "desc" ? -1 : 1;
  return [...lista].sort((a, b) => {
    let x = a[campo];
    let y = b[campo];

    if (campo === "severidade") {
      x = PESO_SEVERIDADE[x] ?? 0;
      y = PESO_SEVERIDADE[y] ?? 0;
    }

    if (typeof x === "number" && typeof y === "number") return (x - y) * fator;

    // Datas em ISO (AAAA-MM-DD) comparam corretamente como texto.
    return String(x).localeCompare(String(y), "pt-BR", { numeric: true }) * fator;
  });
}

export function paginar(lista, pagina = 1, porPagina = 5) {
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  // Se um filtro reduziu a lista e a pessoa estava na página 4, cai para a última
  // página existente em vez de mostrar uma tabela vazia.
  const atual = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (atual - 1) * porPagina;
  return {
    itens: lista.slice(inicio, inicio + porPagina),
    pagina: atual,
    totalPaginas,
    total,
    primeiroItem: total === 0 ? 0 : inicio + 1,
    ultimoItem: Math.min(inicio + porPagina, total),
  };
}

// Combina os três passos na ordem que a tela usa.
export function prepararTabela(lista, { filtros, ordenacao, pagina, porPagina } = {}) {
  const filtrados = filtrarDefeitos(lista, filtros);
  const ordenados = ordenarDefeitos(filtrados, ordenacao?.campo, ordenacao?.direcao);
  return paginar(ordenados, pagina, porPagina);
}

// Contagem por severidade, usada nos cartões de resumo acima da tabela.
export function resumoPorSeveridade(lista) {
  return lista.reduce((acc, d) => {
    acc[d.severidade] = (acc[d.severidade] || 0) + 1;
    return acc;
  }, {});
}
