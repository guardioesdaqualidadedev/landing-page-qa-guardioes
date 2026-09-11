import { test, expect } from "@playwright/test";

// Conjunto válido reutilizado pelos testes que precisam chegar ao envio.
const DEFEITO_VALIDO = {
  titulo: "Botão Salvar não responde no Safari",
  modulo: "Login",
  severidade: "Alta",
  ambiente: "Produção",
  reporter: "douglas@guardioes.dev",
  data: "2026-09-01",
  ocorrencias: "3",
  passos: "1. Abrir a tela de cadastro. 2. Clicar em Salvar. 3. Observar que nada acontece.",
  prioridade: "P1",
};

async function preencherFormulario(page, sobrescrever = {}) {
  const d = { ...DEFEITO_VALIDO, ...sobrescrever };
  if (d.titulo) await page.getByTestId("input-titulo").fill(d.titulo);
  if (d.modulo) await page.getByTestId("select-modulo").selectOption(d.modulo);
  if (d.severidade) await page.getByTestId("select-severidade").selectOption(d.severidade);
  if (d.ambiente) await page.getByTestId("select-ambiente").selectOption(d.ambiente);
  if (d.reporter) await page.getByTestId("input-reporter").fill(d.reporter);
  if (d.data) await page.getByTestId("input-data").fill(d.data);
  if (d.ocorrencias) await page.getByTestId("input-ocorrencias").fill(d.ocorrencias);
  if (d.passos) await page.getByTestId("input-passos").fill(d.passos);
  if (d.prioridade) await page.getByTestId(`radio-prioridade-${d.prioridade}`).check();
  if (d.aceite !== false) await page.getByTestId("check-aceite").check();
  return d;
}

test.describe("Menu Playground — abertura", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground");
  });

  test("abre pela URL direta com as três abas", async ({ page }) => {
    await expect(page.getByTestId("pagina-playground")).toBeVisible();
    await expect(page.getByTestId("titulo-playground")).toContainText("Playground");
    await expect(page.getByTestId("abas-playground").getByRole("tab")).toHaveCount(3);
  });

  test("abre na aba de registro por padrão", async ({ page }) => {
    await expect(page.getByTestId("aba-registrar")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("formulario-defeito")).toBeVisible();
  });

  test("alterna entre as abas", async ({ page }) => {
    await page.getByTestId("aba-tabela").click();
    await expect(page.getByTestId("area-tabela")).toBeVisible();
    await expect(page.getByTestId("formulario-defeito")).toHaveCount(0);

    await page.getByTestId("aba-cenarios").click();
    await expect(page.getByTestId("area-cenarios")).toBeVisible();

    await page.getByTestId("aba-registrar").click();
    await expect(page.getByTestId("formulario-defeito")).toBeVisible();
  });
});

