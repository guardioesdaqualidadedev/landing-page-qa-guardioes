// Usabilidade para quem navega só pelo teclado — o mesmo caminho que o NVDA
// usa no modo de foco. Os dois primeiros cenários são os defeitos relatados
// em outubro/2026 (o Tab que pulava seis seções e a dúvida sobre o grupo de
// prioridade); o resto garante que o foco é sempre visível, previsível e
// alcançável.
import { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } from "./suporte/bdd.js";
import { focoAtual, detalheDoFoco, navegar, apertar, quebrasDeOrdemVisual } from "./suporte/teclado.js";

// Roda no navegador: mede o indicador de foco do elemento focado e o contraste
// dele contra o fundo EM VOLTA (o contorno é desenhado fora do elemento, sobre
// o fundo do ancestral). WCAG 1.4.11: pelo menos 3:1.
function medirIndicadorDeFoco() {
  const el = document.activeElement;
  // A borda dos campos anima ao receber foco: mede o estado final.
  for (const a of el.getAnimations()) a.finish();
  const cs = getComputedStyle(el);
  const ler = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const canal = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = (c) => 0.2126 * canal(c.r) + 0.7152 * canal(c.g) + 0.0722 * canal(c.b);
  const contraste = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const sobre = (cima, baixo) => ({
    r: cima.r * cima.a + baixo.r * (1 - cima.a),
    g: cima.g * cima.a + baixo.g * (1 - cima.a),
    b: cima.b * cima.a + baixo.b * (1 - cima.a),
    a: 1,
  });

  // Fundo atrás do contorno: compõe as camadas dos ancestrais até uma opaca.
  // Um gradiente (a chamada final laranja) conta pelas cores das pontas.
  const camadas = [];
  let fundos = null;
  for (let p = el.parentElement; p; p = p.parentElement) {
    const pcs = getComputedStyle(p);
    if (pcs.backgroundImage.includes("gradient")) {
      fundos = [...pcs.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map((m) => ler(m[0]));
      break;
    }
    const cor = ler(pcs.backgroundColor);
    if (cor && cor.a > 0) {
      camadas.push(cor);
      if (cor.a >= 1) break;
    }
  }
  if (!fundos) fundos = [camadas.reverse().reduce((base, c) => sobre(c, base), { r: 255, g: 255, b: 255, a: 1 })];

  // O indicador é o outline — ou, nos campos de formulário, a borda somada ao
  // anel sólido do box-shadow (veja .qa-input:focus em App.jsx).
  let cor = null;
  let largura = 0;
  if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) {
    cor = ler(cs.outlineColor);
    largura = parseFloat(cs.outlineWidth);
  } else {
    const anel = cs.boxShadow.match(/(rgba?\([^)]+\))\s+0px\s+0px\s+0px\s+(\d+(?:\.\d+)?)px/);
    if (anel && ler(anel[1])?.a === 1) {
      cor = ler(anel[1]);
      largura = parseFloat(anel[2]) + parseFloat(cs.borderTopWidth);
    }
  }
  return {
    largura,
    razao: cor ? Math.round(Math.min(...fundos.map((f) => contraste(cor, f))) * 100) / 100 : 0,
  };
}

const ULTIMO_LINK = /^a: Certificado do playground$/;

