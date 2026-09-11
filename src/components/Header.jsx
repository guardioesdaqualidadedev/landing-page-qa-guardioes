import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import BrandMark from "./BrandMark.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { COLORS } from "../theme.js";
import { LINKS } from "../content/comunidade.js";
import useVisitorCount from "../hooks/useVisitorCount.js";
import { track } from "../firebase.js";

const MENU = [
  { to: "/", rotulo: "A comunidade", testid: "nav-home" },
  { to: "/manifesto", rotulo: "Manifesto", testid: "nav-manifesto" },
  { to: "/playground", rotulo: "Playground QA", testid: "nav-playground" },
];

// Ícones das redes, em traço, para acompanharem a cor do texto do cabeçalho.
const ICONES = {
  discord: (
    <path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.2.4a15 15 0 0 1 3.5 1.5 12.4 12.4 0 0 0-10.4 0A15 15 0 0 1 11.8 4.4L11.6 4a16 16 0 0 0-3.9 1.3C4.9 9.4 4.1 13.4 4.5 17.3a16 16 0 0 0 4.8 2.4l.6-1a10.4 10.4 0 0 1-1.7-.8l.4-.3a11.2 11.2 0 0 0 9.6 0l.4.3c-.5.3-1.1.6-1.7.8l.6 1a16 16 0 0 0 4.8-2.4c.5-4.5-.8-8.5-3-12zM9.5 15c-.9 0-1.7-.9-1.7-2s.7-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2zm5 0c-.9 0-1.7-.9-1.7-2s.7-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2z" />
  ),
  whatsapp: (
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm-3.4 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.3 3.7 2.1.8 2.6.7 3 .6.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4l-.7-.4-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.5-.6.3-.5v-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5z" />
  ),
  linkedin: (
    <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 22 11 22 14.4V21h-4v-5.9c0-1.4-.03-3.2-1.95-3.2-1.96 0-2.25 1.53-2.25 3.1V21H9z" />
  ),
};

function IconeSocial({ tipo, href, rotulo }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={rotulo}
      title={rotulo}
      data-testid={`social-${tipo}`}
      onClick={() => track("header_social", { rede: tipo })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: 10,
        color: COLORS.onBandBody,
        background: "rgba(255,255,255,.07)",
        transition: "color .2s, background .2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = COLORS.onAccent;
        e.currentTarget.style.background = COLORS.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = COLORS.onBandBody;
        e.currentTarget.style.background = "rgba(255,255,255,.07)";
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        {ICONES[tipo]}
      </svg>
    </a>
  );
}

// Contador de visitantes — só aparece quando o Firebase responde.
function VisitorCount() {
  const total = useVisitorCount();
  if (total === null) return null;
  return (
    <span
      data-testid="visitor-count"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: COLORS.onBandMuted,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.accent }} />
      {total.toLocaleString("pt-BR")} visitas
    </span>
  );
}

export default function Header({ theme, onToggleTheme }) {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();

  // Fecha o menu do celular a cada troca de rota — senão ele fica aberto por
  // cima da página nova.
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

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
        <NavLink to="/" aria-label="Ir para a página inicial" style={{ textDecoration: "none" }} data-testid="brand-link">
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
            <VisitorCount />
            <span style={{ display: "inline-flex", gap: 7 }}>
              <IconeSocial tipo="discord" href={LINKS.discord} rotulo="Servidor no Discord" />
              <IconeSocial tipo="whatsapp" href={LINKS.whatsapp} rotulo="Comunidade no WhatsApp" />
              <IconeSocial tipo="linkedin" href={LINKS.linkedin} rotulo="Página no LinkedIn" />
            </span>
          </span>

          <ThemeToggle theme={theme} onToggle={onToggleTheme} sobreFaixa />

          <button
            type="button"
            className="qa-nav-mobile"
            data-testid="menu-toggle"
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
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

      {/* Menu do celular */}
      {aberto && (
        <nav
          id="menu-mobile"
          data-testid="menu-mobile"
          aria-label="Navegação principal"
          className="qa-nav-mobile"
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
            <IconeSocial tipo="discord" href={LINKS.discord} rotulo="Servidor no Discord" />
            <IconeSocial tipo="whatsapp" href={LINKS.whatsapp} rotulo="Comunidade no WhatsApp" />
            <IconeSocial tipo="linkedin" href={LINKS.linkedin} rotulo="Página no LinkedIn" />
          </div>
        </nav>
      )}
    </header>
  );
}
