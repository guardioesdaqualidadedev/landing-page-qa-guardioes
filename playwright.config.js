import { defineConfig, devices } from "@playwright/test";

// Configuração dos testes de interface.
//
// O `webServer` sobe o próprio Vite antes da suíte e derruba no final — ninguém
// precisa lembrar de rodar `npm run dev` em outro terminal. Em CI ele constrói
// e serve o bundle de produção, que é o que de fato vai para o ar.
const EM_CI = Boolean(process.env.CI);
const PORTA = 5173;

// ─── Modo demonstração ───────────────────────────────────────────────────
// `npm run test:all` liga PW_DEMO=1: um único worker, janela visível e uma
// pausa entre cada interação, para a execução ficar assistível — é o modo
// usado para gravar a aula. Sem a variável, a suíte roda no ritmo normal.
const DEMO = process.env.PW_DEMO === "1";
const SLOW_MO = Number(process.env.PW_SLOWMO || 1500);

export default defineConfig({
  testDir: "./tests/e2e",
  // O passeio guiado é roteiro de demonstração, não teste de regressão: fora do
  // modo demonstração ele nem é coletado, para `npm run test:e2e` continuar
  // sendo a suíte enxuta de 52 testes.
  testIgnore: DEMO ? [] : ["**/passeio.spec.js"],
  fullyParallel: !DEMO,
  forbidOnly: EM_CI,
  retries: EM_CI ? 2 : 0,
  // Um worker no modo demonstração: com dois navegadores abertos ao mesmo tempo
  // a gravação viraria uma colagem de janelas se sobrepondo.
  workers: DEMO ? 1 : EM_CI ? 1 : undefined,
  // No modo demonstração o reporter extra publica o nome do teste atual em um
  // arquivo, que o ffmpeg desenha como faixa no rodapé da gravação.
  reporter: DEMO
    ? [["list"], ["./tests/support/reporter-legenda.js"]]
    : EM_CI
      ? [["list"], ["html", { open: "never" }]]
      : [["list"]],

  // O slowMo e as pausas do passeio guiado multiplicam o tempo de cada teste;
  // sem folga no timeout a suíte passaria a falhar por tempo, não por defeito.
  // Um teste do passeio guiado sozinho pode levar dez minutos.
  timeout: DEMO ? 1_200_000 : 30_000,
  expect: { timeout: DEMO ? 15_000 : 5_000 },

  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    launchOptions: DEMO ? { slowMo: SLOW_MO } : undefined,
    headless: !DEMO,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Na gravação a janela ocupa a tela inteira (1920x1080) e o viewport
        // acompanha o tamanho da janela, para não sobrar moldura preta em volta.
        ...(DEMO
          ? {
              viewport: null,
              // `devices["Desktop Chrome"]` fixa deviceScaleFactor: 1, e o
              // Playwright recusa essa combinação com viewport nulo.
              deviceScaleFactor: undefined,
              launchOptions: {
                slowMo: SLOW_MO,
                args: ["--window-position=0,0", "--window-size=1920,1080"],
              },
            }
          : {}),
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        // O celular mantém o viewport estreito (é o que testa o layout
        // responsivo); a janela fica encostada no canto e a edição centraliza.
        ...(DEMO
          ? { launchOptions: { slowMo: SLOW_MO, args: ["--window-position=0,0"] } }
          : {}),
      },
    },
  ],

  webServer: {
    command: EM_CI ? `npm run build && npx vite preview --port ${PORTA}` : `npx vite --port ${PORTA}`,
    port: PORTA,
    reuseExistingServer: !EM_CI,
    timeout: 120_000,
  },
});
