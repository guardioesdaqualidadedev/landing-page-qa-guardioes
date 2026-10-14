// Navegação com leitor de tela (NVDA simulado) pelas três telas do site.
//
// Dois cenários reproduzem os defeitos relatados pelo Douglas em outubro/2026:
//   • "Do botão Abrir o Playground QA, o Tab apresenta cada seção" — antes, o
//     Tab saía do botão direto para os cartões da governança, pulando seis
//     seções inteiras da página;
//   • "Na prioridade, o Tab entra no grupo e as setas escolhem" — o grupo de
//     rádio é UMA parada do Tab (padrão do HTML e do WAI-ARIA); o que faltava
//     era a instrução, que agora o NVDA lê em cada opção.
//
// As asserções usam as falas originais do leitor virtual; a legenda e a voz
// mostram a versão em português.
import { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } from "./suporte/bdd.js";
import { VALORES } from "../../src/content/manifesto.js";

const TITULO_H1 = "heading, Quem cuida da qualidade não precisa fazer isso sozinho, level 1";
const DICA_PRIORIDADE = "Use as setas do teclado para escolher a prioridade. O Tab segue para o próximo campo.";

// Títulos de nível 2 da página inicial, na ordem — inclusive o do rodapé.
const SECOES_H2 = [
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
  "Navegar",
  "Participar",
  "Estudar",
];

const ligarNvda = (caminho = "/", nomeDaTela = "a página inicial") =>
  Dado(`que abro ${nomeDaTela} com o NVDA ligado`, async ({ page, leitor }) => {
    await abrirPagina(page, caminho);
    await leitor.ligar();
  });

// Repete um comando de navegação até o leitor parar de encontrar itens novos.
async function percorrer(leitor, comando, limite = 60) {
  const vistos = [];
  for (let i = 0; i < limite; i++) {
    const [frase] = await leitor.comando(comando);
    if (!frase || vistos.includes(frase)) break;
    vistos.push(frase);
  }
  return vistos;
}

// Põe o foco num elemento (como se a pessoa já estivesse nele) e colhe a fala.
async function focar(page, leitor, testid) {
  await page.getByTestId(testid).focus();
  return leitor.anunciar({ origem: "foco" });
}