funcionalidade("Usabilidade com teclado", () => {
  cenario('Do botão "Abrir o Playground QA", o Tab passa por todas as seções da página, em ordem', [
    Dado('que abro a página inicial e estou no botão "Abrir o Playground QA"', async ({ page, legenda }) => {
      await abrirPagina(page);
      await page.getByTestId("cta-playground").focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando("aperto Tab até o primeiro link dos cartões da governança", async ({ page, legenda, mundo }) => {
      mundo.paradas = await navegar(page, legenda, "Tab", (f) => /LinkedIn de Douglas/.test(f), 20, { detalhes: true });
    }),
    Entao("o foco para no título de cada seção, na ordem da página — sem pular nenhuma", async ({ mundo }) => {
      expect(mundo.paradas.map((p) => p.descricao)).toEqual([
        "h2: Aprender com prática real, sem hierarquia",
        "h2: Seis objetivos, cada um com o canal que o sustenta",
        "h2: Duas plataformas, papéis diferentes",
        "h2: A tabela que resolve a dúvida",
        "h2: O que você busca e o que a gente entrega",
        "h2: Dez regras que cabem em uma tela",
        "h2: Quem cuida de quê",
        "a: LinkedIn de Douglas (abre em nova aba)",
      ]);
    }),
    E("cada parada fica abaixo da anterior na tela: o foco nunca volta para cima", async ({ mundo }) => {
      expect(quebrasDeOrdemVisual(mundo.paradas)).toEqual([]);
    }),
    E("cada parada aparece inteira na tela, sem nada por cima", async ({ mundo }) => {
      expect(mundo.paradas.filter((p) => !p.naTela || !p.visivelNoCentro).map((p) => p.descricao)).toEqual([]);
    }),
  ]);

  cenario("No formulário, a prioridade é uma parada só: o Tab entra, as setas escolhem e o Tab sai", [
    Dado('que abro o Playground e estou no campo "Ocorrências"', async ({ page, legenda }) => {
      await abrirPagina(page, "/playground");
      await page.getByTestId("input-ocorrencias").focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando("aperto Tab", async ({ page, legenda, mundo }) => {
      mundo.foco = await apertar(page, legenda, "Tab");
    }),
    Entao("o foco entra no grupo pela primeira opção, ainda sem marcar nenhuma", async ({ page, mundo }) => {
      expect(mundo.foco).toBe("radio: Prioridade › P1 imediata");
      for (const p of ["P1", "P2", "P3"]) await expect(page.getByTestId(`radio-prioridade-${p}`)).not.toBeChecked();
    }),
    E('a instrução das setas está escrita logo abaixo de "Prioridade"', async ({ page }) => {
      await expect(page.getByTestId("dica-prioridade")).toBeVisible();
      await expect(page.getByTestId("dica-prioridade")).toHaveText(
        "Use as setas do teclado para escolher a prioridade. O Tab segue para o próximo campo."
      );
    }),
    Quando("aperto a seta para a direita duas vezes", async ({ page, legenda }) => {
      await apertar(page, legenda, "ArrowRight");
      await apertar(page, legenda, "ArrowRight");
    }),
    Entao('o foco e a marcação vão para "P3 backlog"', async ({ page }) => {
      await expect(page.getByTestId("radio-prioridade-P3")).toBeFocused();
      await expect(page.getByTestId("radio-prioridade-P3")).toBeChecked();
    }),
    E("mais uma seta dá a volta até a primeira opção, e a seta para cima volta uma", async ({ page, legenda }) => {
      await apertar(page, legenda, "ArrowRight");
      await expect(page.getByTestId("radio-prioridade-P1")).toBeChecked();
      await apertar(page, legenda, "ArrowUp");
      await expect(page.getByTestId("radio-prioridade-P3")).toBeChecked();
    }),
    Quando("aperto Tab", async ({ page, legenda, mundo }) => {
      mundo.foco = await apertar(page, legenda, "Tab");
    }),
    Entao('o foco vai direto para "Passos para reproduzir", sem parar nas outras opções', async ({ mundo }) => {
      expect(mundo.foco).toBe("textarea: Passos para reproduzir");
    }),
    E("o Shift+Tab volta para a opção marcada", async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Shift+Tab")).toBe("radio: Prioridade › P3 backlog");
    }),
  ]);

  cenario('No topo da página, a ordem do Tab segue a ordem visual', [
    Dado("que abro a página inicial", async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('aperto Tab até o botão "Abrir o Playground QA"', async ({ page, legenda, mundo }) => {
      mundo.paradas = await navegar(page, legenda, "Tab", (f) => /Abrir o Playground QA/.test(f), 20, { detalhes: true });
    }),
    Entao("o foco passa pelo atalho, pela marca, pelo menu, pelas redes, pelo tema e pelos botões do topo", async ({ mundo }) => {
      expect(mundo.paradas.map((p) => p.descricao)).toEqual([
        "a: Pular para o conteúdo",
        "a: QA Guardiões — Qualidade de Software, página inicial",
        "a: A comunidade",
        "a: Manifesto",
        "a: Playground QA",
        "a: Servidor no Discord (abre em nova aba)",
        "a: Comunidade no WhatsApp (abre em nova aba)",
        "a: Página no LinkedIn (abre em nova aba)",
        "a: Código da comunidade no GitHub (abre em nova aba)",
        "button: Mudar para o tema claro",
        "a: Entrar no Discord (abre em nova aba)",
        "a: Ler o Manifesto",
        "a: Abrir o Playground QA",
      ]);
    }),
    E("na tela, cada parada vem depois da anterior — da esquerda para a direita, de cima para baixo", async ({ mundo }) => {
      expect(quebrasDeOrdemVisual(mundo.paradas)).toEqual([]);
    }),
  ]);

  cenario('O formulário inteiro segue a ordem visual, do título até "Limpar formulário"', [
    Dado('que abro o Playground e estou no título "Registrar defeito"', async ({ page, legenda }) => {
      await abrirPagina(page, "/playground");
      await page.locator("#formulario-titulo").focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando('aperto Tab até "Limpar formulário"', async ({ page, legenda, mundo }) => {
      mundo.paradas = await navegar(page, legenda, "Tab", (f) => /Limpar formulário/.test(f), 30, { detalhes: true });
    }),
    Entao("o foco passa por todos os campos, um de cada vez, e o grupo de prioridade é uma parada só", async ({ mundo }) => {
      expect(mundo.paradas.map((p) => p.descricao)).toEqual([
        "input: Título do defeito",
        "select: Módulo afetado",
        "select: Severidade",
        "select: Ambiente",
        "input: E-mail de quem reportou",
        "input: Data de detecção",
        "input: Ocorrências",
        "radio: Prioridade › P1 imediata",
        "textarea: Passos para reproduzir",
        expect.stringMatching(/^checkbox: Confirmo que este relato não contém token/),
        "button: Registrar defeito",
        "button: Limpar formulário",
      ]);
    }),
    E("na tela, cada campo vem depois do anterior — da esquerda para a direita, de cima para baixo", async ({ mundo }) => {
      expect(quebrasDeOrdemVisual(mundo.paradas)).toEqual([]);
    }),
  ]);

  cenario("As abas do Playground: só a aba ativa entra no Tab e as setas trocam de aba", [
    Dado('que abro o Playground e estou na aba "Registrar defeito"', async ({ page, legenda }) => {
      await abrirPagina(page, "/playground");
      await page.getByTestId("aba-registrar").focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando("aperto Tab", async ({ page, legenda, mundo }) => {
      mundo.foco = await apertar(page, legenda, "Tab");
    }),
    Entao('o foco pula as outras abas e vai para "Restaurar massa de dados"', async ({ mundo }) => {
      expect(mundo.foco).toBe("button: Restaurar massa de dados");
    }),
    Quando("volto com Shift+Tab e aperto a seta para a direita", async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Shift+Tab")).toBe("tab: Registrar defeito");
      await apertar(page, legenda, "ArrowRight");
    }),
    Entao('a aba "Tabela de defeitos" recebe o foco e já mostra o painel', async ({ page }) => {
      await expect(page.getByTestId("aba-tabela")).toBeFocused();
      await expect(page.getByTestId("aba-tabela")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("area-tabela")).toBeVisible();
    }),
    E('End vai para "Certificado", Home volta para "Registrar defeito" e a seta para a esquerda dá a volta', async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "End")).toBe("tab: Certificado");
      expect(await apertar(page, legenda, "Home")).toBe("tab: Registrar defeito");
      expect(await apertar(page, legenda, "ArrowLeft")).toBe("tab: Certificado");
      await expect(page.getByTestId("area-certificacao")).toBeVisible();
    }),
  ]);

  for (const { tela, caminho } of [{ tela: "página inicial", caminho: "/" }, { tela: "Playground", caminho: "/playground" }]) {
    for (const tema of ["dark", "light"]) {
      const nomeTema = tema === "dark" ? "escuro" : "claro";
      cenario(`Na ${tela}, no tema ${nomeTema}, todo foco tem contorno visível com contraste de 3:1`, [
        Dado(`que abro a ${tela} no tema ${nomeTema}`, async ({ page }) => {
          await abrirPagina(page, caminho, { tema });
        }),
        Quando("percorro a tela inteira com Tab, até o último link do rodapé", async ({ page, legenda, mundo }) => {
          mundo.medidas = [];
          for (let i = 0; i < 120; i++) {
            await page.keyboard.press("Tab");
            const foco = await focoAtual(page);
            if (foco === mundo.medidas.at(-1)?.foco) continue;
            const { largura, razao } = await page.evaluate(medirIndicadorDeFoco);
            mundo.medidas.push({ foco, largura, razao });
            await legenda.foco(`${largura >= 2 && razao >= 3 ? "✓" : "✗"} ${razao}:1 — ${foco}`);
            if (ULTIMO_LINK.test(foco)) break;
          }
        }),
        Entao("o Tab chega ao fim da página, sem ficar preso em lugar nenhum", async ({ mundo }) => {
          expect(mundo.medidas.at(-1).foco).toMatch(ULTIMO_LINK);
        }),
        E("todo elemento focado ganha um contorno de pelo menos 2 px", async ({ mundo }) => {
          expect(mundo.medidas.filter((m) => m.largura < 2).map((m) => m.foco)).toEqual([]);
        }),
        E("e o contorno tem pelo menos 3:1 de contraste contra o fundo em volta (WCAG 1.4.11)", async ({ mundo, testInfo }) => {
          await testInfo.attach("contraste do contorno de foco.txt", {
            body: mundo.medidas.map((m) => `${m.razao.toFixed(2)}:1  ${m.largura}px  ${m.foco}`).join("\n"),
            contentType: "text/plain",
          });
          expect(mundo.medidas.filter((m) => m.razao < 3).map((m) => `${m.foco} (${m.razao}:1)`)).toEqual([]);
        }),
      ]);
    }
  }

  cenario("Com a animação de entrada ligada, a seção que recebe o foco aparece na tela", [
    Dado("que o sistema NÃO pede menos movimento e abro a página inicial", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await abrirPagina(page);
    }),
    Quando('saio do botão "Abrir o Playground QA" com três Tabs rápidos', async ({ page, legenda }) => {
      await page.getByTestId("cta-playground").focus();
      for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
      await legenda.foco(await focoAtual(page));
    }),
    Entao('o foco está no título "Duas plataformas, papéis diferentes"', async ({ page }) => {
      await expect(page.locator("#canais-titulo")).toBeFocused();
    }),
    E("depois da animação, o título e tudo em volta dele estão 100% visíveis", async ({ page }) => {
      await expect
        .poll(() =>
          page.evaluate(() => {
            let opacidade = 1;
            for (let el = document.activeElement; el; el = el.parentElement) opacidade *= Number(getComputedStyle(el).opacity);
            return opacidade;
          })
        )
        .toBe(1);
      expect((await detalheDoFoco(page)).visivelNoCentro).toBe(true);
    }),
  ]);

  cenario("Alvos de clique e toque têm pelo menos 24×24 px (WCAG 2.5.8)", [
    Dado("que vou medir as telas com mais controles", async ({ mundo }) => {
      mundo.pequenos = [];
    }),
    Quando("meço botões, links, campos e abas da página inicial e de cada aba do Playground", async ({ page, mundo }) => {
      const telas = [
        ["início", "/", null],
        ["registrar", "/playground", null],
        ["tabela", "/playground", async () => {
          await page.getByTestId("aba-tabela").click();
          await page.getByTestId("excluir-BUG-1001").click();
        }],
        ["cenários", "/playground", async () => page.getByTestId("aba-cenarios").click()],
        ["certificado", "/playground", async () => page.getByTestId("aba-certificado").click()],
      ];
      for (const [nome, caminho, preparar] of telas) {
        await abrirPagina(page, caminho);
        if (preparar) await preparar();
        const pequenos = await page.evaluate(() =>
          [...document.querySelectorAll('a[href], button, summary, select, input, textarea, [role="tab"]')]
            .filter((e) => !e.closest("#qa-legenda") && e.getClientRects().length && !e.classList.contains("qa-skip"))
            // Rádio e caixa de seleção: o alvo é o rótulo inteiro, que também marca a opção.
            .map((e) => ({ e, alvo: ["radio", "checkbox"].includes(e.type) && e.closest("label") ? e.closest("label") : e }))
            // Exceção da própria WCAG: link dentro de uma frase.
            .filter(({ e }) => !(e.tagName === "A" && getComputedStyle(e).display === "inline" && e.closest("p, li, td")))
            .map(({ e, alvo }) => ({ nome: (e.getAttribute("aria-label") || e.textContent || e.name || e.id).trim().slice(0, 40), r: alvo.getBoundingClientRect() }))
            .filter(({ r }) => r.width < 24 || r.height < 24)
            .map(({ nome, r }) => `${nome} (${Math.round(r.width)}×${Math.round(r.height)})`)
        );
        mundo.pequenos.push(...pequenos.map((p) => `${nome}: ${p}`));
      }
    }),
    Entao("nenhum é menor que 24×24 px", async ({ mundo }) => {
      expect(mundo.pequenos).toEqual([]);
    }),
  ]);

  cenario("No celular, o menu abre com Enter, o Tab entra nos itens e o Esc fecha devolvendo o foco", [
    Dado("que abro a página inicial numa tela de celular", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await abrirPagina(page);
    }),
    Quando('estou no botão "Menu de navegação" e aperto Enter', async ({ page, legenda }) => {
      await page.getByTestId("menu-toggle").focus();
      await legenda.foco(await focoAtual(page));
      await page.keyboard.press("Enter");
    }),
    Entao("o menu abre e o botão anuncia que está expandido", async ({ page }) => {
      await expect(page.getByTestId("menu-mobile")).toBeVisible();
      await expect(page.getByTestId("menu-toggle")).toHaveAttribute("aria-expanded", "true");
    }),
    E('o Tab entra no primeiro item do menu, "A comunidade"', async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Tab")).toBe("a: A comunidade");
    }),
    Quando("aperto Esc", async ({ page, legenda }) => {
      await apertar(page, legenda, "Escape");
    }),
    Entao("o menu fecha e o foco volta para o botão que o abriu", async ({ page }) => {
      await expect(page.getByTestId("menu-mobile")).toBeHidden();
      await expect(page.getByTestId("menu-toggle")).toBeFocused();
      await expect(page.getByTestId("menu-toggle")).toHaveAttribute("aria-expanded", "false");
    }),
  ]);

  cenario('O link "Certificado do playground" do rodapé abre a aba Certificado e põe o foco nela', [
    Dado("que abro a página inicial", async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('chego ao link "Certificado do playground" do rodapé e aperto Enter', async ({ page, legenda }) => {
      await page.getByRole("link", { name: "Certificado do playground" }).focus();
      await legenda.foco(await focoAtual(page));
      await page.keyboard.press("Enter");
    }),
    Entao("o Playground abre já na aba Certificado", async ({ page }) => {
      await expect(page).toHaveURL(/\/playground#certificado$/);
      await expect(page.getByTestId("aba-certificado")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("area-certificacao")).toBeVisible();
    }),
    E("o foco está na aba Certificado, visível na tela", async ({ page, legenda }) => {
      await expect(page.getByTestId("aba-certificado")).toBeFocused();
      await expect(page.getByTestId("aba-certificado")).toBeInViewport();
      await legenda.foco(await focoAtual(page));
    }),
  ]);

  cenario('O link "Parceiros" do rodapé leva o foco ao título da seção, vindo de outra tela', [
    Dado("que abro o Manifesto", async ({ page }) => {
      await abrirPagina(page, "/manifesto");
    }),
    Quando('chego ao link "Parceiros" do rodapé e aperto Enter', async ({ page, legenda }) => {
      await page.getByRole("contentinfo").getByRole("link", { name: "Parceiros", exact: true }).focus();
      await legenda.foco(await focoAtual(page));
      await page.keyboard.press("Enter");
    }),
    Entao("a página inicial abre na seção de parceiros, com o foco no título dela", async ({ page, legenda }) => {
      await expect(page).toHaveURL(/\/#parceiros$/);
      await expect(page.locator("#parceiros-titulo")).toBeFocused();
      await expect(page.locator("#parceiros-titulo")).toBeInViewport();
      await legenda.foco(await focoAtual(page));
    }),
    E("o próximo Tab vai para o primeiro link do parceiro", async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Tab")).toBe("a: Site do projeto (abre em nova aba)");
    }),
  ]);

  cenario("Depois de trocar de tela pelo menu, o Tab continua da tela nova", [
    Dado("que abro a página inicial", async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('chego ao link "Playground QA" do menu e aperto Enter', async ({ page, legenda }) => {
      await page.getByTestId("nav-playground").focus();
      await legenda.foco(await focoAtual(page));
      await page.keyboard.press("Enter");
    }),
    Entao("o foco vai para o título da tela nova", async ({ page }) => {
      await expect(page.locator("#playground-titulo")).toBeFocused();
    }),
    E('o próximo Tab vai para a primeira aba, e não de volta ao menu', async ({ page, legenda }) => {
      expect(await apertar(page, legenda, "Tab")).toBe("tab: Registrar defeito");
    }),
  ]);

  cenario('Com "reduzir movimento" ligado, nada fica escondido esperando animação', [
    Dado("que o sistema pede menos movimento e abro a página inicial", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await abrirPagina(page);
    }),
    Entao("nenhum bloco da página nasce transparente nem com transição de entrada", async ({ page }) => {
      const animados = await page.evaluate(() =>
        [...document.querySelectorAll("main [style*='opacity']")]
          // Opacidade parcial de propósito (fundos decorativos, um texto a 92%)
          // é design; o que não pode haver é bloco invisível ou com fade.
          .filter((e) => {
            const cs = getComputedStyle(e);
            // O reset de "reduzir movimento" deixa 0,01ms (técnica padrão): tudo
            // abaixo de 50ms é instantâneo para quem olha.
            const anima = /opacity|all/.test(cs.transitionProperty) && cs.transitionDuration.split(",").some((d) => parseFloat(d) > 0.05);
            return cs.opacity === "0" || anima;
          })
          .map((e) => e.textContent.trim().slice(0, 40))
      );
      expect(animados).toEqual([]);
    }),
  ]);

  cenario("A escolha de tema feita pelo teclado continua valendo depois de recarregar", [
    Dado("que abro a página inicial no tema escuro", async ({ page }) => {
      await abrirPagina(page, "/", { tema: "dark" });
    }),
    Quando("troco para o tema claro com o teclado", async ({ page, legenda }) => {
      await page.getByTestId("theme-toggle").focus();
      await legenda.foco(await focoAtual(page));
      await page.keyboard.press("Enter");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    }),
    E("recarrego a página", async ({ page }) => {
      await page.reload();
    }),
    Entao("o tema claro continua ativo e o botão oferece o tema escuro", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      await expect(page.getByRole("button", { name: "Mudar para o tema escuro" })).toBeVisible();
    }),
  ]);
});
