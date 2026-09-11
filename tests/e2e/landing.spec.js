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

  test("mostra a governança com os quatro administradores", async ({ page }) => {
    const admins = page.getByTestId("admins");
    await expect(admins.locator("> *")).toHaveCount(4);
    for (const nome of ["Douglas", "Camila", "Amanda", "Patrícia"]) {
      await expect(admins).toContainText(nome);
    }
  });

  test("cada administrador tem o próprio link de LinkedIn", async ({ page }) => {
    const esperado = {
      douglas: "douglas-adriano-queiroz",
      camila: "camila-lopes-ferreira",
      amanda: "amanda-marino",
      patricia: "patricia-silva-correa",
    };

    for (const [quem, trecho] of Object.entries(esperado)) {
      const icone = page.getByTestId(`admin-linkedin-${quem}`);
      await expect(icone).toHaveAttribute("href", new RegExp(trecho));
      await expect(icone).toHaveAttribute("target", "_blank");
      await expect(icone).toHaveAttribute("rel", /noopener/);
    }
  });

  test("Amanda aparece como liderança de Design", async ({ page }) => {
    await expect(page.getByTestId("admins")).toContainText("Liderança de Design");
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

  test("os quatro canais oficiais estão no cabeçalho, com o convite certo", async ({ page, isMobile }) => {
    test.skip(isMobile, "No celular os ícones ficam dentro do menu recolhido.");

    // Convites e perfil oficiais — se algum voltar a ser um link genérico
    // (discord.gg sem código, por exemplo), este teste acusa.
    const esperado = {
      discord: /discord\.gg\/7aA3C2MxzD/,
      whatsapp: /chat\.whatsapp\.com\/I5iW4tCcwcj5Ng1OxRsgPr/,
      linkedin: /linkedin\.com\/company\/guardioesqa/,
      github: /github\.com\/guardioesdaqualidadedev/,
    };

    for (const [rede, padrao] of Object.entries(esperado)) {
      const icone = page.getByTestId(`social-${rede}`).first();
      await expect(icone, `ícone de ${rede}`).toBeVisible();
      await expect(icone, `link de ${rede}`).toHaveAttribute("href", padrao);
      await expect(icone).toHaveAttribute("target", "_blank");
    }
  });

  test("o rodapé repete os canais, incluindo o GitHub", async ({ page }) => {
    const rodape = page.getByTestId("site-footer");
    await expect(rodape.getByRole("link", { name: "Código no GitHub" })).toHaveAttribute(
      "href",
      /github\.com\/guardioesdaqualidadedev/
    );
    await expect(rodape.getByRole("link", { name: "Servidor no Discord" })).toHaveAttribute(
      "href",
      /discord\.gg\/7aA3C2MxzD/
    );
    await expect(rodape.getByRole("link", { name: "Comunidade no WhatsApp" })).toHaveAttribute(
      "href",
      /chat\.whatsapp\.com\/I5iW4tCcwcj5Ng1OxRsgPr/
    );
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

  test("o cabeçalho não estoura nas larguras entre celular e desktop", async ({ page, isMobile }) => {
    test.skip(isMobile, "Aqui a viewport é controlada pelo próprio teste.");
    await page.goto("/");

    // A suíte mede em 1280px e em 390px. A faixa do meio — tablet em pé e
    // janela reduzida — não era coberta por ninguém, e foi exatamente onde o
    // cabeçalho passava a rolar de lado.
    for (const largura of [821, 860, 899, 900, 1024]) {
      await page.setViewportSize({ width: largura, height: 800 });
      const estoura = await page.evaluate(() => {
        const limite = document.documentElement.clientWidth + 1;
        const cabecalho = document.querySelector('[data-testid="site-header"]');
        return [...cabecalho.querySelectorAll("*")]
          .filter((el) => !el.ownerSVGElement && el.getBoundingClientRect().right > limite)
          .map((el) => el.tagName.toLowerCase() + "." + (el.getAttribute("class") || "(sem classe)"))
          .slice(0, 3);
      });
      expect(estoura, `cabeçalho estourando em ${largura}px`).toEqual([]);
    }
  });
});

// ─── Parceiros ───────────────────────────────────────────────────────────
test.describe("Seção de parceiros", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("fica logo acima do rodapé", async ({ page }) => {
    const secao = page.getByTestId("secao-parceiros");
    await expect(secao).toBeVisible();

    // Nada além do rodapé pode vir depois dela na ordem do documento.
    const ehUltima = await page.evaluate(() => {
      const parceiros = document.querySelector('[data-testid="secao-parceiros"]');
      const rodape = document.querySelector('[data-testid="site-footer"]');
      // Node.DOCUMENT_POSITION_FOLLOWING = 4 → o rodapé vem depois dos parceiros.
      return Boolean(parceiros.compareDocumentPosition(rodape) & 4);
    });
    expect(ehUltima).toBe(true);
  });

  test("é um carrossel e mostra o Projeto Social Garapuvu", async ({ page }) => {
    const carrossel = page.getByTestId("carrossel-parceiros");
    await expect(carrossel).toHaveAttribute("aria-roledescription", "carrossel");
    await expect(page.getByTestId("parceiro-garapuvu")).toBeVisible();
    await expect(page.getByTestId("parceiro-garapuvu")).toContainText("Projeto Social Garapuvu");
  });

  test("com um parceiro só, não há setas nem indicadores", async ({ page }) => {
    // Seta desabilitada é alvo morto: com um item, os controles não existem.
    await expect(page.getByTestId("parceiros-controles")).toHaveCount(0);
    await expect(page.getByTestId("parceiros-lista").locator("> li")).toHaveCount(1);
  });

  test("os links do parceiro abrem fora e apontam para site e YouTube", async ({ page }) => {
    const site = page.getByTestId("parceiro-garapuvu-site");
    const youtube = page.getByTestId("parceiro-garapuvu-youtube");

    for (const link of [site, youtube]) {
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
    await expect(youtube).toHaveAttribute("href", /youtube\.com\/channel\/UCST9VOQUtVUC2A2enxcJsQQ/);
    // O site do parceiro tem de sair do nosso domínio: já apontou por engano
    // para a landing da própria comunidade.
    await expect(site).toHaveAttribute("href", /projeto-garapuvu\.web\.app/);
  });
});

// ─── Contador de visitas ─────────────────────────────────────────────────
test.describe("Contador de visitas", () => {
  test("quando aparece, está no rodapé e não no cabeçalho", async ({ page }) => {
    await page.goto("/");

    const contador = page.getByTestId("visitor-count");
    // Sem `.env` de Firebase o contador não renderiza — e isso é esperado.
    // O que NUNCA pode acontecer é ele voltar para o topo.
    await expect(page.getByTestId("site-header").getByTestId("visitor-count")).toHaveCount(0);

    if ((await contador.count()) > 0) {
      await expect(page.getByTestId("site-footer").getByTestId("visitor-count")).toBeVisible();
      await expect(contador).toContainText(/visitas?/);
    }
  });
});

// ─── Arte que acompanha o tema ───────────────────────────────────────────
test.describe("Logo e banner por tema", () => {
  test("o símbolo da marca troca de versão junto com o tema", async ({ page }) => {
    await page.goto("/");

    const simbolo = page.getByTestId("brand-simbolo").first();
    await expect(simbolo).toHaveAttribute("data-variante", "escuro");
    const arteEscura = await simbolo.getAttribute("src");

    await page.getByTestId("theme-toggle").click();
    await expect(simbolo).toHaveAttribute("data-variante", "claro");
    const arteClara = await simbolo.getAttribute("src");

    // O ponto do pedido: hoje o logo era o MESMO arquivo nos dois temas.
    expect(arteClara).not.toBe(arteEscura);
  });

  test("o banner da marca troca de versão junto com o tema", async ({ page }) => {
    await page.goto("/");

    const banner = page.getByTestId("banner-marca");
    await banner.scrollIntoViewIfNeeded();
    await expect(banner).toHaveAttribute("data-variante", "escuro");
    const arteEscura = await banner.locator("img").getAttribute("src");

    await page.getByTestId("theme-toggle").click();
    await expect(banner).toHaveAttribute("data-variante", "claro");
    expect(await banner.locator("img").getAttribute("src")).not.toBe(arteEscura);
  });
});

test.describe("Landing — syllabus CTFL", () => {
  test("divulga os seis capítulos e o PDF oficial", async ({ page }) => {
    await page.goto("/");

    const secao = page.getByTestId("syllabus");
    await expect(secao).toBeVisible();
    await expect(page.getByTestId("syllabus-capitulos").locator("> li")).toHaveCount(6);
    await expect(page.getByTestId("syllabus-exame")).toContainText("40");

    // O botão principal aponta para o PDF em português, e abre em outra aba.
    const pdf = page.getByTestId("syllabus-pdf");
    await expect(pdf).toHaveAttribute("href", /\.pdf$/);
    await expect(pdf).toHaveAttribute("target", "_blank");
  });

  test("repete o syllabus no rodapé", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("footer-syllabus-pdf")).toHaveAttribute("href", /\.pdf$/);
  });
});
