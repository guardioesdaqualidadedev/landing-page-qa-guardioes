import { defineConfig, devices } from "@playwright/test";

// Suíte de acessibilidade e usabilidade (tests/acessibilidade/): WCAG com o
// axe-core, árvore de acessibilidade, leitor de tela (NVDA simulado, com voz),
// teclado, Shift+Tab e layout — cada cenário em BDD, com vídeo legendado.
//
// É separada da suíte de regressão (playwright.config.js) porque o ritmo é
// outro: cada cenário grava vídeo e os de leitor de tela esperam cada frase ser
// falada. Roda contra o BUILD de produção, que é o que vai para o ar.
//
// Para testar o site publicado:
//   BASE_URL=https://comunidade-qa-guardioes.web.app npm run test:acessibilidade
const BASE_URL = process.env.BASE_URL || "http://localhost:4173";
const SITE_LOCAL = !process.env.BASE_URL;
const TAMANHO = { width: 1280, height: 800 };

export default defineConfig({
  testDir: "./tests/acessibilidade",
  outputDir: "./test-results-acessibilidade",
  // Os cenários de leitor de tela esperam cada frase ser falada: são longos de propósito.
  timeout: 5 * 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-acessibilidade", open: "never" }],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    viewport: TAMANHO,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    // Sem animação de entrada: o conteúdo já nasce visível e as medições de
    // contraste não pegam texto no meio do fade. Um cenário do teclado liga a
    // animação de volta para conferir que o foco continua visível com ela.
    reducedMotion: "reduce",
    video: { mode: "on", size: TAMANHO },
    // Trace só na nova tentativa (CI). Com "retain-on-failure", o Playwright
    // descartava o trace do cenário aprovado enquanto a fixture ainda juntava
    // a voz ao vídeo, e o fechamento do navegador quebrava (ENOENT). O vídeo
    // legendado já documenta cada passo.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium" }],
  webServer: SITE_LOCAL
    ? {
        command: "npm run build && npx vite preview --port 4173 --strictPort",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
