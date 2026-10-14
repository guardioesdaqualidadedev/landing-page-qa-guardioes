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

// Faixa de legenda desenhada DENTRO da página, para quem assiste a janela do
// navegador sem o ffmpeg. Duas linhas: a etapa do roteiro e a última frase do
// leitor de tela. Fica fora do caminho de tudo: `aria-hidden` (o leitor não lê
// a própria legenda) e `pointer-events: none` (o clique atravessa a faixa).
//
// Também é no-op fora do modo demonstração.
export async function legendaNaTela(page, { etapa = null, fala = null, rotulo = "Leitor de tela" } = {}) {
  if (process.env.PW_DEMO !== "1") return;
  await page.evaluate(
    ({ etapa, fala, rotulo }) => {
      let faixa = document.getElementById("pw-legenda");
      if (!faixa) {
        faixa = document.createElement("div");
        faixa.id = "pw-legenda";
        faixa.setAttribute("aria-hidden", "true");
        faixa.innerHTML =
          '<div data-etapa style="font-weight:700;font-size:20px"></div>' +
          '<div data-fala style="margin-top:6px;font-size:17px;color:#FFD27A"></div>';
        Object.assign(faixa.style, {
          position: "fixed",
          left: "50%",
          bottom: "24px",
          transform: "translateX(-50%)",
          width: "min(1100px, calc(100vw - 32px))",
          padding: "14px 22px",
          borderRadius: "12px",
          background: "rgba(10, 22, 40, 0.92)",
          color: "#FFFFFF",
          font: "16px/1.45 system-ui, sans-serif",
          zIndex: "2147483647",
          pointerEvents: "none",
        });
        document.body.appendChild(faixa);
      }
      if (etapa !== null) {
        faixa.querySelector("[data-etapa]").textContent = etapa;
        faixa.querySelector("[data-fala]").textContent = "";
      }
      if (fala !== null) faixa.querySelector("[data-fala]").textContent = `${rotulo}: "${fala}"`;
    },
    { etapa, fala, rotulo }
  );
}
