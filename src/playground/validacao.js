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
import { isoParaData, formatarDataBR, formatarDataObjBR, FORMATO_DATA_BR } from "../utils/datas.js";

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

// Reexportado para não quebrar quem já importava daqui. A implementação mora em
// `utils/datas.js` porque a regra de fuso (montar a data local peça por peça,
// em vez de deixar `new Date("2026-09-09")` interpretar como UTC e voltar um
// dia no Brasil) vale para o site inteiro, não só para o playground.
export const paraDataLocal = isoParaData;

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
    erros.data = `Data inválida. Use o formato ${FORMATO_DATA_BR}.`;
  } else {
    const limiteHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    if (data > limiteHoje) {
      erros.data = `A data de detecção não pode estar no futuro (hoje é ${formatarDataObjBR(limiteHoje)}).`;
    } else if (data < paraDataLocal(LIMITES.dataMinima)) {
      // O limite é guardado em ISO (é o formato que o <input type="date" usa),
      // mas o visitante lê dd/mm/aaaa — nunca "2020-01-01".
      erros.data = `A data não pode ser anterior a ${formatarDataBR(LIMITES.dataMinima)}.`;
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
