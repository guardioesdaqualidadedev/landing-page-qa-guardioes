import { test, expect } from "@playwright/test";

// ─── Landing page ────────────────────────────────────────────────────────
test.describe("Landing page da comunidade", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("carrega com o título e a chamada principal", async ({ page }) => {
    await expect(page).toHaveTitle(/QA's Guardiões do Software/);
    await expect(page.getByTestId("pagina-home")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("não precisa");
  });

  test("mostra o princípio que orienta o uso das duas plataformas", async ({ page }) => {
    await expect(page.getByTestId("hero")).toContainText("O WhatsApp avisa. O Discord aprofunda.");
  });

  test("exibe os quatro números de destaque", async ({ page }) => {
    const stats = page.getByTestId("stats");
    await expect(stats).toBeVisible();
    await expect(stats.locator("> *")).toHaveCount(4);
  });

  test("lista os oito canais do Discord e os seis grupos do WhatsApp", async ({ page }) => {
    await expect(page.getByTestId("canais-discord").locator("li")).toHaveCount(8);
    await expect(page.getByTestId("grupos-whatsapp").locator("li")).toHaveCount(6);
  });

  test("traz a tabela de roteamento entre plataformas", async ({ page }) => {
    const tabela = page.getByTestId("tabela-roteamento");
    await expect(tabela).toBeVisible();
    await expect(tabela.locator("tbody tr")).toHaveCount(9);
    await expect(tabela).toContainText("Currículo / perfil profissional");
  });

  test("apresenta as dez regras de convivência", async ({ page }) => {
    await expect(page.getByTestId("regras").locator("> *")).toHaveCount(10);
  });

  test("mostra a governança com os três administradores", async ({ page }) => {
    await expect(page.getByTestId("admins").locator("> *")).toHaveCount(3);
    await expect(page.getByTestId("admins")).toContainText("Douglas");
  });

  test("o cabeçalho e o rodapé aparecem em todas as visitas", async ({ page }) => {
    await expect(page.getByTestId("site-header")).toBeVisible();
    await expect(page.getByTestId("site-footer")).toBeVisible();
  });

  test("os links de rede social apontam para fora e abrem em nova aba", async ({ page, isMobile }) => {
    test.skip(isMobile, "No celular os ícones ficam dentro do menu recolhido.");
    const linkedin = page.getByTestId("social-linkedin").first();
    await expect(linkedin).toHaveAttribute("target", "_blank");
    await expect(linkedin).toHaveAttribute("rel", /noopener/);
    await expect(linkedin).toHaveAttribute("href", /linkedin\.com/);
  });
});

// ─── Tema claro/escuro ───────────────────────────────────────────────────
test.describe("Alternância de tema", () => {
  test("começa no tema escuro e alterna para o claro", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");

    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", "light");

    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", "dark");
  });

  test("a escolha do tema sobrevive ao recarregamento", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("o rótulo do botão anuncia para onde o clique leva", async ({ page }) => {
    await page.goto("/");
    const botao = page.getByTestId("theme-toggle");

    await expect(botao).toHaveAttribute("aria-label", /tema claro/);
    await botao.click();
    await expect(botao).toHaveAttribute("aria-label", /tema escuro/);
  });
});

// ─── Navegação pelo menu ─────────────────────────────────────────────────
test.describe("Navegação pelo menu", () => {
  test("desktop: o menu leva às três telas e marca a rota ativa", async ({ page, isMobile }) => {
    test.skip(isMobile, "No celular o menu é o recolhido, coberto no outro teste.");
    await page.goto("/");

    await page.getByTestId("nav-manifesto").click();
    await expect(page).toHaveURL(/\/manifesto$/);
    await expect(page.getByTestId("pagina-manifesto")).toBeVisible();

    await page.getByTestId("nav-playground").click();
    await expect(page).toHaveURL(/\/playground$/);
    await expect(page.getByTestId("pagina-playground")).toBeVisible();

    await page.getByTestId("nav-home").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("pagina-home")).toBeVisible();
  });

  test("celular: o menu recolhido abre, navega e fecha sozinho", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Só faz sentido na viewport de celular.");
    await page.goto("/");

    await expect(page.getByTestId("menu-mobile")).toHaveCount(0);
    await page.getByTestId("menu-toggle").click();
    await expect(page.getByTestId("menu-mobile")).toBeVisible();

    await page.getByTestId("nav-manifesto-mobile").click();
    await expect(page).toHaveURL(/\/manifesto$/);
    await expect(page.getByTestId("menu-mobile")).toHaveCount(0);
  });

  test("o logo do cabeçalho volta para a página inicial", async ({ page }) => {
    await page.goto("/manifesto");
    await page.getByTestId("brand-link").click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("uma rota inexistente cai na página 404", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");
    await expect(page.getByTestId("pagina-404")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("não passou no teste");
  });

  test("nenhum elemento estoura a largura da tela", async ({ page }) => {
    // `overflow-x: hidden` no <html> esconde a barra de rolagem, mas o conteúdo
    // largo continua lá — e o navegador ainda rola de lado ao focar um elemento
    // cortado. Por isso medimos a borda direita de cada elemento, em vez de
    // olhar apenas o scrollWidth do documento.
    for (const rota of ["/", "/manifesto", "/playground"]) {
      await page.goto(rota);
      const estouram = await page.evaluate(() => {
        const limite = document.documentElement.clientWidth + 1;

        // Um elemento largo só é problema se ninguém o contém. Duas exceções
        // legítimas: as formas internas dos SVGs decorativos, recortadas pelo
        // próprio <svg>, e o conteúdo de containers com rolagem horizontal
        // própria (a tabela larga dentro de .qa-tabela-scroll).
        const contido = (el) => {
          for (let pai = el.parentElement; pai && pai !== document.body; pai = pai.parentElement) {
            const overflowX = getComputedStyle(pai).overflowX;
            if (overflowX === "auto" || overflowX === "scroll") {
              return pai.getBoundingClientRect().right <= limite;
            }
          }
          return false;
        };

        return [...document.querySelectorAll("body *")]
          .filter((el) => {
            if (el.ownerSVGElement) return false;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.right <= limite) return false;
            return !contido(el);
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${el.getAttribute("class") || "(sem classe)"}`);
      });
      expect(estouram, `elementos estourando em ${rota}`).toEqual([]);
    }
  });
});
