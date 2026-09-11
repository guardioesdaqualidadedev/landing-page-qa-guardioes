// Contador TOTAL de visitantes (acumulado), em tempo real via Firestore.
//
// Como funciona:
//  • Existe um único documento `stats/visits` com o campo numérico `count`.
//  • Na primeira visita de cada navegador, incrementamos `count` em 1 usando
//    `increment` — operação atômica do Firestore, sem corrida entre visitantes.
//  • Um `onSnapshot` escuta o documento e atualiza o número na tela.
//
// O localStorage conta VISITANTES (um por navegador), não recarregamentos.
import { useEffect, useState } from "react";
import { db } from "../firebase.js";
import { doc, onSnapshot, setDoc, increment } from "firebase/firestore";

const VISITED_KEY = "qag_visited";

export default function useVisitorCount() {
  // null = carregando ou indisponível; número = total de visitantes.
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!db || typeof window === "undefined") return;

    const ref = doc(db, "stats", "visits");
    let vivo = true;

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
