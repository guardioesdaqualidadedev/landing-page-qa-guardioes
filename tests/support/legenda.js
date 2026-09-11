// Escreve a faixa de legenda que o ffmpeg desenha sobre a gravação.
//
// O reporter (reporter-legenda.js) já publica o nome de cada teste, mas o
// passeio guiado é um teste único e longo: sem isto a faixa ficaria congelada
// por vários minutos. Aqui o próprio roteiro narra o que está em tela.
//
// Fora do modo demonstração é um no-op — nada de escrever arquivo em CI.
import fs from "node:fs";

const SAIDA = process.env.PW_LEGENDA;
const ATIVO = process.env.PW_DEMO === "1" && Boolean(SAIDA);

// Multiplicador global do ritmo. Serve para calibrar a duração da gravação sem
// reescrever o roteiro: PW_RITMO=1.6 deixa cada pausa 60% mais longa. O padrão
// é 1 — o ritmo escrito no roteiro.
const RITMO = Number(process.env.PW_RITMO || 1);
const espera = (ms) => Math.round(ms * RITMO);

export function legenda(texto) {
  if (!ATIVO) return;
  try {
    const tmp = `${SAIDA}.tmp`;
    fs.writeFileSync(tmp, String(texto).replace(/\s+/g, " ").trim() + "\n", "utf8");
    fs.renameSync(tmp, SAIDA);
  } catch {
    /* a legenda nunca deve derrubar o roteiro */
  }
}

// Pausa nomeada: escreve a legenda e espera. É o que dá ritmo de aula à
// gravação — tempo de ler a tela antes da próxima ação.
export async function passo(page, texto, ms = 3000) {
  legenda(texto);
  await page.waitForTimeout(espera(ms));
}

// Rola até uma seção e espera a animação de entrada terminar.
export async function irPara(page, seletor, ms = 2600) {
  await page.locator(seletor).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(espera(ms));
}

// Rolagem suave por uma tela inteira, para o conteúdo passar em ritmo de leitura.
export async function rolar(page, telas = 1, ms = 1800) {
  for (let i = 0; i < telas; i += 1) {
    await page.evaluate(() => window.scrollBy({ top: window.innerHeight * 0.82, behavior: "smooth" }));
    await page.waitForTimeout(espera(ms));
  }
}

export async function voltarAoTopo(page, ms = 1600) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(espera(ms));
}