test.describe("Playground — formulário de defeito", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground");
  });

  test("bloqueia o envio vazio e aponta os dez campos", async ({ page }) => {
    await page.getByTestId("btn-registrar").click();

    await expect(page.getByTestId("resumo-erros")).toContainText("10 campos precisam de atenção");
    await expect(page.getByTestId("campo-titulo-erro")).toBeVisible();
    await expect(page.getByTestId("campo-aceite-erro")).toBeVisible();
    await expect(page.getByTestId("input-titulo")).toBeFocused();
  });

  test("valor limite: título com 4 caracteres é rejeitado e com 5 é aceito", async ({ page }) => {
    await preencherFormulario(page, { titulo: "abcd" });
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("campo-titulo-erro")).toContainText("pelo menos 5 caracteres");

    await page.getByTestId("input-titulo").fill("abcde");
    await expect(page.getByTestId("campo-titulo-erro")).toHaveCount(0);
  });

  test("rejeita e-mail sem arroba", async ({ page }) => {
    await preencherFormulario(page, { reporter: "douglas.guardioes.dev" });
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("campo-reporter-erro")).toContainText("E-mail inválido");
  });

  test("rejeita data de detecção no futuro", async ({ page }) => {
    await preencherFormulario(page, { data: "2099-12-31" });
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("campo-data-erro")).toContainText("não pode estar no futuro");
  });

  test("valor limite: ocorrências aceita 1 e 999, rejeita 0 e 1000", async ({ page }) => {
    await preencherFormulario(page, { ocorrencias: "0" });
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("campo-ocorrencias-erro")).toContainText("entre 1 e 999");

    await page.getByTestId("input-ocorrencias").fill("1000");
    await expect(page.getByTestId("campo-ocorrencias-erro")).toContainText("entre 1 e 999");

    await page.getByTestId("input-ocorrencias").fill("999");
    await expect(page.getByTestId("campo-ocorrencias-erro")).toHaveCount(0);
  });

  test("exige o aceite das diretrizes", async ({ page }) => {
    await preencherFormulario(page, { aceite: false });
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("campo-aceite-erro")).toContainText("dados sensíveis");
  });

  test("caminho feliz: registra o defeito e ele aparece na tabela", async ({ page }) => {
    await preencherFormulario(page);
    await page.getByTestId("btn-registrar").click();

    await expect(page.getByTestId("aviso-sucesso")).toContainText("registrado com sucesso");
    await expect(page.getByTestId("input-titulo")).toHaveValue("");

    await page.getByTestId("aba-tabela").click();
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 9 defeito(s)");

    // Com 9 registros e 5 por página, o novo defeito cai na segunda página.
    // Buscar pelo ID é o que uma pessoa faria — e de quebra cobre a busca.
    await page.getByTestId("filtro-busca").fill("BUG-1009");
    await expect(page.getByTestId("linha-BUG-1009")).toContainText(DEFEITO_VALIDO.titulo);
    await expect(page.getByTestId("linha-BUG-1009")).toContainText("Aberto");
  });

  test("o botão Limpar zera o formulário e remove os erros", async ({ page }) => {
    await page.getByTestId("btn-registrar").click();
    await expect(page.getByTestId("resumo-erros")).toBeVisible();

    await page.getByTestId("input-titulo").fill("Alguma coisa");
    await page.getByTestId("btn-limpar").click();

    await expect(page.getByTestId("input-titulo")).toHaveValue("");
    await expect(page.getByTestId("resumo-erros")).toHaveCount(0);
  });

  test("o formulário é percorrível apenas pelo teclado", async ({ page, isMobile }) => {
    test.skip(isMobile, "Navegação por Tab não se aplica ao toque.");

    await page.getByTestId("input-titulo").focus();
    await page.keyboard.type("Falha ao salvar com o teclado");
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("select-modulo")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("select-severidade")).toBeFocused();
  });
});

