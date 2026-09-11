import React, { useEffect, useRef, useState } from "react";

// Anima a entrada de um bloco quando ele aparece na tela. Respeita
// `prefers-reduced-motion`: quem pediu menos animação vê tudo direto.
export function useReveal() {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;

    // Quem pediu menos animação vê o conteúdo direto, sem fade nem deslocamento.
    const menosMovimento =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!el || menosMovimento || typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, visivel];
}

export default function Reveal({ children, delay = 0, as: Tag = "div", style, ...rest }) {
  const [ref, visivel] = useReveal();
  return (
    <Tag
      ref={ref}
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? "none" : "translateY(16px)",
        transition: `opacity .6s ease ${delay}s, transform .6s ease ${delay}s`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
