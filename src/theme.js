// ─────────────────────────────────────────────────────────────────────────────
// Design System — QA's Guardiões do Software
//
// A paleta oficial da marca (Manual de Marca) é:
//   Azul Marinho #0B2341 · Laranja #F47A20 · Branco #FFFFFF · Cinza Claro #EFF2F5
//
// Aqui ela vira VARIÁVEIS CSS para o site inteiro alternar entre tema escuro e
// claro sem re-renderizar nada: o React só troca o atributo `data-theme` no
// <html> e o navegador resolve o resto.
//
// Os nomes são SEMÂNTICOS (o que a cor faz), não literais (que cor é). Assim,
// quando o tema muda, o mesmo token continua fazendo sentido.
// ─────────────────────────────────────────────────────────────────────────────

export const MARCA = {
  azulMarinho: "#0B2341",
  laranja: "#F47A20",
  branco: "#FFFFFF",
  cinzaClaro: "#EFF2F5",
};

export const COLORS = {
  // Superfícies e texto — mudam com o tema.
  page: "var(--qa-page)",
  surface: "var(--qa-surface)",
  surfaceAlt: "var(--qa-surface-alt)",
  border: "var(--qa-border)",
  text: "var(--qa-text)",
  textSoft: "var(--qa-text-soft)",
  muted: "var(--qa-muted)",

  // Laranja da marca. `accent` é o laranja puro (fundos, ícones, botões e
  // texto sobre a faixa azul); `accentText` é a versão calibrada para TEXTO
  // sobre as superfícies do tema — no claro o laranja puro dá 2,3:1 a 2,7:1,
  // abaixo do mínimo de acessibilidade, então escurece.
  accent: "var(--qa-accent)",
  accentText: "var(--qa-accent-text)",
  accentSoft: "var(--qa-accent-soft)",

  // Faixas escuras (cabeçalho, hero, rodapé) são âncora de marca: ficam
  // azul-marinho nos DOIS temas. Só o texto sobre elas é fixo também.
  band: "var(--qa-band)",
  bandRgb: "var(--qa-band-rgb)",
  onBand: "#F4F8FC",
  onBandBody: "#C6D6E8",
  onBandMuted: "#93A9C4",
  onAccent: "#0B2341",

  // Semânticas de status — usadas nos badges do playground.
  critica: "var(--qa-critica)",
  alta: "var(--qa-alta)",
  media: "var(--qa-media)",
  baixa: "var(--qa-baixa)",
  sucesso: "var(--qa-sucesso)",
  erro: "var(--qa-erro)",
  // Texto sobre fundo de erro (botão "Confirmar exclusão"). O vermelho do
  // escuro é claro demais para texto branco (2,5:1): lá o texto é azul.
  onErro: "var(--qa-on-erro)",
};

// Onde a preferência de tema fica guardada no navegador.
export const THEME_KEY = "qag_theme";

// Escuro é o padrão (`:root`) — é a aplicação principal da marca, a versão
// negativa do logo sobre o azul-marinho. O claro entra pelo botão do topo.
export const THEME_CSS = `
  :root {
    --qa-page: #06182D;
    --qa-surface: #0E2A47;
    --qa-surface-rgb: 14, 42, 71;
    --qa-surface-alt: #12355A;
    --qa-border: #1D4267;
    --qa-text: #EFF4FA;
    --qa-text-soft: #C6D6E8;
    --qa-muted: #93A9C4;
    --qa-accent: #F47A20;
    --qa-accent-text: #FF9C57;
    --qa-accent-soft: rgba(244,122,32,.16);
    --qa-band: #0B2341;
    --qa-band-rgb: 11, 35, 65;
    --qa-critica: #FF6B6B;
    --qa-alta: #FF9245;
    --qa-media: #FFC96B;
    --qa-baixa: #7FC8A9;
    --qa-sucesso: #5FD3A0;
    --qa-erro: #FF7B7B;
    --qa-on-erro: #0B2341;
    --qa-card-shadow: 0 10px 30px rgba(0,0,0,.30);
    --qa-ring: rgba(244,122,32,.45);
    /* Cor do contorno de foco. Precisa de 3:1 contra o fundo em volta do
       elemento (WCAG 1.4.11): o laranja puro passa em todas as superfícies
       escuras (4,5:1 ou mais). */
    --qa-foco: #F47A20;
  }

  :root[data-theme="light"] {
    --qa-page: #EFF2F5;
    --qa-surface: #FFFFFF;
    --qa-surface-rgb: 255, 255, 255;
    --qa-surface-alt: #E6EBF2;
    --qa-border: #D5DFEA;
    --qa-text: #0B2341;
    --qa-text-soft: #1B3A5E;
    --qa-muted: #55677E;
    --qa-accent: #F47A20;
    /* 4,6:1 ou mais em todo fundo claro, inclusive nos selos laranja
       translúcidos sobre o cartão cinza (WCAG 1.4.3). O #C25400 de antes só
       passava sobre o branco: dava 4,1:1 na página e 3,5:1 nos selos. */
    --qa-accent-text: #A34600;
    --qa-accent-soft: rgba(244,122,32,.12);
    --qa-band: #0B2341;
    --qa-band-rgb: 11, 35, 65;
    --qa-critica: #C62828;
    --qa-alta: #A34600;
    --qa-media: #8A6A00;
    --qa-baixa: #226B4E;
    --qa-sucesso: #1B7A54;
    --qa-erro: #C62828;
    --qa-on-erro: #FFFFFF;
    --qa-card-shadow: 0 6px 20px rgba(11,35,65,.08);
    --qa-ring: rgba(194,84,0,.30);
    /* No claro, o laranja puro dá 2,3:1 a 2,7:1 contra o fundo — o contorno
       sumia. O laranja de texto mantém a marca e fica entre 3,8:1 e 4,6:1. */
    --qa-foco: #C25400;
  }

  /* Faixas azul-marinho (cabeçalho, rodapé, topos de página) são iguais nos
     dois temas, então o foco também: laranja puro, 5,7:1 sobre o azul. */
  .qa-faixa { --qa-foco: #F47A20; }
  /* Sobre o laranja da chamada final, só o azul-marinho aparece (4,1:1). */
  .qa-faixa-laranja { --qa-foco: #0B2341; }
`;

// Lê a preferência salva. Escuro é o padrão quando não há nada salvo.
export function temaInicial() {
  if (typeof window === "undefined") return "dark";
  try {
    const salvo = window.localStorage.getItem(THEME_KEY);
    if (salvo === "light" || salvo === "dark") return salvo;
  } catch {
    /* localStorage bloqueado (janela anônima) — segue no padrão. */
  }
  return "dark";
}

// Grava o tema no <html> (para as variáveis CSS valerem na página inteira,
// inclusive no bounce do scroll) e persiste a escolha.
export function aplicarTema(tema) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = tema;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", tema === "dark" ? "#06182D" : "#EFF2F5");
  try {
    window.localStorage.setItem(THEME_KEY, tema);
  } catch {
    /* ignora — a troca vale para esta sessão mesmo sem poder salvar. */
  }
}

export function proximoTema(tema) {
  return tema === "dark" ? "light" : "dark";
}
