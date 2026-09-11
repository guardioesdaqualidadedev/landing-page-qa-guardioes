import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { temaInicial, aplicarTema, proximoTema, THEME_KEY, THEME_CSS, MARCA } from "../../src/theme.js";

describe("proximoTema", () => {
  it("alterna entre escuro e claro", () => {
    expect(proximoTema("dark")).toBe("light");
    expect(proximoTema("light")).toBe("dark");
  });
});

describe("temaInicial", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("usa escuro quando não há preferência salva", () => {
    expect(temaInicial()).toBe("dark");
  });

  it("respeita a preferência salva", () => {
    window.localStorage.setItem(THEME_KEY, "light");
    expect(temaInicial()).toBe("light");
  });

  it("ignora valores inválidos gravados no storage", () => {
    window.localStorage.setItem(THEME_KEY, "roxo");
    expect(temaInicial()).toBe("dark");
  });

  it("cai no padrão quando o localStorage lança (janela anônima)", () => {
    const spy = vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(temaInicial()).toBe("dark");
    spy.mockRestore();
  });
});

describe("aplicarTema", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
  });

  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("grava o tema no <html> e no localStorage", () => {
    aplicarTema("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("light");
  });

  it("atualiza a theme-color do navegador", () => {
    aplicarTema("dark");
    expect(document.querySelector('meta[name="theme-color"]').getAttribute("content")).toBe("#06182D");
    aplicarTema("light");
    expect(document.querySelector('meta[name="theme-color"]').getAttribute("content")).toBe("#EFF2F5");
  });
});

describe("design system", () => {
  it("mantém a paleta oficial do manual de marca", () => {
    expect(MARCA.azulMarinho).toBe("#0B2341");
    expect(MARCA.laranja).toBe("#F47A20");
    expect(MARCA.cinzaClaro).toBe("#EFF2F5");
  });

  it("define os dois temas e usa o azul-marinho como faixa nos dois", () => {
    expect(THEME_CSS).toContain(':root[data-theme="light"]');
    const faixas = THEME_CSS.match(/--qa-band:\s*#0B2341;/g) || [];
    expect(faixas).toHaveLength(2);
  });
});
