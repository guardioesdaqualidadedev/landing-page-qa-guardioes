import React, { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Peças de acessibilidade usadas no site inteiro.
//
// Cada uma resolve um problema que o teste com leitor de tela (NVDA) e com o
// teclado encontrou, e fica aqui para a regra ser a mesma em toda tela — em vez
// de cada componente lembrar (ou esquecer) de aplicar.
// ─────────────────────────────────────────────────────────────────────────────

// Aviso de nova aba, só para leitor de tela. Sem ele a pessoa ativa o link e o
// contexto muda sem explicação (WCAG 3.2.5): o leitor passa a ler outra aba e o
// botão "voltar" do navegador para de funcionar.
export function NovaAba() {
  return <span className="qa-sr-only"> (abre em nova aba)</span>;
}

// Link para fora do site: abre em nova aba, sem dar ao destino acesso a esta
// janela (`noopener`) e avisando que vai abrir.
export function LinkExterno({ children, ...props }) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <NovaAba />
    </a>
  );
}

// Título de seção (h2) que também é uma parada do Tab.
//
// Quem navega pelo teclado só para em elementos focáveis — e boa parte das
// seções da landing é só texto. Sem esta parada, o Tab saía do botão "Abrir o
// Playground QA" direto para os cartões de administração, pulando seis seções
// inteiras. Com ela, cada Tab apresenta a próxima seção na ordem da página, e o
// NVDA anuncia "título nível 2, <nome da seção>".
export function TituloSecao({ as: Tag = "h2", className = "", children, ...props }) {
  return (
    <Tag tabIndex={0} className={`qa-titulo-secao ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}

// Diz se o conteúdo de um contêiner com `overflow: auto` passa do tamanho dele.
export function useRolavel() {
  const ref = useRef(null);
  const [rola, setRola] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const medir = () =>
      setRola(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    medir();

    // jsdom (testes unitários) não tem ResizeObserver: a medida inicial basta.
    if (typeof ResizeObserver === "undefined") return undefined;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    // O conteúdo muda de tamanho sozinho (filtros da tabela, por exemplo).
    if (el.firstElementChild) observador.observe(el.firstElementChild);
    return () => observador.disconnect();
  }, []);

  return [ref, rola];
}

// Contêiner com rolagem própria (tabela larga no celular, bloco de código).
//
// Quem não usa mouse só consegue rolar o que recebe foco (WCAG 2.1.1). Por isso,
// QUANDO o conteúdo passa do tamanho, a área vira uma região nomeada e entra no
// Tab — e aí as setas rolam o conteúdo. Quando cabe inteira, ela fica fora do
// caminho: uma parada que não faz nada só atrasa quem navega pelo teclado.
export function AreaRolavel({ as: Tag = "div", rotulo, children, ...props }) {
  const [ref, rola] = useRolavel();
  return (
    <Tag
      ref={ref}
      tabIndex={rola ? 0 : undefined}
      role={rola ? "region" : undefined}
      aria-label={rola ? rotulo : undefined}
      data-rolavel={rola ? "sim" : "nao"}
      {...props}
    >
      {children}
    </Tag>
  );
}
