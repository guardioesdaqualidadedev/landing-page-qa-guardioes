// ─── Apoio aos testes de navegação por teclado ───────────────────────────
//
// Por que isto existe: um KeyboardEvent sintético disparado de dentro da
// página NÃO move o foco — o navegador ignora Tab vindo de script, por
// segurança. Só a tecla de verdade funciona, e é isso que
// `page.keyboard.press("Tab")` faz: o Playwright envia a tecla pelo protocolo
// do navegador, então o foco anda exatamente como andaria com a mão da pessoa
// no teclado. Estes helpers são a leitura desse passeio.

/**
 * Descreve o elemento que está com o foco agora.
 * Devolve `null` quando o foco saiu do documento (foi para a barra do
 * navegador, por exemplo) — o que também serve de condição de parada.
 */
export async function focoAtual(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return null;

    const limpar = (s) => (s || "").replace(/\s+/g, " ").trim();
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();

    // Aproximação prática do nome acessível, na ordem de prioridade real.
    const porReferencia = (attr) =>
      limpar(
        (el.getAttribute(attr) || "")
          .split(/\s+/)
          .filter(Boolean)
          .map((id) => (document.getElementById(id) || {}).textContent || "")
          .join(" ")
      );
    const rotuloAssociado =
      el.labels && el.labels.length ? limpar([...el.labels].map((l) => l.textContent).join(" ")) : "";

    const nome =
      porReferencia("aria-labelledby") ||
      limpar(el.getAttribute("aria-label")) ||
      rotuloAssociado ||
      limpar(el.getAttribute("alt")) ||
      limpar(el.textContent) ||
      limpar(el.getAttribute("title")) ||
      limpar(el.getAttribute("placeholder")) ||
      limpar(el.value);

    const regiao = el.closest("header")
      ? "header"
      : el.closest("main")
        ? "main"
        : el.closest("footer")
          ? "footer"
          : null;

    return {
      tag: el.tagName.toLowerCase(),
      testid: el.getAttribute("data-testid") || null,
      id: el.id || null,
      papel: el.getAttribute("role") || null,
      nome: nome.slice(0, 90),
      tabindex: el.getAttribute("tabindex"),
      href: el.getAttribute("href"),
      regiao,
      // Geometria: viewport para saber se está na tela, absoluta para comparar
      // com a ordem visual sem que a rolagem atrapalhe.
      largura: Math.round(r.width),
      altura: Math.round(r.height),
      topo: Math.round(r.top),
      esquerda: Math.round(r.left),
      topoAbsoluto: Math.round(r.top + window.scrollY),
      esquerdaAbsoluta: Math.round(r.left + window.scrollX),
      naTela:
        r.width > 0 &&
        r.height > 0 &&
        r.bottom > 0 &&
        r.right > 0 &&
        r.top < window.innerHeight &&
        r.left < window.innerWidth,
      display: cs.display,
      visibilidade: cs.visibility,
      // A WCAG 2.5.8 isenta do tamanho mínimo o alvo que está dentro de uma
      // frase ou bloco de texto — é a exceção "inline".
      linhaDeTexto:
        el.tagName === "A" &&
        cs.display === "inline" &&
        Boolean(el.closest("p,li,td,dd,span,h1,h2,h3,h4,h5,h6,figcaption,blockquote,label")),
    };
  });
}

/**
 * Mede se o foco aparece na tela: compara o estilo calculado do elemento
 * COM e SEM foco. Um `outline` vale por si; qualquer outra diferença
 * perceptível (sombra, borda, fundo, sublinhado) também conta.
 *
 * O elemento é desfocado e refocado no processo — seguro neste projeto, que
 * não tem nenhum onBlur/onFocus.
 */
