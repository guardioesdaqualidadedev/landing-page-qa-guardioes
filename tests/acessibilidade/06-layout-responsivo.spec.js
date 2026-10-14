// Layout em várias larguras de tela. 320px equivale a um desktop de 1280px com
// zoom de 400% — é o que a WCAG 1.4.10 (Refluxo) pede para funcionar sem
// rolagem horizontal. Cada largura anexa uma captura da página inteira.
import { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } from "./suporte/bdd.js";

const LARGURAS = [
  { nome: "celular pequeno (320px, zoom 400%)", width: 320, height: 720 },
  { nome: "celular (390px)", width: 390, height: 844 },
  { nome: "tablet (768px)", width: 768, height: 1024 },
  { nome: "notebook (1280px)", width: 1280, height: 800 },
  { nome: "monitor largo (1920px)", width: 1920, height: 1080 },
];

// Elementos com conteúdo que passam da borda direita da tela. Ignora o que está
// dentro de um contêiner com rolagem própria (tabelas no celular) e o que é
// cortado de propósito por um contêiner com overflow hidden (fundos decorativos).
async function elementosVazando(page) {
  return page.evaluate(() => {
    const largura = document.documentElement.clientWidth;
    const contido = (e) => {
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
        if (ox === "hidden" && p.getBoundingClientRect().right <= largura + 1) return true;
      }
      return false;
    };
    return [...document.querySelectorAll("header *, main *, footer *")]
      .filter((e) => !e.closest("#qa-legenda") && !e.ownerSVGElement && e.getClientRects().length)
      .filter((e) => e.getBoundingClientRect().right > largura + 1 && !contido(e))
      .map((e) => `${e.tagName.toLowerCase()}${typeof e.className === "string" && e.className ? "." + e.className.split(" ")[0] : ""} (direita em ${Math.round(e.getBoundingClientRect().right)}px)`)
      .slice(0, 10);
  });
}

// Pares de elementos que se sobrepõem.
async function sobreposicoes(page, seletor) {
  return page.locator(seletor).evaluateAll((els) => {
    const r = els.map((e) => ({ nome: e.textContent.trim().slice(0, 30), b: e.getBoundingClientRect() }));
    const pares = [];
    for (let i = 0; i < r.length; i++) {
      for (let j = i + 1; j < r.length; j++) {
        const [a, b] = [r[i].b, r[j].b];
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
          pares.push(`${r[i].nome} × ${r[j].nome}`);
        }
      }
    }
    return pares;
  });
}

