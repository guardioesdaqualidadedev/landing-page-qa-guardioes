import { test, expect } from "@playwright/test";
import { legendaNaTela } from "../support/legenda.js";
import { prepararLeitor, ligarLeitor, desligarLeitor, falas, proximaFala } from "../support/leitor.js";

// ─────────────────────────────────────────────────────────────────────────────
// Cadastro de defeito — o campo Prioridade, ouvido por um leitor de tela.
//
// Um cenário só, contado em etapas: o leitor lê o grupo, a pessoa envia sem
// escolher a prioridade, o erro é anunciado na opção que recebeu o foco, a
// seta troca a opção e o defeito é registrado.
//
// Na suíte normal roda como qualquer teste. No modo demonstração
// (`npm run test:demo:prioridade`) cada etapa e cada frase do leitor aparecem
// numa faixa de legenda na própria página, com uma pausa de PW_SLOWMO entre
// elas — a mesma variável que dá o slowMo das ações.
// ─────────────────────────────────────────────────────────────────────────────

const DEMO = process.env.PW_DEMO === "1";
const PAUSA = DEMO ? Number(process.env.PW_SLOWMO || 1500) : 0;

const DEFEITO_SEM_PRIORIDADE = {
  titulo: "Botão Salvar não responde no Safari",
  modulo: "Login",
  severidade: "Alta",
  ambiente: "Produção",
  reporter: "douglas@guardioes.dev",
  data: "2026-09-01",
  ocorrencias: "3",
  passos: "1. Abrir a tela de cadastro. 2. Clicar em Salvar. 3. Observar que nada acontece.",
};

const DICA = "Use as setas do teclado para escolher a prioridade. O Tab segue para o próximo campo.";

// Uma etapa do roteiro: vira test.step no relatório e legenda na tela.
async function etapa(page, titulo, corpo) {
  await test.step(titulo, async () => {
    await legendaNaTela(page, { etapa: titulo });
    await page.waitForTimeout(PAUSA);
    await corpo();
  });
}

// Mostra as frases do leitor, uma por vez, no ritmo da gravação.
async function mostrarFalas(page, lista) {
  for (const fala of lista) {
    await legendaNaTela(page, { fala });
    await page.waitForTimeout(PAUSA);
  }
}

// Avança o cursor do leitor até a frase que bate com `padrao`.
async function lerAte(page, padrao, limite = 20) {
  for (let i = 0; i < limite; i++) {
    const fala = await proximaFala(page);
    await mostrarFalas(page, [fala]);
    if (padrao.test(fala)) return fala;
  }
  throw new Error(`o leitor não chegou em ${padrao} depois de ${limite} itens`);
}

