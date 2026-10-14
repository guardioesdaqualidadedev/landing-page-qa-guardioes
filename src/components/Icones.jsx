import React from "react";
import { COLORS } from "../theme.js";
import { track } from "../firebase.js";

// Ícones das redes em um lugar só — cabeçalho, rodapé, cartões de administração
// e o carrossel de parceiros usam os mesmos traços. Todos desenhados em um
// viewBox 24×24 e pintados com `currentColor`, para herdarem a cor de quem os
// contém e funcionarem nos dois temas sem variante de arquivo.
export const ICONES = {
  discord: (
    <path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.2.4a15 15 0 0 1 3.5 1.5 12.4 12.4 0 0 0-10.4 0A15 15 0 0 1 11.8 4.4L11.6 4a16 16 0 0 0-3.9 1.3C4.9 9.4 4.1 13.4 4.5 17.3a16 16 0 0 0 4.8 2.4l.6-1a10.4 10.4 0 0 1-1.7-.8l.4-.3a11.2 11.2 0 0 0 9.6 0l.4.3c-.5.3-1.1.6-1.7.8l.6 1a16 16 0 0 0 4.8-2.4c.5-4.5-.8-8.5-3-12zM9.5 15c-.9 0-1.7-.9-1.7-2s.7-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2zm5 0c-.9 0-1.7-.9-1.7-2s.7-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2z" />
  ),
  whatsapp: (
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm-3.4 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.3 3.7 2.1.8 2.6.7 3 .6.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4l-.7-.4-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.5-.6.3-.5v-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5z" />
  ),
  linkedin: (
    <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 22 11 22 14.4V21h-4v-5.9c0-1.4-.03-3.2-1.95-3.2-1.96 0-2.25 1.53-2.25 3.1V21H9z" />
  ),
  github: (
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  ),
  youtube: (
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.1V8.9l5.2 3.1z" />
  ),
  site: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.9 8zM12 4.04c.72 1.04 1.3 2.34 1.68 3.96h-3.36C10.7 6.38 11.28 5.08 12 4.04zM4.26 14A8.1 8.1 0 0 1 4 12c0-.7.1-1.36.26-2h3.38a16.5 16.5 0 0 0 0 4H4.26zm.84 2h2.95c.33 1.3.8 2.5 1.38 3.56A8.03 8.03 0 0 1 5.1 16zm2.95-8H5.1a8.03 8.03 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.05 8zM12 19.96c-.72-1.04-1.3-2.34-1.68-3.96h3.36c-.38 1.62-.96 2.92-1.68 3.96zM14.1 14H9.9a14.7 14.7 0 0 1 0-4h4.2a14.7 14.7 0 0 1 0 4zm.47 5.56c.58-1.06 1.05-2.26 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38c.16.64.26 1.3.26 2s-.1 1.36-.26 2h-3.38z" />
  ),
};

export function Icone({ tipo, tamanho = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} fill="currentColor" aria-hidden="true">
      {ICONES[tipo]}
    </svg>
  );
}

// Botão redondo de rede social. `sobreFaixa` vale para cabeçalho e rodapé, que
// são azul-marinho nos dois temas; sem ele o ícone se veste com as cores de
// superfície e serve dentro de um cartão.
export function IconeSocial({
  tipo,
  href,
  rotulo,
  evento = "social_click",
  tamanho = 34,
  sobreFaixa = false,
  testid,
}) {
  const corBase = sobreFaixa ? COLORS.onBandBody : COLORS.muted;
  const fundoBase = sobreFaixa ? "rgba(255,255,255,.07)" : COLORS.surfaceAlt;
  // Ícone sem texto: o nome inteiro vem do aria-label, inclusive o aviso de
  // nova aba. O title repete o mesmo texto — igual ao nome, o navegador não o
  // expõe como descrição e o leitor de tela não lê a frase duas vezes.
  const nome = `${rotulo} (abre em nova aba)`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={nome}
      title={nome}
      data-testid={testid || `social-${tipo}`}
      onClick={() => track(evento, { rede: tipo })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: tamanho,
        height: tamanho,
        borderRadius: Math.round(tamanho * 0.3),
        color: corBase,
        background: fundoBase,
        flexShrink: 0,
        transition: "color .2s, background .2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = COLORS.onAccent;
        e.currentTarget.style.background = COLORS.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = corBase;
        e.currentTarget.style.background = fundoBase;
      }}
    >
      <Icone tipo={tipo} tamanho={Math.round(tamanho * 0.53)} />
    </a>
  );
}

export default IconeSocial;
