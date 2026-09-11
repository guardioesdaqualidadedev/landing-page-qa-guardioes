import { test, expect } from "@playwright/test";

test.describe("Menu Manifesto", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/manifesto");
  });

  test("abre pela URL direta com o título da página", async ({ page }) => {
    await expect(page.getByTestId("pagina-manifesto")).toBeVisible();
    await expect(page.getByTestId("titulo-manifesto")).toContainText("Manifesto Ágil de");
    await expect(page.getByTestId("titulo-manifesto")).toContainText("Testes");
  });

  test("apresenta os quatro valores da comunidade", async ({ page }) => {
    const valores = page.getByTestId("valores");
    await expect(valores.locator("> *")).toHaveCount(4);

    await expect(page.getByTestId("valor-01")).toContainText("Qualidade construída pelo time");
    await expect(page.getByTestId("valor-01")).toContainText("defeitos encontrados no fim");
    await expect(page.getByTestId("valor-04")).toContainText("Automação que sustenta o ritmo");
  });

  test("cada valor traz a explicação do porquê", async ({ page }) => {
    await expect(page.getByTestId("valor-02")).toContainText("Testamos onde dói");
  });

  test("fecha com a ressalva de que há valor nos dois lados", async ({ page }) => {
    await expect(page.getByTestId("fechamento")).toContainText(
      "Mesmo havendo valor nos itens à direita, valorizamos mais os itens à esquerda."
    );
  });

  test("lista os doze princípios", async ({ page }) => {
    await expect(page.getByTestId("principios").locator("li")).toHaveCount(12);
    await expect(page.getByTestId("principios")).toContainText("Nossa maior prioridade é proteger quem usa o software");
  });

  test("reproduz o manifesto original com o aviso de direitos", async ({ page }) => {
    const original = page.getByTestId("manifesto-original");
    await expect(original).toContainText("Manifesto para Desenvolvimento Ágil de Software");
    await expect(original).toContainText("Indivíduos e interações");
    await expect(original).toContainText("Software em funcionamento");
    await expect(original).toContainText("Colaboração com o cliente");
    await expect(original).toContainText("Responder a mudanças");
    await expect(original).toContainText("© 2001, os autores do manifesto ágil");
  });

  test("o link para o manifesto original aponta para agilemanifesto.org", async ({ page }) => {
    const link = page.getByTestId("link-manifesto-original");
    await expect(link).toHaveAttribute("href", "https://agilemanifesto.org/iso/ptbr/manifesto.html");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  });

  test("mantém a hierarquia de cabeçalhos — um h1 e vários h2", async ({ page }) => {
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.locator("h2").count()).toBeGreaterThan(1);
  });

  test("funciona nos dois temas", async ({ page }) => {
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByTestId("valores").locator("> *")).toHaveCount(4);
  });
});
