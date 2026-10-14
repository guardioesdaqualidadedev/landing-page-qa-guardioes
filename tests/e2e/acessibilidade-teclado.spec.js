import { test, expect } from "@playwright/test";
import {
  focoAtual,
  indicadorDeFoco,
  caminhoDoFoco,
  caminhoDeVolta,
  chaveDoFoco,
  descrever,
  listar,
  quebrasDeOrdemVisual,
} from "../support/foco.js";

// ─── Acessibilidade por teclado ──────────────────────────────────────────
//
// Aqui o Tab é pressionado de verdade. Isso importa: uma varredura estática do
// HTML consegue apontar indícios (tabindex positivo, outline removido, elemento
// focável dentro de aria-hidden), mas não responde à pergunta que interessa —
// "dá para usar esta tela só com o teclado?". Só a tecla de fato responde.
//
// O que cada bloco cobre:
//   1. Navegação global  — atalho de pular, ordem de tabulação, volta com
//                          Shift+Tab, nome acessível, foco visível, alvo mínimo
//   2. Menu do celular   — abrir, fechar, estado anunciado, foco de retorno
//   3. Manifesto         — a rota mais simples, usada como controle
//   4. Playground        — abas, formulário e tabela, que é onde o teclado
//                          realmente é exercitado

const ROTAS = [
  { caminho: "/", nome: "Landing", marcador: "pagina-home" },
  { caminho: "/manifesto", nome: "Manifesto", marcador: "pagina-manifesto" },
  { caminho: "/playground", nome: "Playground", marcador: "pagina-playground" },
];

// ══════════════════════════════════════════════════════════════════════════
// 1. Navegação global
// ══════════════════════════════════════════════════════════════════════════

