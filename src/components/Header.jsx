import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import BrandMark from "./BrandMark.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { IconeSocial } from "./Icones.jsx";
import { COLORS } from "../theme.js";
import { LINKS } from "../content/comunidade.js";
import { track } from "../firebase.js";

const MENU = [
  { to: "/", rotulo: "A comunidade", testid: "nav-home" },
  { to: "/manifesto", rotulo: "Manifesto", testid: "nav-manifesto" },
  { to: "/playground", rotulo: "Playground QA", testid: "nav-playground" },
];

export default function Header({ theme, onToggleTheme }) {
  const [aberto, setAberto] = useState(false);
  const botaoMenu = useRef(null);
  const { pathname } = useLocation();

  // Fecha o menu do celular a cada troca de rota — senão ele fica aberto por
  // cima da página nova.
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  // Esc fecha o menu e devolve o foco ao botão que o abriu: é o que quem usa
  // teclado ou leitor de tela espera de qualquer coisa que se abre por cima.
  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = (e) => {
      if (e.key !== "Escape") return;
      setAberto(false);
      botaoMenu.current?.focus();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const linkEstilo = ({ isActive }) => ({
    position: "relative",
    display: "inline-block",
    padding: "9px 2px",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.02em",
    textDecoration: "none",
    whiteSpace: "nowrap",
    color: isActive ? COLORS.onBand : COLORS.onBandBody,
    borderBottom: `2px solid ${isActive ? COLORS.accent : "transparent"}`,
    transition: "color .2s, border-color .2s",
  });

  return (
    <header
      data-testid="site-header"
      className="qa-faixa"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: COLORS.band,
        color: COLORS.onBand,
        boxShadow: "0 1px 0 rgba(255,255,255,.08), 0 8px 24px rgba(0,0,0,.18)",
      }}
    >
      {/* Faixa fina com o slogan do manual de marca. */}
      <div style={{ background: COLORS.accent, color: COLORS.onAccent }}>
        <div
          className="qa-wrap"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            height: 30,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          <span className="qa-slogan-full">Qualidade de software para um futuro melhor</span>
          <span className="qa-slogan-short">Qualidade de software</span>
        </div>
      </div>

      <div
        className="qa-wrap"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 72 }}
      >
        {/* O nome começa pelo que está escrito na marca (WCAG 2.5.3): quem usa
            comando de voz diz "clicar em QA Guardiões" e o link responde. */}
        <NavLink
          to="/"
          aria-label="QA Guardiões — Qualidade de Software, página inicial"
          style={{ textDecoration: "none" }}
          data-testid="brand-link"
        >
          <BrandMark tamanho={42} sobreFaixa />
        </NavLink>

        {/* Navegação de desktop */}
        <nav className="qa-nav-desktop" aria-label="Navegação principal" style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              data-testid={item.testid}
              style={linkEstilo}
              onClick={() => track("nav_click", { destino: item.to })}
            >
              {item.rotulo}
            </NavLink>
          ))}
        </nav>

        {/* Ações do topo. O botão de tema fica FORA dos blocos que somem por
            media query: um único botão no DOM, visível nas duas larguras —
            dois controles com o mesmo papel confundem leitor de tela e
            automação. */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="qa-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "inline-flex", gap: 7 }}>
              <IconeSocial tipo="discord" href={LINKS.discord} rotulo="Servidor no Discord" evento="header_social" sobreFaixa />
              <IconeSocial tipo="whatsapp" href={LINKS.whatsapp} rotulo="Comunidade no WhatsApp" evento="header_social" sobreFaixa />
              <IconeSocial tipo="linkedin" href={LINKS.linkedin} rotulo="Página no LinkedIn" evento="header_social" sobreFaixa />
              <IconeSocial tipo="github" href={LINKS.github} rotulo="Código da comunidade no GitHub" evento="header_social" sobreFaixa />
            </span>
          </span>

          <ThemeToggle theme={theme} onToggle={onToggleTheme} sobreFaixa />

          {/* Rótulo fixo: quem diz se o menu está aberto é o aria-expanded
              ("expandido" / "recolhido"). Trocar o rótulo junto fazia o leitor
              anunciar o estado duas vezes, e de formas diferentes. */}
          <button
            type="button"
            ref={botaoMenu}
            className="qa-nav-mobile"
            data-testid="menu-toggle"
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            aria-label="Menu de navegação"
            onClick={() => setAberto((v) => !v)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 38,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              color: COLORS.onBand,
              background: "rgba(255,255,255,.08)",
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {aberto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu do celular. Fica sempre no DOM — o aria-controls do botão aponta
          para ele — e o atributo hidden o tira da tela, do Tab e da árvore de
          acessibilidade enquanto está fechado. */}
      <nav
        id="menu-mobile"
        data-testid="menu-mobile"
        aria-label="Navegação principal"
        className="qa-nav-mobile"
        hidden={!aberto}
        style={{
          display: "block",
          borderTop: "1px solid rgba(255,255,255,.12)",
          background: COLORS.band,
          padding: "10px 18px 18px",
        }}
      >
        {MENU.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            data-testid={`${item.testid}-mobile`}
            style={({ isActive }) => ({
              display: "block",
              padding: "13px 4px",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
              color: isActive ? COLORS.accent : COLORS.onBand,
              borderBottom: "1px solid rgba(255,255,255,.08)",
            })}
          >
            {item.rotulo}
          </NavLink>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <IconeSocial tipo="discord" href={LINKS.discord} rotulo="Servidor no Discord" evento="header_social" sobreFaixa />
          <IconeSocial tipo="whatsapp" href={LINKS.whatsapp} rotulo="Comunidade no WhatsApp" evento="header_social" sobreFaixa />
          <IconeSocial tipo="linkedin" href={LINKS.linkedin} rotulo="Página no LinkedIn" evento="header_social" sobreFaixa />
          <IconeSocial tipo="github" href={LINKS.github} rotulo="Código da comunidade no GitHub" evento="header_social" sobreFaixa />
        </div>
      </nav>
    </header>
  );
}
