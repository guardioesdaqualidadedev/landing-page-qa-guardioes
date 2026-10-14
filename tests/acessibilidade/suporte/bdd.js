/**
 * BDD em português sobre o Playwright Test.
 *
 *   funcionalidade('Navegação com NVDA', () => {
 *     cenario('Pular do topo para o conteúdo', [
 *       Dado('que abro a página com o NVDA ligado', async ({ page, leitor }) => { ... }),
 *       Quando('ativo o atalho "Pular para o conteúdo"', async ({ leitor }) => { ... }),
 *       Entao('o NVDA anuncia o título principal', async ({ leitor }) => { ... }),
 *     ]);
 *   });
 *
 * Cada passo vira um test.step (aparece no relatório HTML) e atualiza a
 * legenda do vídeo: o passo em execução fica em destaque, os concluídos
 * ganham ✓ e o que falhar fica em vermelho com a mensagem de erro.
 *
 * Os passos recebem um único objeto de contexto: as fixtures (page, leitor,
 * legenda, narrador...) e `mundo`, um objeto vazio para passar dados de um
 * passo para o outro.
 *
 * PASSO_MS (padrão 600) é a pausa entre passos, para o vídeo ficar legível.
 * Em CI, use PASSO_MS=0.
 */
import { test as base, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Legenda } from "./legenda.js";
import { LeitorNvda } from "./leitor-nvda.js";
import { Narrador } from "./narrador.js";
import { juntarAudioNoVideo, converterParaMp4 } from "./video.js";

// Pasta com os vídeos organizados: videos/<arquivo de teste>/<cenário>.mp4
const PASTA_VIDEOS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "videos");
const PREFIXO_FALHA = "[FALHOU] ";

