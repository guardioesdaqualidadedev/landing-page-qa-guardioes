// Análise automática das regras WCAG 2.2 níveis A e AA com o axe-core — o
// mesmo motor de extensões como o axe DevTools e do Lighthouse.
//
// O axe pega o que dá para medir: contraste, nome de controle, estrutura de
// lista e de tabela, atributos ARIA inválidos. Não diz se a ORDEM do foco faz
// sentido nem se o leitor de tela anuncia o que deve — isso fica com os
// cenários de teclado e de NVDA simulado.
import AxeBuilder from "@axe-core/playwright";
import { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina, esperarTransicoes } from "./suporte/bdd.js";

const REGRAS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function analisar({ page, testInfo }, nome, incluir) {
  await esperarTransicoes(page);
  let analise = new AxeBuilder({ page })
    .withTags(REGRAS_WCAG)
    .exclude("#qa-legenda")
    // Modo legado: roda tudo nesta página (sem abrir uma aba extra no vídeo).
    .setLegacyMode(true);
  if (incluir) analise = analise.include(incluir);
  const resultado = await analise.analyze();
  await testInfo.attach(`axe — ${nome}.json`, {
    body: JSON.stringify(resultado.violations, null, 2),
    contentType: "application/json",
  });
  return resultado.violations;
}

// Troca o tema pelo teclado: com o mouse, o ponteiro fica parado sobre o botão
// e o estado de hover (outra cor de fundo) entraria na medição.
const trocarTema = async (page, tema) => {
  await page.getByTestId("theme-toggle").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", tema);
};

// Mensagem de falha legível: regra, impacto, onde está e, no contraste, a medida.
function resumir(violacoes) {
  return violacoes.flatMap((v) =>
    v.nodes.slice(0, 3).map((n) => {
      const d = n.any?.[0]?.data;
      const medida = d?.contrastRatio ? ` (${d.contrastRatio}:1, ${d.fgColor} sobre ${d.bgColor})` : "";
      return `[${v.impact}] ${v.id}: ${v.help} → ${n.target.join(" ")}${medida}`;
    })
  );
}

