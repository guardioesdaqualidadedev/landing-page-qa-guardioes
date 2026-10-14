/**
 * Ajudantes de navegação por teclado (Tab / Shift+Tab).
 *
 * Cada parada do foco vira uma frase curta "tipo: nome", que aparece no painel
 * "Foco do teclado" da legenda e é o que as asserções comparam:
 *
 *   a: Entrar no Discord (abre em nova aba)
 *   h2: Aprender com prática real, sem hierarquia
 *   radio: Prioridade › P1 imediata
 *
 * O nome é uma aproximação do nome acessível — o mesmo que o NVDA lê: ignora o
 * que está em aria-hidden (setas e símbolos decorativos) e usa o texto como
 * está no HTML, e não em maiúsculas como o CSS desenha os títulos.
 *
 * Paradas repetidas seguidas contam como uma só: dentro do campo de data, por
 * exemplo, o Tab passa por dia, mês e ano, mas o foco DA PÁGINA continua no
 * mesmo <input> — é o que a pessoa percebe ("estou na data").
 */

// Roda no navegador: descreve o elemento com foco e onde ele está na tela.
function lerFoco() {
  const a = document.activeElement;
  if (!a || a === document.body || a === document.documentElement) {
    return { descricao: "body", naTela: false };
  }
  const limpar = (s) => (s || "").replace(/\s+/g, " ").trim();
  const texto = (el) => {
    if (!el) return "";
    const copia = el.cloneNode(true);
    copia.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
    return limpar(copia.textContent);
  };
  const porIds = (ids) => limpar(ids.split(/\s+/).map((id) => texto(document.getElementById(id))).join(" "));

  const nome =
    (a.getAttribute("aria-labelledby") && porIds(a.getAttribute("aria-labelledby"))) ||
    limpar(a.getAttribute("aria-label")) ||
    (a.labels && a.labels.length ? limpar([...a.labels].map(texto).join(" ")) : "") ||
    texto(a) ||
    limpar(a.getAttribute("title")) ||
    limpar(a.getAttribute("placeholder"));

  const tipo =
    a.getAttribute("role") ||
    (a.tagName === "INPUT" ? (["radio", "checkbox"].includes(a.type) ? a.type : "input") : a.tagName.toLowerCase());

  // Rádio: o nome do grupo vem junto ("Prioridade › P1 imediata").
  const grupo = tipo === "radio" ? texto(a.closest("fieldset")?.querySelector("legend")) : "";

  const r = a.getBoundingClientRect();
  const cabecalho = document.querySelector("header")?.getBoundingClientRect();
  // O que está no centro do elemento é ele mesmo? Se não, algo o cobre.
  const cx = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1);
  const cy = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1);
  const noCentro = document.elementFromPoint(cx, cy);
  const visivelNoCentro = !!noCentro && (a === noCentro || a.contains(noCentro) || noCentro.contains(a) || a.labels?.[0]?.contains(noCentro));

  return {
    descricao: `${tipo}: ${grupo ? `${grupo} › ` : ""}${nome.slice(0, 90)}`,
    tipo,
    id: a.id || null,
    testid: a.getAttribute("data-testid"),
    topo: Math.round(r.top + window.scrollY),
    esquerda: Math.round(r.left + window.scrollX),
    naTela: r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth,
    sobOCabecalho: !!cabecalho && cabecalho.bottom > 0 && r.top < cabecalho.bottom - 1 && r.bottom > cabecalho.top,
    visivelNoCentro,
  };
}

// Descrição curta do elemento com foco: "tipo: nome".
export async function focoAtual(page) {
  return (await page.evaluate(lerFoco)).descricao;
}

// Mesma leitura, com a posição na tela (para conferir ordem visual e foco escondido).
export async function detalheDoFoco(page) {
  return page.evaluate(lerFoco);
}

/**
 * Aperta `tecla` repetidamente e devolve as paradas do foco (sem repetições
 * seguidas). Para quando `parar(foco)` for verdadeiro ou no `limite`.
 * Cada parada nova aparece no painel "Foco do teclado" da legenda.
 * Com `detalhes`, devolve o objeto completo de cada parada em vez do texto.
 */
export async function navegar(page, legenda, tecla, parar, limite = 150, { detalhes = false } = {}) {
  const paradas = [];
  const simbolo = tecla === "Tab" ? "Tab →" : "⇧Tab ←";
  for (let i = 0; i < limite; i++) {
    await page.keyboard.press(tecla);
    const foco = await detalheDoFoco(page);
    if (foco.descricao === paradas.at(-1)?.descricao) continue;
    paradas.push(foco);
    if (legenda) await legenda.foco(`${simbolo} ${foco.descricao}`);
    if (parar && parar(foco.descricao)) break;
  }
  return detalhes ? paradas : paradas.map((p) => p.descricao);
}

// Uma tecla só, registrando a parada na legenda.
export async function apertar(page, legenda, tecla) {
  await page.keyboard.press(tecla);
  await page.waitForTimeout(150);
  const foco = await focoAtual(page);
  const simbolo = tecla === "Shift+Tab" ? "⇧Tab ←" : `${tecla} →`;
  if (legenda) await legenda.foco(`${simbolo} ${foco}`);
  return foco;
}

/**
 * Pontos em que a ordem do foco anda para trás em relação à ordem visual
 * (de cima para baixo, da esquerda para a direita). A tolerância existe porque
 * itens da mesma linha nunca ficam alinhados ao pixel.
 */
export function quebrasDeOrdemVisual(paradas, tolerancia = 16) {
  const quebras = [];
  for (let i = 1; i < paradas.length; i++) {
    const [antes, agora] = [paradas[i - 1], paradas[i]];
    const subiu = agora.topo + tolerancia < antes.topo;
    const mesmaLinha = Math.abs(agora.topo - antes.topo) <= tolerancia;
    if (subiu || (mesmaLinha && agora.esquerda + tolerancia < antes.esquerda)) {
      quebras.push(`${antes.descricao} → ${agora.descricao}`);
    }
  }
  return quebras;
}