test.describe("Playground — tabela de defeitos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground");
    await page.getByTestId("aba-tabela").click();
  });

  test("mostra cinco registros por página, de oito no total", async ({ page }) => {
    await expect(page.getByTestId("tabela-defeitos").locator("tbody tr")).toHaveCount(5);
    await expect(page.getByTestId("contagem-resultados")).toContainText("Exibindo 1–5 de 8");
    await expect(page.getByTestId("pagina-atual")).toContainText("Página 1 de 2");
  });

  test("a busca ignora acentos", async ({ page }) => {
    await page.getByTestId("filtro-busca").fill("relatorio");
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 2 defeito(s)");
  });

  test("filtra por severidade e por status combinados", async ({ page }) => {
    await page.getByTestId("filtro-severidade").selectOption("Crítica");
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 2 defeito(s)");

    await page.getByTestId("filtro-status").selectOption("Em análise");
    await expect(page.getByTestId("contagem-resultados")).toContainText("Nenhum defeito encontrado");
    await expect(page.getByTestId("linha-vazia")).toBeVisible();
  });

  test("o botão Limpar devolve a lista completa", async ({ page }) => {
    await page.getByTestId("filtro-modulo").selectOption("API");
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 1 defeito(s)");

    await page.getByTestId("btn-limpar-filtros").click();
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 8 defeito(s)");
  });

  test("ordena severidade por gravidade, não em ordem alfabética", async ({ page }) => {
    await page.getByTestId("ordenar-severidade").click(); // ascendente
    await expect(page.getByTestId("tabela-defeitos").locator("tbody tr").first()).toContainText("Baixa");

    await page.getByTestId("ordenar-severidade").click(); // descendente
    await expect(page.getByTestId("tabela-defeitos").locator("tbody tr").first()).toContainText("Crítica");
  });

  test("expõe a direção da ordenação em aria-sort", async ({ page }) => {
    await page.getByTestId("ordenar-ocorrencias").click();
    const th = page.getByTestId("tabela-defeitos").locator("th").filter({ hasText: "Ocorr." });
    await expect(th).toHaveAttribute("aria-sort", "ascending");
  });

  test("navega entre as páginas e desabilita os extremos", async ({ page }) => {
    await expect(page.getByTestId("btn-pagina-anterior")).toBeDisabled();

    await page.getByTestId("btn-pagina-proxima").click();
    await expect(page.getByTestId("pagina-atual")).toContainText("Página 2 de 2");
    await expect(page.getByTestId("btn-pagina-proxima")).toBeDisabled();

    await page.getByTestId("btn-pagina-anterior").click();
    await expect(page.getByTestId("pagina-atual")).toContainText("Página 1 de 2");
  });

  test("filtrar na última página traz de volta para a página 1", async ({ page }) => {
    await page.getByTestId("btn-pagina-proxima").click();
    await expect(page.getByTestId("pagina-atual")).toContainText("Página 2");

    await page.getByTestId("filtro-status").selectOption("Aberto");
    await expect(page.getByTestId("pagina-atual")).toContainText("Página 1 de 1");
    await expect(page.getByTestId("linha-vazia")).toHaveCount(0);
  });

  test("muda o status de um defeito e o filtro acompanha", async ({ page }) => {
    await page.getByTestId("status-BUG-1001").selectOption("Corrigido");
    await expect(page.getByTestId("status-BUG-1001")).toHaveValue("Corrigido");

    await page.getByTestId("filtro-status").selectOption("Corrigido");
    await expect(page.getByTestId("linha-BUG-1001")).toBeVisible();

    await page.getByTestId("filtro-status").selectOption("Aberto");
    await expect(page.getByTestId("linha-BUG-1001")).toHaveCount(0);
  });

  test("cancelar a exclusão mantém o registro", async ({ page }) => {
    await page.getByTestId("excluir-BUG-1001").click();
    await expect(page.getByTestId("confirmacao-BUG-1001")).toBeVisible();

    await page.getByTestId("cancelar-exclusao-BUG-1001").click();
    await expect(page.getByTestId("confirmacao-BUG-1001")).toHaveCount(0);
    await expect(page.getByTestId("linha-BUG-1001")).toBeVisible();
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 8 defeito(s)");
  });

  test("confirmar a exclusão remove o registro da tabela", async ({ page }) => {
    await page.getByTestId("excluir-BUG-1002").click();
    await page.getByTestId("confirmar-exclusao-BUG-1002").click();

    await expect(page.getByTestId("linha-BUG-1002")).toHaveCount(0);
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 7 defeito(s)");
    await expect(page.getByTestId("aviso-sucesso")).toContainText("BUG-1002 excluído");
  });

  test("o resumo por severidade acompanha o filtro aplicado", async ({ page }) => {
    await expect(page.getByTestId("resumo-Crítica")).toHaveText("2");

    await page.getByTestId("filtro-modulo").selectOption("Login");
    await expect(page.getByTestId("resumo-Crítica")).toHaveText("1");
  });

  test("restaurar a massa de dados desfaz as alterações", async ({ page }) => {
    await page.getByTestId("excluir-BUG-1002").click();
    await page.getByTestId("confirmar-exclusao-BUG-1002").click();
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 7 defeito(s)");

    await page.getByTestId("btn-restaurar").click();
    await expect(page.getByTestId("contagem-resultados")).toContainText("de 8 defeito(s)");
  });
});

test.describe("Playground — cenários de teste", () => {
  test("marca cenários e o progresso acompanha", async ({ page }) => {
    await page.goto("/playground");
    await page.getByTestId("aba-cenarios").click();

    await expect(page.getByTestId("lista-cenarios").locator("li")).toHaveCount(12);
    await expect(page.getByTestId("progresso-cenarios")).toContainText("0 de 12");

    await page.getByTestId("cenario-c1").check();
    await page.getByTestId("cenario-c3").check();
    await expect(page.getByTestId("progresso-cenarios")).toContainText("2 de 12");

    await page.getByTestId("cenario-c1").uncheck();
    await expect(page.getByTestId("progresso-cenarios")).toContainText("1 de 12");
  });
});