test.describe("Cadastro de defeito — campo Prioridade com leitor de tela", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, "Leitor de tela com as setas do teclado é cenário de desktop.");
  });

  test("o leitor anuncia o grupo, o erro e a opção escolhida até o registro", async ({ page }) => {
    const grupo = page.getByTestId("grupo-prioridade");

    await etapa(page, "1. Abrir o Playground na aba Registrar defeito", async () => {
      await prepararLeitor(page);
      await page.goto("/playground");
      await expect(page.getByTestId("aba-registrar")).toHaveAttribute("aria-selected", "true");
      await grupo.scrollIntoViewIfNeeded();
    });

    await etapa(page, "2. O leitor de tela percorre o grupo Prioridade", async () => {
      await ligarLeitor(page, '[data-testid="grupo-prioridade"]');
      await mostrarFalas(page, await falas(page));
      await lerAte(page, /^radio, P3 backlog/);

      // O grupo tem nome (fieldset + legend), a dica é lida em cada opção e a
      // posição "1 de 3" mostra que as três opções formam um só grupo.
      const lidas = await falas(page);
      expect(lidas).toContain("group, Prioridade");
      expect(lidas).toContain(DICA);
      expect(lidas).toContainEqual(expect.stringMatching(/^radio, P1 imediata, .*not checked, position 1, set size 3$/));
      expect(lidas).toContainEqual(expect.stringMatching(/^radio, P2 próxima sprint, .*position 2, set size 3$/));
      await desligarLeitor(page);
    });

    await etapa(page, "3. Preencher o cadastro e deixar a Prioridade em branco", async () => {
      const d = DEFEITO_SEM_PRIORIDADE;
      await page.getByTestId("input-titulo").fill(d.titulo);
      await page.getByTestId("select-modulo").selectOption(d.modulo);
      await page.getByTestId("select-severidade").selectOption(d.severidade);
      await page.getByTestId("select-ambiente").selectOption(d.ambiente);
      await page.getByTestId("input-reporter").fill(d.reporter);
      await page.getByTestId("input-data").fill(d.data);
      await page.getByTestId("input-ocorrencias").fill(d.ocorrencias);
      await page.getByTestId("input-passos").fill(d.passos);
      await page.getByTestId("check-aceite").check();
    });

    await etapa(page, "4. Registrar sem prioridade: o foco vai para P1 e o erro é anunciado", async () => {
      await ligarLeitor(page, '[data-testid="formulario-defeito"]');
      await page.getByTestId("btn-registrar").click();

      await expect(page.getByTestId("resumo-erros")).toContainText("1 campo precisa de atenção");
      await expect(page.getByTestId("campo-prioridade-erro")).toHaveText("Selecione a prioridade.");
      await expect(page.getByTestId("radio-prioridade-P1")).toBeFocused();

      // O erro entra no aria-describedby da opção: quem não enxerga ouve o
      // motivo junto com o campo, sem precisar procurar a mensagem.
      await expect
        .poll(() => falas(page))
        .toContainEqual(expect.stringMatching(/^radio, P1 imediata, Selecione a prioridade\. Use as setas/));
      await expect.poll(() => falas(page)).toContain("assertive: 1 campo precisa de atenção antes de registrar.");
      await mostrarFalas(page, await falas(page));
    });

    await etapa(page, "5. Escolher P2 com a seta para a direita", async () => {
      const antes = (await falas(page)).length;
      await page.keyboard.press("ArrowRight");

      await expect(page.getByTestId("radio-prioridade-P2")).toBeChecked();
      await expect(page.getByTestId("radio-prioridade-P2")).toBeFocused();
      await expect(page.getByTestId("campo-prioridade-erro")).toHaveCount(0);

      await expect.poll(() => falas(page)).toContainEqual(expect.stringMatching(/^radio, P2 próxima sprint/));
      await mostrarFalas(page, (await falas(page)).slice(antes));
    });

    await etapa(page, "6. A árvore de acessibilidade do navegador confirma P2 marcada", async () => {
      // Aqui o leitor virtual não serve de prova: ele lê o ATRIBUTO `checked`,
      // e o React marca a opção pela PROPRIEDADE — ele diria "not checked"
      // para P2. Quem responde pelo estado é a árvore de acessibilidade do
      // próprio Chromium, que é a que um leitor de verdade consulta.
      await desligarLeitor(page);
      await expect(grupo).toMatchAriaSnapshot(`
        - group "Prioridade":
          - radio "P1 imediata"
          - radio "P2 próxima sprint" [checked]
          - radio "P3 backlog"
      `);
      await legendaNaTela(page, { rotulo: "Árvore de acessibilidade", fala: 'radio "P2 próxima sprint" [checked]' });
      await page.waitForTimeout(PAUSA);
    });

    await etapa(page, "7. Registrar o defeito com prioridade P2", async () => {
      await page.getByTestId("btn-registrar").click();
      await expect(page.getByTestId("aviso-sucesso")).toContainText("registrado com sucesso");
      await expect(page.getByTestId("radio-prioridade-P2")).not.toBeChecked();
      await page.waitForTimeout(PAUSA);
    });
  });
});
