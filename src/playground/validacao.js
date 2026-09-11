// ─────────────────────────────────────────────────────────────────────────────
// Validação do formulário de registro de defeito.
//
// É uma função PURA: recebe os valores, devolve um objeto de erros. Sem React,
// sem DOM. Isso é o que permite testar as regras de negócio em unidade — e é o
// mesmo motivo pelo qual, na vida real, a lógica de validação não deveria morar
// dentro do componente.
//
// As faixas foram escolhidas para render valor-limite e partição de
// equivalência: quem estiver praticando tem fronteiras claras para explorar.
// ─────────────────────────────────────────────────────────────────────────────
import { SEVERIDADES, PRIORIDADES, AMBIENTES, MODULOS } from "./dominio.js";

export const LIMITES = {
  tituloMin: 5,
  tituloMax: 80,
  passosMin: 20,
  passosMax: 600,
  ocorrenciasMin: 1,
  ocorrenciasMax: 999,
  dataMinima: "2020-01-01",
};

// Formato de e-mail deliberadamente simples: algo@algo.dominio, sem espaços.
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// "2026-09-09" → data local à meia-noite. Usar new Date("2026-09-09") direto
// interpreta como UTC e, em fusos negativos como o do Brasil, a data "hoje"
// vira "ontem" — um clássico de bug de fuso horário.
export function paraDataLocal(iso) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [a, m, d] = iso.split("-").map(Number);
  const data = new Date(a, m - 1, d);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function validarDefeito(valores, hoje = new Date()) {
  const erros = {};
  const v = valores || {};

  // Título
  const titulo = (v.titulo || "").trim();
  if (!titulo) {
    erros.titulo = "Informe o título do defeito.";
  } else if (titulo.length < LIMITES.tituloMin) {
    erros.titulo = `O título precisa de pelo menos ${LIMITES.tituloMin} caracteres.`;
  } else if (titulo.length > LIMITES.tituloMax) {
    erros.titulo = `O título pode ter no máximo ${LIMITES.tituloMax} caracteres.`;
  }

  // Módulo, severidade, prioridade e ambiente — listas fechadas.
  if (!v.modulo) erros.modulo = "Selecione o módulo afetado.";
  else if (!MODULOS.includes(v.modulo)) erros.modulo = "Módulo inválido.";

  if (!v.severidade) erros.severidade = "Selecione a severidade.";
  else if (!SEVERIDADES.includes(v.severidade)) erros.severidade = "Severidade inválida.";

  if (!v.prioridade) erros.prioridade = "Selecione a prioridade.";
  else if (!PRIORIDADES.includes(v.prioridade)) erros.prioridade = "Prioridade inválida.";

  if (!v.ambiente) erros.ambiente = "Selecione o ambiente.";
  else if (!AMBIENTES.includes(v.ambiente)) erros.ambiente = "Ambiente inválido.";

  // E-mail de quem reportou
  const email = (v.reporter || "").trim();
  if (!email) erros.reporter = "Informe o e-mail de quem reportou.";
  else if (!RE_EMAIL.test(email)) erros.reporter = "E-mail inválido. Use o formato nome@dominio.com.";

  // Data de detecção — não pode ser futura nem anterior ao limite.
  const data = paraDataLocal(v.data);
  if (!v.data) {
    erros.data = "Informe a data de detecção.";
  } else if (!data) {
    erros.data = "Data inválida.";
  } else {
    const limiteHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    if (data > limiteHoje) erros.data = "A data de detecção não pode estar no futuro.";
    else if (data < paraDataLocal(LIMITES.dataMinima)) {
      erros.data = `A data não pode ser anterior a ${LIMITES.dataMinima}.`;
    }
  }

  // Ocorrências — inteiro dentro da faixa.
  const bruto = v.ocorrencias;
  if (bruto === "" || bruto === null || bruto === undefined) {
    erros.ocorrencias = "Informe quantas vezes o defeito ocorreu.";
  } else {
    const n = Number(bruto);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      erros.ocorrencias = "Use um número inteiro.";
    } else if (n < LIMITES.ocorrenciasMin || n > LIMITES.ocorrenciasMax) {
      erros.ocorrencias = `Informe um valor entre ${LIMITES.ocorrenciasMin} e ${LIMITES.ocorrenciasMax}.`;
    }
  }

  // Passos para reproduzir
  const passos = (v.passos || "").trim();
  if (!passos) {
    erros.passos = "Descreva os passos para reproduzir.";
  } else if (passos.length < LIMITES.passosMin) {
    erros.passos = `Descreva com pelo menos ${LIMITES.passosMin} caracteres.`;
  } else if (passos.length > LIMITES.passosMax) {
    erros.passos = `Use no máximo ${LIMITES.passosMax} caracteres.`;
  }

  // Aceite das diretrizes da comunidade
  if (!v.aceite) erros.aceite = "É preciso confirmar que o defeito não expõe dados sensíveis.";

  return erros;
}

export function formularioValido(valores, hoje = new Date()) {
  return Object.keys(validarDefeito(valores, hoje)).length === 0;
}
