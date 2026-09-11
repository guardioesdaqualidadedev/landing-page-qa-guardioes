import { describe, it, expect } from "vitest";
import { deveContar } from "../../src/hooks/useVisitorCount.js";

// A regra que decide se uma visita entra no contador. Ela existe porque o
// `.env` de desenvolvimento aponta para o Firebase de produção: sem esta
// trava, cada `npm run test:e2e` somava dezenas de "visitantes" reais.
function janela({ hostname, webdriver = false }) {
  return { location: { hostname }, navigator: { webdriver } };
}

describe("deveContar", () => {
  it("conta a visita no domínio publicado", () => {
    expect(deveContar(janela({ hostname: "comunidade-qa-guardioes.web.app" }))).toBe(true);
    expect(deveContar(janela({ hostname: "guardioesqa.com.br" }))).toBe(true);
  });

  it("não conta em localhost — é onde a suíte Playwright roda", () => {
    for (const host of ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]) {
      expect(deveContar(janela({ hostname: host }))).toBe(false);
    }
  });

  it("não conta em rede local nem em hostnames .local", () => {
    for (const host of ["192.168.0.14", "10.0.0.7", "172.16.3.2", "172.31.255.1", "macbook.local"]) {
      expect(deveContar(janela({ hostname: host }))).toBe(false);
    }
  });

  it("conta endereços fora das faixas privadas", () => {
    // 172.32 e 11.x ficam de fora da faixa reservada — são internet pública.
    expect(deveContar(janela({ hostname: "172.32.0.1" }))).toBe(true);
    expect(deveContar(janela({ hostname: "11.0.0.1" }))).toBe(true);
  });

  it("não conta navegador dirigido por automação, mesmo em produção", () => {
    expect(deveContar(janela({ hostname: "comunidade-qa-guardioes.web.app", webdriver: true }))).toBe(false);
  });

  it("não quebra sem window ou sem location", () => {
    expect(deveContar(null)).toBe(false);
    expect(deveContar({})).toBe(false);
    expect(deveContar({ location: { hostname: "" } })).toBe(false);
  });
});