export async function indicadorDeFoco(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;

    const ler = () => {
      const cs = getComputedStyle(el);
      return {
        outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} ${cs.outlineOffset}`,
        sombra: cs.boxShadow,
        borda: `${cs.borderStyle} ${cs.borderWidth} ${cs.borderColor}`,
        fundo: cs.backgroundColor,
        cor: cs.color,
        sublinhado: cs.textDecorationLine,
      };
    };

    const comFoco = ler();
    el.blur();
    const semFoco = ler();
    el.focus({ preventScroll: true });

    const larguraOutline = parseFloat(comFoco.outline.split(" ")[1]) || 0;
    return {
      temOutline: !/^(none|hidden)/.test(comFoco.outline) && larguraOutline > 0,
      mudou: JSON.stringify(comFoco) !== JSON.stringify(semFoco),
      comFoco,
      semFoco,
    };
  });
}

/** Identidade estável de um elemento focado, para comparar caminhos. */
export function chaveDoFoco(f) {
  if (!f) return "(fora do documento)";
  return f.testid || f.id || `${f.tag}${f.papel ? `[${f.papel}]` : ""}:${f.nome}`;
}

/**
 * Percorre o documento pressionando Tab e devolve o caminho do foco.
 *
 * Para quando o foco sai do documento ou quando dá a volta e retorna ao
 * primeiro elemento — o que também detecta armadilha de foco: se o caminho
 * bate no limite de `passos` sem nenhuma das duas coisas, o foco está preso.
 */
export async function caminhoDoFoco(page, { passos = 80, indicador = false } = {}) {
  const caminho = [];
  let voltouAoInicio = false;

  for (let i = 0; i < passos; i++) {
    await page.keyboard.press("Tab");
    const f = await focoAtual(page);
    if (!f) break;

    if (caminho.length && chaveDoFoco(f) === chaveDoFoco(caminho[0])) {
      voltouAoInicio = true;
      break;
    }
    if (indicador) f.indicador = await indicadorDeFoco(page);
    caminho.push(f);
  }

  caminho.voltouAoInicio = voltouAoInicio;
  caminho.atingiuOLimite = caminho.length >= passos;
  return caminho;
}

/** Mesmo passeio, de trás para frente. */
export async function caminhoDeVolta(page, passos) {
  const caminho = [];
  for (let i = 0; i < passos; i++) {
    await page.keyboard.press("Shift+Tab");
    const f = await focoAtual(page);
    if (!f) break;
    caminho.push(f);
  }
  return caminho;
}

/** Linha legível de um elemento focado, usada nas mensagens de falha. */
export function descrever(f) {
  if (!f) return "(nada focado)";
  const quem = f.testid ? `[${f.testid}]` : f.id ? `#${f.id}` : `<${f.tag}>`;
  return `${quem} "${f.nome || "sem nome"}"`;
}

/** Lista pronta para aparecer numa mensagem de erro. */
export function listar(caminho) {
  return caminho.map((f, i) => `  ${String(i + 1).padStart(2)}. ${descrever(f)}`).join("\n");
}

/**
 * Pontos em que a ordem de tabulação anda para trás em relação à ordem visual
 * (de cima para baixo, da esquerda para a direita). A tolerância existe porque
 * itens da mesma linha nunca ficam alinhados ao pixel.
 */
export function quebrasDeOrdemVisual(caminho, tolerancia = 16) {
  const quebras = [];
  for (let i = 1; i < caminho.length; i++) {
    const anterior = caminho[i - 1];
    const atual = caminho[i];
    const subiu = atual.topoAbsoluto + tolerancia < anterior.topoAbsoluto;
    const mesmaLinha = Math.abs(atual.topoAbsoluto - anterior.topoAbsoluto) <= tolerancia;
    const voltouNaLinha = mesmaLinha && atual.esquerdaAbsoluta + tolerancia < anterior.esquerdaAbsoluta;
    if (subiu || voltouNaLinha) {
      quebras.push(`${descrever(anterior)} → ${descrever(atual)}`);
    }
  }
  return quebras;
}
