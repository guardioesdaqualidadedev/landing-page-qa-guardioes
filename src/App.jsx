import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Manifesto from "./pages/Manifesto.jsx";
import Playground from "./pages/Playground.jsx";
import NaoEncontrada from "./pages/NaoEncontrada.jsx";
import { COLORS, THEME_CSS, temaInicial, aplicarTema, proximoTema } from "./theme.js";
import { TemaContexto } from "./hooks/useTema.js";
import { track } from "./firebase.js";

// Título da aba do navegador por rota. É a primeira coisa que o leitor de tela
// fala quando a página muda (WCAG 2.4.2) — com um título só para o site
// inteiro, as três telas soavam iguais.
const TITULOS = {
  "/": "QA's Guardiões do Software — Comunidade de Qualidade de Software",
  "/manifesto": "Manifesto Ágil de Testes — QA's Guardiões do Software",
  "/playground": "Playground QA — QA's Guardiões do Software",
};
const TITULO_404 = "Página não encontrada — QA's Guardiões do Software";

const NATIVAMENTE_FOCAVEL = "a[href], button, input, select, textarea, summary";

// Leva o foco para o destino, que pode ser uma seção inteira: nesse caso o
// foco vai para o título dela, que é o que o leitor de tela precisa anunciar.
function focarDestino(alvo) {
  const destino = /^H[1-6]$/.test(alvo.tagName) ? alvo : alvo.querySelector("h1, h2") || alvo;
  if (!destino.hasAttribute("tabindex") && !destino.matches(NATIVAMENTE_FOCAVEL)) {
    destino.setAttribute("tabindex", "-1");
  }
  destino.focus({ preventScroll: true });
}

