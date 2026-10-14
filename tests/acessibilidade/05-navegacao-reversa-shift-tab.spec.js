// Navegação reversa com Shift+Tab em cada tela e nas experiências em que o
// foco muda de lugar sozinho (atalho de pular, troca de tema, confirmação de
// exclusão). Shift+Tab precisa ir para o elemento ANTERIOR na página, e um Tab
// em seguida precisa voltar para onde estava.
import { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } from "./suporte/bdd.js";
import { focoAtual, navegar, apertar } from "./suporte/teclado.js";

const PRIMEIRO = /^a: Pular para o conteúdo$/;
const ULTIMO = /^a: Certificado do playground$/;

// O grupo de rádio é UMA parada nos dois sentidos — mas sem opção marcada, o
// navegador entra pela primeira opção no Tab e pela última no Shift+Tab. Para
// comparar os caminhos, o grupo vira uma parada só, com o nome do grupo.
const comoParada = (f) => f.replace(/^radio: (.+?) › .*$/, "grupo de opções: $1");

funcionalidade("Navegação reversa com Shift+Tab", () => {
  for (const { tela, nome, caminho } of [
    { tela: "Na página inicial", nome: "a página inicial", caminho: "/" },
    { tela: "No Manifesto", nome: "o Manifesto", caminho: "/manifesto" },
    { tela: "No Playground", nome: "o Playground", caminho: "/playground" },
  ]) {
    cenario(`${tela}, o Shift+Tab percorre a tela inteira na ordem exata inversa do Tab`, [
      Dado(`que abro ${nome}`, async ({ page }) => {
        await abrirPagina(page, caminho);
      }),
      Quando("percorro a tela inteira com Tab, do topo até o último link do rodapé", async ({ page, legenda, mundo }) => {
        mundo.ida = await navegar(page, legenda, "Tab", (f) => ULTIMO.test(f));
        expect(mundo.ida.at(-1)).toMatch(ULTIMO);
      }),
      E("volto com Shift+Tab até o primeiro elemento da página", async ({ page, legenda, mundo }) => {
        mundo.volta = await navegar(page, legenda, "Shift+Tab", (f) => PRIMEIRO.test(f));
      }),
      Entao("a volta passa pelos mesmos elementos, na ordem inversa, sem pular nenhum", async ({ mundo, testInfo }) => {
        await testInfo.attach("ordem do Tab e do Shift+Tab.txt", {
          body: `TAB (${mundo.ida.length} paradas)\n${mundo.ida.join("\n")}\n\nSHIFT+TAB (${mundo.volta.length} paradas)\n${mundo.volta.join("\n")}`,
          contentType: "text/plain",
        });
        // A volta começa no penúltimo (o último é de onde ela partiu).
        expect(mundo.volta.map(comoParada)).toEqual(mundo.ida.slice(0, -1).reverse().map(comoParada));
      }),
      E("em nenhum momento o foco escapa para o topo da página no meio do caminho", async ({ mundo }) => {
        expect(mundo.volta.slice(0, -1).filter((f) => PRIMEIRO.test(f))).toEqual([]);
      }),
    ]);
  }

  cenario('Do título "Quem cuida de quê", o Shift+Tab volta uma seção por vez até o botão do Playground', [
    Dado('que abro a página inicial e estou no título "Quem cuida de quê"', async ({ page, legenda }) => {
      await abrirPagina(page);
      await page.locator("#governanca-titulo").focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando('aperto Shift+Tab até o botão "Abrir o Playground QA"', async ({ page, legenda, mundo }) => {
      mundo.volta = await navegar(page, legenda, "Shift+Tab", (f) => /Abrir o Playground QA/.test(f), 12);
    }),
    Entao("o foco passa pelo título de cada seção anterior, de baixo para cima", async ({ mundo }) => {
      expect(mundo.volta).toEqual([
        "h2: Dez regras que cabem em uma tela",
        "h2: O que você busca e o que a gente entrega",
        "h2: A tabela que resolve a dúvida",
        "h2: Duas plataformas, papéis diferentes",
        "h2: Seis objetivos, cada um com o canal que o sustenta",
        "h2: Aprender com prática real, sem hierarquia",
        "a: Abrir o Playground QA",
      ]);
    }),
  ]);

  cenario("Na prioridade, o Shift+Tab volta para a opção marcada", [
    Dado('que abro o Playground e marco a prioridade "P2"', async ({ page }) => {
      await abrirPagina(page, "/playground");
      await page.getByTestId("radio-prioridade-P2").check();
    }),
    E('estou no campo "Passos para reproduzir"', async ({ page, legenda }) => {
      await page.getByTestId("input-passos").focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando("aperto Shift+Tab", async ({ page, legenda, mundo }) => {
      mundo.foco = await apertar(page, legenda, "Shift+Tab");
    }),
    Entao('o foco volta para "P2 próxima sprint", a opção marcada', async ({ mundo }) => {
      expect(mundo.foco).toBe("radio: Prioridade › P2 próxima sprint");
    }),
    E('mais um Shift+Tab sai do grupo e vai para "Ocorrências"', async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Shift+Tab")).toBe("input: Ocorrências");
    }),
  ]);

  cenario("Depois de fechar a confirmação de exclusão com Esc, Tab e Shift+Tab seguem da mesma linha", [
    Dado("que abro a tabela de defeitos e peço para excluir o BUG-1001", async ({ page }) => {
      await abrirPagina(page, "/playground");
      await page.getByTestId("aba-tabela").click();
      await page.getByTestId("excluir-BUG-1001").focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("confirmacao-BUG-1001")).toBeVisible();
    }),
    Quando("aperto Esc", async ({ page, legenda, mundo }) => {
      mundo.foco = await apertar(page, legenda, "Escape");
    }),
    Entao('a confirmação fecha e o foco fica no "Excluir" da mesma linha', async ({ page, mundo }) => {
      expect(mundo.foco).toBe("button: Excluir BUG-1001");
      await expect(page.getByTestId("confirmacao-BUG-1001")).toHaveCount(0);
    }),
    E("o Shift+Tab vai para o status do BUG-1001 e o Tab volta para o Excluir", async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Shift+Tab")).toBe("select: Status de BUG-1001");
      expect(await apertar(page, legenda, "Tab")).toBe("button: Excluir BUG-1001");
    }),
    E("mais um Tab segue para a linha de baixo", async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Tab")).toBe("select: Status de BUG-1002");
    }),
  ]);

  cenario('Depois do atalho "Pular para o conteúdo", o Shift+Tab volta para o fim do cabeçalho', [
    Dado("que abro a página inicial", async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando("ativo o atalho com Tab e Enter", async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Tab")).toMatch(PRIMEIRO);
      await page.keyboard.press("Enter");
    }),
    Entao("o foco vai para o título principal da página", async ({ page }) => {
      await expect(page.locator("#hero-titulo")).toBeFocused();
    }),
    E("o Shift+Tab volta para o último controle do cabeçalho, o botão de tema", async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Shift+Tab")).toBe("button: Mudar para o tema claro");
    }),
  ]);

  cenario("Depois de trocar o tema, Tab e Shift+Tab continuam do botão de tema", [
    Dado("que abro a página inicial no tema escuro", async ({ page }) => {
      await abrirPagina(page, "/", { tema: "dark" });
    }),
    Quando("estou no botão de tema e aperto Enter", async ({ page, legenda }) => {
      await page.getByTestId("theme-toggle").focus();
      await legenda.foco(await focoAtual(page));
      await page.keyboard.press("Enter");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    }),
    Entao("o foco continua no botão, agora oferecendo o tema escuro", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Mudar para o tema escuro" })).toBeFocused();
    }),
    Quando("aperto Tab e depois Shift+Tab", async ({ page, legenda, mundo }) => {
      mundo.ida = await apertar(page, legenda, "Tab");
      mundo.volta = await apertar(page, legenda, "Shift+Tab");
    }),
    Entao("o Tab vai para o primeiro botão do conteúdo e o Shift+Tab volta para o botão de tema", async ({ mundo }) => {
      expect(mundo.ida).toBe("a: Entrar no Discord (abre em nova aba)");
      expect(mundo.volta).toBe("button: Mudar para o tema escuro");
    }),
  ]);
});
