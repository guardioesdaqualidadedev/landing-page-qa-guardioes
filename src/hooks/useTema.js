// Tema atual disponível para qualquer componente, sem prop drilling.
//
// O App já guarda o tema em estado (é ele quem grava o `data-theme` no <html>).
// Cores e superfícies não precisam desse valor — resolvem sozinhas pelas
// variáveis CSS. Quem precisa são as IMAGENS: um PNG não muda de cor por CSS,
// então logo, símbolo e banner têm de escolher o arquivo certo em JS.
import { createContext, useContext } from "react";

export const TemaContexto = createContext("dark");

export function useTema() {
  return useContext(TemaContexto);
}

// Açúcar para o caso mais comum: escolher entre duas variantes de arte.
export function porTema(tema, { claro, escuro }) {
  return tema === "light" ? claro : escuro;
}