// Cuida do que muda a cada troca de rota numa aplicação de página única.
//
// O React Router troca a tela sem recarregar o documento. Para o navegador,
// nada aconteceu: a página não sobe, o foco fica no link que acabou de sumir e o
// leitor de tela não diz que a tela é outra. Aqui:
//   • o título da aba muda;
//   • a página sobe e o foco vai para o título (h1) da tela nova — o NVDA
//     anuncia "Playground QA, título nível 1" e o Tab segue dali;
//   • com âncora (#parceiros, vindo do rodapé), rola até a seção e o foco vai
//     para o título dela, em vez de ficar lá no rodapé.
// Na primeira carga sem âncora o foco fica onde o navegador põe: no começo.
function GerenciarRota() {
  const { pathname, hash } = useLocation();
  const rotaAnterior = useRef(null);

  useEffect(() => {
    document.title = TITULOS[pathname] || TITULO_404;
    // Primeira carga é quando ainda não havia rota — ou quando a rota é a
    // mesma de antes: em desenvolvimento, o modo estrito do React roda este
    // efeito duas vezes ao montar, e a segunda vez não é uma navegação.
    const rota = pathname + hash;
    const inicial = rotaAnterior.current === null || rotaAnterior.current === rota;
    rotaAnterior.current = rota;

    const alvo = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (alvo) {
      // Um quadro depois: num link de âncora comum (o "Pular para o conteúdo"),
      // o próprio navegador termina o pulo DEPOIS deste efeito e põe o foco no
      // alvo (o <main>) — por cima do foco que daríamos ao título.
      const quadro = requestAnimationFrame(() => {
        const menosMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        alvo.scrollIntoView({ behavior: menosMovimento ? "auto" : "smooth", block: "start" });
        focarDestino(alvo);
      });
      return () => cancelAnimationFrame(quadro);
    }
    if (inicial) return;

    window.scrollTo({ top: 0, behavior: "auto" });
    document.querySelector("main h1")?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return null;
}

// Todo o CSS global do site. Fica em um único lugar para o design system ser
// legível de cima a baixo: tokens de tema, tipografia, utilitários e os pontos
// de quebra responsivos.
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
  ${THEME_CSS}

  * { box-sizing: border-box; }
  html, body { margin: 0; overflow-x: hidden; max-width: 100%; background: ${COLORS.page}; }
  /* O cabeçalho fica preso no topo. Sem esta folga, o elemento que recebe foco
     no Shift+Tab — e o destino de uma âncora — para escondido atrás dele
     (WCAG 2.4.11, foco não encoberto). */
  html { scroll-padding-top: 118px; }
  img, video { max-width: 100%; height: auto; }

  @media (prefers-reduced-motion: no-preference) {
    body, .qa-card { transition: background-color .25s ease, color .25s ease, border-color .25s ease; }
  }
  /* Quem pede menos movimento não recebe animação nenhuma: nem o botão que
     sobe no hover, nem as cores que deslizam na troca de tema. */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    .qa-btn:hover, .qa-parceiro-link:hover { transform: none !important; }
  }

  /* ── Tipografia ────────────────────────────────────────────────────────
     O manual de marca pede sans-serif condensada em negrito para títulos e
     uma sans-serif limpa para texto corrido. Barlow Condensed + Inter. */
  .qa-display {
    font-family: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif;
    line-height: 1.06;
    text-transform: uppercase;
    letter-spacing: 0.01em;
  }
  .qa-eyebrow {
    font-size: 11.5px; font-weight: 700; letter-spacing: 0.22em;
    text-transform: uppercase; margin: 0;
  }

  /* ── Estrutura ─────────────────────────────────────────────────────── */
  .qa-wrap { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
  .qa-section { padding-top: 84px; }

  .qa-card {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 16px;
    box-shadow: var(--qa-card-shadow);
  }

  /* ── Botões ────────────────────────────────────────────────────────── */
  .qa-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    cursor: pointer; border: none; font-family: inherit; font-weight: 700;
    border-radius: 999px; padding: 13px 26px; font-size: 15px; text-decoration: none;
    transition: transform .15s, box-shadow .15s, background .2s, color .2s;
  }
  .qa-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(244,122,32,.32); }
  .qa-btn:focus-visible { outline: 3px solid var(--qa-foco); outline-offset: 3px; }
  .qa-btn-primario { background: ${COLORS.accent}; color: ${COLORS.onAccent}; }
  .qa-btn-fantasma {
    background: transparent; color: ${COLORS.onBand};
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.34);
  }
  .qa-btn-fantasma:hover { box-shadow: inset 0 0 0 1.5px ${COLORS.accent}; }
  .qa-btn-pequeno { padding: 8px 15px; font-size: 13px; border-radius: 10px; }

  /* ── Formulários (usados no Playground) ────────────────────────────── */
  .qa-field { display: flex; flex-direction: column; gap: 6px; }
  .qa-label { font-size: 13px; font-weight: 600; color: ${COLORS.text}; }
  .qa-input, .qa-select, .qa-textarea {
    font-family: inherit; font-size: 14.5px; color: ${COLORS.text};
    background: ${COLORS.page}; border: 1px solid ${COLORS.border};
    border-radius: 10px; padding: 11px 12px; width: 100%;
    transition: border-color .15s, box-shadow .15s;
  }
  .qa-textarea { min-height: 108px; resize: vertical; }
  /* Borda de 2px na cor de foco (3:1 nos dois temas) mais o brilho suave. Só o
     brilho translúcido não chegava a 3:1 contra o fundo claro. */
  .qa-input:focus, .qa-select:focus, .qa-textarea:focus {
    outline: none; border-color: var(--qa-foco);
    box-shadow: 0 0 0 1px var(--qa-foco), 0 0 0 5px var(--qa-ring);
  }
  .qa-input[aria-invalid="true"], .qa-textarea[aria-invalid="true"], .qa-select[aria-invalid="true"] {
    border-color: ${COLORS.erro};
  }
  .qa-erro { font-size: 12.5px; color: ${COLORS.erro}; font-weight: 600; }
  .qa-hint { font-size: 12.5px; color: ${COLORS.muted}; }

  /* ── Tabela ────────────────────────────────────────────────────────── */
  .qa-tabela-wrap { position: relative; }
  .qa-tabela-dica { display: none; }
  .qa-tabela-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .qa-tabela { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 760px; }
  .qa-tabela th, .qa-tabela td {
    text-align: left; padding: 11px 12px; border-bottom: 1px solid ${COLORS.border};
  }
  .qa-tabela thead th {
    font-size: 11.5px; letter-spacing: .1em; text-transform: uppercase;
    color: ${COLORS.muted}; font-weight: 700; white-space: nowrap;
  }
  .qa-tabela tbody tr:hover { background: ${COLORS.surfaceAlt}; }
  .qa-th-sort {
    background: none; border: none; padding: 0; font: inherit; cursor: pointer;
    color: inherit; display: inline-flex; align-items: center; gap: 5px; min-height: 24px;
    font-size: 11.5px; letter-spacing: .1em; text-transform: uppercase; font-weight: 700;
  }
  .qa-th-sort:hover { color: ${COLORS.accentText}; }

  /* ── Grades ────────────────────────────────────────────────────────── */
  .qa-grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
  .qa-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .qa-grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

  /* Administração: a quantidade de pessoas muda com o tempo, então a grade se
     ajusta sozinha em vez de ficar presa a três colunas — com quatro cartões,
     três colunas deixariam um órfão sozinho na segunda linha. */
  .qa-grid-admins {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(238px, 1fr));
    gap: 18px;
  }

  .qa-sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
  .qa-lista-limpa { list-style: none; margin: 0; padding: 0; }

  .qa-nav-mobile { display: none !important; }
  /* O menu do celular fica sempre no DOM (o aria-controls do botão aponta para
     ele) e o atributo hidden o esconde — inclusive do leitor de tela. */
  nav.qa-nav-mobile[hidden] { display: none !important; }

  /* Carrossel de parceiros. O botão do parceiro é discreto (fundo de
     superfície, não laranja), então o hover acende a borda em vez de repetir a
     sombra laranja de .qa-btn. */
  .qa-parceiro-link:hover {
    transform: translateY(-2px);
    border-color: ${COLORS.accent} !important;
    color: ${COLORS.accentText} !important;
    box-shadow: 0 10px 22px rgba(0,0,0,.18);
  }

  /* Contorno de foco em tudo que recebe foco — inclusive títulos de seção,
     áreas com rolagem e o resumo dos blocos dobráveis. A cor vem de --qa-foco,
     que muda conforme o fundo (veja theme.js). */
  a:focus-visible, button:focus-visible, input:focus-visible,
  select:focus-visible, textarea:focus-visible, summary:focus-visible,
  [tabindex]:focus-visible {
    outline: 3px solid var(--qa-foco); outline-offset: 2px;
  }
  .qa-titulo-secao:focus-visible { outline-offset: 6px; border-radius: 6px; }
  /* O <main> recebe foco só para o atalho "Pular para o conteúdo" funcionar;
     um contorno em volta da página inteira não ajudaria ninguém. */
  main:focus { outline: none; }

  .qa-skip {
    position: absolute; left: -9999px; top: 0; z-index: 100;
    background: ${COLORS.accent}; color: ${COLORS.onAccent};
    padding: 10px 16px; border-radius: 0 0 10px 0; font-weight: 700;
    box-shadow: 0 0 0 3px #0B2341;
  }
  .qa-skip:focus { left: 0; }

  /* ── Tablet ────────────────────────────────────────────────────────── */
  @media (max-width: 980px) {
    .qa-grid4 { grid-template-columns: 1fr 1fr; }
    .qa-grid3 { grid-template-columns: 1fr 1fr; }
    .qa-hero-grid { grid-template-columns: 1fr !important; }
    .qa-footer-grid { grid-template-columns: 1fr 1fr !important; }
  }

  /* ── Celular e tablet estreito ─────────────────────────────────────────
     O cabeçalho aberto é marca + três itens de menu + quatro ícones de rede +
     botão de tema. Isso deixa de caber por volta de 880px: até 899px o menu
     recolhido assume. O limite era 820px e a faixa entre 821 e 880 rolava de
     lado — defeito antigo, que só não aparecia nos testes porque eles medem em
     1280px e em 390px, nunca no meio. */
  @media (max-width: 899px) {
    .qa-nav-desktop { display: none !important; }
    .qa-nav-mobile { display: inline-flex !important; }
    nav.qa-nav-mobile { display: block !important; }
  }
  @media (max-width: 700px) {
    .qa-wrap { padding: 0 18px; }
    .qa-section { padding-top: 60px; }
    .qa-grid2, .qa-grid3 { grid-template-columns: 1fr; }
    .qa-grid4 { grid-template-columns: 1fr 1fr; }
    .qa-footer-grid { grid-template-columns: 1fr !important; }
    .qa-slogan-full { display: none; }
    .qa-form-grid { grid-template-columns: 1fr !important; }
  }
  @media (min-width: 701px) {
    .qa-slogan-short { display: none; }
  }
  /* Manifesto: no celular a linha "X mais que Y" empilha em vez de espremer */
  @media (max-width: 640px) {
    .qa-original-linha { grid-template-columns: 1fr !important; gap: 4px !important; text-align: left !important; }
    .qa-original-linha > span:first-child { text-align: left !important; }
  }
  /* Cabeçalho em telas estreitas: sem isto, marca + botão de tema + menu
     somam mais que a largura do celular e a página passa a rolar de lado. */
  @media (max-width: 560px) {
    .qa-brand-tagline { display: none !important; }
    .qa-brand-nome { font-size: 19px !important; }
  }
  @media (max-width: 400px) {
    .qa-theme-label { display: none !important; }
  }

  /* Abas do playground no celular: rolam de lado dentro da própria faixa em
     vez de virarem três linhas empilhadas, e o botão de restaurar desce para
     baixo delas, alinhado à esquerda. */
  @media (max-width: 700px) {
    .qa-abas { flex-wrap: nowrap !important; overflow-x: auto; scrollbar-width: none; }
    .qa-abas::-webkit-scrollbar { display: none; }
    .qa-abas-lista { flex-wrap: nowrap !important; }
    .qa-abas .qa-btn-restaurar {
      margin-left: 8px !important;
      align-self: center !important;
      margin-bottom: 4px !important;
      white-space: nowrap;
    }
    .qa-abas-lista > button[role="tab"] { white-space: nowrap; padding-left: 12px; padding-right: 12px; }
  }

  /* ── Tabela de defeitos no celular ─────────────────────────────────────
     A tela do playground concentra resumo, filtros e tabela numa largura de
     390px. Sem estes ajustes, os quatro cartoes de severidade e a grade de
     cinco colunas dos filtros empurram a tabela para fora da primeira tela e
     os campos ficam estreitos demais para usar. */
  @media (max-width: 700px) {
    /* Resumo por severidade: 2x2 compacto, ocupando um terco da altura. */
    .qa-resumo { gap: 10px !important; margin-bottom: 14px !important; }
    .qa-resumo > .qa-card { padding: 10px 12px !important; }
    .qa-resumo-num { font-size: 22px !important; }

    /* Filtros: a busca e o botao ocupam a linha inteira; os tres seletores
       ficam dois a dois. Os !important sao necessarios porque a grade original
       vem de estilo inline no componente. */
    .qa-filtros {
      grid-template-columns: 1fr 1fr !important;
      gap: 10px !important;
      padding: 14px !important;
      align-items: stretch !important;
    }
    /* A busca ocupa a linha inteira; os tres seletores ficam dois a dois e o
       botao Limpar aproveita a celula que sobra ao lado de Modulo — assim os
       filtros cabem em tres linhas em vez de quatro. */
    .qa-filtros > .qa-field:first-child { grid-column: 1 / -1; }
    .qa-filtros .qa-btn-limpar {
      align-self: end;
      width: 100% !important;
      height: 42px !important;
    }

    /* Celulas mais justas para caber mais coluna antes de precisar rolar. */
    .qa-tabela { min-width: 680px; font-size: 13px; }
    .qa-tabela th, .qa-tabela td { padding: 9px 8px; }
    .qa-tabela thead th { font-size: 10.5px; letter-spacing: .06em; }

    /* Sombras que indicam que a tabela rola de lado.
       As duas primeiras camadas usam background-attachment: local, ou seja,
       rolam junto com o conteudo e vao descobrindo as sombras. As duas ultimas
       usam scroll: ficam presas na borda. O efeito e que a sombra aparece so quando existe conteudo
       escondido daquele lado — e desaparece ao chegar no fim, sem cobrir o
       botao Excluir da ultima coluna. Truque puramente CSS, funciona tambem
       no Safari do iPhone. */
    .qa-tabela-scroll {
      background-image:
        linear-gradient(to right, var(--qa-surface) 40%, rgba(var(--qa-surface-rgb), 0)),
        linear-gradient(to left, var(--qa-surface) 40%, rgba(var(--qa-surface-rgb), 0)),
        radial-gradient(farthest-side at 0 50%, rgba(0, 0, 0, .26), rgba(0, 0, 0, 0)),
        radial-gradient(farthest-side at 100% 50%, rgba(0, 0, 0, .26), rgba(0, 0, 0, 0));
      background-position: left center, right center, left center, right center;
      background-repeat: no-repeat;
      background-size: 44px 100%, 44px 100%, 15px 100%, 15px 100%;
      background-attachment: local, local, scroll, scroll;
    }
    .qa-tabela-dica { display: block !important; }
  }

  @media (max-width: 420px) {
    .qa-btn { width: 100%; }
    .qa-btn-pequeno { width: auto; }
    .qa-btn-limpar { width: 100% !important; }
  }
