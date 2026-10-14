// A árvore de acessibilidade é o que o navegador entrega ao NVDA, JAWS e
// VoiceOver: papel (botão, link, título...), nome e estado de cada elemento.
// Aqui ela é lida direto do Chromium — pelo protocolo de depuração (CDP) e
// pelos seletores por papel do Playwright, que consultam a mesma árvore.
import { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } from "./suporte/bdd.js";

// Árvore completa do Chromium, só com os nós que o leitor de tela enxerga.
async function lerArvore(page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  await cdp.detach();
  return nodes
    .filter((n) => !n.ignored)
    .map((n) => ({ papel: n.role?.value, nome: (n.name?.value ?? "").trim() }))
    .filter((n) => n.papel && !["none", "generic", "InlineTextBox", "StaticText", "LineBreak"].includes(n.papel));
}

const INTERATIVOS = ["button", "link", "tab", "textbox", "searchbox", "checkbox", "radio", "combobox", "spinbutton", "menuitem", "switch", "tabpanel"];

// As telas do site, cada aba do Playground contando como uma tela.
const TELAS = [
  { nome: "início", caminho: "/" },
  { nome: "manifesto", caminho: "/manifesto" },
  { nome: "playground — registrar", caminho: "/playground" },
  { nome: "playground — tabela", caminho: "/playground", aba: "tabela" },
  { nome: "playground — cenários", caminho: "/playground", aba: "cenarios" },
  { nome: "playground — certificado", caminho: "/playground", aba: "certificado" },
  { nome: "página 404", caminho: "/endereco-que-nao-existe" },
];

async function abrirTela(page, tela) {
  await abrirPagina(page, tela.caminho);
  if (tela.aba) await page.getByTestId(`aba-${tela.aba}`).click();
}

const SECOES_DA_HOME = [
  "Quem cuida da qualidade não precisa fazer isso sozinho",
  "A comunidade em números",
  "Aprender com prática real, sem hierarquia",
  "Seis objetivos, cada um com o canal que o sustenta",
  "Duas plataformas, papéis diferentes",
  "A tabela que resolve a dúvida",
  "O que você busca e o que a gente entrega",
  "Dez regras que cabem em uma tela",
  "Quem cuida de quê",
  "O programa oficial de quem testa software",
  "Chegou até aqui? Então já é dos nossos",
  "Quem caminha junto com a comunidade",
];

