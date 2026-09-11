import { describe, it, expect } from "vitest";
import {
  normalizar,
  filtrarDefeitos,
  ordenarDefeitos,
  paginar,
  prepararTabela,
  resumoPorSeveridade,
} from "../../src/playground/tabela.js";
import { DEFEITOS_INICIAIS, proximoId } from "../../src/playground/dominio.js";

describe("normalizar", () => {
  it("remove acentos e caixa", () => {
    expect(normalizar("Relatórios CRÍTICOS")).toBe("relatorios criticos");
  });

  it("lida com valores nulos sem quebrar", () => {
    expect(normalizar(null)).toBe("");
    expect(normalizar(undefined)).toBe("");
  });
});

describe("filtrarDefeitos", () => {
  it("sem filtro, devolve a lista inteira", () => {
    expect(filtrarDefeitos(DEFEITOS_INICIAIS, {})).toHaveLength(DEFEITOS_INICIAIS.length);
  });

  it("encontra por texto sem acento", () => {
    const achados = filtrarDefeitos(DEFEITOS_INICIAIS, { busca: "relatorio" });
    expect(achados.length).toBeGreaterThan(0);
    expect(achados.every((d) => d.modulo === "Relatórios")).toBe(true);
  });

  it("busca também pelo ID e pelo e-mail de quem reportou", () => {
    expect(filtrarDefeitos(DEFEITOS_INICIAIS, { busca: "BUG-1003" })).toHaveLength(1);
    expect(filtrarDefeitos(DEFEITOS_INICIAIS, { busca: "camila@" }).length).toBeGreaterThan(1);
  });

  it("combina filtros como E, não como OU", () => {
    const achados = filtrarDefeitos(DEFEITOS_INICIAIS, { severidade: "Crítica", status: "Aberto" });
    expect(achados.every((d) => d.severidade === "Crítica" && d.status === "Aberto")).toBe(true);
  });

  it("devolve lista vazia quando nada casa", () => {
    expect(filtrarDefeitos(DEFEITOS_INICIAIS, { busca: "zzzz-inexistente" })).toEqual([]);
  });
});

describe("ordenarDefeitos", () => {
  it("ordena severidade por gravidade, não em ordem alfabética", () => {
    const desc = ordenarDefeitos(DEFEITOS_INICIAIS, "severidade", "desc");
    expect(desc[0].severidade).toBe("Crítica");
    const asc = ordenarDefeitos(DEFEITOS_INICIAIS, "severidade", "asc");
    expect(asc[0].severidade).toBe("Baixa");
  });

  it("ordena números como números", () => {
    const desc = ordenarDefeitos(DEFEITOS_INICIAIS, "ocorrencias", "desc");
    expect(desc[0].ocorrencias).toBe(27);
  });

  it("ordena datas em ordem cronológica", () => {
    const asc = ordenarDefeitos(DEFEITOS_INICIAIS, "data", "asc");
    expect(asc[0].data).toBe("2026-07-22");
  });

  it("não altera a lista original", () => {
    const copia = [...DEFEITOS_INICIAIS];
    ordenarDefeitos(DEFEITOS_INICIAIS, "titulo", "desc");
    expect(DEFEITOS_INICIAIS).toEqual(copia);
  });
});

describe("paginar", () => {
  it("respeita o tamanho de página", () => {
    const r = paginar(DEFEITOS_INICIAIS, 1, 5);
    expect(r.itens).toHaveLength(5);
    expect(r.totalPaginas).toBe(2);
    expect(r.primeiroItem).toBe(1);
    expect(r.ultimoItem).toBe(5);
  });

  it("a última página pode vir incompleta", () => {
    const r = paginar(DEFEITOS_INICIAIS, 2, 5);
    expect(r.itens).toHaveLength(3);
    expect(r.ultimoItem).toBe(8);
  });

  it("volta para a última página existente quando a pedida não existe mais", () => {
    const r = paginar(DEFEITOS_INICIAIS.slice(0, 3), 4, 5);
    expect(r.pagina).toBe(1);
    expect(r.itens).toHaveLength(3);
  });

  it("lida com lista vazia sem quebrar", () => {
    const r = paginar([], 1, 5);
    expect(r.itens).toEqual([]);
    expect(r.total).toBe(0);
    expect(r.primeiroItem).toBe(0);
    expect(r.totalPaginas).toBe(1);
  });
});

describe("prepararTabela", () => {
  it("aplica filtro, ordenação e paginação na ordem certa", () => {
    const r = prepararTabela(DEFEITOS_INICIAIS, {
      filtros: { status: "Aberto" },
      ordenacao: { campo: "ocorrencias", direcao: "desc" },
      pagina: 1,
      porPagina: 2,
    });
    expect(r.total).toBe(3);
    expect(r.itens).toHaveLength(2);
    expect(r.itens[0].ocorrencias).toBe(27);
  });
});

describe("resumoPorSeveridade", () => {
  it("conta os registros de cada severidade", () => {
    const resumo = resumoPorSeveridade(DEFEITOS_INICIAIS);
    expect(resumo["Crítica"]).toBe(2);
    expect(resumo.Alta).toBe(2);
    expect(Object.values(resumo).reduce((a, b) => a + b, 0)).toBe(DEFEITOS_INICIAIS.length);
  });
});

describe("proximoId", () => {
  it("segue a sequência a partir do maior ID existente", () => {
    expect(proximoId(DEFEITOS_INICIAIS)).toBe("BUG-1009");
  });

  it("começa em BUG-1001 quando a lista está vazia", () => {
    expect(proximoId([])).toBe("BUG-1001");
  });
});