`;

export default function App() {
  const [theme, setTheme] = useState(temaInicial);
  const [anuncioTema, setAnuncioTema] = useState("");

  useEffect(() => {
    aplicarTema(theme);
  }, [theme]);

  const alternarTema = () => {
    const alvo = proximoTema(theme);
    setTheme(alvo);
    // O botão continua focado e só troca o rótulo — o leitor de tela não fala
    // nada sozinho. A região ao vivo confirma que a troca aconteceu.
    setAnuncioTema(alvo === "light" ? "Tema claro ativado" : "Tema escuro ativado");
    track("tema_" + alvo);
  };

  return (
    <TemaContexto.Provider value={theme}>
      <div style={{ background: COLORS.page, color: COLORS.text, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <style>{GLOBAL_CSS}</style>
        <a className="qa-skip" href="#conteudo">Pular para o conteúdo</a>
        <GerenciarRota />
        <Header theme={theme} onToggleTheme={alternarTema} />
        {/* tabIndex -1: o atalho de pular precisa conseguir pôr o foco aqui. */}
        <main id="conteudo" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/manifesto" element={<Manifesto />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="*" element={<NaoEncontrada />} />
          </Routes>
        </main>
        <Footer />
        <p role="status" className="qa-sr-only" data-testid="anuncio-tema">
          {anuncioTema}
        </p>
      </div>
    </TemaContexto.Provider>
  );
}