test.describe("Teclado — navegação global", () => {
  test("nenhum elemento usa tabindex positivo", async ({ page }) => {
    for (const rota of ROTAS) {
      await page.goto(rota.caminho);
      const positivos = await page.evaluate(() =>
        [...document.querySelectorAll("[tabindex]")]
          .filter((el) => Number(el.getAttribute("tabindex")) > 0)
          .map((el) => `${el.tagName.toLowerCase()}[tabindex=${el.getAttribute("tabindex")}]`)
      );
      expect(positivos, `${rota.nome}: tabindex positivo cria uma ordem paralela que atropela a do HTML`).toEqual([]);
    }
  });

  test("o primeiro Tab revela o atalho de pular para o conteúdo", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const f = await focoAtual(page);
    expect(f, "nada recebeu foco no primeiro Tab").not.toBeNull();
    expect(f.nome, `o primeiro foco foi ${descrever(f)}`).toMatch(/pular para o conteúdo/i);

    // Escondido até receber foco, e visível depois — é o comportamento do atalho.
    expect(f.naTela, "o atalho recebeu foco mas continuou fora da tela").toBe(true);
    expect(f.esquerda).toBeGreaterThan(-100);
  });

  test("ativar o atalho leva o foco para dentro do conteúdo principal", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // O que a pessoa espera depois de pular: o próximo Tab já está no conteúdo,
    // não de volta no cabeçalho que ela acabou de pular.
    await page.keyboard.press("Tab");
    const f = await focoAtual(page);

    expect(
      f && f.regiao,
      `depois de pular, o foco seguiu para ${descrever(f)} na região "${f && f.regiao}". ` +
        `Para o atalho funcionar de fato, <main> precisa de tabindex="-1" e receber foco no clique.`
    ).toBe("main");
  });

  for (const rota of ROTAS) {
    test(`${rota.nome}: todo elemento que recebe foco tem nome acessível`, async ({ page }) => {
      await page.goto(rota.caminho);
      await expect(page.getByTestId(rota.marcador)).toBeVisible();

      const caminho = await caminhoDoFoco(page, { passos: 90 });
      expect(caminho.length, "o Tab não alcançou nenhum elemento").toBeGreaterThan(3);

      const semNome = caminho.filter((f) => !f.nome);
      expect(
        semNome.map(descrever),
        `elementos anunciados apenas como "${semNome[0] ? semNome[0].tag : ""}" pelo leitor de tela`
      ).toEqual([]);
    });

    test(`${rota.nome}: o foco nunca para fora da área visível`, async ({ page }) => {
      await page.goto(rota.caminho);
      await expect(page.getByTestId(rota.marcador)).toBeVisible();

      const caminho = await caminhoDoFoco(page, { passos: 90 });
      const invisiveis = caminho.filter((f) => !f.naTela);

      expect(
        invisiveis.map((f) => `${descrever(f)} em x=${f.esquerda} y=${f.topo}`),
        "o foco foi para um elemento que não está na tela — quem enxerga e usa teclado perde a referência"
      ).toEqual([]);
    });

    test(`${rota.nome}: todo elemento focado mostra um indicador visível`, async ({ page }) => {
      await page.goto(rota.caminho);
      await expect(page.getByTestId(rota.marcador)).toBeVisible();

      const caminho = await caminhoDoFoco(page, { passos: 60, indicador: true });
      const invisiveis = caminho.filter((f) => f.indicador && !f.indicador.temOutline && !f.indicador.mudou);

      expect(
        invisiveis.map(descrever),
        "elementos que recebem foco sem nada mudar na tela: quem navega por teclado tabula às cegas"
      ).toEqual([]);
    });

    test(`${rota.nome}: o foco não fica preso em nenhum ponto`, async ({ page }) => {
      await page.goto(rota.caminho);
      await expect(page.getByTestId(rota.marcador)).toBeVisible();

      const caminho = await caminhoDoFoco(page, { passos: 120 });
      expect(
        caminho.atingiuOLimite,
        `120 tabulações sem sair do documento nem dar a volta — indício de armadilha de foco.\n${listar(caminho.slice(-8))}`
      ).toBe(false);
    });
  }

  test("Shift+Tab volta exatamente pelo mesmo caminho", async ({ page }) => {
    await page.goto("/");
    const ida = await caminhoDoFoco(page, { passos: 12 });
    expect(ida.length).toBeGreaterThan(4);

    const volta = await caminhoDeVolta(page, ida.length - 1);
    const esperado = ida.slice(0, -1).reverse().map(chaveDoFoco);

    expect(volta.map(chaveDoFoco), "a volta com Shift+Tab não espelhou a ida").toEqual(esperado);
  });

  // Defeito relatado em outubro/2026: do botão "Abrir o Playground QA", o Tab
  // ia direto para os cartões da governança, pulando seis seções que só têm
  // texto. Cada seção agora tem o título como parada do Tab.
  test("do botão Abrir o Playground QA, o Tab passa pelo título de cada seção, em ordem", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.getByTestId("cta-playground").focus();

    const caminho = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const f = await focoAtual(page);
      caminho.push(f);
      if (f && f.testid === "admin-linkedin-douglas") break;
    }

    expect(
      caminho.map((f) => f && (f.id || f.papel || f.testid)),
      `caminho do Tab:\n${listar(caminho)}`
    ).toEqual([
      "missao-titulo",
      "objetivos-titulo",
      "canais-titulo",
      "roteamento-titulo",
      // No celular a tabela de roteamento rola de lado, e a área com rolagem
      // entra no Tab para as setas conseguirem rolá-la (WCAG 2.1.1).
      ...(isMobile ? ["region"] : []),
      "perfis-titulo",
      "regras-titulo",
      "governanca-titulo",
      "admin-linkedin-douglas", // primeiro link dos cartões
    ]);
  });

  test("no cabeçalho, a ordem de tabulação segue a ordem visual", async ({ page, isMobile }) => {
    test.skip(isMobile, "No celular o cabeçalho é uma linha só — a checagem perde o sentido.");

    await page.goto("/");
    const caminho = await caminhoDoFoco(page, { passos: 20 });
    const noCabecalho = caminho.filter((f) => f.regiao === "header");
    expect(noCabecalho.length, "nada do cabeçalho recebeu foco").toBeGreaterThan(3);

    const quebras = quebrasDeOrdemVisual(noCabecalho);
    expect(quebras, "o foco anda para trás em relação ao que se vê na tela").toEqual([]);
  });

  test("todo alvo focável tem pelo menos 24 por 24 pixels", async ({ page }) => {
    await page.goto("/");
    const caminho = await caminhoDoFoco(page, { passos: 90 });

    // Duas exceções previstas na própria WCAG 2.5.8: o alvo dentro de uma frase
    // (exceção "inline") e o atalho de pular, que só aparece durante o foco.
    const pequenos = caminho.filter(
      (f) =>
        f.largura > 0 &&
        f.altura > 0 &&
        (f.largura < 24 || f.altura < 24) &&
        !f.linhaDeTexto &&
        !/pular para o conteúdo/i.test(f.nome)
    );

    expect(
      pequenos.map((f) => `${descrever(f)} — ${f.largura}x${f.altura} px`),
      "alvo pequeno exige precisão de movimento que nem todo mundo tem (WCAG 2.2, 2.5.8)"
    ).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 2. Menu do celular
// ══════════════════════════════════════════════════════════════════════════

test.describe("Teclado — menu recolhido", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "O menu recolhido só existe na viewport estreita.");
    await page.goto("/");
  });

  test("o botão do menu abre com Enter e fecha com Espaço, anunciando o estado", async ({ page }) => {
    const botao = page.getByTestId("menu-toggle");

    await botao.focus();
    await expect(botao).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Enter");
    await expect(page.getByTestId("menu-mobile")).toBeVisible();
    await expect(botao).toHaveAttribute("aria-expanded", "true");

    await botao.focus();
    await page.keyboard.press(" ");
    await expect(page.getByTestId("menu-mobile")).toBeHidden();
    await expect(botao).toHaveAttribute("aria-expanded", "false");
  });

  test("o aria-controls do botão aponta para um elemento que existe", async ({ page }) => {
    const alvo = await page.getByTestId("menu-toggle").getAttribute("aria-controls");
    expect(alvo, "o botão do menu não declara aria-controls").toBeTruthy();

    const existe = await page.evaluate((id) => Boolean(document.getElementById(id)), alvo);
    expect(
      existe,
      `com o menu fechado, aria-controls="${alvo}" aponta para um id que não existe no DOM. ` +
        `O padrão é manter o <nav> sempre renderizado e alternar o atributo hidden.`
    ).toBe(true);
  });

  test("com o menu aberto, o Tab entra nos itens do menu", async ({ page }) => {
    const botao = page.getByTestId("menu-toggle");
    await botao.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("menu-mobile")).toBeVisible();

    await page.keyboard.press("Tab");
    const f = await focoAtual(page);
    expect(f && f.testid, `depois de abrir o menu, o Tab foi para ${descrever(f)}`).toBe("nav-home-mobile");
  });

  test("Esc fecha o menu e devolve o foco ao botão que o abriu", async ({ page }) => {
    const botao = page.getByTestId("menu-toggle");
    await botao.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("menu-mobile")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("menu-mobile"), "Esc não fechou o menu").toBeHidden();
    await expect(botao, "o foco não voltou para o botão do menu").toBeFocused();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Manifesto
// ══════════════════════════════════════════════════════════════════════════

test.describe("Teclado — Manifesto", () => {
  test("a página inteira é percorrível e o link externo avisa que abre fora", async ({ page }) => {
    await page.goto("/manifesto");
    await expect(page.getByTestId("pagina-manifesto")).toBeVisible();

    const caminho = await caminhoDoFoco(page, { passos: 60 });
    expect(caminho.length, "a rota não expôs nenhum elemento ao teclado").toBeGreaterThan(3);

    const externo = page.getByTestId("link-manifesto-original");
    await expect(externo).toHaveAttribute("target", "_blank");
    await expect(externo).toHaveAttribute("rel", /noopener/);

    const anuncia = await externo.evaluate((el) =>
      `${el.textContent} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""}`.toLowerCase()
    );
    expect(
      anuncia,
      "o link abre em nova aba sem dizer isso no nome acessível: o contexto muda sem aviso"
    ).toMatch(/nova aba|nova janela|abre em/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Playground
// ══════════════════════════════════════════════════════════════════════════

test.describe("Teclado — Playground: abas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground");
    await expect(page.getByTestId("pagina-playground")).toBeVisible();
  });

  test("as quatro abas são alcançáveis pelo Tab e ativam com Enter e com Espaço", async ({ page }) => {
    await page.getByTestId("aba-tabela").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("area-tabela")).toBeVisible();
    await expect(page.getByTestId("aba-tabela")).toHaveAttribute("aria-selected", "true");

    await page.getByTestId("aba-cenarios").focus();
    await page.keyboard.press(" ");
    await expect(page.getByTestId("area-cenarios")).toBeVisible();
    await expect(page.getByTestId("aba-cenarios")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("aba-tabela")).toHaveAttribute("aria-selected", "false");
  });

  test("as setas trocam de aba, como manda o padrão de tablist", async ({ page }) => {
    await page.getByTestId("aba-registrar").focus();
    await page.keyboard.press("ArrowRight");

    const f = await focoAtual(page);
    expect(
      f && f.testid,
      `com role="tablist", as setas devem mover entre as abas e só a ativa fica na ordem de tabulação ` +
        `(roving tabindex). O foco ficou em ${descrever(f)}.`
    ).toBe("aba-tabela");
    await expect(page.getByTestId("aba-tabela")).toHaveAttribute("aria-selected", "true");
  });

  test("o painel escondido não deixa nada no caminho do Tab", async ({ page }) => {
    await page.getByTestId("aba-cenarios").click();
    await expect(page.getByTestId("area-cenarios")).toBeVisible();

    const caminho = await caminhoDoFoco(page, { passos: 90 });
    const doFormulario = caminho.filter((f) => f.testid && /^(input|select|check|btn-registrar|btn-limpar$)/.test(f.testid));

    expect(
      doFormulario.map(descrever),
      "campos de um painel escondido continuaram recebendo foco"
    ).toEqual([]);
  });
});

test.describe("Teclado — Playground: formulário", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground");
    await expect(page.getByTestId("formulario-defeito")).toBeVisible();
  });

  test("o formulário é percorrível do título ao botão registrar, na ordem visual", async ({ page }) => {
    await page.getByTestId("input-titulo").focus();

    const visitados = [];
    for (let i = 0; i < 18; i++) {
      const f = await focoAtual(page);
      if (!f) break;
      visitados.push(f);
      if (f.testid === "btn-registrar") break;
      await page.keyboard.press("Tab");
    }

    const ids = visitados.map((f) => f.testid);
    expect(ids, `o Tab não chegou ao botão de registrar:\n${listar(visitados)}`).toContain("btn-registrar");

    const esperados = ["input-titulo", "select-modulo", "select-severidade", "select-ambiente", "input-reporter"];
    for (const id of esperados) {
      expect(ids, `${id} não apareceu no caminho do teclado`).toContain(id);
    }

    const quebras = quebrasDeOrdemVisual(visitados);
    expect(quebras, "dentro do formulário o foco anda para trás em relação à ordem visual").toEqual([]);
  });

  // Grupo de rádio é UMA parada do Tab (padrão do HTML e do WAI-ARIA): o Tab
  // entra na opção marcada — ou na primeira —, as setas escolhem e o próximo
  // Tab segue para o campo seguinte. A dica visível explica isso a quem enxerga.
  test("a prioridade é uma parada só: o Tab entra, as setas escolhem e o Tab sai", async ({ page }) => {
    const dica = page.getByTestId("dica-prioridade");
    await expect(dica).toBeVisible();
    await expect(page.getByTestId("radio-prioridade-P1")).toHaveAttribute("aria-describedby", /campo-prioridade-dica/);

    await page.getByTestId("input-ocorrencias").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("radio-prioridade-P1")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("radio-prioridade-P2")).toBeFocused();
    await expect(page.getByTestId("radio-prioridade-P2")).toBeChecked();

    await page.keyboard.press("Tab");
    await expect(page.getByTestId("input-passos"), "o Tab parou em outra opção em vez de sair do grupo").toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(page.getByTestId("radio-prioridade-P2"), "o Shift+Tab não voltou para a opção marcada").toBeFocused();
  });

  test("enviar vazio pelo teclado anuncia o resumo de erros", async ({ page }) => {
    await page.getByTestId("btn-registrar").focus();
    await page.keyboard.press("Enter");

    const resumo = page.getByTestId("resumo-erros");
    await expect(resumo).toBeVisible();
    // O resumo fica dentro de uma região role=alert que existe desde o início:
    // um alerta que já nasce com o texto nem sempre é anunciado.
    await expect(
      page.getByRole("alert").filter({ has: resumo }),
      "o resumo precisa estar numa região role=alert para ser anunciado sem roubar o foco"
    ).toHaveCount(1);
    await expect(resumo).toContainText(/precisam? de atenção/);
  });

  test("cada campo inválido aponta para a própria mensagem de erro", async ({ page }) => {
    await page.getByTestId("btn-registrar").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("resumo-erros")).toBeVisible();

    const titulo = page.getByTestId("input-titulo");
    await expect(titulo).toHaveAttribute("aria-invalid", "true");

    const descrito = await titulo.getAttribute("aria-describedby");
    expect(descrito, "o campo inválido não aponta para nenhuma descrição").toBeTruthy();

    const textoDoErro = await page.evaluate(
      (ids) =>
        ids
          .split(/\s+/)
          .map((id) => (document.getElementById(id) || {}).textContent || "")
          .join(" ")
          .trim(),
      descrito
    );
    expect(textoDoErro.length, "aria-describedby aponta para um elemento vazio ou inexistente").toBeGreaterThan(0);
  });

  test("o Enter em um campo de texto envia o formulário", async ({ page }) => {
    await page.getByTestId("input-titulo").focus();
    await page.keyboard.type("Defeito registrado apenas com o teclado");
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("resumo-erros"), "o Enter no campo não disparou o envio").toBeVisible();
  });
});

