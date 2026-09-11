// ─────────────────────────────────────────────────────────────────────────────
// Datas no padrão brasileiro — dd/mm/aaaa.
//
// O site troca datas com o navegador em ISO (`aaaa-mm-dd`): é o formato que o
// <input type="date"> entrega e o único que ordena corretamente como texto. Só
// que ISO NUNCA deve aparecer para o visitante — nem no texto de uma célula,
// nem dentro de uma mensagem de erro. Este módulo é a única fronteira entre os
// dois mundos, para não sobrar nenhuma tela com o formato errado.
//
// Atenção ao fuso: `new Date("2026-09-09")` é interpretado como UTC e, em fuso
// negativo como o do Brasil, volta um dia. Por isso montamos a data local peça
// por peça, em vez de deixar o parser do navegador adivinhar.
// ─────────────────────────────────────────────────────────────────────────────

const RE_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

// "2026-09-09" → Date local à meia-noite. `null` quando não é uma data ISO
// válida (inclusive casos como "2026-02-31", que o construtor "corrigiria"
// silenciosamente para 03/03).
export function isoParaData(iso) {
  if (typeof iso !== "string") return null;
  const m = RE_ISO.exec(iso);
  if (!m) return null;

  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(ano, mes - 1, dia);
  if (Number.isNaN(data.getTime())) return null;

  // Rejeita datas que "transbordaram" para o mês seguinte.
  const real =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return real ? data : null;
}

// "2026-09-09" → "09/09/2026". Devolve string vazia quando não dá para formatar,
// para nunca imprimir "Invalid Date" na tela.
export function formatarDataBR(iso) {
  const data = isoParaData(iso);
  return data ? formatarDataObjBR(data) : "";
}

// Date → "09/09/2026". Montado com padStart em vez de `toLocaleDateString`
// porque o resultado não pode depender do idioma configurado no navegador de
// quem visita: a regra aqui é o padrão brasileiro, sempre.
export function formatarDataObjBR(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) return "";
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()}`;
}

export const FORMATO_DATA_BR = "dd/mm/aaaa";
