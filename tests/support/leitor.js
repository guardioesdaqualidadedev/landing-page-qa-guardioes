// ─── Leitor de tela virtual dentro do navegador ──────────────────────────
//
// O @guidepup/virtual-screen-reader percorre a árvore de acessibilidade como
// um leitor de tela de verdade e devolve, em texto, o que ele falaria
// ("radio, P1 imediata, not checked, position 1, set size 3"). Ele roda dentro
// da página: o pacote é servido por uma rota interceptada pelo Playwright, sem
// depender do Vite — funciona igual no `vite` local e no `vite preview` do CI.
//
// As frases saem em inglês, que é o vocabulário da biblioteca; o conteúdo
// (rótulos, dicas, erros) é o da página, em português.
import { createRequire } from "node:module";

const PACOTE = createRequire(import.meta.url).resolve("@guidepup/virtual-screen-reader/browser.js");
const ROTA = "/__leitor-de-tela.js";

/** Registra a rota do pacote. Chamar antes de ligar o leitor. */
export async function prepararLeitor(page) {
  await page.route(`**${ROTA}`, (route) => route.fulfill({ path: PACOTE, contentType: "text/javascript" }));
}

/**
 * Liga o leitor com o cursor no início de `seletor`. Religar zera o registro
 * de falas — cada etapa do roteiro começa a ouvir do zero.
 */
export async function ligarLeitor(page, seletor) {
  await page.evaluate(
    async ({ rota, seletor }) => {
      const { virtual } = await import(rota);
      if (window.__leitorLigado) await virtual.stop();
      await virtual.start({ container: document.querySelector(seletor) });
      window.__leitor = virtual;
      window.__leitorLigado = true;
    },
    { rota: ROTA, seletor }
  );
}

export async function desligarLeitor(page) {
  await page.evaluate(async () => {
    if (window.__leitorLigado) await window.__leitor.stop();
    window.__leitorLigado = false;
  });
}

/** Tudo o que o leitor falou desde que foi ligado. */
export function falas(page) {
  return page.evaluate(() => window.__leitor.spokenPhraseLog());
}

/** Move o cursor do leitor para o próximo item e devolve o que ele falou. */
export function proximaFala(page) {
  return page.evaluate(async () => {
    await window.__leitor.next();
    return window.__leitor.lastSpokenPhrase();
  });
}