function caminhoDoVideo(testInfo) {
  // titlePath[0] é o arquivo de teste (o testInfo.file seria este bdd.js, onde o test() é declarado).
  const pasta = path.join(PASTA_VIDEOS, path.basename(testInfo.titlePath[0], ".spec.js"));
  const cenario = testInfo.title
    .replace(/^Cenário: /, "")
    .replace(/"/g, "'")
    .replace(/[\\/:*?<>|]/g, "-")
    .slice(0, 150);
  const passou = testInfo.status === "passed";
  fs.mkdirSync(pasta, { recursive: true });
  // O vídeo da execução anterior com o resultado oposto sai: senão um cenário
  // corrigido continuaria com um "[FALHOU]" velho do lado.
  fs.rmSync(path.join(pasta, `${passou ? PREFIXO_FALHA : ""}${cenario}.mp4`), { force: true });
  return path.join(pasta, `${passou ? "" : PREFIXO_FALHA}${cenario}.mp4`);
}

const PASSO_MS = Number(process.env.PASSO_MS ?? 600);

export const test = base.extend({
  narrador: async ({}, use, testInfo) => {
    await use(new Narrador(testInfo));
  },

  legenda: async ({ page, narrador }, use) => {
    const legenda = new Legenda(page, narrador);
    await legenda.instalar();
    await use(legenda);
  },

  leitor: async ({ page, legenda, narrador }, use) => {
    const leitor = new LeitorNvda(page, legenda, narrador);
    await use(leitor);
    await leitor.parar();
  },

  // Automática: prepara a página para teste e, no fim, junta o áudio ao vídeo.
  _gravacao: [
    async ({ page, narrador }, use, testInfo) => {
      narrador.zerarRelogio();

      // Nada de eventos de teste no Google Analytics. O contador de visitas
      // não precisa de trava: ele já ignora localhost e navegador automatizado
      // (veja useVisitorCount.js).
      await page.route(/google-analytics\.com|googletagmanager\.com/, (r) => r.abort());

      // Com o navegador visível (modo ao vivo, extensão do VS Code, --headed),
      // quem assiste costuma clicar na janela para trazê-la para frente — e no
      // macOS esse primeiro clique chega à página. Um clique em texto ou no
      // fundo tirava o foco do lugar (ia para o <main>) e reprovava o cenário
      // de teclado sem defeito nenhum no site. Aqui, o clique em texto e fundo
      // não move mais o foco; o clique em campo, botão, link ou rótulo segue
      // normal — inclusive os do próprio teste, que continuam funcionando.
      await page.addInitScript(() => {
        const CONTROLES = 'input, select, textarea, button, a[href], summary, label, [tabindex="0"]';
        document.addEventListener(
          "mousedown",
          (e) => {
            if (!e.target.closest?.(CONTROLES)) e.preventDefault();
          },
          true
        );
      });

      await use();

      const video = page.video();
      await page.close();
      if (!video) return;
      const webm = await video.path();
      const destino = caminhoDoVideo(testInfo);

      if (narrador.falas.length) {
        // Cenários de leitor de tela: vídeo legendado + voz do NVDA simulado.
        const mp4 = await juntarAudioNoVideo(webm, narrador.falas, destino);
        if (mp4) {
          await testInfo.attach("vídeo com a voz do NVDA simulado", { path: mp4, contentType: "video/mp4" });
          return;
        }
      }
      // Demais cenários (ou sem áudio): só o vídeo legendado, em .mp4.
      await converterParaMp4(webm, destino);
    },
    { auto: true },
  ],
});

const passo = (palavra) => (texto, fn) => ({ palavra, texto, fn });
export const Dado = passo("Dado");
export const Quando = passo("Quando");
export const Entao = passo("Então");
export const E = passo("E");
export const Mas = passo("Mas");

export function funcionalidade(nome, corpo) {
  test.describe(`Funcionalidade: ${nome}`, corpo);
}

export function cenario(nome, passos, detalhes = {}) {
  test(`Cenário: ${nome}`, detalhes, async ({ page, context, legenda, leitor, narrador, baseURL }, testInfo) => {
    const nomeFuncionalidade =
      testInfo.titlePath.find((t) => t.startsWith("Funcionalidade: "))?.replace("Funcionalidade: ", "") ?? "";

    const contexto = { page, context, legenda, leitor, narrador, baseURL, testInfo, mundo: {} };

    // A legenda só aparece depois da primeira navegação — até lá a página está em branco.
    await legenda.iniciar(nomeFuncionalidade, nome, passos);
    await narrador.narrar(`Cenário: ${nome}`);

    let sucesso = false;
    try {
      for (const [i, p] of passos.entries()) {
        await test.step(`${p.palavra} ${p.texto}`, async () => {
          await legenda.passo(i, "executando");
          await narrador.narrar(`${p.palavra} ${p.texto}`);
          try {
            await p.fn(contexto);
          } catch (erro) {
            const mensagem = String(erro.message || erro).split("\n").slice(0, 4).join("\n");
            await legenda.passo(i, "falhou", mensagem);
            throw erro;
          }
          await legenda.passo(i, "ok");
          if (PASSO_MS) await page.waitForTimeout(PASSO_MS);
        });
      }
      sucesso = true;
    } finally {
      await legenda.concluir(sucesso);
      await narrador.narrar(sucesso ? "Cenário aprovado." : "Cenário reprovado.");
      // Segura o quadro final para o resultado aparecer no vídeo.
      await page.waitForTimeout(sucesso ? 800 : 2500).catch(() => {});
    }
  });
}

// Espera as transições e animações em andamento terminarem — numa troca de
// tema, por exemplo, as cores deslizam por 0,2s, e medir contraste no meio do
// caminho reprovaria uma cor que, parada, passa.
export async function esperarTransicoes(page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
}

// Abre uma tela do site e espera o título principal.
//
// `tema` vale só na primeira carga: depois de um reload, vale o que a pessoa
// escolheu (é isso que o cenário de "tema salvo" confere).
export async function abrirPagina(page, caminho = "/", { tema } = {}) {
  if (tema) {
    await page.addInitScript((t) => {
      try {
        if (!sessionStorage.getItem("qa_tema_inicial")) {
          localStorage.setItem("qag_theme", t);
          sessionStorage.setItem("qa_tema_inicial", "1");
        }
      } catch {
        /* ignora */
      }
    }, tema);
  }
  await page.goto(caminho);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // As fontes vêm do Google Fonts. Se a troca da fonte reserva pela definitiva
  // acontecer no meio de uma medição, o título muda de altura, a página toda
  // se mexe e a ordem visual parece quebrada sem estar.
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

export { expect };
