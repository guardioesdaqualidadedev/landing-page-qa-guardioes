import { describe, it, expect } from "vitest";
import {
  isoParaData,
  formatarDataBR,
  formatarDataObjBR,
  FORMATO_DATA_BR,
} from "../../src/utils/datas.js";

describe("isoParaData", () => {
  it("monta a data no fuso local, sem deslocar um dia", () => {
    // `new Date("2026-09-09")` seria lido como UTC e, no Brasil, voltaria para
    // o dia 8. É o bug de fuso que este módulo existe para evitar.
    const d = isoParaData("2026-09-09");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(9);
  });

  it("devolve null para o que não é ISO", () => {
    expect(isoParaData("09/09/2026")).toBeNull();
    expect(isoParaData("2026-9-9")).toBeNull();
    expect(isoParaData("")).toBeNull();
    expect(isoParaData(null)).toBeNull();
    expect(isoParaData(undefined)).toBeNull();
    expect(isoParaData(20260909)).toBeNull();
  });

  it("rejeita datas que não existem no calendário", () => {
    // O construtor do Date "corrige" 31/02 para 03/03 sem avisar; aqui não.
    expect(isoParaData("2026-02-31")).toBeNull();
    expect(isoParaData("2026-13-01")).toBeNull();
    expect(isoParaData("2026-00-10")).toBeNull();
  });

  it("aceita 29 de fevereiro em ano bissexto e recusa fora dele", () => {
    expect(isoParaData("2024-02-29")).not.toBeNull();
    expect(isoParaData("2026-02-29")).toBeNull();
  });
});

describe("formatarDataBR", () => {
  it("converte ISO em dd/mm/aaaa", () => {
    expect(formatarDataBR("2026-09-09")).toBe("09/09/2026");
    expect(formatarDataBR("2020-01-01")).toBe("01/01/2020");
    expect(formatarDataBR("2026-12-31")).toBe("31/12/2026");
  });

  it("mantém o zero à esquerda em dia e mês", () => {
    expect(formatarDataBR("2026-03-07")).toBe("07/03/2026");
  });

  it("devolve string vazia em vez de 'Invalid Date'", () => {
    expect(formatarDataBR("2026-02-31")).toBe("");
    expect(formatarDataBR("qualquer coisa")).toBe("");
    expect(formatarDataBR(null)).toBe("");
  });
});

describe("formatarDataObjBR", () => {
  it("formata um Date em dd/mm/aaaa", () => {
    expect(formatarDataObjBR(new Date(2026, 8, 9))).toBe("09/09/2026");
  });

  it("não quebra com entrada que não é Date válido", () => {
    expect(formatarDataObjBR(new Date("nada"))).toBe("");
    expect(formatarDataObjBR("2026-09-09")).toBe("");
    expect(formatarDataObjBR(null)).toBe("");
  });
});

describe("FORMATO_DATA_BR", () => {
  it("é a máscara que as telas mostram ao visitante", () => {
    expect(FORMATO_DATA_BR).toBe("dd/mm/aaaa");
  });
});