funcionalidade("Árvore de acessibilidade (o que o NVDA recebe do navegador)", () => {
  cenario("A página inicial tem as regiões que o NVDA lista com a tecla D", [
    Dado("que abro a página inicial", async ({ page }) => {
      await abrirPagina(page);
    }),
    Entao("existem o cabeçalho, a navegação principal, o conteúdo principal e o rodapé", async ({ page }) => {
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Navegação principal" })).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Navegar" })).toHaveCount(1);
    }),
    E("cada seção é uma região com o nome do próprio título", async ({ page }) => {
      for (const nome of SECOES_DA_HOME) {
        await expect(page.getByRole("region", { name: nome, exact: true }), `região "${nome}"`).toHaveCount(1);
      }
      await expect(page.getByRole("region", { name: "Parceiros da comunidade" })).toHaveAttribute("aria-roledescription", "carrossel");
    }),
  ]);

  cenario("No Playground, o formulário e as regras de validação são regiões com nome", [
    Dado("que abro o Playground", async ({ page }) => {
      await abrirPagina(page, "/playground");
    }),
    Entao('o formulário aparece como região "Registrar defeito"', async ({ page }) => {
      await expect(page.getByRole("form", { name: "Registrar defeito" })).toHaveCount(1);
    }),
    E('as regras ficam numa região complementar "Regras de validação"', async ({ page }) => {
      await expect(page.getByRole("complementary", { name: "Regras de validação" })).toHaveCount(1);
    }),
    E('as abas formam uma lista de abas "Áreas do playground", com quatro abas', async ({ page }) => {
      const abas = page.getByRole("tablist", { name: "Áreas do playground" });
      await expect(abas.getByRole("tab")).toHaveText(["Registrar defeito", "Tabela de defeitos", "Cenários de teste", "Certificado"]);
      // Só abas dentro da lista: o botão de restaurar fica fora dela.
      await expect(abas.getByRole("button")).toHaveCount(0);
    }),
  ]);

  cenario("A hierarquia de títulos não pula níveis em nenhuma tela", [
    Dado("que vou abrir cada tela do site, e cada aba do Playground", async ({ mundo }) => {
      mundo.porTela = {};
    }),
    Quando("leio os títulos de cada tela na árvore de acessibilidade", async ({ page, mundo, testInfo }) => {
      const estrutura = [];
      for (const tela of TELAS) {
        await abrirTela(page, tela);
        const titulos = await page.getByRole("heading").evaluateAll((els) =>
          els.map((e) => ({ nivel: Number(e.tagName.slice(1)), texto: e.textContent.replace(/\s+/g, " ").trim() }))
        );
        mundo.porTela[tela.nome] = titulos;
        estrutura.push(`## ${tela.nome}`, ...titulos.map((t) => `${"  ".repeat(t.nivel - 1)}h${t.nivel} ${t.texto}`), "");
      }
      await testInfo.attach("estrutura de títulos.txt", { body: estrutura.join("\n"), contentType: "text/plain" });
    }),
    Entao("cada tela tem exatamente um título de nível 1, e ele vem primeiro", async ({ mundo }) => {
      for (const [tela, titulos] of Object.entries(mundo.porTela)) {
        expect(titulos.filter((t) => t.nivel === 1), tela).toHaveLength(1);
        expect(titulos[0].nivel, tela).toBe(1);
      }
    }),
    E("nenhum título desce mais de um nível em relação ao anterior", async ({ mundo }) => {
      const saltos = Object.entries(mundo.porTela).flatMap(([tela, t]) =>
        t.map((h, i) => (i && h.nivel > t[i - 1].nivel + 1 ? `${tela}: h${t[i - 1].nivel} → h${h.nivel} "${h.texto}"` : null)).filter(Boolean)
      );
      expect(saltos).toEqual([]);
    }),
  ]);

  cenario("Todo controle interativo tem nome acessível, em todas as telas", [
    Quando("leio a árvore de acessibilidade completa do Chromium em cada tela", async ({ page, mundo, testInfo }) => {
      mundo.semNome = [];
      for (const tela of TELAS) {
        await abrirTela(page, tela);
        const arvore = await lerArvore(page);
        mundo.semNome.push(
          ...arvore
            .filter((n) => (INTERATIVOS.includes(n.papel) || ["image", "img"].includes(n.papel)) && !n.nome)
            .map((n) => `${tela.nome}: ${n.papel} sem nome`)
        );
        await testInfo.attach(`árvore — ${tela.nome}.txt`, {
          body: arvore.map((n) => `${n.papel}: ${n.nome}`).join("\n"),
          contentType: "text/plain",
        });
      }
    }),
    Entao("nenhum botão, link, aba, campo ou imagem está sem nome", async ({ mundo }) => {
      expect(mundo.semNome).toEqual([]);
    }),
  ]);

  cenario("Todo link que abre em nova aba avisa antes", [
    Quando('procuro os links com target="_blank" em cada tela', async ({ page, mundo }) => {
      mundo.semAviso = [];
      mundo.total = 0;
      for (const tela of TELAS) {
        await abrirTela(page, tela);
        for (const link of await page.locator('a[target="_blank"]').all()) {
          if (!(await link.isVisible())) continue;
          mundo.total++;
          const nome = await link.evaluate((a) => a.getAttribute("aria-label") || a.textContent.replace(/\s+/g, " ").trim());
          if (!/\(abre em nova aba\)$/.test(nome)) mundo.semAviso.push(`${tela.nome}: "${nome}"`);
        }
      }
    }),
    Entao('o nome acessível de cada um termina em "(abre em nova aba)"', async ({ mundo }) => {
      expect(mundo.total).toBeGreaterThan(20);
      expect(mundo.semAviso).toEqual([]);
    }),
    E('os links principais são anunciados com o aviso, sem setas no nome', async ({ page }) => {
      await abrirPagina(page);
      await expect(page.getByTestId("cta-discord")).toHaveAccessibleName("Entrar no Discord (abre em nova aba)");
      await expect(page.getByTestId("admin-linkedin-gabriel")).toHaveAccessibleName("LinkedIn de Gabriel (abre em nova aba)");
    }),
  ]);

  cenario("O grupo Prioridade é um agrupamento de três botões de opção, com a instrução das setas", [
    Dado("que abro o Playground", async ({ page }) => {
      await abrirPagina(page, "/playground");
    }),
    Entao('existe um agrupamento chamado "Prioridade" com três botões de opção', async ({ page, mundo }) => {
      mundo.grupo = page.getByRole("group", { name: "Prioridade" });
      await expect(mundo.grupo).toHaveCount(1);
      await expect(mundo.grupo.getByRole("radio")).toHaveCount(3);
    }),
    E('as opções se chamam "P1 imediata", "P2 próxima sprint" e "P3 backlog" — sem o "·" decorativo', async ({ mundo }) => {
      const opcoes = mundo.grupo.getByRole("radio");
      for (const [i, nome] of ["P1 imediata", "P2 próxima sprint", "P3 backlog"].entries()) {
        await expect(opcoes.nth(i)).toHaveAccessibleName(nome);
      }
    }),
    E("cada opção tem como descrição a instrução de usar as setas", async ({ mundo }) => {
      for (const opcao of await mundo.grupo.getByRole("radio").all()) {
        await expect(opcao).toHaveAccessibleDescription(
          "Use as setas do teclado para escolher a prioridade. O Tab segue para o próximo campo."
        );
      }
    }),
    E("a mesma instrução aparece escrita na tela, para quem enxerga", async ({ page }) => {
      await expect(page.getByTestId("dica-prioridade")).toBeVisible();
    }),
    Quando("envio o formulário sem escolher a prioridade", async ({ page }) => {
      await page.getByTestId("btn-registrar").click();
    }),
    Entao("a mensagem de erro passa a vir antes da instrução, na descrição de cada opção", async ({ mundo }) => {
      await expect(mundo.grupo.getByRole("radio").first()).toHaveAccessibleDescription(/^Selecione a prioridade\. Use as setas/);
    }),
  ]);

  cenario("Cada tela tem um título próprio na aba do navegador", [
    Dado("que abro a página inicial", async ({ page }) => {
      await abrirPagina(page);
    }),
    Entao("o título da aba é o da comunidade", async ({ page }) => {
      await expect(page).toHaveTitle("QA's Guardiões do Software — Comunidade de Qualidade de Software");
    }),
    Quando("vou para o Manifesto pelo menu", async ({ page }) => {
      await page.getByTestId("nav-manifesto").click();
    }),
    Entao("o título da aba passa a ser o do Manifesto", async ({ page }) => {
      await expect(page).toHaveTitle("Manifesto Ágil de Testes — QA's Guardiões do Software");
    }),
    Quando("vou para o Playground pelo menu", async ({ page }) => {
      await page.getByTestId("nav-playground").click();
    }),
    Entao("o título da aba passa a ser o do Playground", async ({ page }) => {
      await expect(page).toHaveTitle("Playground QA — QA's Guardiões do Software");
    }),
    E("um endereço que não existe tem o próprio título", async ({ page }) => {
      await abrirPagina(page, "/endereco-que-nao-existe");
      await expect(page).toHaveTitle("Página não encontrada — QA's Guardiões do Software");
    }),
  ]);

  cenario("Setas e símbolos decorativos ficam fora da árvore", [
    Quando("leio a árvore de acessibilidade das telas com símbolos (▶ → ↗ ↺ ✕ ●)", async ({ page, mundo }) => {
      mundo.lidos = [];
      for (const tela of TELAS.filter((t) => ["início", "manifesto", "playground — registrar", "playground — tabela"].includes(t.nome))) {
        await abrirTela(page, tela);
        const arvore = await page.locator("body").ariaSnapshot();
        for (const linha of arvore.split("\n")) {
          if (/[▶▷→←↗↺✕×●◆▲▼]/.test(linha)) mundo.lidos.push(`${tela.nome}: ${linha.trim()}`);
        }
      }
    }),
    Entao("nenhum deles chega ao leitor de tela", async ({ mundo }) => {
      expect(mundo.lidos).toEqual([]);
    }),
  ]);

  cenario("A governança mostra a equipe de administração atual", [
    Dado("que abro a página inicial", async ({ page }) => {
      await abrirPagina(page);
    }),
    Entao('a região "Quem cuida de quê" lista quatro pessoas: Douglas, Camila, Gabriel e Patrícia', async ({ page, mundo }) => {
      mundo.secao = page.getByRole("region", { name: "Quem cuida de quê" });
      await expect(mundo.secao.getByTestId("admins").getByRole("listitem")).toHaveCount(4);
      await expect(mundo.secao.getByTestId("admins").getByRole("heading", { level: 3 })).toHaveText([
        "Douglas",
        "Camila",
        "Gabriel",
        "Patrícia",
      ]);
    }),
    E("a Amanda, afastada temporariamente, não aparece", async ({ mundo }) => {
      await expect(mundo.secao).not.toContainText("Amanda");
    }),
    E("o Gabriel cuida dos grupos do WhatsApp", async ({ page, mundo }) => {
      const cartao = mundo.secao.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Gabriel" }) });
      await expect(cartao).toContainText("Administração do WhatsApp");
      await expect(cartao).toContainText(
        "Grupos do WhatsApp: acolhimento de quem entra, moderação do dia a dia e roteamento das conversas para o canal certo"
      );
    }),
    E("o LinkedIn do Gabriel abre o perfil dele, avisando a nova aba", async ({ mundo }) => {
      const link = mundo.secao.getByRole("link", { name: "LinkedIn de Gabriel (abre em nova aba)" });
      await expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/gabriel-rocc%C3%A0-32a978421/");
    }),
  ]);

  cenario("O idioma da página é o português do Brasil", [
    Dado("que abro a página inicial", async ({ page }) => {
      await abrirPagina(page);
    }),
    Entao('o elemento <html> declara lang="pt-BR" (o NVDA escolhe a voz por ele)', async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    }),
  ]);
});
