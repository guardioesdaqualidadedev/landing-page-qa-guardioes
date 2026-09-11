// Contador TOTAL de visitantes (acumulado), em tempo real via Firestore.
//
// Como funciona:
//  • Existe um único documento `stats/visits` com o campo numérico `count`.
//  • Na primeira visita de cada navegador, incrementamos `count` em 1 usando
//    `increment` — operação atômica do Firestore, sem corrida entre visitantes.
//  • Um `onSnapshot` escuta o documento e atualiza o número na tela.
//
// O que NÃO é contado (e por quê):
//  • Execuções em localhost e em rede local. O `.env` de desenvolvimento aponta
//    para o mesmo projeto Firebase de produção, então a suíte Playwright — que
//    sobe o site em localhost, com um navegador limpo a cada teste — inflava o
//    contador a cada `npm run test:e2e`. Era a causa do número subir sozinho.
//  • Navegadores sob automação (`navigator.webdriver`): Playwright, Selenium,
//    Puppeteer e afins, mesmo que rodem contra o domínio de produção.
//
// Sobre contar por IP: o endereço IP do visitante não é visível para o código
// que roda no navegador. Contar por IP de verdade exigiria uma Cloud Function
// (plano Blaze) recebendo a requisição e lendo o cabeçalho. A trava por
// navegador abaixo é a aproximação possível do lado do cliente — e a regra do
// Firestore (firestore.rules) impede que alguém empurre o número na marra.
import { useEffect, useState } from "react";
import { db } from "../firebase.js";
import { doc, onSnapshot, setDoc, increment } from "firebase/firestore";

const VISITED_KEY = "qag_visited";

// Hostnames que representam desenvolvimento, teste ou rede interna.
const HOSTS_LOCAIS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

// Faixas privadas do IPv4: 10.x, 192.168.x e 172.16.x–172.31.x.
const IP_PRIVADO = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

// Só a visita de uma pessoa real, no site publicado, entra na conta.
export function deveContar(janela = typeof window === "undefined" ? null : window) {
  if (!janela?.location) return false;

  const host = janela.location.hostname;
  if (!host) return false;
  if (HOSTS_LOCAIS.has(host)) return false;
  if (host.endsWith(".local")) return false;
  if (IP_PRIVADO.test(host)) return false;

  // Navegador dirigido por ferramenta de automação não é visitante.
  if (janela.navigator?.webdriver) return false;

  return true;
}

export default function useVisitorCount() {
  // null = carregando ou indisponível; número = total de visitantes.
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!db || typeof window === "undefined") return;

    const ref = doc(db, "stats", "visits");
    let vivo = true;

    // Ambiente de teste ou desenvolvimento apenas LÊ o número — nunca soma.
    if (deveContar()) {
      let jaContado = false;
      try {
        jaContado = window.localStorage.getItem(VISITED_KEY) === "1";
      } catch {
        /* localStorage bloqueado (janela anônima) — segue sem a trava. */
      }

      if (!jaContado) {
        setDoc(ref, { count: increment(1) }, { merge: true })
          .then(() => {
            try {
              window.localStorage.setItem(VISITED_KEY, "1");
            } catch {
              /* ignora */
            }
          })
          .catch(() => {
            /* falha de rede ou permissão — apenas não incrementa. */
          });
      }
    }

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!vivo) return;
        const valor = snap.exists() ? snap.data().count : 0;
        if (typeof valor === "number") setCount(valor);
      },
      () => {
        if (vivo) setCount(null);
      }
    );

    return () => {
      vivo = false;
      unsub();
    };
  }, []);

  return count;
}