funcionalidade("Navegação com leitor de tela (NVDA simulado)", () => {
  cenario("Ler o topo da página com a seta para baixo", [
    ligarNvda(),
    Quando("leio o topo com a seta para baixo até o título principal", async ({ leitor }) => {
      await leitor.lerAte(TITULO_H1);
    }),
    Entao('o primeiro link é o atalho "Pular para o conteúdo"', async ({ leitor }) => {
      expect(leitor.falasOriginais().find((f) => f.startsWith("link, "))).toBe("link, Pular para o conteúdo");
    }),
    E("a marca diz que leva à página inicial e o menu é uma navegação com nome", async ({ leitor }) => {
      expect(leitor.falasOriginais()).toContain("link, QA Guardiões — Qualidade de Software, página inicial, current page");
      expect(leitor.falasOriginais()).toContain("navigation, Navegação principal");
    }),
    E("os ícones das redes avisam que abrem em nova aba", async ({ leitor }) => {
      expect(leitor.falasOriginais()).toContain("link, Servidor no Discord (abre em nova aba)");
      expect(leitor.falasOriginais()).toContain("link, Comunidade no WhatsApp (abre em nova aba)");
    }),
    E("o botão de tema diz para qual tema ele muda", async ({ leitor }) => {
      expect(leitor.falasOriginais()).toContain("button, Mudar para o tema claro");
    }),
    Quando("continuo lendo até os botões do topo", async ({ leitor }) => {
      await leitor.lerAte("link, Abrir o Playground QA");
    }),
    Entao("os três botões são anunciados, e o do Discord avisa a nova aba", async ({ leitor }) => {
      const falas = leitor.falasOriginais();
      expect(falas).toContain("link, Entrar no Discord (abre em nova aba)");
      expect(falas).toContain("link, Ler o Manifesto");
      expect(falas).toContain("link, Abrir o Playground QA");
    }),
    E("nenhum símbolo decorativo (● → ▶) é lido", async ({ leitor }) => {
      expect(leitor.falasOriginais().filter((f) => /[●→▶]/.test(f))).toEqual([]);
    }),
  ]);

  cenario("Navegar pelos títulos com a tecla H", [
    ligarNvda(),
    Quando("percorro a página inteira com a tecla H", async ({ leitor, mundo }) => {
      mundo.titulos = await percorrer(leitor, "moveToNextHeading");
    }),
    Entao("o primeiro título é o principal, de nível 1", async ({ mundo }) => {
      expect(mundo.titulos[0]).toBe(TITULO_H1);
    }),
    E("as seções aparecem como títulos de nível 2, na ordem da página", async ({ mundo }) => {
      const nivel2 = mundo.titulos.map((f) => f.match(/^heading, (.*), level 2$/)?.[1]).filter(Boolean);
      expect(nivel2).toEqual(SECOES_H2);
    }),
    E("na governança, cada cartão é um título de nível 3 com o nome da pessoa", async ({ mundo }) => {
      const inicio = mundo.titulos.indexOf("heading, Quem cuida de quê, level 2");
      expect(mundo.titulos.slice(inicio + 1, inicio + 5)).toEqual([
        "heading, Douglas, level 3",
        "heading, Camila, level 3",
        "heading, Gabriel, level 3",
        "heading, Patrícia, level 3",
      ]);
    }),
  ]);

  cenario("Navegar pelas regiões com a tecla D", [
    ligarNvda(),
    Quando("percorro a página inteira com a tecla D", async ({ leitor, mundo }) => {
      mundo.regioes = await percorrer(leitor, "moveToNextLandmark");
    }),
    Entao("a página começa pelo cabeçalho, pela navegação principal e pelo conteúdo", async ({ mundo }) => {
      expect(mundo.regioes.slice(0, 3)).toEqual(["banner", "navigation, Navegação principal", "main"]);
    }),
    E("cada seção é uma região com o nome do próprio título", async ({ mundo }) => {
      for (const secao of SECOES_H2.slice(0, 11)) expect(mundo.regioes).toContain(`region, ${secao}`);
    }),
    E("o rodapé tem a navegação do site", async ({ mundo }) => {
      expect(mundo.regioes).toContain("contentinfo");
      expect(mundo.regioes).toContain("navigation, Navegar");
    }),
  ]);

  cenario('Do botão "Abrir o Playground QA", o Tab apresenta cada seção, na ordem da página', [
    ligarNvda(),
    Quando('chego ao botão "Abrir o Playground QA"', async ({ page, leitor }) => {
      expect(await focar(page, leitor, "cta-playground")).toContain("link, Abrir o Playground QA");
    }),
    E("aperto Tab até chegar ao primeiro link dos cartões da governança", async ({ leitor, mundo }) => {
      mundo.falas = [];
      for (let i = 0; i < 15; i++) {
        const novas = await leitor.tecla("Tab");
        mundo.falas.push(...novas);
        if (novas.includes("link, LinkedIn de Douglas (abre em nova aba)")) return;
      }
      throw new Error("O Tab não chegou ao LinkedIn do Douglas.");
    }),
    Entao("o primeiro Tab anuncia a seção logo abaixo — e não os cartões da governança", async ({ mundo }) => {
      expect(mundo.falas[0]).toBe("heading, Aprender com prática real, sem hierarquia, level 2");
    }),
    E("cada seção do caminho é anunciada como título de nível 2, na ordem da página", async ({ mundo }) => {
      expect(mundo.falas.filter((f) => f.startsWith("heading, "))).toEqual([
        "heading, Aprender com prática real, sem hierarquia, level 2",
        "heading, Seis objetivos, cada um com o canal que o sustenta, level 2",
        "heading, Duas plataformas, papéis diferentes, level 2",
        "heading, A tabela que resolve a dúvida, level 2",
        "heading, O que você busca e o que a gente entrega, level 2",
        "heading, Dez regras que cabem em uma tela, level 2",
        "heading, Quem cuida de quê, level 2",
      ]);
    }),
    E('o primeiro link dos cartões só vem depois do título "Quem cuida de quê"', async ({ mundo }) => {
      expect(mundo.falas.slice(-2)).toEqual([
        "heading, Quem cuida de quê, level 2",
        "link, LinkedIn de Douglas (abre em nova aba)",
      ]);
    }),
  ]);

  cenario("Os administradores atuais são anunciados, com o Gabriel na equipe", [
    ligarNvda(),
    Quando('vou até "Quem cuida de quê" com a tecla H', async ({ leitor }) => {
      await leitor.comandoAte("moveToNextHeading", "heading, Quem cuida de quê, level 2");
    }),
    E("sigo com H pelos quatro cartões", async ({ leitor, mundo }) => {
      mundo.nomes = [];
      for (let i = 0; i < 4; i++) mundo.nomes.push((await leitor.proximoTitulo())[0]);
    }),
    Entao("o NVDA anuncia Douglas, Camila, Gabriel e Patrícia", async ({ mundo }) => {
      expect(mundo.nomes).toEqual([
        "heading, Douglas, level 3",
        "heading, Camila, level 3",
        "heading, Gabriel, level 3",
        "heading, Patrícia, level 3",
      ]);
    }),
    Quando("volto ao cartão do Gabriel e leio com a seta para baixo", async ({ leitor, mundo }) => {
      expect((await leitor.comando("moveToPreviousHeading"))[0]).toBe("heading, Gabriel, level 3");
      mundo.inicio = leitor.falasOriginais().length;
      await leitor.lerAte(/^Grupos do WhatsApp: acolhimento de quem entra/, 12);
    }),
    Entao("ouço o LinkedIn dele, a plataforma, o papel e o que ele faz", async ({ leitor, mundo }) => {
      const cartao = leitor.falasOriginais().slice(mundo.inicio);
      expect(cartao).toContain("link, LinkedIn de Gabriel (abre em nova aba)");
      expect(cartao).toContain("WhatsApp");
      expect(cartao).toContain("Administração do WhatsApp");
      expect(cartao).toContain(
        "Grupos do WhatsApp: acolhimento de quem entra, moderação do dia a dia e roteamento das conversas para o canal certo"
      );
    }),
    E("ninguém chamado Amanda é lido — ela está afastada temporariamente", async ({ leitor }) => {
      expect(leitor.falasOriginais().filter((f) => f.includes("Amanda"))).toEqual([]);
    }),
  ]);

  cenario("Na prioridade, o Tab entra no grupo, as setas escolhem e o Tab segue para o próximo campo", [
    ligarNvda("/playground", "o Playground"),
    Quando('estou no campo "Ocorrências" e aperto Tab', async ({ page, leitor, mundo }) => {
      await focar(page, leitor, "input-ocorrencias");
      mundo.falas = await leitor.tecla("Tab");
    }),
    Entao('o NVDA anuncia "P1 imediata", opção 1 de 3, e a instrução das setas', async ({ mundo }) => {
      expect(mundo.falas).toContain(`radio, P1 imediata, ${DICA_PRIORIDADE}, not checked, position 1, set size 3`);
    }),
    Quando("aperto a seta para a direita", async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla("ArrowRight");
    }),
    Entao('o foco vai para "P2 próxima sprint", que fica marcada', async ({ page, mundo }) => {
      expect(mundo.falas).toContain(`radio, P2 próxima sprint, ${DICA_PRIORIDADE}, checked, position 2, set size 3`);
      await expect(page.getByTestId("radio-prioridade-P2")).toBeChecked();
    }),
    E('com mais uma seta, "P3 backlog" é marcada', async ({ page, leitor }) => {
      expect(await leitor.tecla("ArrowRight")).toContain(
        `radio, P3 backlog, ${DICA_PRIORIDADE}, checked, position 3, set size 3`
      );
      await expect(page.getByTestId("radio-prioridade-P3")).toBeChecked();
    }),
    Quando("aperto Tab", async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla("Tab");
    }),
    Entao('o foco sai do grupo e vai para "Passos para reproduzir"', async ({ page, mundo }) => {
      expect(mundo.falas.some((f) => f.startsWith("textbox, Passos para reproduzir"))).toBe(true);
      await expect(page.getByTestId("input-passos")).toBeFocused();
    }),
    E("o Shift+Tab volta para a opção marcada, e não para a primeira", async ({ leitor }) => {
      expect(await leitor.tecla("Shift+Tab")).toContain(
        `radio, P3 backlog, ${DICA_PRIORIDADE}, checked, position 3, set size 3`
      );
    }),
  ]);

  cenario("Enviar o formulário vazio anuncia quantos campos faltam e leva ao primeiro deles", [
    ligarNvda("/playground", "o Playground"),
    Quando('chego ao botão "Registrar defeito" e aperto Enter', async ({ page, leitor, mundo }) => {
      await focar(page, leitor, "btn-registrar");
      mundo.falas = await leitor.tecla("Enter", 600);
    }),
    Entao('o NVDA anuncia o resumo: "10 campos precisam de atenção"', async ({ mundo }) => {
      expect(mundo.falas).toContain("assertive: 10 campos precisam de atenção antes de registrar.");
    }),
    E("o foco vai para o título do defeito, anunciado como inválido e com a mensagem de erro", async ({ page, mundo }) => {
      expect(mundo.falas.some((f) => /^textbox, Título do defeito, Informe o título do defeito\. .*, invalid/.test(f))).toBe(true);
      await expect(page.getByTestId("input-titulo")).toBeFocused();
    }),
    Quando("digito um título válido", async ({ leitor, mundo }) => {
      mundo.falas = await leitor.digitar("Botão salvar não responde");
    }),
    Entao('o resumo é atualizado e anunciado: "9 campos"', async ({ mundo }) => {
      expect(mundo.falas).toContain("assertive: 9 campos precisam de atenção antes de registrar.");
    }),
  ]);

  cenario("As abas do Playground: as setas trocam de aba e o Tab vai para o conteúdo", [
    ligarNvda("/playground", "o Playground"),
    Quando('chego à aba "Registrar defeito"', async ({ page, leitor }) => {
      expect(await focar(page, leitor, "aba-registrar")).toContain(
        "tab, Registrar defeito, selected, 1 control, position 1, set size 4"
      );
    }),
    E("aperto a seta para a direita", async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla("ArrowRight");
    }),
    Entao('o NVDA anuncia a aba "Tabela de defeitos", já selecionada', async ({ page, mundo }) => {
      expect(mundo.falas).toContain("tab, Tabela de defeitos, selected, 1 control, position 2, set size 4");
      await expect(page.getByTestId("area-tabela")).toBeVisible();
    }),
    E("End vai para a última aba e Home volta para a primeira", async ({ leitor }) => {
      expect(await leitor.tecla("End")).toContain("tab, Certificado, selected, 1 control, position 4, set size 4");
      expect(await leitor.tecla("Home")).toContain("tab, Registrar defeito, selected, 1 control, position 1, set size 4");
    }),
    Quando("volto para a Tabela e aperto Tab duas vezes", async ({ leitor, mundo }) => {
      await leitor.tecla("ArrowRight");
      mundo.falas = [...(await leitor.tecla("Tab")), ...(await leitor.tecla("Tab"))];
    }),
    Entao("o foco passa pelo botão de restaurar e entra no painel, que se apresenta pelo nome", async ({ mundo }) => {
      expect(mundo.falas).toEqual(["button, Restaurar massa de dados", "tabpanel, Tabela de defeitos"]);
    }),
  ]);

  cenario("Filtrar a tabela anuncia quantos defeitos sobraram", [
    ligarNvda("/playground", "o Playground"),
    Dado("que estou na aba da tabela de defeitos", async ({ page }) => {
      await page.getByTestId("aba-tabela").click();
    }),
    Quando('digito "relatorio" na busca', async ({ page, leitor, mundo }) => {
      await focar(page, leitor, "filtro-busca");
      mundo.falas = await leitor.digitar("relatorio");
    }),
    Entao('o NVDA anuncia "Exibindo 1–2 de 2 defeito(s)"', async ({ mundo }) => {
      expect(mundo.falas).toContain("polite: Exibindo 1–2 de 2 defeito(s).");
    }),
    E("o foco continua na busca", async ({ page }) => {
      await expect(page.getByTestId("filtro-busca")).toBeFocused();
    }),
  ]);

  cenario("Excluir um defeito só com o teclado: o Esc desiste e a exclusão leva à próxima linha", [
    ligarNvda("/playground", "o Playground"),
    Dado("que estou na aba da tabela de defeitos", async ({ page }) => {
      await page.getByTestId("aba-tabela").click();
    }),
    Quando("chego ao botão de excluir do BUG-1002", async ({ page, leitor }) => {
      expect(await focar(page, leitor, "excluir-BUG-1002")).toContain("button, Excluir BUG-1002, not expanded");
    }),
    E("aperto Enter e depois Tab", async ({ page, leitor, mundo }) => {
      await leitor.tecla("Enter");
      await expect(page.getByTestId("excluir-BUG-1002")).toHaveAttribute("aria-expanded", "true");
      mundo.falas = await leitor.tecla("Tab");
    }),
    Entao('o foco chega ao botão "Confirmar exclusão"', async ({ mundo }) => {
      expect(mundo.falas).toContain("button, Confirmar exclusão");
    }),
    Quando("aperto Esc", async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla("Escape");
    }),
    Entao('a confirmação fecha e o foco volta para o "Excluir" do BUG-1002', async ({ page, mundo }) => {
      expect(mundo.falas).toContain("button, Excluir BUG-1002, not expanded");
      await expect(page.getByTestId("confirmacao-BUG-1002")).toHaveCount(0);
    }),
    Quando("confirmo a exclusão: Enter, Tab e Enter", async ({ leitor, mundo }) => {
      await leitor.tecla("Enter");
      await leitor.tecla("Tab");
      mundo.falas = await leitor.tecla("Enter", 700);
    }),
    Entao('o foco vai para o defeito seguinte, e o NVDA avisa "Defeito BUG-1002 excluído"', async ({ page, mundo }) => {
      expect(mundo.falas).toContain("button, Excluir BUG-1003, not expanded");
      expect(mundo.falas).toContain("polite: Defeito BUG-1002 excluído.");
      await expect(page.getByTestId("linha-BUG-1002")).toHaveCount(0);
    }),
  ]);

  cenario("A troca de tema é anunciada", [
    ligarNvda(),
    Quando("chego ao botão de tema com o Tab", async ({ leitor }) => {
      await leitor.teclaAte("Tab", "button, Mudar para o tema claro", 15);
    }),
    E("aperto Enter", async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla("Enter", 600);
    }),
    Entao('o NVDA anuncia "Tema claro ativado" pela região ao vivo', async ({ page, mundo }) => {
      expect(mundo.falas).toContain("polite: Tema claro ativado");
      await expect(page.getByTestId("anuncio-tema")).toHaveText("Tema claro ativado");
    }),
    E("o foco continua no botão, que agora oferece o tema escuro", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Mudar para o tema escuro" })).toBeFocused();
    }),
  ]);

  cenario("Trocar de tela pelo menu leva o NVDA ao título da tela nova", [
    ligarNvda(),
    Quando('chego ao link "Manifesto" do menu e aperto Enter', async ({ page, leitor, mundo }) => {
      await focar(page, leitor, "nav-manifesto");
      mundo.falas = await leitor.tecla("Enter", 600);
    }),
    Entao("o NVDA anuncia o título da tela nova, de nível 1", async ({ mundo }) => {
      expect(mundo.falas).toContain("heading, Manifesto Ágil de Testes, level 1");
    }),
    E("o título da aba do navegador também muda", async ({ page }) => {
      await expect(page).toHaveTitle("Manifesto Ágil de Testes — QA's Guardiões do Software");
    }),
    Quando("aperto Tab", async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla("Tab");
    }),
    Entao("o foco segue da tela nova: o primeiro valor do Manifesto", async ({ mundo }) => {
      expect(mundo.falas).toContain(`heading, ${VALORES[0].esquerda}, level 3`);
    }),
  ]);

  cenario('O atalho "Pular para o conteúdo" leva ao título principal da tela', [
    ligarNvda(),
    Quando("aperto Tab uma vez", async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla("Tab");
    }),
    Entao('o NVDA anuncia o atalho "Pular para o conteúdo"', async ({ mundo }) => {
      expect(mundo.falas).toContain("link, Pular para o conteúdo");
    }),
    Quando("aperto Enter", async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla("Enter", 500);
    }),
    Entao("o NVDA anuncia o título principal da página", async ({ mundo }) => {
      expect(mundo.falas).toContain(TITULO_H1);
    }),
    E("o próximo Tab vai para o primeiro botão do conteúdo, e não volta ao cabeçalho", async ({ leitor }) => {
      expect(await leitor.tecla("Tab")).toContain("link, Entrar no Discord (abre em nova aba)");
    }),
  ]);

  cenario("No Manifesto, o Tab passa pelos quatro valores, um a um", [
    ligarNvda("/manifesto", "o Manifesto"),
    Quando("estou no título da página e aperto Tab quatro vezes", async ({ page, leitor, mundo }) => {
      await page.locator("#manifesto-titulo").focus();
      await leitor.anunciar({ origem: "foco" });
      mundo.falas = [];
      for (let i = 0; i < 4; i++) mundo.falas.push(...(await leitor.tecla("Tab")));
    }),
    Entao("o NVDA anuncia cada valor como título de nível 3, na ordem do manifesto", async ({ mundo }) => {
      expect(mundo.falas).toEqual(VALORES.map((v) => `heading, ${v.esquerda}, level 3`));
    }),
    E("o quinto Tab vai para a seção de princípios", async ({ leitor }) => {
      expect(await leitor.tecla("Tab")).toContain("heading, Doze princípios por trás destes valores, level 2");
    }),
  ]);
});
