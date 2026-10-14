import React, { useEffect, useRef, useState } from "react";

// Anima a entrada de um bloco quando ele aparece na tela. Respeita
// `prefers-reduced-motion`: quem pediu menos animação vê tudo direto.
//
// A preferência é lida ANTES da primeira pintura. Lida só no efeito (como
// era), o bloco nascia invisível e fazia o fade de 0,6s mesmo para quem pediu
// menos movimento — e, nesse meio-tempo, o texto semitransparente reprovava
// na medição de contraste.
const prefereMenosMovimento = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useReveal() {
  const ref = useRef(null);
  const [menosMovimento] = useState(prefereMenosMovimento);
  const [visivel, setVisivel] = useState(menosMovimento);

  useEffect(() => {
    if (menosMovimento) return undefined;
    const el = ref.current;

    if (!el || typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return undefined;
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
  }, [menosMovimento]);

  return [ref, visivel, menosMovimento];
}

export default function Reveal({ children, delay = 0, as: Tag = "div", style, ...rest }) {
  const [ref, visivel, menosMovimento] = useReveal();
  return (
    <Tag
      ref={ref}
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? "none" : "translateY(16px)",
        transition: menosMovimento ? "none" : `opacity .6s ease ${delay}s, transform .6s ease ${delay}s`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
