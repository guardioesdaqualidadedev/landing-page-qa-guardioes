import { test, expect } from "@playwright/test";
import { passo, irPara, rolar, voltarAoTopo, legenda } from "../support/legenda.js";

// ─────────────────────────────────────────────────────────────────────────────
// Passeio guiado pelo sistema — roteiro de demonstração.
//
// NÃO é um teste de regressão: é um roteiro que percorre cada tela, aba e
// componente em ritmo de aula, para servir de material visual. Por isso só roda
// no modo demonstração (`npm run test:all`) e apenas no projeto de desktop —
// `npm run test:e2e` continua sendo a suíte enxuta.
//
// As asserções que existem aqui servem de âncora: garantem que o roteiro está
// mesmo na tela que diz estar antes de continuar narrando.
// ─────────────────────────────────────────────────────────────────────────────

const DEMO = process.env.PW_DEMO === "1";

test.describe("Passeio guiado pelo sistema", () => {
  test.skip(!DEMO, "Roteiro de demonstração — roda só com npm run test:all.");

  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, "O passeio é gravado na largura de desktop.");
  });

  test("1. A landing page da comunidade, de cima a baixo", async ({ page }) => {
    await page.goto("/");
    await passo(page, "Landing page — QA's Guardioes do Software", 4000);

    await passo(page, "Cabecalho fixo: marca, menu, redes sociais e botao de tema", 4500);
    await passo(page, "Hero: a chamada principal e os tres botoes de acao", 4500);
    await passo(page, 'O principio que orienta a comunidade: "O WhatsApp avisa. O Discord aprofunda."', 5000);

    await irPara(page, '[data-testid="stats"]');
    await passo(page, "Numeros da comunidade: 8 canais, 6 grupos, 100% gratuita, meta de 24h", 4500);

    await rolar(page, 1);
    await passo(page, "Missao da comunidade e o que ela nao e", 5000);

    await irPara(page, "#objetivos");
    await passo(page, "Seis objetivos — cada um com o canal que o sustenta e o indicador", 4000);
    await rolar(page, 1);
    await passo(page, "Sem indicador, objetivo e intencao", 4000);

    await irPara(page, "#canais");
    await passo(page, "Estrutura: 8 canais no Discord e 6 grupos no WhatsApp", 4500);
    await rolar(page, 1, 2200);
    await passo(page, "Cada canal com proposito e tipo de conteudo", 4000);

    await irPara(page, "#roteamento");
    await passo(page, 'A tabela que responde "onde posto isso?"', 5000);
    await rolar(page, 1, 2200);

    await irPara(page, "#perfis");
    await passo(page, "Seis perfis de membro: o que busca e o que a comunidade entrega", 5000);
    await rolar(page, 1, 2200);

    await irPara(page, "#regras");
    await passo(page, "Dez regras de convivencia que cabem em uma tela", 5000);
    await rolar(page, 1, 2200);

    await irPara(page, "#governanca");
    await passo(page, "Governanca: quem cuida de que — Douglas, Camila, Gabriel e Patricia", 4500);
    await rolar(page, 1, 2200);
    await passo(page, "Metricas de saude revisadas a cada quinzena", 4000);

    await irPara(page, '[data-testid="cta-final"]');
    await passo(page, "Chamada final para entrar no Discord", 3500);

    await irPara(page, '[data-testid="site-footer"]');
    await passo(page, "Rodape com navegacao e as redes da comunidade", 3500);

    await voltarAoTopo(page);
    await passo(page, "De volta ao topo", 2000);
  });

  test("2. O mesmo site no tema claro", async ({ page }) => {
    await page.goto("/");
    await passo(page, "Alternancia de tema: um clique troca a paleta inteira", 3500);

    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await passo(page, "Tema claro — cinza #EFF2F5 de fundo, azul-marinho no texto", 5000);

    await irPara(page, '[data-testid="stats"]');
    await passo(page, "Os cartoes ganham fundo branco e sombra suave", 4000);

    await irPara(page, "#canais");
    await passo(page, "As faixas de marca seguem azul-marinho nos dois temas", 4500);
    await rolar(page, 1, 2200);

    await irPara(page, "#roteamento");
    await passo(page, "A tabela no tema claro", 4000);

    await irPara(page, "#regras");
    await passo(page, "O laranja de texto escurece no tema claro para manter contraste", 5000);

    await voltarAoTopo(page);
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await passo(page, "E de volta ao tema escuro, que e o padrao", 3500);
  });

  test("3. O Manifesto Agil de Testes", async ({ page }) => {
    await page.goto("/");
    await passo(page, "Navegando pelo menu para o Manifesto", 2500);
    await page.getByTestId("nav-manifesto").click();
    await expect(page.getByTestId("pagina-manifesto")).toBeVisible();
    await passo(page, "Manifesto Agil de Testes — versao da comunidade", 4500);

    await passo(page, "A abertura, no mesmo tom do manifesto original de 2001", 4500);

    await irPara(page, '[data-testid="valor-01"]');
    await passo(page, "Valor 01 — Qualidade construida pelo time, mais que defeitos no fim", 6000);
    await irPara(page, '[data-testid="valor-02"]');
    await passo(page, "Valor 02 — Risco coberto, mais que quantidade de casos de teste", 6000);
    await irPara(page, '[data-testid="valor-03"]');
    await passo(page, "Valor 03 — Colaboracao com quem constroi, mais que relatorios que acusam", 6000);
    await irPara(page, '[data-testid="valor-04"]');
    await passo(page, "Valor 04 — Automacao que sustenta o ritmo, mais que automacao que impressiona", 6000);

    await irPara(page, '[data-testid="fechamento"]');
    await passo(page, "A ressalva: ha valor nos itens a direita, mas valorizamos mais os da esquerda", 5500);

    await irPara(page, "#principios");
    await passo(page, "Doze principios por tras destes valores", 4000);
    await rolar(page, 4, 3200);

    await irPara(page, '[data-testid="manifesto-original"]');
    await passo(page, "O manifesto original de 2001, reproduzido para comparacao", 5000);
    await rolar(page, 1, 2600);
    await passo(page, "Com o aviso de direitos exigido pelos autores", 4000);

    await rolar(page, 1, 2200);
    await passo(page, "E o convite para discutir tudo isso no #feedbacks-melhorias", 3500);
  });

  test("4. Playground QA — o formulario, campo a campo", async ({ page }) => {
    await page.goto("/");
    await passo(page, "Agora o Playground QA, pelo menu", 2500);
    await page.getByTestId("nav-playground").click();
    await expect(page.getByTestId("pagina-playground")).toBeVisible();
    await passo(page, "Playground QA — o Guardiao Tracker, um sistema fake para treinar", 5000);

    await passo(page, "Tres abas: registrar defeito, tabela de defeitos e cenarios de teste", 4500);
    await irPara(page, '[data-testid="formulario-defeito"]');
    await passo(page, "Aba 1 — formulario de registro de defeito, com as regras ao lado", 5000);

    // Primeiro erro: enviar vazio.
    await passo(page, "Primeiro cenario: enviar o formulario completamente vazio", 3500);
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("resumo-erros")).toBeVisible();
    await passo(page, "Dez campos acusados, e o foco vai para o primeiro erro", 5500);
    await rolar(page, 1, 3000);
    await passo(page, "Cada campo com a mensagem ligada por aria-describedby", 4500);
    await voltarAoTopo(page, 1200);
    await irPara(page, '[data-testid="formulario-defeito"]', 1500);

    // Valor limite no título.
    await passo(page, "Valor limite no titulo: o minimo e 5 caracteres. Vamos digitar 4", 4000);
    await page.getByTestId("input-titulo").fill("abcd");
    await expect(page.getByTestId("campo-titulo-erro")).toBeVisible();
    await passo(page, "Quatro caracteres — rejeitado", 4000);
    await page.getByTestId("input-titulo").fill("abcde");
    await expect(page.getByTestId("campo-titulo-erro")).toHaveCount(0);
    await passo(page, "Cinco caracteres — aceito. Fronteira encontrada", 4500);

    await page.getByTestId("input-titulo").fill("Pagamento em duplicidade ao clicar duas vezes em Confirmar");
    await passo(page, "Agora um titulo de verdade", 3000);

    // Listas fechadas.
    await page.getByTestId("select-modulo").selectOption("Pagamentos");
    await passo(page, "Modulo afetado — lista fechada de seis opcoes", 3000);
    await page.getByTestId("select-severidade").selectOption("Crítica");
    await passo(page, "Severidade critica", 2800);
    await page.getByTestId("select-ambiente").selectOption("Produção");
    await passo(page, "Ambiente de producao", 2800);

    // E-mail inválido.
    await passo(page, "E-mail: particao de equivalencia. Sem arroba, sem dominio, com espaco", 4000);
    await page.getByTestId("input-reporter").fill("douglas.guardioes.dev");
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("campo-reporter-erro")).toBeVisible();
    await passo(page, "Sem arroba — rejeitado", 3800);
    await page.getByTestId("input-reporter").fill("douglas@guardioes");
    await passo(page, "Sem dominio de topo — tambem rejeitado", 3800);
    await page.getByTestId("input-reporter").fill("douglas@guardioes.dev");
    await expect(page.getByTestId("campo-reporter-erro")).toHaveCount(0);
    await passo(page, "Agora valido", 3000);

    // Data futura.
    await passo(page, "Data de deteccao: a regra diz que nao pode estar no futuro", 3500);
    await page.getByTestId("input-data").fill("2099-12-31");
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("campo-data-erro")).toBeVisible();
    await passo(page, "Ano 2099 — rejeitado com mensagem especifica", 4500);
    await page.getByTestId("input-data").fill("2026-09-01");
    await passo(page, "Uma data plausivel", 2800);

    // Ocorrências: limites.
    await passo(page, "Ocorrencias: inteiro de 1 a 999. Testando as quatro fronteiras", 4000);
    await page.getByTestId("input-ocorrencias").fill("0");
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("campo-ocorrencias-erro")).toBeVisible();
    await passo(page, "Zero — fora da faixa", 3500);
    await page.getByTestId("input-ocorrencias").fill("1000");
    await passo(page, "Mil — fora da faixa", 3500);
    await page.getByTestId("input-ocorrencias").fill("999");
    await expect(page.getByTestId("campo-ocorrencias-erro")).toHaveCount(0);
    await passo(page, "Novecentos e noventa e nove — aceito", 3500);
    await page.getByTestId("input-ocorrencias").fill("27");
    await passo(page, "E o valor real do defeito: 27 ocorrencias", 2800);

    // Prioridade e passos.
    await page.getByTestId("radio-prioridade-P1").check();
    await passo(page, "Prioridade P1 — atencao imediata", 3000);
    await page
      .getByTestId("input-passos")
      .fill("1. Iniciar um pagamento. 2. Clicar em Confirmar duas vezes rapidamente. 3. Observar dois lancamentos identicos no extrato.");
    await passo(page, "Passos para reproduzir — minimo de 20 caracteres", 4000);

    // Aceite obrigatório.
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("campo-aceite-erro")).toBeVisible();
    await passo(page, "Falta o aceite: o relato nao pode expor dado sensivel do empregador", 5500);
    await page.getByTestId("check-aceite").check();
    await passo(page, "Aceite marcado — agora o formulario esta completo", 3500);

    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("aviso-sucesso")).toBeVisible();
    await passo(page, "Defeito registrado. O formulario se limpa e o aviso confirma", 5000);
  });

  test("5. Playground QA — a tabela de defeitos e suas acoes", async ({ page }) => {
    await page.goto("/playground");
    await page.getByTestId("aba-tabela").click();
    await expect(page.getByTestId("area-tabela")).toBeVisible();
    await passo(page, "Aba 2 — tabela de defeitos: 8 registros, 5 por pagina", 5000);

    await passo(page, "Resumo por severidade no topo, acompanhando os filtros", 4500);
    await passo(page, "Sete colunas ordenaveis e uma coluna de acoes", 4500);

    // Busca.
    await passo(page, "Busca por texto — e ela ignora acento", 3500);
    await page.getByTestId("filtro-busca").fill("relatorio");
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 2");
    await passo(page, 'Digitando "relatorio" sem acento e achando "Relatorios"', 5000);
    await page.getByTestId("filtro-busca").fill("BUG-1003");
    await passo(page, "A busca tambem cobre o ID do defeito", 4000);
    await page.getByTestId("filtro-busca").fill("");
    await passo(page, "Limpando a busca", 2500);

    // Filtros combinados.
    await page.getByTestId("filtro-severidade").selectOption("Crítica");
    await passo(page, "Filtro por severidade critica — dois registros", 4000);
    await page.getByTestId("filtro-status").selectOption("Aberto");
    await passo(page, "Somando o status Aberto: os filtros combinam como E, nao como OU", 5000);
    await page.getByTestId("filtro-status").selectOption("Corrigido");
    await expect(page.getByTestId("linha-vazia")).toBeVisible();
    await passo(page, "Critica e corrigido: nenhum resultado, com estado vazio explicito", 5000);
    await page.getByTestId("btn-limpar-filtros").click();
    await passo(page, "O botao Limpar devolve a lista completa", 3500);

    await page.getByTestId("filtro-modulo").selectOption("Login");
    await passo(page, "Filtro por modulo — e o resumo por severidade acompanha", 4500);
    await page.getByTestId("btn-limpar-filtros").click();
    await passo(page, "Limpando de novo", 2500);

    // Ordenação.
    await passo(page, "Ordenacao: clicar no cabecalho alterna crescente e decrescente", 3500);
    await page.getByTestId("ordenar-severidade").click();
    await passo(page, "Severidade crescente — Baixa primeiro", 4000);
    await page.getByTestId("ordenar-severidade").click();
    await passo(page, "Decrescente — Critica primeiro. Ordena por gravidade, nao alfabeticamente", 5500);
    await page.getByTestId("ordenar-ocorrencias").click();
    await passo(page, "Por ocorrencias, como numero", 3800);
    await page.getByTestId("ordenar-ocorrencias").click();
    await passo(page, "Do defeito mais recorrente para o menos", 3800);
    await page.getByTestId("ordenar-data").click();
    await passo(page, "Por data de deteccao", 3500);
    await page.getByTestId("ordenar-id").click();
    await passo(page, "E de volta a ordem por ID", 3000);

    // Paginação.
    await passo(page, "Paginacao: duas paginas, com os extremos desabilitados", 3500);
    await page.getByTestId("btn-pagina-proxima").click();
    await expect(page.getByTestId("pagina-atual")).toContainText("Página 2");
    await passo(page, "Pagina 2 de 2 — o botao Proxima fica desabilitado", 4500);
    await page.getByTestId("filtro-status").selectOption("Aberto");
    await expect(page.getByTestId("pagina-atual")).toContainText("Página 1");
    await passo(page, "Filtrar na ultima pagina traz de volta para a pagina 1, sem tabela vazia", 5500);
    await page.getByTestId("btn-limpar-filtros").click();
    await passo(page, "Filtros limpos", 2200);

    // Mudança de status.
    await passo(page, "Acao na linha: mudar o status de um defeito", 3500);
    await page.getByTestId("status-BUG-1001").selectOption("Corrigido");
    await passo(page, "BUG-1001 passou para Corrigido", 4000);
    await page.getByTestId("filtro-status").selectOption("Corrigido");
    await expect(page.getByTestId("linha-BUG-1001")).toBeVisible();
    await passo(page, "E aparece no filtro do status novo", 4500);
    await page.getByTestId("btn-limpar-filtros").click();
    await passo(page, "Voltando a lista completa", 2200);

    // Exclusão com confirmação.
    await passo(page, "Acao destrutiva: excluir. A confirmacao acontece dentro da linha", 4500);
    await page.getByTestId("excluir-BUG-1002").click();
    await expect(page.getByTestId("confirmacao-BUG-1002")).toBeVisible();
    await passo(page, "Sem window.confirm: dialogo nativo trava a automacao e nao e estilizavel", 6000);
    await page.getByTestId("cancelar-exclusao-BUG-1002").click();
    await passo(page, "Cancelando — o registro permanece", 4000);
    await page.getByTestId("excluir-BUG-1002").click();
    await page.getByTestId("confirmar-exclusao-BUG-1002").click();
    await expect(page.getByTestId("linha-BUG-1002")).toHaveCount(0);
    await passo(page, "Confirmando — de 8 para 7 registros, com aviso na tela", 5000);

    await page.getByTestId("btn-restaurar").click();
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 8");
    await passo(page, "E o botao Restaurar devolve a massa de dados ao estado inicial", 5000);
  });

  test("6. Playground QA — os cenarios de teste sugeridos", async ({ page }) => {
    await page.goto("/playground");
    await page.getByTestId("aba-cenarios").click();
    await expect(page.getByTestId("area-cenarios")).toBeVisible();
    await passo(page, "Aba 3 — doze cenarios sugeridos, cada um com a tecnica por tras", 5000);

    await passo(page, "Valor limite, particao de equivalencia, acessibilidade, fluxo feliz", 5000);

    for (const [id, texto] of [
      ["c1", "Cenario 1 — titulo com 4, 5, 80 e 81 caracteres"],
      ["c2", "Cenario 2 — e-mail sem arroba, sem dominio e com espaco"],
      ["c3", "Cenario 3 — ocorrencias com 0, 1, 999 e 1000"],
      ["c4", "Cenario 4 — data de deteccao no futuro"],
    ]) {
      await page.getByTestId(`cenario-${id}`).check();
      await passo(page, `${texto} — marcado`, 3600);
    }
    await expect(page.getByTestId("progresso-cenarios")).toContainText("4 de 12");
    await passo(page, "A barra de progresso acompanha a sessao de teste", 4000);

    await rolar(page, 2, 3000);
    await passo(page, "Os cenarios restantes, ate o de estado e o de acao destrutiva", 5000);

    await page.getByTestId("cenario-c1").uncheck();
    await expect(page.getByTestId("progresso-cenarios")).toContainText("3 de 12");
    await passo(page, "Desmarcar tambem funciona — o progresso volta", 4000);

    await voltarAoTopo(page);
    await irPara(page, "#automatizar");
    await passo(page, "E no pe da pagina, como rodar esta suite na sua maquina", 5500);
  });

  test("7. A pagina de erro 404", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");
    await expect(page.getByTestId("pagina-404")).toBeVisible();
    await passo(page, "Rota inexistente: 404 com a cara da comunidade", 5000);
    await passo(page, '"Esta pagina nao passou no teste" — bug reproduzido, severidade baixa', 5000);
    await page.getByRole("link", { name: /Voltar para a pagina inicial|Voltar para a página inicial/ }).click();
    await expect(page.getByTestId("pagina-home")).toBeVisible();
    await passo(page, "E o caminho de volta para o inicio", 3500);
    legenda("Fim do passeio guiado — a suite de testes continua");
  });
});