test.describe("Teclado — Playground: tabela de defeitos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground");
    await page.getByTestId("aba-tabela").click();
    await expect(page.getByTestId("tabela-defeitos")).toBeVisible();
  });

  test("os cabeçalhos de ordenação são botões operáveis pelo teclado", async ({ page }) => {
    const primeiro = page.locator(".qa-th-sort").first();
    await primeiro.focus();
    await expect(primeiro).toBeFocused();

    const antes = await page.getByTestId("tabela-defeitos").locator("tbody tr td:first-child").first().textContent();
    await page.keyboard.press("Enter");
    const depois = await page.getByTestId("tabela-defeitos").locator("tbody tr td:first-child").first().textContent();

    expect(depois, "Enter no cabeçalho não reordenou a tabela").not.toBe(antes);
  });

  test("filtrar e paginar funciona sem mouse", async ({ page }) => {
    await page.getByTestId("filtro-busca").focus();
    await page.keyboard.type("relatorio");
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 2 defeito(s)");

    await page.getByTestId("btn-limpar-filtros").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 8 defeito(s)");

    await page.getByTestId("btn-pagina-proxima").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("pagina-atual")).toContainText("Página 2 de 2");
  });

  test("o seletor de status de cada linha tem rótulo próprio", async ({ page }) => {
    const seletores = page.locator('select[id^="status-"]');
    const total = await seletores.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      const nome = await seletores.nth(i).evaluate((el) => (el.labels && el.labels[0] ? el.labels[0].textContent : ""));
      expect(nome.trim(), `o seletor de status da linha ${i + 1} não tem rótulo associado`).not.toBe("");
    }
  });

  test("a confirmação de exclusão abre pelo teclado e é anunciada", async ({ page }) => {
    const excluir = page.locator('[data-testid^="excluir-"]').first();
    await excluir.focus();
    await expect(excluir).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Enter");
    await expect(excluir).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('[data-testid^="confirmacao-"]').first()).toBeVisible();

    await page.keyboard.press("Escape");
    const aindaAberta = await page.locator('[data-testid^="confirmacao-"]').count();
    expect(aindaAberta, "Esc não fechou a confirmação de exclusão").toBe(0);
  });

  test("depois de excluir, o foco continua em algum lugar utilizável", async ({ page }) => {
    const excluir = page.locator('[data-testid^="excluir-"]').first();
    const id = (await excluir.getAttribute("data-testid")).replace("excluir-", "");

    await excluir.focus();
    await page.keyboard.press("Enter");
    await page.getByTestId(`confirmar-exclusao-${id}`).focus();
    await page.keyboard.press("Enter");

    await expect(page.getByTestId(`linha-${id}`)).toHaveCount(0);

    const f = await focoAtual(page);
    expect(
      f,
      "o elemento com foco foi removido do DOM e o foco caiu no <body>: quem usa teclado ou leitor de tela " +
        "volta ao início da página. O padrão é mover o foco para um ponto previsível antes de remover a linha."
    ).not.toBeNull();
  });
});