const semRolagemHorizontal = async (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

funcionalidade("Layout responsivo", () => {
  for (const tela of LARGURAS) {
    cenario(`A página inicial se ajusta à tela de ${tela.nome}`, [
      Dado(`que abro a página inicial numa tela de ${tela.width}×${tela.height}`, async ({ page }) => {
        await page.setViewportSize({ width: tela.width, height: tela.height });
        await abrirPagina(page);
      }),
      Entao("não existe rolagem horizontal", async ({ page }) => {
        expect(await semRolagemHorizontal(page)).toBe(true);
      }),
      E("nenhum conteúdo vaza pela borda direita", async ({ page }) => {
        expect(await elementosVazando(page)).toEqual([]);
      }),
      E("os botões do topo não se sobrepõem", async ({ page }) => {
        expect(await sobreposicoes(page, '[data-testid="hero"] .qa-btn')).toEqual([]);
      }),
      E("os cartões da governança não se sobrepõem", async ({ page }) => {
        expect(await sobreposicoes(page, '[data-testid="admins"] > li')).toEqual([]);
      }),
      E("anexo uma captura da página inteira ao relatório", async ({ page, testInfo }) => {
        await testInfo.attach(`página inteira — ${tela.width}px.png`, {
          body: await page.screenshot({ fullPage: true, style: "#qa-legenda { display: none !important; }" }),
          contentType: "image/png",
        });
      }),
    ]);
  }

  cenario("O formulário do Playground cabe em 320 px, com as opções de prioridade sem se sobrepor", [
    Dado("que abro o Playground numa tela de 320 px (zoom de 400%)", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await abrirPagina(page, "/playground");
    }),
    Entao("não existe rolagem horizontal e nada vaza pela direita", async ({ page }) => {
      expect(await semRolagemHorizontal(page)).toBe(true);
      expect(await elementosVazando(page)).toEqual([]);
    }),
    E("as três opções de prioridade e a instrução das setas aparecem sem se sobrepor", async ({ page }) => {
      await expect(page.getByTestId("dica-prioridade")).toBeVisible();
      expect(await sobreposicoes(page, '[data-testid="grupo-prioridade"] label')).toEqual([]);
    }),
    E("anexo uma captura do formulário", async ({ page, testInfo }) => {
      await testInfo.attach("formulário — 320px.png", {
        body: await page.getByTestId("formulario-defeito").screenshot({ style: "#qa-legenda { display: none !important; }" }),
        contentType: "image/png",
      });
    }),
  ]);

  for (const { onde, caminho, preparar, area, rotulo } of [
    {
      onde: "a tabela de defeitos",
      caminho: "/playground",
      preparar: (page) => page.getByTestId("aba-tabela").click(),
      area: '[data-testid="area-tabela"] .qa-tabela-scroll',
      rotulo: "Tabela de defeitos — use as setas para ver as outras colunas",
    },
    {
      onde: "a tabela de roteamento da página inicial",
      caminho: "/",
      preparar: async () => {},
      area: "#roteamento .qa-tabela-scroll",
      rotulo: "Tabela de roteamento — use as setas para ver as outras colunas",
    },
  ]) {
    cenario(`No celular, ${onde} rola dentro da própria área — e pelo teclado também`, [
      Dado(`que abro ${onde} numa tela de 320 px`, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 720 });
        await abrirPagina(page, caminho);
        await preparar(page);
      }),
      Entao("a página não rola de lado: só a tabela rola", async ({ page }) => {
        expect(await semRolagemHorizontal(page)).toBe(true);
        const rola = await page.locator(area).evaluate((e) => e.scrollWidth > e.clientWidth);
        expect(rola).toBe(true);
      }),
      E("a área da tabela é uma região com nome e entra no Tab (WCAG 2.1.1)", async ({ page }) => {
        const regiao = page.locator(area);
        await expect(regiao).toHaveAttribute("role", "region");
        await expect(regiao).toHaveAttribute("tabindex", "0");
        await expect(regiao).toHaveAccessibleName(rotulo);
      }),
      Quando("ponho o foco na área e aperto a seta para a direita", async ({ page, legenda }) => {
        await page.locator(area).focus();
        await legenda.foco(`region: ${rotulo}`);
        for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
      }),
      Entao("a tabela rola para mostrar as outras colunas", async ({ page }) => {
        await expect.poll(() => page.locator(area).evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
      }),
    ]);
  }

  cenario("Na tela larga, as tabelas cabem inteiras e não viram parada do Tab", [
    Dado("que abro a página inicial numa tela de 1280 px", async ({ page }) => {
      await abrirPagina(page);
    }),
    Entao("a tabela de roteamento não rola e não recebe foco", async ({ page }) => {
      const area = page.locator("#roteamento .qa-tabela-scroll");
      await expect(area).toHaveAttribute("data-rolavel", "nao");
      await expect(area).not.toHaveAttribute("tabindex", /.*/);
    }),
  ]);

  for (const { tela, caminho } of [{ tela: "página inicial", caminho: "/" }, { tela: "Playground", caminho: "/playground" }]) {
    cenario(`Na ${tela}, com o espaçamento de texto aumentado, nada é cortado (WCAG 1.4.12)`, [
      Dado(`que abro a ${tela} numa tela de celular`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await abrirPagina(page, caminho);
      }),
      Quando("aplico o espaçamento da WCAG: linha 1,5, letras 0,12em, palavras 0,16em, parágrafos 2em", async ({ page }) => {
        await page.addStyleTag({
          content: `main *, footer * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
                    main p, footer p { margin-bottom: 2em !important; }`,
        });
      }),
      Entao("nenhum botão, aba ou link em forma de botão corta o próprio texto", async ({ page }) => {
        const cortados = await page.evaluate(() =>
          [...document.querySelectorAll('main button, main a.qa-btn, main [role="tab"]')]
            .filter((e) => e.getClientRects().length)
            .filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)
            .map((e) => `${(e.getAttribute("aria-label") || e.textContent).trim().slice(0, 40)} (${e.scrollWidth}×${e.scrollHeight} em ${e.clientWidth}×${e.clientHeight})`)
        );
        expect(cortados).toEqual([]);
      }),
      E("continua sem rolagem horizontal", async ({ page }) => {
        expect(await semRolagemHorizontal(page)).toBe(true);
      }),
    ]);
  }
});