funcionalidade("Conformidade com a WCAG 2.2 AA (axe-core)", () => {
  for (const tema of ["dark", "light"]) {
    const nomeTema = tema === "dark" ? "escuro" : "claro";

    cenario(`Página inicial sem violações no tema ${nomeTema}`, [
      Dado(`que abro a página inicial no tema ${nomeTema}`, async ({ page }) => {
        await abrirPagina(page, "/", { tema });
      }),
      Quando("analiso a página inteira com o axe-core nas regras WCAG 2.2 A e AA", async (ctx) => {
        ctx.mundo.violacoes = await analisar(ctx, `início — tema ${nomeTema}`);
      }),
      Entao("nenhuma violação é encontrada", async ({ mundo }) => {
        expect(resumir(mundo.violacoes)).toEqual([]);
      }),
    ]);
  }

  cenario("Manifesto sem violações nos dois temas", [
    Dado("que abro o Manifesto no tema escuro", async ({ page }) => {
      await abrirPagina(page, "/manifesto", { tema: "dark" });
    }),
    Quando("analiso a página com o axe-core", async (ctx) => {
      ctx.mundo.escuro = await analisar(ctx, "manifesto — tema escuro");
    }),
    E("troco para o tema claro e analiso de novo", async (ctx) => {
      await trocarTema(ctx.page, "light");
      ctx.mundo.claro = await analisar(ctx, "manifesto — tema claro");
    }),
    Entao("nenhuma violação é encontrada em nenhum dos temas", async ({ mundo }) => {
      expect(resumir(mundo.escuro)).toEqual([]);
      expect(resumir(mundo.claro)).toEqual([]);
    }),
  ]);

  cenario("Cada aba do Playground sem violações", [
    Dado("que abro o Playground", async ({ page }) => {
      await abrirPagina(page, "/playground");
    }),
    Quando("abro cada uma das quatro abas e analiso a tela", async (ctx) => {
      ctx.mundo.porAba = {};
      for (const aba of ["registrar", "tabela", "cenarios", "certificado"]) {
        await ctx.page.getByTestId(`aba-${aba}`).click();
        // Na trilha do certificado, os blocos dobráveis são abertos para o
        // axe enxergar o conteúdo de dentro deles também.
        for (const bloco of await ctx.page.locator("details").all()) await bloco.evaluate((d) => (d.open = true));
        ctx.mundo.porAba[aba] = resumir(await analisar(ctx, `playground — aba ${aba}`));
      }
    }),
    Entao("nenhuma aba tem violações", async ({ mundo }) => {
      expect(mundo.porAba).toEqual({ registrar: [], tabela: [], cenarios: [], certificado: [] });
    }),
  ]);

  cenario("Formulário com erros de validação sem violações", [
    Dado("que abro o Playground", async ({ page }) => {
      await abrirPagina(page, "/playground");
    }),
    Quando("envio o formulário vazio", async ({ page }) => {
      await page.getByTestId("btn-registrar").click();
      await expect(page.getByTestId("resumo-erros")).toBeVisible();
    }),
    E("analiso o formulário com as mensagens de erro na tela", async (ctx) => {
      ctx.mundo.violacoes = await analisar(ctx, "formulário com erros", '[data-testid="formulario-defeito"]');
    }),
    Entao("nenhuma violação é encontrada", async ({ mundo }) => {
      expect(resumir(mundo.violacoes)).toEqual([]);
    }),
  ]);

  cenario("Confirmação de exclusão sem violações nos dois temas", [
    Dado("que abro a tabela de defeitos", async ({ page }) => {
      await abrirPagina(page, "/playground", { tema: "dark" });
      await page.getByTestId("aba-tabela").click();
    }),
    Quando('peço para excluir o BUG-1001 e a confirmação aparece', async ({ page }) => {
      await page.getByTestId("excluir-BUG-1001").click();
      await expect(page.getByTestId("confirmar-exclusao-BUG-1001")).toBeVisible();
    }),
    E("analiso a tabela no tema escuro e depois no claro", async (ctx) => {
      ctx.mundo.escuro = await analisar(ctx, "confirmação — tema escuro", '[data-testid="area-tabela"]');
      await trocarTema(ctx.page, "light");
      ctx.mundo.claro = await analisar(ctx, "confirmação — tema claro", '[data-testid="area-tabela"]');
    }),
    Entao('o botão "Confirmar exclusão" tem contraste nos dois temas', async ({ mundo }) => {
      expect(resumir(mundo.escuro)).toEqual([]);
      expect(resumir(mundo.claro)).toEqual([]);
    }),
  ]);

  cenario("No celular, com o menu aberto, sem violações", [
    Dado("que abro a página inicial numa tela de celular", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await abrirPagina(page);
    }),
    Quando("abro o menu de navegação", async ({ page }) => {
      await page.getByTestId("menu-toggle").click();
      await expect(page.getByTestId("menu-mobile")).toBeVisible();
    }),
    E("analiso a página com o axe-core", async (ctx) => {
      ctx.mundo.violacoes = await analisar(ctx, "celular — menu aberto");
    }),
    Entao("nenhuma violação é encontrada", async ({ mundo }) => {
      expect(resumir(mundo.violacoes)).toEqual([]);
    }),
  ]);

  cenario("Página não encontrada sem violações", [
    Dado("que abro um endereço que não existe", async ({ page }) => {
      await abrirPagina(page, "/endereco-que-nao-existe");
    }),
    Quando("analiso a página com o axe-core", async (ctx) => {
      ctx.mundo.violacoes = await analisar(ctx, "página 404");
    }),
    Entao("nenhuma violação é encontrada", async ({ mundo }) => {
      expect(resumir(mundo.violacoes)).toEqual([]);
    }),
  ]);
});
