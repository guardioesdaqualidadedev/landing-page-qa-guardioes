/*!
 * Auditor de Acessibilidade Web - bookmarklet
 * Varre o DOM e o CSS da pagina atual e gera um relatorio HTML autocontido.
 * Base: WCAG 2.2 niveis A e AA + boas praticas. Idioma: pt-BR.
 */
(function () {
  'use strict';

  if (window.__AUDITOR_A11Y_RODANDO__) { return; }
  window.__AUDITOR_A11Y_RODANDO__ = 1;

  var VERSAO = '1.0.0';
  var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
  var D = document, W = window;

  /* ------------------------------------------------------------------ */
  /* utilidades basicas                                                  */
  /* ------------------------------------------------------------------ */

  function A(l) { return Array.prototype.slice.call(l || []); }

  function $$(sel, raiz) {
    try { return A((raiz || D).querySelectorAll(sel)); } catch (e) { return []; }
  }

  var MAPA_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return MAPA_ESC[c]; });
  }

  function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  function cssEsc(s) {
    if (W.CSS && CSS.escape) { try { return CSS.escape(s); } catch (e) { } }
    return String(s).replace(/([^\w-])/g, '\\$1');
  }

  var cacheEstilo = new Map();
  function gcs(el) {
    if (cacheEstilo.has(el)) return cacheEstilo.get(el);
    var cs = null;
    try { cs = W.getComputedStyle(el); } catch (e) { cs = null; }
    cacheEstilo.set(el, cs);
    return cs;
  }

  function ret(el) {
    try { return el.getBoundingClientRect(); } catch (e) { return { width: 0, height: 0, top: 0, left: 0 }; }
  }

  /* caminho CSS curto e legivel, util para o time reproduzir o achado */
  function caminho(el) {
    if (!el || el.nodeType !== 1) return '(documento)';
    if (el === D.documentElement) return 'html';
    if (el === D.body) return 'body';
    var partes = [], n = el, prof = 0;
    while (n && n.nodeType === 1 && prof < 4) {
      var p = n.nodeName.toLowerCase();
      var id = n.getAttribute && n.getAttribute('id');
      if (id && /^[A-Za-z][\w-]*$/.test(id)) { partes.unshift('#' + id); break; }
      var cls = ((n.getAttribute && n.getAttribute('class')) || '').split(/\s+/)
        .filter(function (c) { return c && /^[A-Za-z][\w-]*$/.test(c) && c.length < 24; })
        .slice(0, 2);
      if (cls.length) p += '.' + cls.join('.');
      var pai = n.parentNode;
      if (pai && pai.nodeType === 1) {
        var irmaos = A(pai.children).filter(function (c) { return c.nodeName === n.nodeName; });
        if (irmaos.length > 1) p += ':nth-of-type(' + (irmaos.indexOf(n) + 1) + ')';
      }
      partes.unshift(p);
      n = n.parentNode;
      prof++;
    }
    return partes.join(' > ');
  }

  /* trecho de codigo resumido do elemento */
  function trecho(el, max) {
    max = max || 160;
    if (!el || el.nodeType !== 1) return '';
    var s = '';
    try {
      var html = el.outerHTML || '';
      var fim = html.indexOf('>');
      var abre = fim > -1 ? html.slice(0, fim + 1) : html;
      if (el.children && el.children.length) {
        s = abre + ' ... </' + el.nodeName.toLowerCase() + '>';
      } else {
        s = norm(html);
      }
    } catch (e) { s = '<' + el.nodeName.toLowerCase() + '>'; }
    s = norm(s);
    if (s.length > max) s = s.slice(0, max) + ' ...';
    return s;
  }

  /* ------------------------------------------------------------------ */
  /* visibilidade                                                        */
  /* ------------------------------------------------------------------ */

  function ariaOculto(el) {
    var n = el;
    while (n && n.nodeType === 1) {
      if (n.getAttribute('aria-hidden') === 'true') return true;
      n = n.parentElement;
    }
    return false;
  }

  /* oculto para todo mundo (inclusive leitores de tela) */
  function oculto(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.closest && el.closest('[hidden]')) return true;
    if (el.nodeName === 'INPUT' && el.type === 'hidden') return true;
    if (ariaOculto(el)) return true;
    var cs = gcs(el);
    if (!cs) return true;
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return true;
    var rects = 0;
    try { rects = el.getClientRects().length; } catch (e) { rects = 1; }
    if (!rects && el.nodeName !== 'AREA' && cs.display !== 'contents') return true;
    return false;
  }

  /* escondido da tela mas disponivel para leitores de tela (padrao "visually hidden") */
  function soParaLeitor(el) {
    var cs = gcs(el);
    if (!cs) return false;
    var r = ret(el);
    if (r.width <= 1 && r.height <= 1) return true;
    if (cs.clipPath && cs.clipPath.indexOf('inset(50%') === 0) return true;
    if (cs.clip && cs.clip !== 'auto' && cs.clip.indexOf('rect(') === 0) return true;
    var x = parseFloat(cs.left), y = parseFloat(cs.top);
    if (cs.position === 'absolute' && (x < -999 || y < -999)) return true;
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* nome acessivel (aproximacao pratica do algoritmo accname)           */
  /* ------------------------------------------------------------------ */

  var FOCAVEL = 'a[href],area[href],button,input,select,textarea,summary,iframe,object,embed,audio[controls],video[controls],[tabindex],[contenteditable="true"]';

  function refs(el, attr) {
    var v = el.getAttribute(attr);
    if (!v) return [];
    return v.split(/\s+/).filter(Boolean).map(function (id) { return D.getElementById(id); });
  }

  function textoDe(el, prof) {
    prof = prof || 0;
    if (!el || prof > 4) return '';
    var saida = '';
    A(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { saida += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      if (n.getAttribute('aria-hidden') === 'true') return;
      var t = n.nodeName.toLowerCase();
      if (t === 'img' || t === 'area') {
        saida += ' ' + (n.getAttribute('alt') || n.getAttribute('aria-label') || '') + ' ';
      } else if (t === 'svg') {
        var ti = n.querySelector('title');
        saida += ' ' + (n.getAttribute('aria-label') || (ti ? ti.textContent : '')) + ' ';
      } else if (t === 'input' && /^(submit|button|reset)$/i.test(n.type || '')) {
        saida += ' ' + (n.value || '') + ' ';
      } else if (t === 'script' || t === 'style' || t === 'template') {
        return;
      } else {
        var rotulo = n.getAttribute('aria-label');
        saida += ' ' + (norm(rotulo) || textoDe(n, prof + 1)) + ' ';
      }
    });
    return norm(saida);
  }

  /* retorna { nome, origem } - origem diz de onde veio o nome */
  function nomeAcessivel(el) {
    if (!el || el.nodeType !== 1) return { nome: '', origem: '' };
    var lb = refs(el, 'aria-labelledby').filter(Boolean);
    if (lb.length) {
      var n1 = norm(lb.map(function (x) { return textoDe(x); }).join(' '));
      if (n1) return { nome: n1, origem: 'aria-labelledby' };
    }
    var al = norm(el.getAttribute('aria-label'));
    if (al) return { nome: al, origem: 'aria-label' };

    var tag = el.nodeName.toLowerCase();
    var tipo = (el.getAttribute('type') || '').toLowerCase();

    if (tag === 'img' || tag === 'area' || (tag === 'input' && tipo === 'image')) {
      if (el.hasAttribute('alt')) {
        var alt = norm(el.getAttribute('alt'));
        return { nome: alt, origem: 'alt' };
      }
    }
    if (tag === 'input' || tag === 'select' || tag === 'textarea') {
      if (tipo === 'submit') return { nome: norm(el.value) || 'Enviar', origem: 'value' };
      if (tipo === 'reset') return { nome: norm(el.value) || 'Redefinir', origem: 'value' };
      if (tipo === 'button') return { nome: norm(el.value), origem: 'value' };
      var rot = '';
      if (el.id) {
        var ls = $$('label[for="' + cssEsc(el.id) + '"]');
        if (ls.length) rot = ls.map(function (x) { return textoDe(x); }).join(' ');
      }
      if (!norm(rot) && el.closest) {
        var env = el.closest('label');
        if (env) rot = textoDe(env);
      }
      if (norm(rot)) return { nome: norm(rot), origem: 'label' };
      var ph = norm(el.getAttribute('placeholder'));
      if (ph) return { nome: ph, origem: 'placeholder' };
      var ti0 = norm(el.getAttribute('title'));
      if (ti0) return { nome: ti0, origem: 'title' };
      return { nome: '', origem: '' };
    }
    if (tag === 'fieldset') {
      var lg = el.querySelector('legend');
      if (lg) return { nome: textoDe(lg), origem: 'legend' };
    }
    if (tag === 'table') {
      var cap = el.querySelector('caption');
      if (cap && norm(cap.textContent)) return { nome: norm(cap.textContent), origem: 'caption' };
    }
    if (tag === 'svg') {
      var st = el.querySelector('title');
      if (st && norm(st.textContent)) return { nome: norm(st.textContent), origem: 'title (svg)' };
    }
    if (tag === 'iframe' || tag === 'frame') {
      var it = norm(el.getAttribute('title'));
      if (it) return { nome: it, origem: 'title' };
      return { nome: '', origem: '' };
    }
    var txt = textoDe(el);
    if (txt) return { nome: txt, origem: 'texto visivel' };
    var ti = norm(el.getAttribute('title'));
    if (ti) return { nome: ti, origem: 'title' };
    return { nome: '', origem: '' };
  }

  /* ------------------------------------------------------------------ */
  /* cor, contraste e simulacao de percepcao de cores                    */
  /* ------------------------------------------------------------------ */

  var telaCor = null;
  function parseCor(c) {
    if (!c) return null;
    c = String(c).trim();
    if (c === 'transparent' || c === 'none') return [0, 0, 0, 0];
    var m = c.match(/^rgba?\(([^)]+)\)/i);
    if (m) {
      var p = m[1].split(/[,\/\s]+/).filter(function (x) { return x !== ''; }).map(parseFloat);
      if (p.length >= 3) return [p[0] | 0, p[1] | 0, p[2] | 0, (p.length > 3 && !isNaN(p[3])) ? p[3] : 1];
    }
    m = c.match(/^#([0-9a-fA-F]{3,8})$/);
    if (m) {
      var h = m[1];
      if (h.length === 3 || h.length === 4) h = h.split('').map(function (x) { return x + x; }).join('');
      if (h.length >= 6) {
        var a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a];
      }
    }
    try {
      if (!telaCor) { telaCor = D.createElement('canvas'); telaCor.width = telaCor.height = 1; }
      var ctx = telaCor.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000000';
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      var d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    } catch (e) { return null; }
  }

  function mistura(frente, fundo) {
    var a = frente[3] == null ? 1 : frente[3];
    return [
      Math.round(frente[0] * a + fundo[0] * (1 - a)),
      Math.round(frente[1] * a + fundo[1] * (1 - a)),
      Math.round(frente[2] * a + fundo[2] * (1 - a))
    ];
  }

  function hex(rgb) {
    return '#' + rgb.slice(0, 3).map(function (v) {
      var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return s.length < 2 ? '0' + s : s;
    }).join('');
  }

  function linear(v) {
    v = v / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  function deLinear(v) {
    v = Math.max(0, Math.min(1, v));
    return 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  }
  function luminancia(rgb) {
    return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
  }
  function contraste(a, b) {
    var l1 = luminancia(a), l2 = luminancia(b);
    if (l1 < l2) { var t = l1; l1 = l2; l2 = t; }
    return (l1 + 0.05) / (l2 + 0.05);
  }

  /* fundo efetivo: empilha as camadas ate encontrar uma opaca */
  function fundoDe(el) {
    var camadas = [], n = el, temImagem = false, temGradiente = false;
    while (n && n.nodeType === 1) {
      var cs = gcs(n);
      if (cs) {
        var bi = cs.backgroundImage;
        if (bi && bi !== 'none') {
          if (/gradient/i.test(bi)) temGradiente = true; else temImagem = true;
        }
        var c = parseCor(cs.backgroundColor);
        if (c && c[3] > 0) {
          camadas.push(c);
          if (c[3] >= 0.995) break;
        }
      }
      n = n.parentElement;
    }
    var base = [255, 255, 255];
    for (var i = camadas.length - 1; i >= 0; i--) base = mistura(camadas[i], base);
    return { rgb: base, imagem: temImagem, gradiente: temGradiente };
  }

  /* matrizes de Machado et al. (2009), severidade maxima, em espaco linear */
  var SIM = {
    protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
    deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
    tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900]
  };
  function simulaCor(rgb, tipo) {
    var m = SIM[tipo];
    if (!m) return rgb.slice(0, 3);
    var r = linear(rgb[0]), g = linear(rgb[1]), b = linear(rgb[2]);
    return [
      deLinear(m[0] * r + m[1] * g + m[2] * b),
      deLinear(m[3] * r + m[4] * g + m[5] * b),
      deLinear(m[6] * r + m[7] * g + m[8] * b)
    ].map(Math.round);
  }

  /* ------------------------------------------------------------------ */
  /* leitura das folhas de estilo                                        */
  /* ------------------------------------------------------------------ */

  var cssBloqueadas = 0;
  var regras = [];
  var cssTexto = '';

  (function lerCSS() {
    A(D.styleSheets).forEach(function (ss) {
      var lista;
      try { lista = ss.cssRules || ss.rules; } catch (e) { cssBloqueadas++; return; }
      if (!lista) { cssBloqueadas++; return; }
      (function anda(l, prof) {
        if (prof > 6) return;
        A(l).forEach(function (r) {
          regras.push(r);
          try { cssTexto += (r.conditionText || r.media && r.media.mediaText || '') + ' '; } catch (e) { }
          if (r.cssRules) anda(r.cssRules, prof + 1);
        });
      })(lista, 0);
    });
    $$('style').forEach(function (s) { cssTexto += ' ' + (s.textContent || ''); });
  })();

  function regrasDeEstilo() {
    return regras.filter(function (r) { return r.type === 1 && r.selectorText && r.style; });
  }

  /* ------------------------------------------------------------------ */
  /* registro de verificacoes                                            */
  /* ------------------------------------------------------------------ */

  var achados = [], aprovadas = [], falhasInternas = [], totalVerif = 0;
  var LIM_ITENS = 40;

  /*
    def = { id, titulo, sev, cat, wcag, afeta[], leitor, cor, porque, corrigir, exemplo }
    fn() devolve [] (passou) ou [{ el, det }]
  */
  function checa(def, fn) {
    totalVerif++;
    var itens;
    try { itens = fn() || []; }
    catch (e) { falhasInternas.push(def.id + ': ' + (e && e.message ? e.message : e)); return; }
    if (!itens.length) { aprovadas.push(def); return; }
    def.qtd = itens.length;
    def.itens = itens.slice(0, LIM_ITENS).map(function (it) {
      return {
        sel: it.el ? caminho(it.el) : (it.sel || '(pagina)'),
        cod: it.el ? trecho(it.el) : (it.cod || ''),
        det: it.det || '',
        extra: it.extra || null
      };
    });
    achados.push(def);
  }

  var PESO = { critico: 10, serio: 5, moderado: 2, aviso: 0.5 };

  var CATS = {
    imagens: 'Imagens e conteúdo não textual',
    links: 'Links e navegação',
    controles: 'Botões e controles interativos',
    formularios: 'Formulários',
    estrutura: 'Estrutura semântica e regiões da página',
    aria: 'ARIA, papéis e estados',
    cor: 'Cor, contraste e legibilidade',
    teclado: 'Teclado e foco',
    zoom: 'Zoom, redimensionamento e espaçamento',
    midia: 'Mídia, movimento e tempo',
    extras: 'Boas práticas além da norma'
  };

  var AFETA = {
    cegos: 'pessoas cegas que usam leitor de tela',
    baixavisao: 'pessoas com baixa visão',
    cores: 'pessoas com daltonismo (visão de cores atípica)',
    teclado: 'pessoas que navegam só pelo teclado',
    motora: 'pessoas com mobilidade reduzida nas mãos',
    cognitiva: 'pessoas com dislexia, TDAH ou deficiência cognitiva',
    auditiva: 'pessoas surdas ou com perda auditiva',
    todos: 'todas as pessoas usuárias'
  };

  /* coletas reutilizadas pelas verificacoes */
  var TODOS = $$('body *').slice(0, 8000);
  var VISIVEIS = TODOS.filter(function (el) { return !oculto(el); });
  var FOCAVEIS = $$(FOCAVEL).filter(function (el) {
    if (el.disabled) return false;
    var ti = el.getAttribute('tabindex');
    if (ti !== null && parseInt(ti, 10) < 0) return false;
    return true;
  });
  var FOCAVEIS_VIS = FOCAVEIS.filter(function (el) { return !oculto(el); });

  var PAPEIS_VALIDOS = ('alert alertdialog application article associationlist associationlistitemkey associationlistitemvalue banner blockquote button caption cell checkbox code columnheader combobox comment command complementary composite contentinfo definition deletion dialog directory document emphasis feed figure form generic grid gridcell group heading image img input insertion landmark link list listbox listitem log main mark marquee math menu menubar menuitem menuitemcheckbox menuitemradio meter navigation none note option paragraph presentation progressbar radio radiogroup range region roletype row rowgroup rowheader scrollbar search searchbox section sectionhead select separator slider spinbutton status strong structure subscript suggestion superscript switch tab table tablist tabpanel term textbox time timer toolbar tooltip tree treegrid treeitem widget window').split(' ');

  var ARIA_VALIDOS = ('activedescendant atomic autocomplete braillelabel brailleroledescription busy checked colcount colindex colindextext colspan controls current describedby description details disabled dropeffect errormessage expanded flowto grabbed haspopup hidden invalid keyshortcuts label labelledby level live modal multiline multiselectable orientation owns placeholder posinset pressed readonly relevant required roledescription rowcount rowindex rowindextext rowspan selected setsize sort valuemax valuemin valuenow valuetext').split(' ');

  /* ================================================================== */
  /* IMAGENS E CONTEUDO NAO TEXTUAL                                      */
  /* ================================================================== */

  checa({
    id: 'img-sem-alt', sev: 'critico', cat: 'imagens', wcag: '1.1.1 Conteúdo não textual (A)',
    titulo: 'Imagem sem atributo alt',
    afeta: ['cegos', 'baixavisao'], leitor: true,
    porque: 'Sem o atributo alt, o leitor de tela não tem texto para anunciar e costuma ler o nome do arquivo ou apenas "imagem" — a informação que a imagem carrega some da experiência. O atributo precisa existir sempre: com texto quando a imagem informa algo, e vazio (alt="") quando ela é apenas decorativa.',
    corrigir: 'Adicione alt descrevendo a função ou a informação da imagem naquele contexto, não a aparência dela. Se a imagem for puramente decorativa, use alt="" (vazio, sem espaço) para que o leitor de tela a ignore.',
    exemplo: '<img src="grafico.png" alt="Vendas cresceram 12% no 2º trimestre">\n<img src="ornamento.svg" alt="">'
  }, function () {
    return $$('img').filter(function (el) {
      return !el.hasAttribute('alt') && !ariaOculto(el) && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.getAttribute('title');
    }).map(function (el) { return { el: el, det: 'src: ' + norm((el.getAttribute('src') || '').slice(-70)) }; });
  });

  checa({
    id: 'img-alt-nome-arquivo', sev: 'serio', cat: 'imagens', wcag: '1.1.1 Conteúdo não textual (A)',
    titulo: 'Texto alternativo parece ser o nome do arquivo',
    afeta: ['cegos'], leitor: true,
    porque: 'O leitor de tela vai anunciar algo como "i-m-g underline 4 4 2 ponto p-n-g". Isso ocupa tempo de escuta e não comunica nada sobre o conteúdo.',
    corrigir: 'Substitua por uma descrição em linguagem natural do que a imagem comunica naquele ponto da página.',
    exemplo: '<!-- em vez de --> <img src="..." alt="IMG_4421.jpg">\n<!-- use -->      <img src="..." alt="Equipe de suporte reunida na sala de treinamento">'
  }, function () {
    return $$('img[alt]').filter(function (el) {
      var a = norm(el.getAttribute('alt'));
      return a && (/\.(jpe?g|png|gif|svg|webp|avif|bmp|ico)$/i.test(a) || /^(img|image|dsc|foto|photo|picture|captura|screenshot|banner)[-_ ]?\d+$/i.test(a));
    }).map(function (el) { return { el: el, det: 'alt="' + norm(el.getAttribute('alt')) + '"' }; });
  });

  checa({
    id: 'img-alt-redundante', sev: 'moderado', cat: 'imagens', wcag: '1.1.1 Conteúdo não textual (A)',
    titulo: 'Texto alternativo começa com "imagem de", "foto de" ou similar',
    afeta: ['cegos'], leitor: true,
    porque: 'O leitor de tela já anuncia o papel do elemento ("imagem") antes de ler o alt. Repetir a palavra faz a pessoa ouvir "imagem, imagem de um gato" a cada figura.',
    corrigir: 'Remova o prefixo e comece direto pelo conteúdo. Exceção legítima: quando o tipo de imagem é a informação relevante, como "Gráfico de barras: ..." ou "Ilustração: ...".',
    exemplo: '<!-- em vez de --> alt="Imagem de um estetoscópio sobre a mesa"\n<!-- use -->      alt="Estetoscópio sobre a mesa"'
  }, function () {
    return $$('img[alt]').filter(function (el) {
      return /^(imagem|foto|figura|image|picture|photo)\s*(de|do|da|dos|das|:)?\s+\S/i.test(norm(el.getAttribute('alt')));
    }).map(function (el) { return { el: el, det: 'alt="' + norm(el.getAttribute('alt')).slice(0, 80) + '"' }; });
  });

  checa({
    id: 'img-alt-longo', sev: 'moderado', cat: 'imagens', wcag: '1.1.1 Conteúdo não textual (A)',
    titulo: 'Texto alternativo muito longo (acima de 150 caracteres)',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'O alt é lido de uma vez só, sem pausa e sem possibilidade de navegar dentro dele. Descrições longas ficam difíceis de acompanhar só pela audição.',
    corrigir: 'Deixe no alt um resumo curto da informação essencial e coloque a descrição completa no próprio conteúdo da página (uma legenda, um parágrafo, uma tabela de dados) referenciada por aria-describedby.',
    exemplo: '<img src="grafico.png" alt="Gráfico de evolução das vendas em 2026" aria-describedby="desc-grafico">\n<p id="desc-grafico">Janeiro 12 mil, fevereiro 15 mil ...</p>'
  }, function () {
    return $$('img[alt]').filter(function (el) { return norm(el.getAttribute('alt')).length > 150; })
      .map(function (el) { return { el: el, det: norm(el.getAttribute('alt')).length + ' caracteres' }; });
  });

  checa({
    id: 'svg-sem-tratamento', sev: 'moderado', cat: 'imagens', wcag: '1.1.1 Conteúdo não textual (A)',
    titulo: 'SVG em linha sem nome acessível nem marcação de decorativo',
    afeta: ['cegos'], leitor: true,
    porque: 'Leitores de tela tratam SVG de forma inconsistente. Sem instrução explícita, alguns anunciam "gráfico" ou leem textos internos soltos; outros ignoram por completo.',
    corrigir: 'Ícone decorativo (dentro de um botão que já tem texto): aria-hidden="true" e focusable="false". SVG que carrega informação: role="img" mais aria-label ou um elemento <title> referenciado.',
    exemplo: '<svg aria-hidden="true" focusable="false">...</svg>\n<svg role="img" aria-label="Status aprovado">...</svg>'
  }, function () {
    return $$('svg').filter(function (el) {
      if (ariaOculto(el)) return false;
      if (oculto(el)) return false;
      var temNome = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.querySelector('title');
      var papel = el.getAttribute('role');
      return !(temNome && (papel === 'img' || papel === 'graphics-document' || temNome));
    }).slice(0, 60).map(function (el) { return { el: el, det: 'sem role="img"+nome e sem aria-hidden' }; });
  });

  checa({
    id: 'input-image-sem-alt', sev: 'critico', cat: 'imagens', wcag: '1.1.1 Conteúdo não textual (A)',
    titulo: 'Botão de imagem (input type="image") sem alt',
    afeta: ['cegos'], leitor: true,
    porque: 'Esse elemento é um botão de envio. Sem alt, o leitor de tela anuncia apenas "botão" e a pessoa não sabe o que vai acontecer ao ativá-lo.',
    corrigir: 'Use alt com a ação do botão, não com a descrição visual do ícone.',
    exemplo: '<input type="image" src="lupa.png" alt="Buscar">'
  }, function () {
    return $$('input[type="image"]').filter(function (el) { return !norm(el.getAttribute('alt')) && !norm(el.getAttribute('aria-label')); })
      .map(function (el) { return { el: el }; });
  });

  checa({
    id: 'area-sem-alt', sev: 'serio', cat: 'imagens', wcag: '1.1.1 Conteúdo não textual (A)',
    titulo: 'Área de mapa de imagem (<area>) sem alt',
    afeta: ['cegos'], leitor: true,
    porque: 'Cada área clicável de um mapa de imagem é um link. Sem alt, o leitor de tela anuncia apenas a URL de destino.',
    corrigir: 'Dê a cada <area> um alt que descreva o destino do link.',
    exemplo: '<area shape="rect" coords="0,0,100,50" href="/sul" alt="Região Sul">'
  }, function () {
    return $$('area').filter(function (el) { return !norm(el.getAttribute('alt')) && !norm(el.getAttribute('aria-label')); })
      .map(function (el) { return { el: el }; });
  });

  checa({
    id: 'canvas-sem-alternativa', sev: 'serio', cat: 'imagens', wcag: '1.1.1 Conteúdo não textual (A)',
    titulo: '<canvas> sem conteúdo alternativo',
    afeta: ['cegos'], leitor: true,
    porque: 'O que é desenhado no canvas existe só como pixels. Não há nada na árvore de acessibilidade para o leitor de tela anunciar.',
    corrigir: 'Coloque dentro do <canvas> um conteúdo alternativo em HTML (texto, tabela de dados equivalente) ou use role="img" com aria-label quando for uma ilustração simples.',
    exemplo: '<canvas role="img" aria-label="Medidor: 72% concluído">\n  <p>72% concluído</p>\n</canvas>'
  }, function () {
    return $$('canvas').filter(function (el) {
      if (ariaOculto(el) || oculto(el)) return false;
      return !norm(el.textContent) && !el.children.length && !norm(el.getAttribute('aria-label')) && !el.getAttribute('aria-labelledby');
    }).map(function (el) { return { el: el }; });
  });

  /* ================================================================== */
  /* LINKS E NAVEGACAO                                                   */
  /* ================================================================== */

  checa({
    id: 'link-sem-nome', sev: 'critico', cat: 'links', wcag: '2.4.4 Finalidade do link (A) / 4.1.2 Nome, função, valor (A)',
    titulo: 'Link sem nome acessível',
    afeta: ['cegos', 'teclado'], leitor: true,
    porque: 'A pessoa ouve apenas "link" — ou, em alguns casos, a URL inteira soletrada. Em uma lista de links (atalho muito usado por quem navega com leitor de tela), esse item fica impossível de distinguir dos outros.',
    corrigir: 'Garanta texto visível dentro do link. Se o link tem só um ícone, use aria-label no <a> ou um texto oculto visualmente, e marque o ícone com aria-hidden="true".',
    exemplo: '<a href="/perfil" aria-label="Abrir meu perfil">\n  <svg aria-hidden="true" focusable="false">...</svg>\n</a>'
  }, function () {
    return $$('a[href]').filter(function (el) {
      if (oculto(el)) return false;
      return !nomeAcessivel(el).nome;
    }).map(function (el) { return { el: el, det: 'href: ' + norm((el.getAttribute('href') || '').slice(0, 60)) }; });
  });

  checa({
    id: 'link-texto-generico', sev: 'serio', cat: 'links', wcag: '2.4.4 Finalidade do link (A) / 2.4.9 Finalidade do link apenas pelo link (AAA)',
    titulo: 'Link com texto genérico ("clique aqui", "saiba mais", "leia mais")',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Quem usa leitor de tela frequentemente abre uma lista com todos os links da página para decidir aonde ir. Fora do contexto do parágrafo, cinco links "saiba mais" são indistinguíveis entre si.',
    corrigir: 'Escreva no próprio link o destino ou a ação. Se o texto visível precisa ficar curto por razões de layout, complemente com aria-label mantendo o texto visível dentro dele.',
    exemplo: '<!-- em vez de --> Conheça o plano Pro. <a href="/pro">Saiba mais</a>\n<!-- use -->      Conheça o <a href="/pro">plano Pro</a>\n<!-- ou -->       <a href="/pro" aria-label="Saiba mais sobre o plano Pro">Saiba mais</a>'
  }, function () {
    var re = /^(clique aqui|clica aqui|clique|aqui|leia mais|ler mais|saiba mais|veja mais|ver mais|mais|mais informações|mais informacoes|continuar|continue lendo|detalhes|acesse|acesse aqui|link|este link|click here|read more|learn more|more|this link|download)[\s.!:>»→]*$/i;
    return $$('a[href]').filter(function (el) {
      if (oculto(el)) return false;
      var n = nomeAcessivel(el).nome;
      return n && re.test(n);
    }).map(function (el) { return { el: el, det: 'texto: "' + nomeAcessivel(el).nome + '" → ' + norm((el.getAttribute('href') || '').slice(0, 50)) }; });
  });

  checa({
    id: 'link-mesmo-nome-destinos-diferentes', sev: 'moderado', cat: 'links', wcag: '2.4.4 Finalidade do link (A)',
    titulo: 'Links com o mesmo nome apontando para destinos diferentes',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Na lista de links do leitor de tela aparecem vários itens idênticos que levam a lugares diferentes. Não há como escolher.',
    corrigir: 'Diferencie os nomes acessíveis incluindo o contexto (o nome do produto, a data, o número do pedido).',
    exemplo: '<a href="/pedido/1" aria-label="Ver detalhes do pedido 1042">Ver detalhes</a>\n<a href="/pedido/2" aria-label="Ver detalhes do pedido 1043">Ver detalhes</a>'
  }, function () {
    var mapa = {}, saida = [];
    $$('a[href]').forEach(function (el) {
      if (oculto(el)) return;
      var n = nomeAcessivel(el).nome.toLowerCase();
      if (!n || n.length < 3) return;
      var h = el.href;
      if (!mapa[n]) mapa[n] = { destinos: {}, el: el };
      mapa[n].destinos[h] = 1;
    });
    Object.keys(mapa).forEach(function (n) {
      var q = Object.keys(mapa[n].destinos).length;
      if (q > 1) saida.push({ el: mapa[n].el, det: '"' + n + '" aparece com ' + q + ' destinos diferentes' });
    });
    return saida;
  });

  checa({
    id: 'link-nova-aba-sem-aviso', sev: 'moderado', cat: 'links', wcag: '3.2.5 Mudança sob demanda (AAA) / G201',
    titulo: 'Link abre em nova aba sem avisar',
    afeta: ['cegos', 'cognitiva', 'baixavisao'], leitor: true,
    porque: 'A nova aba muda o contexto sem aviso. Quem não vê a tela pode levar um tempo para perceber que mudou de página, e o botão "voltar" deixa de funcionar como esperado.',
    corrigir: 'Inclua a informação no nome acessível do link (texto visível ou aria-label) e, se usar um ícone indicativo, marque-o com aria-hidden="true". Acrescente rel="noopener" por segurança.',
    exemplo: '<a href="https://exemplo.com" target="_blank" rel="noopener">\n  Manual do produto (abre em nova aba)\n</a>'
  }, function () {
    return $$('a[target="_blank"]').filter(function (el) {
      if (oculto(el)) return false;
      var n = (nomeAcessivel(el).nome + ' ' + (el.getAttribute('title') || '')).toLowerCase();
      return !/nova aba|nova janela|new tab|new window|abre em|externo/.test(n);
    }).map(function (el) { return { el: el, det: nomeAcessivel(el).nome.slice(0, 60) || '(sem nome)' }; });
  });

  checa({
    id: 'link-falso', sev: 'moderado', cat: 'links', wcag: '4.1.2 Nome, função, valor (A)',
    titulo: 'Link usado como botão (href="#" ou javascript:)',
    afeta: ['cegos', 'teclado', 'cognitiva'], leitor: true,
    porque: 'O leitor de tela anuncia "link", o que promete navegação para outro lugar. A pessoa também espera que Enter funcione e que possa abrir em nova aba. Se o elemento na verdade executa uma ação na própria página, o papel anunciado está errado.',
    corrigir: 'Use <button type="button"> para ações na página e reserve <a href> para navegação. O botão já vem com o comportamento de teclado correto (Enter e Espaço).',
    exemplo: '<!-- em vez de --> <a href="#" onclick="abrirModal()">Abrir</a>\n<!-- use -->      <button type="button" onclick="abrirModal()">Abrir</button>'
  }, function () {
    return $$('a[href]').filter(function (el) {
      if (oculto(el)) return false;
      var h = (el.getAttribute('href') || '').trim();
      return h === '#' || /^javascript:\s*(void\(0\)|;)?\s*$/i.test(h);
    }).map(function (el) { return { el: el, det: nomeAcessivel(el).nome.slice(0, 60) }; });
  });

  checa({
    id: 'link-sem-href', sev: 'serio', cat: 'links', wcag: '2.1.1 Teclado (A)',
    titulo: '<a> sem href funcionando como elemento clicável',
    afeta: ['teclado', 'cegos'], leitor: true,
    porque: 'Um <a> sem href não recebe foco pelo teclado e não é anunciado como link. Quem não usa mouse simplesmente não alcança o elemento.',
    corrigir: 'Troque por <button type="button">, ou acrescente href real. Se precisar manter o <a>, adicione role="button", tabindex="0" e tratamento das teclas Enter e Espaço.',
    exemplo: '<button type="button" class="menu-item">Filtrar</button>'
  }, function () {
    return $$('a:not([href])').filter(function (el) {
      if (oculto(el)) return false;
      return el.hasAttribute('onclick') || el.getAttribute('role') === 'button' || el.hasAttribute('data-href');
    }).map(function (el) { return { el: el }; });
  });

  checa({
    id: 'link-url-crua', sev: 'aviso', cat: 'links', wcag: '2.4.4 Finalidade do link (A)',
    titulo: 'Link cujo texto é uma URL longa',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Dependendo da configuração, o leitor de tela soletra a URL caractere por caractere. Uma URL de 80 caracteres vira quase um minuto de áudio sem significado.',
    corrigir: 'Use o nome da página ou do documento como texto do link.',
    exemplo: '<!-- em vez de --> <a href="...">https://portal.exemplo.gov.br/docs/2026/manual-v3.pdf</a>\n<!-- use -->      <a href="...">Manual de uso 2026 (PDF)</a>'
  }, function () {
    return $$('a[href]').filter(function (el) {
      if (oculto(el)) return false;
      var n = nomeAcessivel(el).nome;
      return /^(https?:\/\/|www\.)/i.test(n) && n.length > 30;
    }).map(function (el) { return { el: el, det: nomeAcessivel(el).nome.slice(0, 70) }; });
  });

  checa({
    id: 'link-arquivo-sem-formato', sev: 'aviso', cat: 'links', wcag: 'Boa prática (G201)',
    titulo: 'Link para arquivo sem indicar formato',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Saber antes do clique que o destino é um PDF ou uma planilha ajuda a pessoa a decidir se tem o aplicativo certo aberto e se aquele formato funciona bem com a tecnologia que ela usa.',
    corrigir: 'Inclua o formato (e, se possível, o tamanho) no texto do link.',
    exemplo: '<a href="/edital.pdf">Edital de credenciamento (PDF, 1,2 MB)</a>'
  }, function () {
    return $$('a[href]').filter(function (el) {
      if (oculto(el)) return false;
      var h = (el.getAttribute('href') || '').toLowerCase();
      var m = h.match(/\.(pdf|docx?|xlsx?|pptx?|csv|zip|rar|odt|ods)(\?|#|$)/);
      if (!m) return false;
      var n = nomeAcessivel(el).nome.toLowerCase();
      return n.indexOf(m[1]) === -1;
    }).map(function (el) { return { el: el, det: nomeAcessivel(el).nome.slice(0, 60) }; });
  });

  checa({
    id: 'sem-link-pular', sev: 'moderado', cat: 'links', wcag: '2.4.1 Ignorar blocos (A)',
    titulo: 'Página sem link para pular direto ao conteúdo',
    afeta: ['teclado', 'cegos', 'motora'], leitor: true,
    porque: 'Sem esse atalho, a pessoa que navega pelo teclado precisa passar por todos os links do menu em cada página antes de chegar ao conteúdo. Em um menu com 30 itens, são 30 tabulações repetidas a cada navegação.',
    corrigir: 'Coloque como primeiro elemento focável da página um link que aponte para o início do conteúdo principal. Ele pode ficar oculto visualmente e aparecer ao receber foco.',
    exemplo: '<a href="#conteudo" class="pular-link">Pular para o conteúdo principal</a>\n...\n<main id="conteudo" tabindex="-1"> ... </main>'
  }, function () {
    if ($$('a[href]').length < 15) return [];
    var primeiros = FOCAVEIS.slice(0, 4);
    var tem = primeiros.some(function (el) {
      var h = el.getAttribute('href') || '';
      var n = nomeAcessivel(el).nome.toLowerCase();
      return h.charAt(0) === '#' && /pular|ir para|ir ao|saltar|skip|conte[úu]do principal/.test(n);
    });
    return tem ? [] : [{ sel: 'body', cod: '', det: 'Nenhum link de atalho encontrado entre os primeiros elementos focáveis' }];
  });

  /* ================================================================== */
  /* BOTOES E CONTROLES                                                  */
  /* ================================================================== */

  checa({
    id: 'botao-sem-nome', sev: 'critico', cat: 'controles', wcag: '4.1.2 Nome, função, valor (A)',
    titulo: 'Botão sem nome acessível',
    afeta: ['cegos', 'teclado'], leitor: true,
    porque: 'O leitor de tela anuncia apenas "botão". A pessoa não tem como saber o que aquele controle faz sem ativá-lo e observar o resultado — o que pode ser destrutivo.',
    corrigir: 'Coloque texto dentro do botão. Em botões só de ícone, use aria-label descrevendo a ação e esconda o ícone com aria-hidden="true".',
    exemplo: '<button type="button" aria-label="Fechar janela">\n  <svg aria-hidden="true" focusable="false">...</svg>\n</button>'
  }, function () {
    return $$('button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"]').filter(function (el) {
      if (oculto(el)) return false;
      return !nomeAcessivel(el).nome;
    }).map(function (el) { return { el: el }; });
  });

  checa({
    id: 'nome-so-por-title', sev: 'aviso', cat: 'controles', wcag: '4.1.2 Nome, função, valor (A)',
    titulo: 'Controle cujo nome vem apenas do atributo title',
    afeta: ['cegos', 'motora', 'cognitiva'], leitor: true,
    porque: 'O title depende de passar o mouse por cima: não aparece no toque, não aparece para quem usa só teclado e é tratado de forma inconsistente pelos leitores de tela.',
    corrigir: 'Prefira texto visível ou aria-label. Use title apenas como complemento, nunca como única fonte do nome.',
    exemplo: '<button type="button" aria-label="Exportar relatório">\n  <svg aria-hidden="true">...</svg>\n</button>'
  }, function () {
    return $$('a[href],button,[role="button"],input,select,textarea').filter(function (el) {
      if (oculto(el)) return false;
      var r = nomeAcessivel(el);
      return r.nome && r.origem === 'title';
    }).map(function (el) { return { el: el, det: 'title="' + norm(el.getAttribute('title')).slice(0, 60) + '"' }; });
  });

  checa({
    id: 'div-clicavel', sev: 'serio', cat: 'controles', wcag: '2.1.1 Teclado (A) / 4.1.2 Nome, função, valor (A)',
    titulo: 'Elemento não interativo com evento de clique',
    afeta: ['teclado', 'cegos', 'motora'], leitor: true,
    porque: 'Um <div> ou <span> com onclick não recebe foco pelo teclado, não responde a Enter nem a Espaço e é anunciado como texto comum. Para quem não usa mouse, esse controle simplesmente não existe.',
    corrigir: 'Use <button type="button">. Se não for possível trocar o elemento, acrescente role="button", tabindex="0" e tratamento explícito das teclas Enter e Espaço.',
    exemplo: '<div role="button" tabindex="0" onclick="acao()" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();acao();}">\n  Aplicar filtro\n</div>'
  }, function () {
    return $$('[onclick]').filter(function (el) {
      if (oculto(el)) return false;
      var t = el.nodeName.toLowerCase();
      if (/^(a|button|input|select|textarea|summary|label|option)$/.test(t)) return false;
      var papel = el.getAttribute('role');
      if (papel && /button|link|menuitem|tab|option|checkbox|radio|switch/.test(papel) && el.hasAttribute('tabindex')) return false;
      return true;
    }).map(function (el) { return { el: el, det: 'sem foco pelo teclado' }; });
  });

  checa({
    id: 'role-interativo-sem-foco', sev: 'serio', cat: 'controles', wcag: '2.1.1 Teclado (A)',
    titulo: 'Elemento com papel interativo que não recebe foco',
    afeta: ['teclado', 'cegos'], leitor: true,
    porque: 'O papel ARIA promete ao leitor de tela um controle acionável, mas sem tabindex o elemento nunca entra na ordem de tabulação. A promessa não se cumpre.',
    corrigir: 'Adicione tabindex="0" e os manipuladores de teclado correspondentes ao papel declarado — ou troque por um elemento HTML nativo equivalente.',
    exemplo: '<span role="button" tabindex="0">Aplicar</span>'
  }, function () {
    return $$('[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],[role="menuitem"],[role="tab"],[role="option"],[role="slider"]').filter(function (el) {
      if (oculto(el)) return false;
      var t = el.nodeName.toLowerCase();
      if (/^(a|button|input|select|textarea|summary)$/.test(t)) return false;
      return !el.hasAttribute('tabindex');
    }).map(function (el) { return { el: el, det: 'role="' + el.getAttribute('role') + '" sem tabindex' }; });
  });

  checa({
    id: 'estado-aria-ausente', sev: 'serio', cat: 'controles', wcag: '4.1.2 Nome, função, valor (A)',
    titulo: 'Componente sem o estado ARIA que o papel exige',
    afeta: ['cegos'], leitor: true,
    porque: 'O leitor de tela anuncia estado junto com nome e papel. Sem aria-expanded, aria-checked ou aria-selected, a pessoa não sabe se o menu está aberto, se a opção está marcada ou qual aba está ativa.',
    corrigir: 'Declare e atualize o estado por JavaScript sempre que ele mudar: aria-expanded em quem abre/fecha, aria-checked em caixas e interruptores, aria-selected em abas e opções.',
    exemplo: '<button aria-expanded="false" aria-controls="menu-ajuda">Ajuda</button>\n<div id="menu-ajuda" hidden> ... </div>'
  }, function () {
    var saida = [];
    $$('[aria-controls]').forEach(function (el) {
      if (oculto(el)) return;
      var t = el.nodeName.toLowerCase();
      if (t !== 'button' && el.getAttribute('role') !== 'button') return;
      if (!el.hasAttribute('aria-expanded')) saida.push({ el: el, det: 'botão com aria-controls e sem aria-expanded' });
    });
    $$('[role="tab"]').forEach(function (el) {
      if (!oculto(el) && !el.hasAttribute('aria-selected')) saida.push({ el: el, det: 'role="tab" sem aria-selected' });
    });
    $$('[role="checkbox"],[role="switch"],[role="menuitemcheckbox"]').forEach(function (el) {
      if (!oculto(el) && !el.hasAttribute('aria-checked')) saida.push({ el: el, det: 'role="' + el.getAttribute('role') + '" sem aria-checked' });
    });
    $$('[role="radio"],[role="menuitemradio"]').forEach(function (el) {
      if (!oculto(el) && !el.hasAttribute('aria-checked')) saida.push({ el: el, det: 'role="' + el.getAttribute('role') + '" sem aria-checked' });
    });
    return saida;
  });

  checa({
    id: 'alvo-pequeno', sev: 'moderado', cat: 'controles', wcag: '2.5.8 Tamanho do alvo mínimo (AA, WCAG 2.2)',
    titulo: 'Alvo de clique menor que 24 por 24 pixels',
    afeta: ['motora', 'baixavisao'], leitor: false,
    porque: 'Alvos muito pequenos exigem precisão fina do movimento. Isso cria dificuldade para quem tem tremor, usa a tela em movimento, usa ponteiro de cabeça ou tem pouca acuidade visual.',
    corrigir: 'Garanta pelo menos 24 por 24 CSS pixels de área acionável (ou espaçamento equivalente entre alvos vizinhos). Aumente o padding em vez do tamanho da fonte.',
    exemplo: '.botao-icone { min-inline-size: 44px; min-block-size: 44px; display: inline-flex; align-items: center; justify-content: center; }'
  }, function () {
    return FOCAVEIS_VIS.filter(function (el) {
      var t = el.nodeName.toLowerCase();
      var tipo = (el.getAttribute('type') || '').toLowerCase();
      if (soParaLeitor(el)) return false;
      /* excecao "inline": link dentro de um bloco de texto */
      if (t === 'a' && el.closest('p,li,td,dd,h1,h2,h3,h4,h5,h6,figcaption,label,blockquote')) {
        var cs0 = gcs(el);
        if (cs0 && cs0.display === 'inline') return false;
      }
      /* excecao "controle do agente de usuario": o rotulo amplia a area do alvo */
      if (t === 'input' && (tipo === 'radio' || tipo === 'checkbox')) {
        var rotulos = el.labels ? A(el.labels) : [];
        var env = el.closest('label');
        if (env && rotulos.indexOf(env) === -1) rotulos.push(env);
        var basta = rotulos.some(function (l) { var rr = ret(l); return rr.width >= 24 && rr.height >= 24; });
        if (basta) return false;
      }
      var r = ret(el);
      return r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24);
    }).slice(0, 40).map(function (el) {
      var r = ret(el);
      return { el: el, det: Math.round(r.width) + ' x ' + Math.round(r.height) + ' px' };
    });
  });

  checa({
    id: 'botao-so-icone-sem-texto-visivel', sev: 'aviso', cat: 'controles', wcag: '2.5.3 Rótulo no nome (A)',
    titulo: 'Botão apenas com ícone (sem texto visível)',
    afeta: ['motora', 'cognitiva'], leitor: false,
    porque: 'Quem usa comando de voz fala o rótulo que enxerga na tela. Se não há texto visível, não há o que falar. Ícones sozinhos também dependem de o significado ser adivinhado, o que varia muito entre pessoas.',
    corrigir: 'Sempre que o espaço permitir, mostre o texto ao lado do ícone. Quando não der, garanta que o aria-label use as palavras que a pessoa esperaria falar e considere uma dica de texto visível ao passar o foco.',
    exemplo: '<button type="button">\n  <svg aria-hidden="true" focusable="false">...</svg>\n  <span>Excluir</span>\n</button>'
  }, function () {
    return $$('button,[role="button"]').filter(function (el) {
      if (oculto(el)) return false;
      var r = nomeAcessivel(el);
      if (!r.nome) return false;
      if (r.origem !== 'aria-label' && r.origem !== 'aria-labelledby') return false;
      return !norm(el.textContent);
    }).slice(0, 30).map(function (el) { return { el: el, det: 'nome: "' + nomeAcessivel(el).nome + '"' }; });
  });

  /* ================================================================== */
  /* FORMULARIOS                                                         */
  /* ================================================================== */

  var CAMPOS = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]),select,textarea';

  checa({
    id: 'campo-sem-rotulo', sev: 'critico', cat: 'formularios', wcag: '1.3.1 Informação e relações (A) / 3.3.2 Rótulos ou instruções (A)',
    titulo: 'Campo de formulário sem rótulo associado',
    afeta: ['cegos', 'cognitiva', 'baixavisao'], leitor: true,
    porque: 'Ao chegar no campo, o leitor de tela anuncia apenas o tipo ("caixa de edição") e a pessoa não sabe o que digitar ali. Um rótulo associado corretamente também amplia a área de clique para quem tem dificuldade motora.',
    corrigir: 'Use <label for="id-do-campo"> apontando para o id do campo, ou envolva o campo com o <label>. Quando o rótulo visível não existir por decisão de layout, use aria-label.',
    exemplo: '<label for="cpf">CPF</label>\n<input id="cpf" name="cpf" type="text" inputmode="numeric" autocomplete="off">'
  }, function () {
    return $$(CAMPOS).filter(function (el) {
      if (oculto(el) && !soParaLeitor(el)) return false;
      var r = nomeAcessivel(el);
      return !r.nome;
    }).map(function (el) { return { el: el, det: 'name="' + norm(el.getAttribute('name') || '(sem name)') + '"' }; });
  });

  checa({
    id: 'placeholder-como-rotulo', sev: 'serio', cat: 'formularios', wcag: '3.3.2 Rótulos ou instruções (A) / 1.4.3 Contraste (AA)',
    titulo: 'Campo rotulado apenas pelo placeholder',
    afeta: ['cognitiva', 'baixavisao', 'cegos'], leitor: true,
    porque: 'O placeholder desaparece assim que a pessoa começa a digitar, então some justamente quando serve para conferir o que era pedido. Além disso costuma ter contraste baixo e nem todo leitor de tela o anuncia.',
    corrigir: 'Mantenha um <label> visível e permanente. O placeholder pode ficar como exemplo de formato, nunca como rótulo.',
    exemplo: '<label for="tel">Telefone com DDD</label>\n<input id="tel" type="tel" placeholder="(48) 99999-0000" autocomplete="tel">'
  }, function () {
    return $$(CAMPOS).filter(function (el) {
      if (oculto(el)) return false;
      return nomeAcessivel(el).origem === 'placeholder';
    }).map(function (el) { return { el: el, det: 'placeholder="' + norm(el.getAttribute('placeholder')).slice(0, 50) + '"' }; });
  });

  checa({
    id: 'label-for-quebrado', sev: 'serio', cat: 'formularios', wcag: '1.3.1 Informação e relações (A)',
    titulo: '<label for> aponta para um id que não existe',
    afeta: ['cegos', 'motora'], leitor: true,
    porque: 'A associação entre rótulo e campo se rompe. Visualmente tudo parece certo, mas o leitor de tela não encontra o rótulo e clicar no texto não move o foco para o campo.',
    corrigir: 'Confira se o valor de for é exatamente igual ao id do campo (maiúsculas e minúsculas contam).',
    exemplo: '<label for="email-usuario">E-mail</label>\n<input id="email-usuario" type="email">'
  }, function () {
    return $$('label[for]').filter(function (el) {
      var alvo = D.getElementById(el.getAttribute('for'));
      return !alvo;
    }).map(function (el) { return { el: el, det: 'for="' + el.getAttribute('for') + '" não existe na página' }; });
  });

  checa({
    id: 'grupo-sem-fieldset', sev: 'serio', cat: 'formularios', wcag: '1.3.1 Informação e relações (A) / 3.3.2 Rótulos ou instruções (A)',
    titulo: 'Grupo de opções sem rótulo de grupo',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'O leitor de tela lê "Sim, botão de opção 1 de 2", mas não diz a pergunta a que essas opções respondem. Com várias perguntas na mesma tela, as respostas ficam sem contexto.',
    corrigir: 'Envolva o grupo em <fieldset> com <legend>, ou use role="radiogroup" com aria-labelledby apontando para o texto da pergunta.',
    exemplo: '<fieldset>\n  <legend>Você autoriza o contato por WhatsApp?</legend>\n  <label><input type="radio" name="zap" value="s"> Sim</label>\n  <label><input type="radio" name="zap" value="n"> Não</label>\n</fieldset>'
  }, function () {
    var grupos = {}, saida = [];
    $$('input[type="radio"][name],input[type="checkbox"][name]').forEach(function (el) {
      if (oculto(el)) return;
      var n = el.getAttribute('name');
      (grupos[n] = grupos[n] || []).push(el);
    });
    Object.keys(grupos).forEach(function (n) {
      var g = grupos[n];
      if (g.length < 2) return;
      var el = g[0];
      var fs = el.closest('fieldset');
      if (fs && fs.querySelector('legend') && norm(fs.querySelector('legend').textContent)) return;
      var rg = el.closest('[role="radiogroup"],[role="group"]');
      if (rg && nomeAcessivel(rg).nome) return;
      saida.push({ el: el, det: 'grupo name="' + n + '" com ' + g.length + ' opções, sem rótulo de grupo' });
    });
    return saida;
  });

  checa({
    id: 'sem-autocomplete', sev: 'moderado', cat: 'formularios', wcag: '1.3.5 Identificar a finalidade da entrada (AA)',
    titulo: 'Campo de dado pessoal sem autocomplete',
    afeta: ['cognitiva', 'motora', 'baixavisao'], leitor: false,
    porque: 'O atributo autocomplete permite que o navegador e tecnologias assistivas preencham o campo automaticamente e até troquem o rótulo por um ícone conhecido pela pessoa. Sem ele, quem tem dificuldade de digitação ou de memória precisa redigitar tudo.',
    corrigir: 'Declare o token adequado de autocomplete nos campos de dados pessoais.',
    exemplo: '<input type="email" name="email" autocomplete="email">\n<input type="text" name="cep" autocomplete="postal-code">'
  }, function () {
    var padroes = /(^|[-_])(email|e-mail|mail|tel|telefone|phone|celular|nome|name|sobrenome|lastname|firstname|cep|zip|postal|endereco|address|cidade|city|estado|state|pais|country|nascimento|birth|cartao|card)([-_]|$)/i;
    return $$(CAMPOS).filter(function (el) {
      if (oculto(el)) return false;
      var t = (el.getAttribute('type') || 'text').toLowerCase();
      if (el.nodeName === 'SELECT' || el.nodeName === 'TEXTAREA') return false;
      if (!/^(text|email|tel|url|number|search)$/.test(t)) return false;
      if (norm(el.getAttribute('autocomplete'))) return false;
      var chave = (el.getAttribute('name') || '') + ' ' + (el.getAttribute('id') || '') + ' ' + t;
      return padroes.test(chave) || t === 'email' || t === 'tel';
    }).slice(0, 30).map(function (el) { return { el: el, det: 'name="' + norm(el.getAttribute('name') || el.getAttribute('id') || '') + '"' }; });
  });

  checa({
    id: 'sem-regiao-de-status', sev: 'moderado', cat: 'formularios', wcag: '4.1.3 Mensagens de status (AA) / 3.3.1 Identificação de erro (A)',
    titulo: 'Página com formulário e sem região para anunciar mensagens',
    afeta: ['cegos', 'baixavisao'], leitor: true,
    porque: 'Mensagens de erro ou de sucesso que aparecem na tela não são anunciadas automaticamente pelo leitor de tela. Sem uma região viva, a pessoa preenche, envia e não recebe retorno nenhum.',
    corrigir: 'Crie uma região com role="alert" (para erros) ou role="status" / aria-live="polite" (para confirmações) que já exista no HTML desde o carregamento e receba o texto por JavaScript. Associe cada erro ao campo com aria-describedby e aria-invalid="true".',
    exemplo: '<div role="alert" id="erros"></div>\n<input id="cpf" aria-invalid="true" aria-describedby="erro-cpf">\n<span id="erro-cpf">Informe um CPF com 11 dígitos.</span>'
  }, function () {
    if (!$$('form').length && $$(CAMPOS).length < 3) return [];
    if ($$('[aria-live],[role="alert"],[role="status"],[role="log"],output').length) return [];
    return [{ sel: 'form', cod: '', det: 'Nenhum elemento com aria-live, role="alert" ou role="status" na página' }];
  });

  checa({
    id: 'obrigatorio-so-por-asterisco', sev: 'moderado', cat: 'formularios', wcag: '3.3.2 Rótulos ou instruções (A) / 1.3.1 (A)',
    titulo: 'Campo obrigatório sinalizado apenas por asterisco',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'O asterisco pode ser lido como "asterisco" ou simplesmente ignorado, dependendo da configuração de pontuação do leitor de tela. E nem toda pessoa associa o símbolo a "obrigatório".',
    corrigir: 'Use o atributo required (ou aria-required="true") e explique a convenção em texto no início do formulário. Melhor ainda: escreva "(obrigatório)" no rótulo.',
    exemplo: '<label for="nome">Nome completo (obrigatório)</label>\n<input id="nome" required>'
  }, function () {
    return $$(CAMPOS).filter(function (el) {
      if (oculto(el)) return false;
      if (el.hasAttribute('required') || el.getAttribute('aria-required') === 'true') return false;
      var r = nomeAcessivel(el);
      return /\*/.test(r.nome);
    }).slice(0, 25).map(function (el) { return { el: el, det: 'rótulo com "*" e sem required/aria-required' }; });
  });

  checa({
    id: 'input-tipo-inadequado', sev: 'aviso', cat: 'extras', wcag: 'Boa prática (1.3.5 relacionado)',
    titulo: 'Campo de e-mail ou telefone declarado como type="text"',
    afeta: ['motora', 'cognitiva'], leitor: false,
    porque: 'O tipo correto faz o teclado virtual mostrar as teclas certas e ativa a validação nativa do navegador — que já vem com mensagens acessíveis.',
    corrigir: 'Use type="email", type="tel", type="url" e inputmode quando fizer sentido.',
    exemplo: '<input type="tel" inputmode="numeric" autocomplete="tel">'
  }, function () {
    return $$('input[type="text"],input:not([type])').filter(function (el) {
      if (oculto(el)) return false;
      var chave = ((el.getAttribute('name') || '') + ' ' + (el.getAttribute('id') || '')).toLowerCase();
      return /email|e-mail|telefone|celular|phone|whatsapp/.test(chave);
    }).slice(0, 20).map(function (el) { return { el: el, det: 'name="' + norm(el.getAttribute('name') || '') + '"' }; });
  });

  /* ================================================================== */
  /* ESTRUTURA SEMANTICA                                                 */
  /* ================================================================== */

  function nivelCabecalho(el) {
    var m = el.nodeName.match(/^H([1-6])$/);
    if (m) return parseInt(m[1], 10);
    var al = el.getAttribute('aria-level');
    return al ? parseInt(al, 10) : 2;
  }
  var CABECALHOS = $$('h1,h2,h3,h4,h5,h6,[role="heading"]').filter(function (el) { return !ariaOculto(el); });

  checa({
    id: 'sem-h1', sev: 'serio', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A) / 2.4.6 Cabeçalhos e rótulos (AA)',
    titulo: 'Página sem cabeçalho de nível 1',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Navegar por cabeçalhos é o atalho mais usado por quem usa leitor de tela. O h1 é o ponto de partida: ele diz de que trata a página. Sem ele, a pessoa precisa ler linearmente até descobrir onde está.',
    corrigir: 'Use exatamente um <h1> com o assunto principal da página, normalmente coincidindo com o título mostrado na tela.',
    exemplo: '<main id="conteudo">\n  <h1>Agendamento de consultas</h1>\n  ...\n</main>'
  }, function () {
    var h1 = CABECALHOS.filter(function (el) { return nivelCabecalho(el) === 1; });
    return h1.length ? [] : [{ sel: 'body', det: 'Nenhum h1 (ou role="heading" aria-level="1") encontrado' }];
  });

  checa({
    id: 'multiplos-h1', sev: 'moderado', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A)',
    titulo: 'Mais de um cabeçalho de nível 1 na página',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Vários h1 desmontam a hierarquia: fica ambíguo qual é o assunto principal e a navegação por cabeçalhos perde o sentido de sumário.',
    corrigir: 'Mantenha um h1 por página e rebaixe os demais para h2 ou h3, conforme a hierarquia real do conteúdo.',
    exemplo: '<h1>Prontuário do paciente</h1>\n  <h2>Anamnese</h2>\n  <h2>Exames</h2>'
  }, function () {
    var h1 = CABECALHOS.filter(function (el) { return nivelCabecalho(el) === 1 && !oculto(el); });
    return h1.length > 1 ? h1.map(function (el) { return { el: el, det: norm(el.textContent).slice(0, 60) }; }) : [];
  });

  checa({
    id: 'salto-de-nivel', sev: 'serio', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A)',
    titulo: 'Salto na hierarquia de cabeçalhos',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Pular de h2 direto para h4 faz o leitor de tela anunciar um nível que não existe acima. Quem usa a lista de cabeçalhos como sumário entende que perdeu uma seção.',
    corrigir: 'Desça um nível por vez. Escolha o nível pela posição na estrutura do conteúdo, não pelo tamanho da fonte — o tamanho é trabalho do CSS.',
    exemplo: '<h2>Exames</h2>\n  <h3>Laboratoriais</h3>\n    <h4>Hemograma</h4>'
  }, function () {
    var saida = [], anterior = 0;
    CABECALHOS.filter(function (el) { return !oculto(el) || soParaLeitor(el); }).forEach(function (el) {
      var n = nivelCabecalho(el);
      if (anterior && n > anterior + 1) {
        saida.push({ el: el, det: 'h' + anterior + ' seguido de h' + n + ': "' + norm(el.textContent).slice(0, 50) + '"' });
      }
      anterior = n;
    });
    return saida;
  });

  checa({
    id: 'cabecalho-vazio', sev: 'serio', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A) / 2.4.6 (AA)',
    titulo: 'Cabeçalho sem texto',
    afeta: ['cegos'], leitor: true,
    porque: 'Um cabeçalho vazio aparece na lista de cabeçalhos do leitor de tela como um item em branco. A pessoa navega até ele e não recebe informação nenhuma.',
    corrigir: 'Remova o cabeçalho vazio ou preencha com o texto da seção. Se ele existe só para dar estilo, troque por <div> ou <p> com classe.',
    exemplo: '<h2 class="titulo-secao">Resultados recentes</h2>'
  }, function () {
    return CABECALHOS.filter(function (el) {
      return !norm(textoDe(el)) && !norm(el.getAttribute('aria-label'));
    }).map(function (el) { return { el: el }; });
  });

  checa({
    id: 'sem-main', sev: 'serio', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A) / 2.4.1 Ignorar blocos (A)',
    titulo: 'Página sem região de conteúdo principal (<main>)',
    afeta: ['cegos', 'teclado'], leitor: true,
    porque: 'Leitores de tela oferecem um atalho para "ir ao conteúdo principal". Sem <main>, esse atalho não existe e a pessoa precisa atravessar cabeçalho e menu a cada página.',
    corrigir: 'Envolva o conteúdo específico da página em <main> (um por página). Use também <header>, <nav>, <aside> e <footer> para delimitar o resto.',
    exemplo: '<header> ... </header>\n<nav aria-label="Principal"> ... </nav>\n<main id="conteudo"> ... </main>\n<footer> ... </footer>'
  }, function () {
    return $$('main,[role="main"]').length ? [] : [{ sel: 'body', det: 'Nenhum <main> ou role="main"' }];
  });

  checa({
    id: 'multiplos-main', sev: 'moderado', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A)',
    titulo: 'Mais de uma região <main> visível',
    afeta: ['cegos'], leitor: true,
    porque: 'A especificação prevê uma única região principal. Com mais de uma, o atalho de ir ao conteúdo fica ambíguo.',
    corrigir: 'Mantenha apenas um <main> visível por página.',
    exemplo: '<main id="conteudo"> ... </main>'
  }, function () {
    var m = $$('main,[role="main"]').filter(function (el) { return !oculto(el); });
    return m.length > 1 ? m.map(function (el) { return { el: el }; }) : [];
  });

  checa({
    id: 'landmarks-duplicadas-sem-rotulo', sev: 'moderado', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A) / 2.4.1 (A)',
    titulo: 'Regiões do mesmo tipo sem rótulo que as diferencie',
    afeta: ['cegos'], leitor: true,
    porque: 'Na lista de regiões do leitor de tela aparecem itens repetidos ("navegação", "navegação", "navegação") sem indicação de qual é o menu principal, o menu do rodapé ou a trilha de navegação.',
    corrigir: 'Dê a cada região repetida um aria-label curto e único.',
    exemplo: '<nav aria-label="Principal"> ... </nav>\n<nav aria-label="Trilha de navegação"> ... </nav>\n<nav aria-label="Rodapé"> ... </nav>'
  }, function () {
    var saida = [];
    [['nav,[role="navigation"]', 'navegação'], ['aside,[role="complementary"]', 'complementar'], ['form[role="search"],[role="search"]', 'busca'], ['section[aria-label],section[aria-labelledby],[role="region"]', 'região']].forEach(function (par) {
      var els = $$(par[0]).filter(function (el) { return !oculto(el); });
      if (els.length < 2) return;
      els.forEach(function (el) {
        if (!norm(el.getAttribute('aria-label')) && !el.getAttribute('aria-labelledby')) {
          saida.push({ el: el, det: par[1] + ': ' + els.length + ' na página, esta sem rótulo' });
        }
      });
    });
    return saida;
  });

  checa({
    id: 'sem-lang', sev: 'critico', cat: 'estrutura', wcag: '3.1.1 Idioma da página (A)',
    titulo: 'Elemento <html> sem atributo lang',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'O leitor de tela escolhe a voz e as regras de pronúncia pelo idioma declarado. Sem lang, um texto em português pode ser lido com fonética em inglês, ficando incompreensível.',
    corrigir: 'Declare o idioma no <html>. Para trechos em outro idioma dentro da página, use lang no elemento correspondente.',
    exemplo: '<html lang="pt-BR">\n...\n<p>O termo <span lang="en">screen reader</span> significa leitor de tela.</p>'
  }, function () {
    var l = norm(D.documentElement.getAttribute('lang'));
    return l ? [] : [{ sel: 'html', det: 'atributo lang ausente' }];
  });

  checa({
    id: 'lang-invalido', sev: 'serio', cat: 'estrutura', wcag: '3.1.1 Idioma da página (A)',
    titulo: 'Atributo lang com valor inválido',
    afeta: ['cegos'], leitor: true,
    porque: 'Um código de idioma que não segue o padrão BCP 47 é ignorado, e o leitor de tela volta para o idioma padrão do sistema.',
    corrigir: 'Use códigos válidos, como pt-BR, pt-PT, en, en-US, es.',
    exemplo: '<html lang="pt-BR">'
  }, function () {
    var saida = [];
    var re = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;
    var l = norm(D.documentElement.getAttribute('lang'));
    if (l && !re.test(l)) saida.push({ sel: 'html', det: 'lang="' + l + '"' });
    $$('[lang]').forEach(function (el) {
      var v = norm(el.getAttribute('lang'));
      if (v && !re.test(v)) saida.push({ el: el, det: 'lang="' + v + '"' });
    });
    return saida;
  });

  checa({
    id: 'sem-titulo', sev: 'critico', cat: 'estrutura', wcag: '2.4.2 Página com título (A)',
    titulo: 'Página sem <title> ou com título vazio',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'O título é a primeira coisa anunciada ao carregar a página e é o que identifica a aba. Sem ele, quem tem várias abas abertas não consegue distinguir uma da outra.',
    corrigir: 'Escreva um título único por página, do mais específico para o mais geral.',
    exemplo: '<title>Agendar consulta — Clínica Exemplo</title>'
  }, function () {
    return norm(D.title) ? [] : [{ sel: 'head > title', det: 'título ausente ou vazio' }];
  });

  checa({
    id: 'titulo-generico', sev: 'moderado', cat: 'estrutura', wcag: '2.4.2 Página com título (A)',
    titulo: 'Título da página é genérico',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Títulos como "Home" ou "Documento" não ajudam a identificar a aba nem a lembrar onde a pessoa parou.',
    corrigir: 'Descreva o conteúdo específico da página no título.',
    exemplo: '<title>Resultado de exames — Portal do Paciente</title>'
  }, function () {
    var t = norm(D.title);
    if (!t) return [];
    return /^(home|index|documento|document|untitled|sem t[íi]tulo|p[áa]gina|page|new page|react app|vite \+ react|site)$/i.test(t) || t.length < 4
      ? [{ sel: 'head > title', det: '<title>' + t + '</title>' }] : [];
  });

  checa({
    id: 'id-duplicado', sev: 'serio', cat: 'estrutura', wcag: '4.1.1 Análise sintática (obsoleto na 2.2, mas ainda impacta) / 1.3.1 (A)',
    titulo: 'Identificadores (id) repetidos na página',
    afeta: ['cegos'], leitor: true,
    porque: 'As associações de acessibilidade dependem de id único: label for, aria-labelledby, aria-describedby e aria-controls resolvem sempre para o primeiro elemento encontrado. Com ids repetidos, o rótulo certo vai para o campo errado.',
    corrigir: 'Torne cada id único. Em listas geradas dinamicamente, componha o id com o identificador do item.',
    exemplo: '<label for="obs-1042">Observações</label>\n<textarea id="obs-1042"></textarea>'
  }, function () {
    var vistos = {}, dup = {};
    $$('[id]').forEach(function (el) {
      var id = el.getAttribute('id');
      if (!id) return;
      if (vistos[id]) dup[id] = (dup[id] || 1) + 1; else vistos[id] = el;
    });
    return Object.keys(dup).slice(0, 30).map(function (id) {
      return { el: vistos[id], det: 'id="' + id + '" aparece ' + dup[id] + ' vezes' };
    });
  });

  checa({
    id: 'iframe-sem-titulo', sev: 'serio', cat: 'estrutura', wcag: '4.1.2 Nome, função, valor (A) / 2.4.1 (A)',
    titulo: 'iframe sem título',
    afeta: ['cegos'], leitor: true,
    porque: 'Na lista de quadros do leitor de tela, iframes sem título aparecem como "quadro" ou com a URL. A pessoa não sabe se ali está um vídeo, um mapa ou um formulário de pagamento.',
    corrigir: 'Adicione title descrevendo o conteúdo embutido. Se o iframe for puramente decorativo ou técnico (rastreamento, pixel), use aria-hidden="true" e tabindex="-1".',
    exemplo: '<iframe src="..." title="Vídeo: como agendar sua consulta"></iframe>'
  }, function () {
    return $$('iframe,frame').filter(function (el) {
      if (ariaOculto(el)) return false;
      return !norm(el.getAttribute('title')) && !norm(el.getAttribute('aria-label'));
    }).map(function (el) { return { el: el, det: norm((el.getAttribute('src') || '').slice(0, 60)) }; });
  });

  checa({
    id: 'tabela-sem-cabecalho', sev: 'serio', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A)',
    titulo: 'Tabela de dados sem células de cabeçalho (<th>)',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Ao navegar célula a célula, o leitor de tela anuncia o cabeçalho da coluna junto com o valor ("Vencimento, 12/03"). Sem <th>, a pessoa ouve só números soltos e precisa contar colunas de cabeça.',
    corrigir: 'Use <th> na primeira linha e/ou na primeira coluna, com scope="col" ou scope="row". Se a tabela serve só para layout, marque com role="presentation".',
    exemplo: '<table>\n  <caption>Consultas da semana</caption>\n  <thead><tr><th scope="col">Paciente</th><th scope="col">Data</th></tr></thead>\n  <tbody><tr><td>Ana</td><td>12/03</td></tr></tbody>\n</table>'
  }, function () {
    return $$('table').filter(function (el) {
      if (oculto(el)) return false;
      var papel = el.getAttribute('role');
      if (papel === 'presentation' || papel === 'none') return false;
      if (el.rows && el.rows.length < 2) return false;
      return !el.querySelector('th');
    }).map(function (el) { return { el: el, det: (el.rows ? el.rows.length : '?') + ' linhas' }; });
  });

  checa({
    id: 'th-sem-scope', sev: 'moderado', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A)',
    titulo: 'Cabeçalho de tabela sem scope',
    afeta: ['cegos'], leitor: true,
    porque: 'Em tabelas com cabeçalho de linha e de coluna ao mesmo tempo, o leitor de tela precisa do scope para saber qual cabeçalho associar a cada célula.',
    corrigir: 'Declare scope="col" ou scope="row" em cada <th>. Em tabelas complexas, use headers e id.',
    exemplo: '<th scope="col">Data</th>\n<th scope="row">Ana Souza</th>'
  }, function () {
    return $$('table th').filter(function (el) {
      if (oculto(el)) return false;
      return !norm(el.getAttribute('scope')) && !norm(el.getAttribute('headers'));
    }).slice(0, 30).map(function (el) { return { el: el, det: norm(el.textContent).slice(0, 40) }; });
  });

  checa({
    id: 'tabela-sem-legenda', sev: 'aviso', cat: 'estrutura', wcag: 'Boa prática (1.3.1 relacionado)',
    titulo: 'Tabela de dados sem <caption>',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'A legenda dá nome à tabela na lista de tabelas do leitor de tela. Com várias tabelas na mesma página, é o que permite escolher a certa.',
    corrigir: 'Adicione <caption> como primeiro filho da tabela (pode ser escondida visualmente, mas mantendo-a disponível para leitores de tela).',
    exemplo: '<table>\n  <caption>Faturas em aberto</caption>\n  ...\n</table>'
  }, function () {
    return $$('table').filter(function (el) {
      if (oculto(el)) return false;
      var papel = el.getAttribute('role');
      if (papel === 'presentation' || papel === 'none') return false;
      if (!el.querySelector('th')) return false;
      return !el.querySelector('caption') && !norm(el.getAttribute('aria-label')) && !el.getAttribute('aria-labelledby');
    }).map(function (el) { return { el: el }; });
  });

  checa({
    id: 'lista-mal-formada', sev: 'moderado', cat: 'estrutura', wcag: '1.3.1 Informação e relações (A)',
    titulo: 'Lista com filhos diretos que não são <li>',
    afeta: ['cegos'], leitor: true,
    porque: 'O leitor de tela anuncia "lista com N itens" e permite pular de item em item. Filhos inválidos quebram a contagem e podem fazer conteúdo desaparecer da navegação por itens.',
    corrigir: 'Deixe apenas <li> (e <script>/<template>) como filhos diretos de <ul> e <ol>. Envolva qualquer wrapper dentro do <li>.',
    exemplo: '<ul>\n  <li><div class="card"> ... </div></li>\n</ul>'
  }, function () {
    return $$('ul,ol').filter(function (el) {
      return A(el.children).some(function (c) { return !/^(LI|SCRIPT|TEMPLATE)$/.test(c.nodeName); });
    }).slice(0, 25).map(function (el) { return { el: el }; });
  });

  checa({
    id: 'elementos-obsoletos', sev: 'moderado', cat: 'estrutura', wcag: '2.2.2 Pausar, parar, ocultar (A) / boa prática',
    titulo: 'Elementos HTML obsoletos em uso',
    afeta: ['cognitiva', 'baixavisao', 'cegos'], leitor: true,
    porque: '<marquee> e <blink> criam movimento que não pode ser pausado, o que atrapalha a leitura e pode desencadear desconforto. <font>, <center> e <big> misturam apresentação com estrutura e não têm suporte previsível.',
    corrigir: 'Substitua por CSS. Qualquer movimento automático precisa de controle de pausa e deve respeitar prefers-reduced-motion.',
    exemplo: '@media (prefers-reduced-motion: reduce) {\n  * { animation: none !important; transition: none !important; }\n}'
  }, function () {
    return $$('marquee,blink,font,center,big,strike').map(function (el) { return { el: el, det: '<' + el.nodeName.toLowerCase() + '>' }; });
  });

  checa({
    id: 'meta-refresh', sev: 'serio', cat: 'estrutura', wcag: '2.2.1 Ajuste de tempo (A) / 3.2.5 (AAA)',
    titulo: 'Recarregamento ou redirecionamento automático por meta refresh',
    afeta: ['cegos', 'cognitiva', 'baixavisao'], leitor: true,
    porque: 'A página muda sozinha no meio da leitura. Quem usa leitor de tela ou lê devagar perde o ponto em que estava, sem aviso e sem como impedir.',
    corrigir: 'Remova o meta refresh. Se precisar atualizar conteúdo, faça por JavaScript com aviso e opção de adiar ou desligar.',
    exemplo: '<!-- evite --> <meta http-equiv="refresh" content="30">'
  }, function () {
    return $$('meta[http-equiv="refresh"]').map(function (el) { return { el: el, det: 'content="' + el.getAttribute('content') + '"' }; });
  });

  /* ================================================================== */
  /* ARIA                                                                */
  /* ================================================================== */

  checa({
    id: 'aria-hidden-com-foco', sev: 'critico', cat: 'aria', wcag: '1.3.1 (A) / 4.1.2 (A)',
    titulo: 'Elemento focável dentro de aria-hidden="true"',
    afeta: ['cegos', 'teclado'], leitor: true,
    porque: 'É a pior combinação possível: o elemento continua recebendo foco pelo teclado, mas foi removido da árvore de acessibilidade. O foco vai para um lugar que o leitor de tela não consegue anunciar — a pessoa fica "perdida no nada".',
    corrigir: 'Se o conteúdo deve ser ignorado, remova-o também da ordem de tabulação com tabindex="-1" nos focáveis internos, ou use o atributo inert no contêiner.',
    exemplo: '<div inert> ... conteúdo fora de alcance ... </div>'
  }, function () {
    var saida = [];
    $$('[aria-hidden="true"]').forEach(function (cont) {
      var focaveis = $$(FOCAVEL, cont).filter(function (el) {
        var ti = el.getAttribute('tabindex');
        return !(ti !== null && parseInt(ti, 10) < 0) && !el.disabled && !el.closest('[inert]');
      });
      if (cont.matches && cont.matches(FOCAVEL) && !cont.hasAttribute('inert')) {
        var ti0 = cont.getAttribute('tabindex');
        if (!(ti0 !== null && parseInt(ti0, 10) < 0)) focaveis.unshift(cont);
      }
      focaveis.slice(0, 5).forEach(function (el) {
        saida.push({ el: el, det: 'focável dentro de aria-hidden="true"' });
      });
    });
    return saida;
  });

  checa({
    id: 'aria-referencia-quebrada', sev: 'serio', cat: 'aria', wcag: '1.3.1 (A) / 4.1.2 (A)',
    titulo: 'Atributo ARIA apontando para id inexistente',
    afeta: ['cegos'], leitor: true,
    porque: 'Referência quebrada faz o nome, a descrição ou a relação simplesmente não existir. O leitor de tela cai para a próxima fonte de nome ou anuncia o controle sem rótulo.',
    corrigir: 'Confira se o id referenciado existe na página e está escrito exatamente igual. Cuidado com componentes que renderizam o alvo só depois.',
    exemplo: '<button aria-describedby="dica-exportar">Exportar</button>\n<span id="dica-exportar">Gera um arquivo CSV.</span>'
  }, function () {
    var saida = [];
    ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-details', 'aria-errormessage', 'aria-flowto'].forEach(function (attr) {
      $$('[' + attr + ']').forEach(function (el) {
        var faltando = (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean).filter(function (id) { return !D.getElementById(id); });
        if (faltando.length) saida.push({ el: el, det: attr + ' aponta para id inexistente: ' + faltando.join(', ') });
      });
    });
    return saida.slice(0, 30);
  });

  checa({
    id: 'role-invalido', sev: 'serio', cat: 'aria', wcag: '4.1.2 Nome, função, valor (A)',
    titulo: 'Valor de role desconhecido',
    afeta: ['cegos'], leitor: true,
    porque: 'Um papel inválido é ignorado e o elemento volta ao papel implícito — normalmente nenhum, no caso de div e span. O componente deixa de ser anunciado como controle.',
    corrigir: 'Use apenas papéis previstos na especificação WAI-ARIA, ou prefira o elemento HTML nativo equivalente.',
    exemplo: '<div role="tablist"> ... </div>'
  }, function () {
    return $$('[role]').filter(function (el) {
      var papeis = norm(el.getAttribute('role')).split(/\s+/).filter(Boolean);
      return papeis.length && papeis.every(function (p) { return PAPEIS_VALIDOS.indexOf(p.toLowerCase()) === -1 && p.indexOf('doc-') !== 0 && p.indexOf('graphics-') !== 0; });
    }).slice(0, 25).map(function (el) { return { el: el, det: 'role="' + el.getAttribute('role') + '"' }; });
  });

  checa({
    id: 'aria-atributo-invalido', sev: 'moderado', cat: 'aria', wcag: '4.1.2 Nome, função, valor (A)',
    titulo: 'Atributo aria-* inexistente',
    afeta: ['cegos'], leitor: true,
    porque: 'Um atributo com erro de digitação não faz nada. O estado ou a propriedade que se pretendia comunicar nunca chega ao leitor de tela.',
    corrigir: 'Confira a grafia contra a lista de estados e propriedades da WAI-ARIA.',
    exemplo: '<button aria-pressed="true">Negrito</button>'
  }, function () {
    var saida = [];
    TODOS.forEach(function (el) {
      A(el.attributes).forEach(function (at) {
        if (at.name.indexOf('aria-') !== 0) return;
        if (ARIA_VALIDOS.indexOf(at.name.slice(5)) === -1) saida.push({ el: el, det: at.name });
      });
    });
    return saida.slice(0, 25);
  });

  checa({
    id: 'presentation-em-interativo', sev: 'serio', cat: 'aria', wcag: '4.1.2 Nome, função, valor (A)',
    titulo: 'role="presentation" ou "none" em elemento interativo',
    afeta: ['cegos'], leitor: true,
    porque: 'Esse papel remove a semântica do elemento. Um botão ou link marcado assim deixa de ser anunciado como controle, embora continue clicável e focável.',
    corrigir: 'Remova o papel do elemento interativo. Use presentation apenas em contêineres puramente visuais, como tabelas de layout.',
    exemplo: '<table role="presentation"> ... </table>'
  }, function () {
    return $$('[role="presentation"],[role="none"]').filter(function (el) {
      return /^(a|button|input|select|textarea|summary)$/.test(el.nodeName.toLowerCase()) && !oculto(el);
    }).map(function (el) { return { el: el }; });
  });

  checa({
    id: 'aria-label-em-generico', sev: 'moderado', cat: 'aria', wcag: '4.1.2 Nome, função, valor (A)',
    titulo: 'aria-label em elemento sem papel semântico',
    afeta: ['cegos'], leitor: true,
    porque: 'Em um <div> ou <span> sem role, o aria-label costuma ser ignorado pelos leitores de tela. O rótulo que a equipe escreveu nunca é anunciado.',
    corrigir: 'Aplique aria-label em elementos com papel (button, a, nav, section com role="region", elementos com role explícito) ou dê um role ao contêiner.',
    exemplo: '<section role="region" aria-label="Resumo financeiro"> ... </section>'
  }, function () {
    return $$('div[aria-label],span[aria-label],p[aria-label],li[aria-label]').filter(function (el) {
      return !el.getAttribute('role') && !el.hasAttribute('tabindex') && !oculto(el);
    }).slice(0, 25).map(function (el) { return { el: el, det: 'aria-label="' + norm(el.getAttribute('aria-label')).slice(0, 50) + '"' }; });
  });

  checa({
    id: 'tabindex-positivo', sev: 'serio', cat: 'teclado', wcag: '2.4.3 Ordem do foco (A)',
    titulo: 'tabindex com valor positivo',
    afeta: ['teclado', 'cegos'], leitor: true,
    porque: 'Valores acima de zero criam uma ordem de tabulação paralela que passa na frente de todo o resto da página. O foco pula de um canto a outro sem relação com o que está na tela, e um único componente novo pode desorganizar a navegação inteira.',
    corrigir: 'Use apenas tabindex="0" (entra na ordem natural) e tabindex="-1" (focável só por script). Para mudar a ordem, mude a ordem no HTML.',
    exemplo: '<button tabindex="0">Salvar</button>\n<div tabindex="-1" id="alvo-de-foco"> ... </div>'
  }, function () {
    return $$('[tabindex]').filter(function (el) { return parseInt(el.getAttribute('tabindex'), 10) > 0; })
      .map(function (el) { return { el: el, det: 'tabindex="' + el.getAttribute('tabindex') + '"' }; });
  });

  /* ================================================================== */
  /* COR, CONTRASTE E LEGIBILIDADE                                       */
  /* ================================================================== */

  /* elementos que contem texto proprio (no direto de texto) */
  var COM_TEXTO = [];
  (function coletaTexto() {
    var lim = 2000;
    for (var i = 0; i < VISIVEIS.length && COM_TEXTO.length < lim; i++) {
      var el = VISIVEIS[i];
      var t = el.nodeName;
      if (t === 'SCRIPT' || t === 'STYLE' || t === 'NOSCRIPT' || t === 'TEMPLATE' || t === 'OPTION' || t === 'SVG') continue;
      var texto = '';
      for (var j = 0; j < el.childNodes.length; j++) {
        if (el.childNodes[j].nodeType === 3) texto += el.childNodes[j].nodeValue;
      }
      texto = norm(texto);
      if (!texto) continue;
      if (soParaLeitor(el)) continue;
      COM_TEXTO.push({ el: el, texto: texto });
    }
  })();

  function ehTextoGrande(cs) {
    var fs = parseFloat(cs.fontSize) || 16;
    var peso = parseInt(cs.fontWeight, 10);
    if (isNaN(peso)) peso = /bold/i.test(cs.fontWeight) ? 700 : 400;
    return fs >= 24 || (fs >= 18.66 && peso >= 700);
  }

  var paresContraste = [];

  checa({
    id: 'contraste-insuficiente', sev: 'serio', cat: 'cor', wcag: '1.4.3 Contraste mínimo (AA)',
    titulo: 'Texto com contraste abaixo do mínimo',
    afeta: ['baixavisao', 'cores', 'todos'], cor: true,
    porque: 'Contraste baixo é a barreira de acessibilidade mais comum na web. Ele afeta pessoas com baixa visão, pessoas com daltonismo (quando a diferença entre as cores é de matiz e não de luminosidade), pessoas com mais de 40 anos e qualquer pessoa usando a tela sob luz forte. O critério exige 4,5:1 para texto normal e 3:1 para texto grande (24px, ou 18,7px em negrito).',
    corrigir: 'Escureça o texto ou clareie o fundo até atingir a razão exigida. Ajuste a luminosidade, não apenas o matiz: trocar verde por vermelho na mesma luminosidade não resolve nada.',
    exemplo: '/* 2,8:1 - reprovado */  color: #8a8a8a; background: #ffffff;\n/* 4,6:1 - aprovado  */  color: #767676; background: #ffffff;'
  }, function () {
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      var el = item.el, cs = gcs(el);
      if (!cs) return;
      var f = fundoDe(el);
      if (f.imagem || f.gradiente) return;
      var corTexto = parseCor(cs.color);
      if (!corTexto) return;
      var fg = mistura(corTexto, f.rgb);
      var razao = contraste(fg, f.rgb);
      var grande = ehTextoGrande(cs);
      var exigido = grande ? 3 : 4.5;
      if (razao + 0.01 < exigido) {
        var reg = {
          el: el,
          det: razao.toFixed(2) + ':1 (mínimo ' + exigido.toFixed(1) + ':1) — texto ' + hex(fg) + ' sobre ' + hex(f.rgb),
          extra: { tipo: 'contraste', fg: hex(fg), bg: hex(f.rgb), razao: razao, exigido: exigido, texto: item.texto.slice(0, 70), grande: grande }
        };
        saida.push(reg);
        paresContraste.push(reg.extra);
      }
    });
    saida.sort(function (a, b) { return a.extra.razao - b.extra.razao; });
    return saida;
  });

  checa({
    id: 'contraste-nao-verificavel', sev: 'aviso', cat: 'cor', wcag: '1.4.3 Contraste mínimo (AA)',
    titulo: 'Texto sobre imagem ou gradiente: contraste precisa de conferência manual',
    afeta: ['baixavisao', 'cores'], cor: true,
    porque: 'Quando o fundo é uma foto ou um gradiente, o contraste muda de pixel para pixel. Nenhuma ferramenta automática consegue afirmar se passa ou não — e é justamente onde mais aparecem falhas reais, porque a imagem muda entre telas grandes e pequenas.',
    corrigir: 'Confira manualmente o pior ponto da imagem. Soluções comuns: camada semitransparente escura sobre a foto, sombra sólida atrás do texto, ou uma faixa de cor sólida sob o bloco de texto.',
    exemplo: '.heroi { background-image: linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url(foto.jpg); color: #fff; }'
  }, function () {
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      var f = fundoDe(item.el);
      if (f.imagem || f.gradiente) saida.push({ el: item.el, det: 'fundo com ' + (f.imagem ? 'imagem' : 'gradiente') + ': "' + item.texto.slice(0, 50) + '"' });
    });
    return saida.slice(0, 25);
  });

  checa({
    id: 'contraste-aaa', sev: 'aviso', cat: 'extras', wcag: '1.4.6 Contraste ampliado (AAA)',
    titulo: 'Texto que passa no nível AA mas não no AAA (7:1)',
    afeta: ['baixavisao'], cor: true,
    porque: 'O nível AAA não costuma ser exigido por lei, mas é a faixa em que pessoas com perda visual moderada leem sem esforço. Vale como meta para texto corrido de leitura longa.',
    corrigir: 'Para conteúdo de leitura contínua, mire 7:1 em texto normal e 4,5:1 em texto grande.',
    exemplo: '/* 7,4:1 */ color: #595959; background: #ffffff;'
  }, function () {
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      var el = item.el, cs = gcs(el);
      if (!cs) return;
      var f = fundoDe(el);
      if (f.imagem || f.gradiente) return;
      var c = parseCor(cs.color);
      if (!c) return;
      var fg = mistura(c, f.rgb);
      var razao = contraste(fg, f.rgb);
      var grande = ehTextoGrande(cs);
      var min = grande ? 3 : 4.5, alvo = grande ? 4.5 : 7;
      if (razao >= min && razao < alvo) saida.push({ el: el, det: razao.toFixed(2) + ':1 (AAA pede ' + alvo + ':1)' });
    });
    return saida.slice(0, 20);
  });

  checa({
    id: 'contraste-componente', sev: 'moderado', cat: 'cor', wcag: '1.4.11 Contraste não textual (AA)',
    titulo: 'Limite de campo ou botão com contraste abaixo de 3:1',
    afeta: ['baixavisao', 'cores'], cor: true,
    porque: 'A borda é o que mostra onde começa e termina a área clicável ou digitável. Com contraste baixo, o campo some do fundo e a pessoa não percebe que há algo ali para preencher.',
    corrigir: 'Garanta pelo menos 3:1 entre a borda (ou o fundo do controle) e a cor imediatamente ao redor.',
    exemplo: 'input { border: 1px solid #767676; } /* 4,5:1 sobre branco */'
  }, function () {
    var saida = [];
    $$('input:not([type="hidden"]),select,textarea,button').forEach(function (el) {
      if (oculto(el) || soParaLeitor(el)) return;
      var cs = gcs(el);
      if (!cs) return;
      /* controles desenhados pelo proprio navegador ficam fora: a aparencia nao vem do CSS da pagina */
      var tp = (el.getAttribute('type') || '').toLowerCase();
      if (/^(radio|checkbox|range|color|file|submit|reset)$/.test(tp)) {
        var ap = cs.appearance || cs.webkitAppearance || '';
        if (ap && ap !== 'none') return;
      }
      var pai = el.parentElement;
      var fPai = pai ? fundoDe(pai) : { rgb: [255, 255, 255], imagem: false, gradiente: false };
      if (fPai.imagem || fPai.gradiente) return;
      var fundoProprio = parseCor(cs.backgroundColor);
      var temFundo = fundoProprio && fundoProprio[3] > 0.1;
      var estiloBorda = cs.borderTopStyle;
      var larguraBorda = parseFloat(cs.borderTopWidth) || 0;
      if (estiloBorda && estiloBorda !== 'none' && larguraBorda > 0) {
        var cb = parseCor(cs.borderTopColor);
        if (cb) {
          var b = mistura(cb, fPai.rgb);
          var r = contraste(b, fPai.rgb);
          if (r + 0.01 < 3) saida.push({ el: el, det: 'borda ' + hex(b) + ' sobre ' + hex(fPai.rgb) + ' = ' + r.toFixed(2) + ':1', extra: { tipo: 'contraste', fg: hex(b), bg: hex(fPai.rgb), razao: r, exigido: 3, texto: 'borda do controle', grande: true } });
          return;
        }
      }
      if (!temFundo) {
        /* um botao com texto ou icone ja se mostra sozinho; o limite importa mesmo em campos vazios */
        var precisaLimite = /^(input|select|textarea)$/.test(el.nodeName.toLowerCase()) && !/^(button|submit|reset|image)$/.test(tp);
        if (precisaLimite) saida.push({ el: el, det: 'sem borda visível e sem fundo próprio: limite do campo não perceptível' });
      } else {
        var bf = mistura(fundoProprio, fPai.rgb);
        var r2 = contraste(bf, fPai.rgb);
        if (r2 + 0.01 < 3) saida.push({ el: el, det: 'fundo do controle ' + hex(bf) + ' sobre ' + hex(fPai.rgb) + ' = ' + r2.toFixed(2) + ':1', extra: { tipo: 'contraste', fg: hex(bf), bg: hex(fPai.rgb), razao: r2, exigido: 3, texto: 'fundo do controle', grande: true } });
      }
    });
    return saida.slice(0, 25);
  });

  checa({
    id: 'link-so-por-cor', sev: 'serio', cat: 'cor', wcag: '1.4.1 Uso de cor (A)',
    titulo: 'Link dentro de texto distinguido apenas pela cor',
    afeta: ['cores', 'baixavisao'], cor: true,
    porque: 'Quem não percebe a diferença entre aquelas duas cores não enxerga que há um link ali. É o caso clássico de informação transmitida só pela cor. A norma aceita a cor sozinha apenas quando o contraste entre o link e o texto ao redor é de pelo menos 3:1 e existe outra pista ao focar ou passar o mouse.',
    corrigir: 'Mantenha o sublinhado nos links dentro de texto corrido. Se a decisão de design for tirá-lo, garanta 3:1 entre a cor do link e a do texto e acrescente sublinhado no hover e no foco.',
    exemplo: 'p a { text-decoration: underline; text-underline-offset: .15em; }'
  }, function () {
    var saida = [];
    $$('p a[href], li a[href], td a[href], dd a[href]').forEach(function (el) {
      if (oculto(el)) return;
      var cs = gcs(el);
      if (!cs) return;
      var linha = cs.textDecorationLine || cs.textDecoration || '';
      if (/underline/.test(linha)) return;
      if ((parseFloat(cs.borderBottomWidth) || 0) > 0 && cs.borderBottomStyle !== 'none') return;
      var pai = el.parentElement;
      if (!pai) return;
      var csPai = gcs(pai);
      if (!csPai) return;
      if (!norm(pai.textContent).replace(norm(el.textContent), '')) return;
      var fundo = fundoDe(el);
      var cl = parseCor(cs.color), cp = parseCor(csPai.color);
      if (!cl || !cp) return;
      var l = mistura(cl, fundo.rgb), p = mistura(cp, fundo.rgb);
      var r = contraste(l, p);
      var pesoDif = Math.abs((parseInt(cs.fontWeight, 10) || 400) - (parseInt(csPai.fontWeight, 10) || 400)) >= 300;
      if (pesoDif) return;
      saida.push({
        el: el,
        det: 'sem sublinhado; link ' + hex(l) + ' vs texto ' + hex(p) + ' = ' + r.toFixed(2) + ':1' + (r < 3 ? ' (abaixo de 3:1)' : ''),
        extra: { tipo: 'link', fg: hex(l), bg: hex(p), razao: r, exigido: 3, texto: norm(el.textContent).slice(0, 40), grande: false }
      });
    });
    return saida.slice(0, 25);
  });

  checa({
    id: 'instrucao-so-por-cor', sev: 'moderado', cat: 'cor', wcag: '1.4.1 Uso de cor (A)',
    titulo: 'Texto que parece instruir pela cor ("em vermelho", "os campos verdes")',
    afeta: ['cores', 'cegos'], cor: true, leitor: true,
    porque: 'Instruções que dependem de identificar uma cor não chegam a quem não distingue aquele par de cores nem a quem usa leitor de tela. Verificação por heurística de texto: confira se o trecho realmente depende da cor.',
    corrigir: 'Acrescente uma segunda pista junto da cor: um ícone, um texto, um padrão de preenchimento ou uma palavra no rótulo.',
    exemplo: '<!-- em vez de --> Os campos em vermelho são obrigatórios.\n<!-- use -->      Os campos marcados com "(obrigatório)" precisam ser preenchidos.'
  }, function () {
    var re = /\b(em|na cor|de cor|marcad[oa]s? em|destacad[oa]s? em|bot[ãa]o|[íi]cone|c[ée]lulas?|linhas?|campos?)\s+(vermelh|verde|azul|amarel|laranja|roxo|rosa|cinza|preto|branco)/i;
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      if (item.texto.length > 400) return;
      var m = item.texto.match(re);
      if (m) saida.push({ el: item.el, det: '"... ' + item.texto.slice(Math.max(0, m.index - 20), m.index + 70) + ' ..."' });
    });
    return saida.slice(0, 15);
  });

  checa({
    id: 'placeholder-baixo-contraste', sev: 'moderado', cat: 'cor', wcag: '1.4.3 Contraste mínimo (AA)',
    titulo: 'Texto de placeholder com contraste insuficiente',
    afeta: ['baixavisao', 'cognitiva'], cor: true,
    porque: 'O placeholder é texto e precisa cumprir o mesmo mínimo de contraste. Cinza-claro sobre branco é o padrão de muitos frameworks e reprova na maioria dos casos.',
    corrigir: 'Aplique pelo menos 4,5:1 ao ::placeholder — e lembre que o placeholder nunca deve ser a única fonte do rótulo.',
    exemplo: 'input::placeholder { color: #6b6b6b; } /* 5,3:1 sobre branco */'
  }, function () {
    var saida = [];
    regrasDeEstilo().forEach(function (r) {
      if (!/::?(-\w+-)?(input-)?placeholder/i.test(r.selectorText)) return;
      var c = parseCor(r.style.color);
      if (!c) return;
      var alvo = $$(r.selectorText.replace(/::?(-\w+-)?(input-)?placeholder/gi, ''))[0];
      var f = alvo ? fundoDe(alvo) : { rgb: [255, 255, 255] };
      var fg = mistura(c, f.rgb);
      var razao = contraste(fg, f.rgb);
      if (razao + 0.01 < 4.5) saida.push({ sel: r.selectorText, cod: r.selectorText + ' { color: ' + r.style.color + ' }', det: razao.toFixed(2) + ':1', extra: { tipo: 'contraste', fg: hex(fg), bg: hex(f.rgb), razao: razao, exigido: 4.5, texto: 'placeholder', grande: false } });
    });
    return saida.slice(0, 10);
  });

  /* ================================================================== */
  /* TECLADO E FOCO                                                      */
  /* ================================================================== */

  checa({
    id: 'foco-removido', sev: 'critico', cat: 'teclado', wcag: '2.4.7 Foco visível (AA) / 2.4.11 Aparência do foco (AA, WCAG 2.2)',
    titulo: 'Indicador de foco removido no CSS sem substituto',
    afeta: ['teclado', 'baixavisao', 'motora'], leitor: false,
    porque: 'Quem navega pelo teclado precisa enxergar onde está o foco para saber o que vai acontecer ao apertar Enter. Com outline: none e nada no lugar, a pessoa tabula às cegas pela interface. Essa é uma das barreiras mais frequentes e mais fáceis de corrigir.',
    corrigir: 'Nunca remova o outline sem colocar outro indicador com no mínimo 3:1 de contraste e área perceptível. Use :focus-visible para mostrar o anel apenas na navegação por teclado.',
    exemplo: ':focus-visible {\n  outline: 3px solid #005fcc;\n  outline-offset: 2px;\n}\n/* se precisar zerar o padrão, sempre com substituto */\n:focus:not(:focus-visible) { outline: none; }'
  }, function () {
    var saida = [];
    regrasDeEstilo().forEach(function (r) {
      if (!/:focus(?!-within)/i.test(r.selectorText)) return;
      var s = r.style;
      var zerado = /^(none|0|0px)$/i.test(norm(s.outline)) || /^(none|hidden)$/i.test(norm(s.outlineStyle)) || (norm(s.outlineWidth) && parseFloat(s.outlineWidth) === 0);
      if (!zerado) return;
      var substituto = norm(s.boxShadow) && s.boxShadow !== 'none';
      substituto = substituto || (norm(s.border) && !/^(none|0)/i.test(s.border)) || norm(s.borderColor) || norm(s.backgroundColor) || norm(s.textDecoration) || norm(s.filter);
      if (substituto) return;
      var qtd = 0;
      try { qtd = $$(r.selectorText.replace(/:focus(-visible|-within)?/gi, '')).length; } catch (e) { qtd = 0; }
      saida.push({ sel: r.selectorText, cod: r.selectorText + ' { outline: ' + (norm(s.outline) || norm(s.outlineStyle) || '0') + ' }', det: 'sem indicador substituto' + (qtd ? ' — atinge cerca de ' + qtd + ' elementos' : '') });
    });
    return saida.slice(0, 15);
  });

  checa({
    id: 'sem-focus-visible', sev: 'aviso', cat: 'extras', wcag: '2.4.11 Aparência do foco (AA, WCAG 2.2)',
    titulo: 'Nenhuma regra :focus-visible declarada',
    afeta: ['teclado', 'baixavisao'], leitor: false,
    porque: 'Sem :focus-visible, o projeto tende a cair em um dos dois extremos: mostrar o anel de foco também no clique de mouse (o que leva times a removê-lo) ou não mostrar nunca.',
    corrigir: 'Declare um estilo de foco explícito com :focus-visible, o que resolve o conflito entre teclado e mouse.',
    exemplo: ':where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {\n  outline: 3px solid #005fcc;\n  outline-offset: 2px;\n  border-radius: 2px;\n}'
  }, function () {
    if (!FOCAVEIS_VIS.length) return [];
    var achou = regrasDeEstilo().some(function (r) { return /:focus-visible/i.test(r.selectorText); });
    return achou ? [] : [{ sel: '(folhas de estilo)', det: 'nenhum seletor :focus-visible encontrado nas folhas legíveis' }];
  });

  checa({
    id: 'ordem-visual-diferente', sev: 'moderado', cat: 'teclado', wcag: '2.4.3 Ordem do foco (A) / 1.3.2 Sequência com significado (A)',
    titulo: 'CSS altera a ordem visual em relação à ordem do HTML',
    afeta: ['teclado', 'cegos', 'baixavisao'], leitor: true,
    porque: 'O leitor de tela e a tecla Tab seguem a ordem do HTML; os olhos seguem a ordem da tela. Quando as duas divergem, o foco parece pular sem lógica e a leitura fica fora de sequência.',
    corrigir: 'Reordene no HTML em vez de usar order, row-reverse ou column-reverse em blocos que contêm elementos focáveis. Se a inversão for necessária, confirme a ordem de tabulação manualmente.',
    exemplo: '/* prefira reorganizar o HTML a fazer isto em blocos interativos */\n.grade { display: flex; flex-direction: row-reverse; }'
  }, function () {
    var saida = [];
    VISIVEIS.slice(0, 3000).forEach(function (el) {
      var cs = gcs(el);
      if (!cs) return;
      var inverte = /reverse/.test(cs.flexDirection || '') || (cs.order && parseInt(cs.order, 10) !== 0);
      if (!inverte) return;
      var temFoco = el.matches && el.matches(FOCAVEL) ? 1 : $$(FOCAVEL, el).length;
      if (temFoco) saida.push({ el: el, det: (cs.order && parseInt(cs.order, 10) !== 0 ? 'order: ' + cs.order : 'flex-direction: ' + cs.flexDirection) + ' com ' + temFoco + ' elemento(s) focável(is)' });
    });
    return saida.slice(0, 15);
  });

  checa({
    id: 'focavel-fora-de-tela', sev: 'moderado', cat: 'teclado', wcag: '2.4.3 Ordem do foco (A) / 2.4.7 (AA)',
    titulo: 'Elemento focável posicionado fora da área visível',
    afeta: ['teclado', 'baixavisao'], leitor: false,
    porque: 'O foco vai para um controle que não aparece na tela. Quem enxerga e usa teclado perde a referência de onde está; é um sintoma comum de menu ou modal que foi escondido com CSS mas continua na ordem de tabulação.',
    corrigir: 'Esconda conteúdo inativo com display: none, hidden ou inert, em vez de deslocá-lo para fora da tela. Links de atalho são exceção legítima — eles devem aparecer ao receber foco.',
    exemplo: '.menu[hidden] { display: none; }\n.pular-link:focus { position: static; width: auto; height: auto; }'
  }, function () {
    return FOCAVEIS.filter(function (el) {
      if (el.closest && el.closest('[hidden],[inert]')) return false;
      var cs = gcs(el);
      if (!cs || cs.display === 'none' || cs.visibility === 'hidden') return false;
      var r = ret(el);
      if (!r.width && !r.height) return false;
      /* posicao absoluta no documento: getBoundingClientRect e relativo a janela,
         e uma pagina rolada faria tudo que ficou acima parecer "fora da tela" */
      var sx = W.scrollX || W.pageXOffset || 0, sy = W.scrollY || W.pageYOffset || 0;
      var dir = r.left + r.width + sx, baixo = r.top + r.height + sy;
      var deslocado = dir < -10 || baixo < -10 || (r.left + sx) > (D.documentElement.scrollWidth + 10);
      if (!deslocado) return false;
      var n = nomeAcessivel(el).nome.toLowerCase();
      if (/pular|skip|ir para|ir ao/.test(n)) return false;
      return true;
    }).slice(0, 15).map(function (el) {
      var r = ret(el);
      return { el: el, det: 'posição x=' + Math.round(r.left) + ' y=' + Math.round(r.top) + ' — "' + (nomeAcessivel(el).nome.slice(0, 40) || 'sem nome') + '"' };
    });
  });

  /* ================================================================== */
  /* ZOOM, REDIMENSIONAMENTO E ESPACAMENTO                               */
  /* ================================================================== */

  checa({
    id: 'viewport-bloqueia-zoom', sev: 'critico', cat: 'zoom', wcag: '1.4.4 Redimensionar texto (AA)',
    titulo: 'Meta viewport impede ampliar a página',
    afeta: ['baixavisao', 'cognitiva'], cor: true,
    porque: 'Ampliar a tela é o recurso mais usado por pessoas com baixa visão no celular. user-scalable=no ou maximum-scale menor que 2 desliga o gesto de pinça e a pessoa fica presa ao tamanho original.',
    corrigir: 'Remova user-scalable e maximum-scale da meta viewport. Permita ampliar até pelo menos 200%.',
    exemplo: '<meta name="viewport" content="width=device-width, initial-scale=1">'
  }, function () {
    var saida = [];
    $$('meta[name="viewport"]').forEach(function (el) {
      var c = (el.getAttribute('content') || '').toLowerCase();
      var problemas = [];
      if (/user-scalable\s*=\s*(no|0)/.test(c)) problemas.push('user-scalable=no');
      var m = c.match(/maximum-scale\s*=\s*([\d.]+)/);
      if (m && parseFloat(m[1]) < 2) problemas.push('maximum-scale=' + m[1]);
      if (problemas.length) saida.push({ el: el, det: problemas.join(' e ') });
    });
    return saida;
  });

  checa({
    id: 'rolagem-horizontal', sev: 'moderado', cat: 'zoom', wcag: '1.4.10 Refluxo (AA)',
    titulo: 'A página exige rolagem horizontal na largura atual',
    afeta: ['baixavisao', 'motora', 'cognitiva'], cor: true,
    porque: 'Quem amplia a página em 200% ou 400% acaba com uma janela estreita. Se o conteúdo não se reorganiza, a pessoa precisa rolar para os lados a cada linha lida — o que torna a leitura inviável na prática.',
    corrigir: 'Use layout fluido (max-width, grid com minmax, flex-wrap) e evite larguras fixas em px nos contêineres. Teste a página com a janela em 320 CSS pixels de largura.',
    exemplo: '.conteiner { max-inline-size: 72ch; inline-size: 100%; }\nimg, table, pre { max-inline-size: 100%; }'
  }, function () {
    var de = D.documentElement;
    var excesso = de.scrollWidth - de.clientWidth;
    if (excesso <= 4) return [];
    var culpados = VISIVEIS.filter(function (el) {
      var r = ret(el);
      return r.width > 0 && (r.right > de.clientWidth + 4);
    }).slice(0, 8).map(function (el) {
      var r = ret(el);
      return { el: el, det: 'ultrapassa a largura da janela em ' + Math.round(r.right - de.clientWidth) + ' px' };
    });
    culpados.unshift({ sel: 'html', det: 'scrollWidth ' + de.scrollWidth + ' px vs largura visível ' + de.clientWidth + ' px' });
    return culpados;
  });

  checa({
    id: 'fonte-pequena', sev: 'moderado', cat: 'zoom', wcag: '1.4.4 Redimensionar texto (AA) / boa prática',
    titulo: 'Texto com fonte menor que 12 px',
    afeta: ['baixavisao', 'cognitiva'], cor: true,
    porque: 'Fontes muito pequenas obrigam a ampliar a página inteira só para ler um aviso ou um rodapé. Costuma acontecer justamente em textos importantes: termos, condições e mensagens de erro.',
    corrigir: 'Use no mínimo 16px no texto corrido e 12px em textos secundários, declarando em rem para respeitar a preferência de tamanho do navegador.',
    exemplo: 'html { font-size: 100%; }\n.legenda { font-size: 0.875rem; } /* 14px */'
  }, function () {
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      var cs = gcs(item.el);
      if (!cs) return;
      var fs = parseFloat(cs.fontSize);
      if (fs && fs < 12) saida.push({ el: item.el, det: Math.round(fs * 10) / 10 + 'px — "' + item.texto.slice(0, 45) + '"' });
    });
    return saida.slice(0, 20);
  });

  checa({
    id: 'entrelinha-apertada', sev: 'aviso', cat: 'extras', wcag: '1.4.12 Espaçamento de texto (AA) / 1.4.8 (AAA)',
    titulo: 'Entrelinha menor que 1,5 em blocos de texto',
    afeta: ['cognitiva', 'baixavisao'], cor: true,
    porque: 'Linhas coladas fazem o olho perder a linha ao voltar para a esquerda. O efeito é maior para pessoas com dislexia e baixa visão.',
    corrigir: 'Use line-height de pelo menos 1,5 em parágrafos e garanta que o layout não quebre quando a pessoa aumentar o espaçamento pelo navegador.',
    exemplo: 'p, li { line-height: 1.6; }'
  }, function () {
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      if (!/^(P|LI|DD|DT|BLOCKQUOTE|ARTICLE|SECTION)$/.test(item.el.nodeName)) return;
      if (item.texto.length < 80) return;
      var cs = gcs(item.el);
      if (!cs) return;
      var fs = parseFloat(cs.fontSize) || 16;
      var lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
      if (lh && lh / fs < 1.5) saida.push({ el: item.el, det: 'line-height ' + (Math.round((lh / fs) * 100) / 100) + ' (recomendado 1,5)' });
    });
    return saida.slice(0, 15);
  });

  checa({
    id: 'texto-justificado', sev: 'aviso', cat: 'extras', wcag: '1.4.8 Apresentação visual (AAA)',
    titulo: 'Texto justificado nas duas margens',
    afeta: ['cognitiva', 'baixavisao'], cor: true,
    porque: 'A justificação cria "rios" de espaço em branco irregulares entre as palavras, que dificultam o rastreio da linha — efeito mais forte em pessoas com dislexia.',
    corrigir: 'Alinhe o texto à esquerda (text-align: start) em conteúdo de leitura longa.',
    exemplo: 'p { text-align: start; }'
  }, function () {
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      if (item.texto.length < 120) return;
      var cs = gcs(item.el);
      if (cs && cs.textAlign === 'justify') saida.push({ el: item.el, det: 'text-align: justify' });
    });
    return saida.slice(0, 10);
  });

  checa({
    id: 'caixa-alta-longa', sev: 'aviso', cat: 'extras', wcag: 'Boa prática (3.1.5 relacionado)',
    titulo: 'Trecho longo em caixa alta',
    afeta: ['cognitiva', 'cegos', 'baixavisao'], leitor: true,
    porque: 'Texto todo em maiúsculas remove as diferenças de altura entre as letras, que é justamente o que o olho usa para reconhecer palavras. Além disso, alguns leitores de tela soletram sequências em maiúsculas por interpretá-las como sigla.',
    corrigir: 'Escreva o texto em caixa mista no HTML. Se o efeito visual for necessário, aplique text-transform: uppercase no CSS — assim o leitor de tela recebe o texto original.',
    exemplo: '<h2 class="titulo">Política de privacidade</h2>\n.titulo { text-transform: uppercase; letter-spacing: .04em; }'
  }, function () {
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      var t = item.texto;
      if (t.length < 40) return;
      var letras = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
      if (letras.length < 30) return;
      var maiusculas = letras.replace(/[^A-ZÀ-Þ]/g, '').length;
      if (maiusculas / letras.length > 0.85) saida.push({ el: item.el, det: 'no HTML: "' + t.slice(0, 60) + '"' });
    });
    return saida.slice(0, 10);
  });

  checa({
    id: 'linha-muito-larga', sev: 'aviso', cat: 'extras', wcag: '1.4.8 Apresentação visual (AAA)',
    titulo: 'Linha de texto muito larga (acima de ~100 caracteres)',
    afeta: ['cognitiva', 'baixavisao'], cor: true,
    porque: 'Linhas longas aumentam a chance de o olho pular ou repetir a linha ao voltar para a margem esquerda.',
    corrigir: 'Limite a medida do texto corrido a cerca de 80 caracteres.',
    exemplo: '.texto { max-inline-size: 70ch; }'
  }, function () {
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      if (!/^(P|LI|DD|ARTICLE|SECTION|DIV)$/.test(item.el.nodeName)) return;
      if (item.texto.length < 200) return;
      var cs = gcs(item.el);
      if (!cs) return;
      var fs = parseFloat(cs.fontSize) || 16;
      var r = ret(item.el);
      var chars = r.width / (fs * 0.5);
      if (chars > 100) saida.push({ el: item.el, det: 'cerca de ' + Math.round(chars) + ' caracteres por linha' });
    });
    return saida.slice(0, 10);
  });

  /* ================================================================== */
  /* MIDIA, MOVIMENTO E TEMPO                                            */
  /* ================================================================== */

  checa({
    id: 'video-sem-legenda', sev: 'critico', cat: 'midia', wcag: '1.2.2 Legendas (A)',
    titulo: 'Vídeo sem faixa de legendas',
    afeta: ['auditiva', 'cognitiva'], leitor: false,
    porque: 'Sem legenda, todo o conteúdo falado fica indisponível para pessoas surdas ou com perda auditiva — e também para quem assiste sem som, situação muito comum.',
    corrigir: 'Adicione <track kind="captions"> com legendas sincronizadas em português. Legenda automática sem revisão não cumpre o critério.',
    exemplo: '<video controls>\n  <source src="aula.mp4" type="video/mp4">\n  <track kind="captions" src="aula-pt.vtt" srclang="pt-BR" label="Português" default>\n</video>'
  }, function () {
    return $$('video').filter(function (el) {
      return !el.querySelector('track[kind="captions"],track[kind="subtitles"]');
    }).map(function (el) { return { el: el, det: norm((el.getAttribute('src') || (el.querySelector('source') || {}).src || '').slice(-60)) }; });
  });

  checa({
    id: 'audio-sem-alternativa', sev: 'serio', cat: 'midia', wcag: '1.2.1 Somente áudio e somente vídeo (A)',
    titulo: 'Áudio sem transcrição aparente',
    afeta: ['auditiva', 'cognitiva'], leitor: false,
    porque: 'Conteúdo só em áudio precisa de uma alternativa em texto para chegar a pessoas surdas. A transcrição também ajuda quem prefere ler e melhora a busca no site.',
    corrigir: 'Publique a transcrição na própria página, ou um link claramente identificado logo ao lado do player.',
    exemplo: '<audio controls src="podcast.mp3"></audio>\n<details><summary>Transcrição do episódio</summary><p>...</p></details>'
  }, function () {
    return $$('audio').filter(function (el) {
      var vizinho = el.parentElement ? norm(el.parentElement.textContent).toLowerCase() : '';
      return !/transcri|legenda|texto completo/.test(vizinho);
    }).map(function (el) { return { el: el }; });
  });

  checa({
    id: 'midia-autoplay', sev: 'serio', cat: 'midia', wcag: '1.4.2 Controle de áudio (A)',
    titulo: 'Mídia com reprodução automática e som',
    afeta: ['cegos', 'cognitiva', 'auditiva'], leitor: true,
    porque: 'O som automático se sobrepõe à voz do leitor de tela e a pessoa precisa caçar o controle de pausa sem conseguir ouvir a própria navegação. Também atrapalha quem tem sensibilidade sensorial.',
    corrigir: 'Não reproduza áudio automaticamente. Se for inevitável, comece sem som (muted) e ofereça um controle de pausa no primeiro elemento focável.',
    exemplo: '<video autoplay muted playsinline loop> ... </video>'
  }, function () {
    return $$('audio[autoplay],video[autoplay]').filter(function (el) { return !el.muted && !el.hasAttribute('muted'); })
      .map(function (el) { return { el: el }; });
  });

  /* --- players de vídeo incorporados (YouTube, Vimeo e afins) --- */

  var PLAYERS_VIDEO = /(youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com|vimeo\.com|dailymotion\.com|loom\.com|wistia\.(net|com)|pandavideo|streamable\.com|brightcove|twitch\.tv|rutube|odysee|vturb|vidyard)/i;

  function iframesDeVideo() {
    return $$('iframe,embed,object').filter(function (el) {
      var src = el.getAttribute('src') || el.getAttribute('data') || '';
      return PLAYERS_VIDEO.test(src);
    });
  }

  checa({
    id: 'embed-video-sem-alternativa', sev: 'serio', cat: 'midia', wcag: '1.2.2 Legendas (A) / 1.2.3 Audiodescrição ou alternativa (A)',
    titulo: 'Vídeo incorporado sem transcrição nem indicação de legenda',
    afeta: ['auditiva', 'cegos', 'cognitiva'], leitor: true,
    porque: 'Incorporar um player não garante legenda: a legenda vive no serviço de vídeo, não na página. E atenção a um ponto que costuma passar batido — a legenda gerada automaticamente pelo YouTube NÃO cumpre o critério. Ela erra nomes próprios, termos técnicos e pontuação, e não identifica quem está falando. Para a norma, legenda vale quando é revisada por pessoa.',
    corrigir: 'Publique a transcrição na própria página, logo abaixo do vídeo (um <details> resolve bem), e revise a legenda no serviço de vídeo. Em aula gravada, a transcrição também ajuda quem prefere ler, quem tem internet ruim e a busca do site.',
    exemplo: '<iframe src="https://www.youtube-nocookie.com/embed/ID?cc_load_policy=1&amp;cc_lang_pref=pt"\n        title="Encontro 1: fundamentos de teste"></iframe>\n<details>\n  <summary>Transcrição do Encontro 1</summary>\n  <p>[00:00] Boa noite, pessoal...</p>\n</details>'
  }, function () {
    var videos = iframesDeVideo();
    if (!videos.length) return [];
    var textoDaPagina = norm(D.body ? (D.body.innerText || D.body.textContent) : '');
    if (/transcri[çc]|legenda|closed caption|libras|audiodescri|áudio ?descri/i.test(textoDaPagina)) return [];
    return videos.map(function (el) {
      return { el: el, det: norm(el.getAttribute('title') || el.getAttribute('src') || '').slice(0, 80) };
    });
  });

  checa({
    id: 'embed-video-autoplay', sev: 'serio', cat: 'midia', wcag: '1.4.2 Controle de áudio (A)',
    titulo: 'Vídeo incorporado começa a tocar sozinho com som',
    afeta: ['cegos', 'cognitiva', 'auditiva'], leitor: true,
    porque: 'O som sobe por cima da voz do leitor de tela e a pessoa precisa caçar a pausa sem conseguir ouvir a própria navegação.',
    corrigir: 'Remova autoplay=1 da URL do player. Se a reprodução automática for mesmo necessária, acrescente mute=1 e ofereça um controle de pausa visível antes do vídeo.',
    exemplo: '<!-- evite --> src="...?autoplay=1"\n<!-- se precisar --> src="...?autoplay=1&amp;mute=1"'
  }, function () {
    return iframesDeVideo().filter(function (el) {
      var src = el.getAttribute('src') || '';
      return /[?&]autoplay=1/.test(src) && !/[?&]mute=1/.test(src);
    }).map(function (el) { return { el: el, det: norm(el.getAttribute('src')).slice(-70) }; });
  });

  checa({
    id: 'embed-video-legenda-desligada', sev: 'aviso', cat: 'midia', wcag: 'Boa prática (1.2.2 relacionado)',
    titulo: 'Player do YouTube sem legenda ligada por padrão',
    afeta: ['auditiva', 'cognitiva'], leitor: false,
    porque: 'Quando existe legenda revisada, ligá-la por padrão poupa a pessoa de abrir o menu do player a cada vídeo — e beneficia também quem assiste sem som.',
    corrigir: 'Acrescente cc_load_policy=1 e cc_lang_pref=pt à URL do embed. Vale padronizar todos os embeds do site com os mesmos parâmetros.',
    exemplo: 'src="https://www.youtube-nocookie.com/embed/ID?cc_load_policy=1&amp;cc_lang_pref=pt&amp;rel=0"'
  }, function () {
    return iframesDeVideo().filter(function (el) {
      var src = el.getAttribute('src') || '';
      return /youtube(-nocookie)?\.com|youtu\.be/i.test(src) && !/[?&]cc_load_policy=1/.test(src);
    }).map(function (el) { return { el: el, det: norm(el.getAttribute('title') || el.getAttribute('src')).slice(0, 80) }; });
  });

  checa({
    id: 'embed-video-sem-tela-cheia', sev: 'moderado', cat: 'midia', wcag: '1.4.4 Redimensionar texto (AA) / 1.4.10 Refluxo (AA)',
    titulo: 'Vídeo incorporado sem permissão de tela cheia',
    afeta: ['baixavisao'], cor: true,
    porque: 'Tela cheia é o principal recurso de ampliação de quem tem baixa visão para assistir a um vídeo, sobretudo quando há código ou texto pequeno na gravação. Sem allowfullscreen, o botão do player não funciona.',
    corrigir: 'Adicione o atributo allowfullscreen (e "fullscreen" na lista do atributo allow).',
    exemplo: '<iframe src="..." title="..." allowfullscreen allow="fullscreen; picture-in-picture"></iframe>'
  }, function () {
    return iframesDeVideo().filter(function (el) {
      if (el.nodeName !== 'IFRAME') return false;
      var permite = (el.getAttribute('allow') || '').toLowerCase();
      return !el.hasAttribute('allowfullscreen') && permite.indexOf('fullscreen') === -1;
    }).map(function (el) { return { el: el, det: norm(el.getAttribute('title') || '').slice(0, 70) }; });
  });

  checa({
    id: 'embed-video-tamanho-fixo', sev: 'moderado', cat: 'zoom', wcag: '1.4.10 Refluxo (AA)',
    titulo: 'Vídeo incorporado com tamanho fixo, sem se adaptar à largura',
    afeta: ['baixavisao', 'motora'], cor: true,
    porque: 'Um player preso a uma largura em pixels estoura a tela quando a pessoa amplia a página ou abre no celular, e o conteúdo passa a exigir rolagem horizontal.',
    corrigir: 'Deixe o player ocupar 100% de um contêiner com proporção fixa. Duas linhas de CSS resolvem, sem depender de truque de padding.',
    exemplo: '.moldura-video { aspect-ratio: 16 / 9; inline-size: 100%; }\n.moldura-video > iframe { inline-size: 100%; block-size: 100%; border: 0; }'
  }, function () {
    return iframesDeVideo().filter(function (el) {
      if (oculto(el)) return false;
      var cs = gcs(el);
      if (!cs) return false;
      var pai = el.parentElement;
      var csPai = pai ? gcs(pai) : null;
      var temProporcao = (cs.aspectRatio && cs.aspectRatio !== 'auto') || (csPai && csPai.aspectRatio && csPai.aspectRatio !== 'auto');
      if (temProporcao) return false;
      if (cs.maxWidth && cs.maxWidth !== 'none') return false;
      var larguraFixa = /^\d+(px)?$/.test(el.getAttribute('width') || '') || /px$/.test(cs.width || '');
      if (!larguraFixa) return false;
      var r = ret(el);
      return r.width > D.documentElement.clientWidth * 0.92;
    }).map(function (el) {
      var r = ret(el);
      return { el: el, det: Math.round(r.width) + ' px de largura fixa contra ' + D.documentElement.clientWidth + ' px de janela' };
    });
  });

  checa({
    id: 'object-sem-alternativa', sev: 'serio', cat: 'midia', wcag: '1.1.1 Conteúdo não textual (A)',
    titulo: '<object> ou <embed> sem conteúdo alternativo',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Se o conteúdo incorporado não carregar — ou se a tecnologia assistiva não conseguir entrar nele — não sobra nada. O <object> aceita conteúdo alternativo no próprio corpo; o <embed> depende de um nome acessível.',
    corrigir: 'Coloque dentro do <object> um texto com link para o material equivalente. No <embed>, declare title ou aria-label descritivo.',
    exemplo: '<object data="aula.pdf" type="application/pdf">\n  <p>Baixe o <a href="aula.pdf">material do encontro 1 em PDF</a>.</p>\n</object>'
  }, function () {
    var saida = [];
    $$('object').forEach(function (el) {
      if (ariaOculto(el)) return;
      if (!norm(el.textContent) && !el.children.length && !nomeAcessivel(el).nome) saida.push({ el: el, det: 'sem conteúdo alternativo no corpo' });
    });
    $$('embed').forEach(function (el) {
      if (ariaOculto(el)) return;
      if (!norm(el.getAttribute('title')) && !norm(el.getAttribute('aria-label'))) saida.push({ el: el, det: 'sem title nem aria-label' });
    });
    return saida;
  });

  checa({
    id: 'animacao-infinita', sev: 'serio', cat: 'midia', wcag: '2.2.2 Pausar, parar, ocultar (A)',
    titulo: 'Animação em repetição infinita sem controle de pausa',
    afeta: ['cognitiva', 'baixavisao'], leitor: false,
    porque: 'Movimento contínuo por mais de cinco segundos dificulta a concentração e a leitura do conteúdo ao redor, e pode causar desconforto físico em pessoas com sensibilidade vestibular.',
    corrigir: 'Ofereça um botão de pausar, limite a animação a cinco segundos ou condicione-a a prefers-reduced-motion.',
    exemplo: '@media (prefers-reduced-motion: no-preference) {\n  .carrossel { animation: girar 20s linear infinite; }\n}'
  }, function () {
    var saida = [];
    VISIVEIS.slice(0, 2500).forEach(function (el) {
      var cs = gcs(el);
      if (!cs) return;
      if (cs.animationName && cs.animationName !== 'none' && /infinite/.test(cs.animationIterationCount || '')) {
        var dur = parseFloat(cs.animationDuration) || 0;
        saida.push({ el: el, det: 'animation: ' + cs.animationName + ', duração ' + cs.animationDuration + ', infinita' });
      }
    });
    return saida.slice(0, 12);
  });

  checa({
    id: 'sem-reduced-motion', sev: 'moderado', cat: 'midia', wcag: '2.3.3 Animação a partir de interações (AAA) / boa prática AA',
    titulo: 'Página com animações e sem suporte a prefers-reduced-motion',
    afeta: ['cognitiva', 'baixavisao'], leitor: false,
    porque: 'Há pessoas que configuram o sistema para reduzir movimento por causa de enxaqueca, tontura ou desconforto vestibular. Quando o site ignora essa preferência, o ajuste que ela fez no sistema não tem efeito nenhum.',
    corrigir: 'Adicione uma consulta de mídia que desliga ou reduz animações e transições quando a preferência estiver ativa.',
    exemplo: '@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: .01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: .01ms !important;\n    scroll-behavior: auto !important;\n  }\n}'
  }, function () {
    var temAnimacao = VISIVEIS.slice(0, 2000).some(function (el) {
      var cs = gcs(el);
      if (!cs) return false;
      return (cs.animationName && cs.animationName !== 'none') || (parseFloat(cs.transitionDuration) > 0.05);
    });
    if (!temAnimacao) return [];
    var temConsulta = /prefers-reduced-motion/i.test(cssTexto) || regras.some(function (r) {
      try { return r.conditionText && /prefers-reduced-motion/i.test(r.conditionText); } catch (e) { return false; }
    });
    return temConsulta ? [] : [{ sel: '(folhas de estilo)', det: 'animações ou transições detectadas, nenhuma consulta prefers-reduced-motion encontrada' }];
  });

  /* ================================================================== */
  /* BOAS PRATICAS EXTRAS                                                */
  /* ================================================================== */

  checa({
    id: 'sem-charset', sev: 'aviso', cat: 'extras', wcag: 'Boa prática',
    titulo: 'Página sem declaração de codificação de caracteres',
    afeta: ['todos'], leitor: false,
    porque: 'Sem charset declarado, acentos e cedilhas podem chegar corrompidos ao leitor de tela, que então lê símbolos soltos em vez das palavras.',
    corrigir: 'Declare <meta charset="utf-8"> como primeiro elemento do <head>.',
    exemplo: '<head>\n  <meta charset="utf-8">\n  ...'
  }, function () {
    return $$('meta[charset],meta[http-equiv="Content-Type"]').length ? [] : [{ sel: 'head', det: 'nenhum meta charset' }];
  });

  checa({
    id: 'fonte-em-px', sev: 'aviso', cat: 'extras', wcag: '1.4.4 Redimensionar texto (AA)',
    titulo: 'Tamanhos de fonte declarados em px',
    afeta: ['baixavisao'], cor: true,
    porque: 'Quem aumenta o tamanho padrão da fonte nas configurações do navegador não vê efeito em textos fixados em px. A preferência que a pessoa configurou é silenciosamente ignorada.',
    corrigir: 'Declare tamanhos de fonte em rem ou em, deixando px para bordas e sombras.',
    exemplo: 'body { font-size: 1rem; }\nh1   { font-size: 2rem; }'
  }, function () {
    var qtd = 0, exemplos = [];
    regrasDeEstilo().forEach(function (r) {
      var fs = r.style.fontSize;
      if (fs && /px$/.test(norm(fs))) {
        qtd++;
        if (exemplos.length < 6) exemplos.push({ sel: r.selectorText.slice(0, 70), cod: r.selectorText.slice(0, 60) + ' { font-size: ' + fs + ' }', det: '' });
      }
    });
    if (qtd < 3) return [];
    exemplos.unshift({ sel: '(folhas de estilo)', det: qtd + ' regras declaram font-size em px' });
    return exemplos;
  });

  checa({
    id: 'form-sem-botao-envio', sev: 'aviso', cat: 'extras', wcag: '3.2.2 Em entrada (A) / boa prática',
    titulo: 'Formulário sem botão de envio explícito',
    afeta: ['teclado', 'cegos', 'cognitiva'], leitor: true,
    porque: 'Formulários que só enviam ao apertar Enter ou ao sair do campo deixam quem navega pelo teclado sem um ponto claro de conclusão, e não avisam que o envio aconteceu.',
    corrigir: 'Inclua um <button type="submit"> visível. Se o envio for automático, avise antes e anuncie o resultado em uma região viva.',
    exemplo: '<form>\n  ...\n  <button type="submit">Enviar solicitação</button>\n</form>'
  }, function () {
    return $$('form').filter(function (el) {
      if (oculto(el)) return false;
      if ($$(CAMPOS, el).length < 1) return false;
      return !el.querySelector('button:not([type="button"]),input[type="submit"],input[type="image"],[role="button"][type="submit"]');
    }).map(function (el) { return { el: el }; });
  });

  checa({
    id: 'titulo-secao-por-estilo', sev: 'aviso', cat: 'extras', wcag: '1.3.1 Informação e relações (A)',
    titulo: 'Texto com aparência de título que não é um cabeçalho',
    afeta: ['cegos', 'cognitiva'], leitor: true,
    porque: 'Se o texto parece um título mas está em <div> ou <p>, ele não entra na lista de cabeçalhos do leitor de tela. A estrutura que a pessoa vidente enxerga não existe para quem navega por áudio.',
    corrigir: 'Use h1 a h6 conforme a hierarquia real do conteúdo e controle o tamanho pelo CSS.',
    exemplo: '<h2 class="titulo-grande">Documentos pendentes</h2>'
  }, function () {
    var saida = [];
    COM_TEXTO.forEach(function (item) {
      var el = item.el;
      if (/^(H[1-6]|LABEL|LEGEND|BUTTON|A|SUMMARY|TH|CAPTION|FIGCAPTION)$/.test(el.nodeName)) return;
      if (el.getAttribute('role') === 'heading') return;
      if (el.closest('h1,h2,h3,h4,h5,h6,button,a,label')) return;
      var cs = gcs(el);
      if (!cs) return;
      var fs = parseFloat(cs.fontSize) || 16;
      var peso = parseInt(cs.fontWeight, 10) || 400;
      var t = item.texto;
      if (t.length > 70 || t.length < 10) return;
      if (t.indexOf(' ') === -1) return;                 /* palavra unica: costuma ser numero de destaque */
      if (/[.!?]\s/.test(t) || /[.!?]$/.test(t)) return;  /* frase completa nao e titulo */
      if (/^[\d\s.,%+/-]+$/.test(t)) return;             /* metrica, nao titulo */
      if (fs >= 22 && peso >= 600 && el.children.length === 0) {
        saida.push({ el: el, det: fs + 'px, peso ' + peso + ': "' + t.slice(0, 50) + '"' });
      }
    });
    return saida.slice(0, 12);
  });

  /* ================================================================== */
  /* SUGESTAO DE COR CORRIGIDA                                           */
  /* ================================================================== */

  function sugereCor(fgHex, bgHex, alvo) {
    var fg = parseCor(fgHex), bg = parseCor(bgHex);
    if (!fg || !bg) return null;
    /* tenta escurecer e clarear: em fundos de luminancia media, so um dos lados alcanca o alvo */
    var candidatos = [];
    [[0, 0, 0], [255, 255, 255]].forEach(function (destino) {
      var lo = 0, hi = 1, melhor = null, ajuste = 1;
      for (var i = 0; i < 22; i++) {
        var t = (lo + hi) / 2;
        var c = [
          Math.round(fg[0] + (destino[0] - fg[0]) * t),
          Math.round(fg[1] + (destino[1] - fg[1]) * t),
          Math.round(fg[2] + (destino[2] - fg[2]) * t)
        ];
        if (contraste(c, bg) >= alvo) { melhor = c; ajuste = t; hi = t; } else { lo = t; }
      }
      if (melhor) candidatos.push({ cor: melhor, ajuste: ajuste });
    });
    if (!candidatos.length) return null;
    candidatos.sort(function (a, b) { return a.ajuste - b.ajuste; });
    return hex(candidatos[0].cor);
  }

  /* ================================================================== */
  /* MONTAGEM DO RELATORIO                                               */
  /* ================================================================== */

  var ROTULO_SEV = { critico: 'Crítico', serio: 'Sério', moderado: 'Moderado', aviso: 'Aviso' };
  var SIGLA_SEV = { critico: 'C', serio: 'S', moderado: 'M', aviso: 'A' };
  var ORDEM_SEV = { critico: 0, serio: 1, moderado: 2, aviso: 3 };

  achados.sort(function (a, b) {
    if (ORDEM_SEV[a.sev] !== ORDEM_SEV[b.sev]) return ORDEM_SEV[a.sev] - ORDEM_SEV[b.sev];
    return (b.qtd || 0) - (a.qtd || 0);
  });

  var contagem = { critico: 0, serio: 0, moderado: 0, aviso: 0 };
  var ocorrencias = { critico: 0, serio: 0, moderado: 0, aviso: 0 };
  achados.forEach(function (a) { contagem[a.sev]++; ocorrencias[a.sev] += a.qtd; });

  var penalidade = contagem.critico * 10 + contagem.serio * 5 + contagem.moderado * 2 + contagem.aviso * 0.5;
  var nota = Math.max(0, Math.min(100, Math.round(100 * 60 / (60 + penalidade))));
  var totalOcorrencias = ocorrencias.critico + ocorrencias.serio + ocorrencias.moderado + ocorrencias.aviso;
  var duracao = Math.round(((window.performance && performance.now ? performance.now() : Date.now()) - t0));

  function badge(sev) {
    return '<span class="sev sev-' + sev + '"><span class="sev-sigla" aria-hidden="true">' + SIGLA_SEV[sev] + '</span>' + ROTULO_SEV[sev] + '</span>';
  }

  function listaAfeta(a) {
    return (a.afeta || []).map(function (k) { return '<li>' + esc(AFETA[k] || k) + '</li>'; }).join('');
  }

  function blocoAchado(a, idx) {
    var itens = a.itens.map(function (it) {
      return '<li><code class="sel">' + esc(it.sel) + '</code>' +
        (it.det ? '<span class="det">' + esc(it.det) + '</span>' : '') +
        (it.cod ? '<pre class="cod"><code>' + esc(it.cod) + '</code></pre>' : '') +
        '</li>';
    }).join('');
    var extra = a.qtd > a.itens.length ? '<p class="mais">Mostrando ' + a.itens.length + ' de ' + a.qtd + ' ocorrências.</p>' : '';
    return '<article class="achado sev-borda-' + a.sev + '" data-sev="' + a.sev + '" data-cat="' + a.cat + '" id="a-' + esc(a.id) + '">' +
      '<h3 class="achado-titulo">' + badge(a.sev) + '<span>' + esc(a.titulo) + '</span></h3>' +
      '<p class="meta"><span class="pilula">' + a.qtd + (a.qtd === 1 ? ' ocorrência' : ' ocorrências') + '</span>' +
      '<span class="pilula">' + esc(CATS[a.cat] || a.cat) + '</span>' +
      '<span class="pilula">WCAG ' + esc(a.wcag) + '</span></p>' +
      '<div class="grade-exp">' +
      '<section><h4>Por que isso cria uma barreira</h4><p>' + esc(a.porque) + '</p>' +
      '<h4>Quem encontra a barreira</h4><ul class="afeta">' + listaAfeta(a) + '</ul></section>' +
      '<section><h4>Como corrigir</h4><p>' + esc(a.corrigir) + '</p>' +
      '<h4>Exemplo</h4><pre class="exemplo"><code>' + esc(a.exemplo) + '</code></pre></section>' +
      '</div>' +
      '<details class="ocorrencias"><summary>Ver onde acontece (' + a.qtd + ')</summary><ul class="lista-oc">' + itens + '</ul>' + extra + '</details>' +
      '</article>';
  }

  function blocoResumo(a) {
    return '<li class="resumo-achado sev-borda-' + a.sev + '">' +
      '<p class="resumo-cab">' + badge(a.sev) + '<a href="#a-' + esc(a.id) + '">' + esc(a.titulo) + '</a></p>' +
      '<p class="resumo-det">' + a.qtd + (a.qtd === 1 ? ' ocorrência' : ' ocorrências') + ' · ' + esc(CATS[a.cat] || a.cat) + ' · WCAG ' + esc(a.wcag) + '</p>' +
      '<p class="resumo-det">' + esc(a.corrigir.split('.')[0]) + '.</p>' +
      '</li>';
  }

  /* --- seção especial: leitores de tela --- */
  var achadosLeitor = achados.filter(function (a) { return a.leitor; });
  /* --- seção especial: cor e baixa visão --- */
  var achadosCor = achados.filter(function (a) { return a.cor; });

  /* amostras de contraste únicas para a seção de cor */
  var amostras = [];
  (function () {
    var vistos = {};
    achados.forEach(function (a) {
      (a.itens || []).forEach(function (it) {
        var e = it.extra;
        if (!e || (e.tipo !== 'contraste' && e.tipo !== 'link')) return;
        var chave = e.fg + '|' + e.bg + '|' + e.tipo;
        if (vistos[chave]) return;
        vistos[chave] = 1;
        amostras.push(e);
      });
    });
    amostras.sort(function (x, y) { return x.razao - y.razao; });
    amostras = amostras.slice(0, 14);
  })();

  function blocoAmostra(e) {
    var sugestao = sugereCor(e.fg, e.bg, e.exigido);
    var sims = ['protanopia', 'deuteranopia', 'tritanopia'].map(function (tipo) {
      var f = simulaCor(parseCor(e.fg), tipo), b = simulaCor(parseCor(e.bg), tipo);
      var nomes = { protanopia: 'Protanopia', deuteranopia: 'Deuteranopia', tritanopia: 'Tritanopia' };
      return '<figure class="sim"><div class="quadro" aria-hidden="true" style="background:' + hex(b) + ';color:' + hex(f) + '">Aa</div>' +
        '<figcaption>' + nomes[tipo] + '<br><span class="mono">' + hex(f) + ' / ' + hex(b) + '</span></figcaption></figure>';
    }).join('');
    var legenda = e.tipo === 'link'
      ? 'Par comparado: <strong>cor do link</strong> sobre <strong>cor do texto ao redor</strong> — a norma só aceita distinguir o link apenas pela cor se houver ao menos 3:1 entre as duas.'
      : 'Par comparado: <strong>cor do texto</strong> sobre <strong>cor de fundo</strong>.';
    return '<div class="amostra">' +
      '<p class="resumo-det" style="margin-block-end:8px">' + legenda + '</p>' +
      '<div class="amostra-topo">' +
      '<figure class="sim"><div class="quadro" aria-hidden="true" style="background:' + e.bg + ';color:' + e.fg + '">Aa</div>' +
      '<figcaption>Como está<br><span class="mono">' + e.fg + ' / ' + e.bg + '</span></figcaption></figure>' +
      (sugestao ? '<figure class="sim"><div class="quadro" aria-hidden="true" style="background:' + e.bg + ';color:' + sugestao + '">Aa</div><figcaption>Sugestão<br><span class="mono">' + sugestao + '</span></figcaption></figure>' : '') +
      sims + '</div>' +
      '<p class="amostra-info"><strong>' + e.razao.toFixed(2) + ':1</strong> — mínimo exigido ' + e.exigido.toFixed(1) + ':1' +
      (e.texto ? ' · <span class="det">' + esc(e.texto) + '</span>' : '') +
      (sugestao ? '<br>Trocar <code>' + e.fg + '</code> por <code>' + sugestao + '</code> sobre <code>' + e.bg + '</code> atinge ' + contraste(parseCor(sugestao), parseCor(e.bg)).toFixed(2) + ':1.' : '') +
      '</p></div>';
  }

  /* agrupamento por categoria */
  var porCategoria = {};
  achados.forEach(function (a) { (porCategoria[a.cat] = porCategoria[a.cat] || []).push(a); });

  var htmlCategorias = Object.keys(CATS).filter(function (c) { return porCategoria[c]; }).map(function (c) {
    return '<section class="categoria" aria-labelledby="cat-' + c + '">' +
      '<h3 id="cat-' + c + '">' + esc(CATS[c]) + ' <span class="contador">' + porCategoria[c].length + '</span></h3>' +
      porCategoria[c].map(blocoAchado).join('') + '</section>';
  }).join('');

  /* ------------------------------------------------------------------ */
  /* CSS do relatorio                                                    */
  /* ------------------------------------------------------------------ */

  var CSS = [
    ':root{--bg:#fbfaf8;--sup:#ffffff;--sup2:#f4f2ee;--txt:#1a1a19;--txt2:#54524e;--linha:#e0dcd5;--acento:#08429c;--acento-sup:#e8f0fd;',
    '--crit:#9e1420;--crit-bg:#fdecee;--serio:#8a4600;--serio-bg:#fdf0e3;--mod:#63550a;--mod-bg:#fbf5dd;--aviso:#3c4a57;--aviso-bg:#eef2f6;--ok:#15613c;--ok-bg:#e5f5ec;--controle:#6e6a64;--acao-txt:#ffffff;--raio:10px}',
    '@media (prefers-color-scheme:dark){:root{--bg:#131418;--sup:#1c1e23;--sup2:#24272d;--txt:#eceef1;--txt2:#b2b6bd;--linha:#343841;--acento:#8ab6ff;--acento-sup:#1b2740;',
    '--crit:#ff9ba3;--crit-bg:#3a1a1e;--serio:#ffbe7a;--serio-bg:#3a2612;--mod:#e9d67a;--mod-bg:#332d10;--aviso:#b8c6d4;--aviso-bg:#222a33;--ok:#84d8ab;--ok-bg:#12301f;--controle:#9aa2ad;--acao-txt:#0d1117}}',
    '*,*::before,*::after{box-sizing:border-box}',
    'body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%}',
    '.env{max-inline-size:1120px;margin-inline:auto;padding-inline:20px}',
    'a{color:var(--acento)}a:hover{text-decoration-thickness:2px}',
    ':where(a,button,summary,[tabindex]):focus-visible{outline:3px solid var(--acento);outline-offset:2px;border-radius:4px}',
    '.pular{position:absolute;inset-inline-start:-9999px}.pular:focus{position:static;display:inline-block;margin:8px;padding:8px 14px;background:var(--acento);color:var(--acao-txt);border-radius:6px}',
    'header.topo{background:var(--sup);border-block-end:1px solid var(--linha);padding-block:28px 22px}',
    'header.topo h1{margin:0 0 6px;font-size:1.65rem;line-height:1.25}',
    '.alvo{margin:0;color:var(--txt2);font-size:.95rem;word-break:break-word}',
    '.alvo strong{color:var(--txt)}',
    '.selo{display:inline-block;margin-block-end:10px;padding:3px 10px;border:1px solid var(--linha);border-radius:999px;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--txt2)}',
    'main{padding-block:28px 60px}',
    'section.bloco{margin-block-end:44px}',
    'h2{font-size:1.3rem;margin:0 0 6px;padding-block-end:8px;border-block-end:2px solid var(--linha)}',
    'h3{font-size:1.08rem;margin:26px 0 10px}',
    'h4{font-size:.83rem;margin:14px 0 4px;text-transform:uppercase;letter-spacing:.06em;color:var(--txt2)}',
    'p{margin:0 0 10px}',
    'main p,.destaque p,.manual li,dl.glos dd,.alvo{max-inline-size:78ch}',
    '.resumo{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-block:18px}',
    '.cartao{background:var(--sup);border:1px solid var(--linha);border-radius:var(--raio);padding:16px}',
    '.cartao .num{display:block;font-size:2rem;font-weight:700;line-height:1.1}',
    '.cartao .rot{font-size:.85rem;color:var(--txt2)}',
    '.cartao.c-critico{border-inline-start:6px solid var(--crit)}.cartao.c-critico .num{color:var(--crit)}',
    '.cartao.c-serio{border-inline-start:6px solid var(--serio)}.cartao.c-serio .num{color:var(--serio)}',
    '.cartao.c-moderado{border-inline-start:6px solid var(--mod)}.cartao.c-moderado .num{color:var(--mod)}',
    '.cartao.c-aviso{border-inline-start:6px solid var(--aviso)}.cartao.c-aviso .num{color:var(--aviso)}',
    '.cartao.c-ok{border-inline-start:6px solid var(--ok)}.cartao.c-ok .num{color:var(--ok)}',
    '.indice{display:flex;flex-wrap:wrap;gap:18px;align-items:center;background:var(--sup);border:1px solid var(--linha);border-radius:var(--raio);padding:18px 20px}',
    '.indice .valor{font-size:2.6rem;font-weight:700;line-height:1}',
    '.indice .barra{flex:1 1 220px;min-inline-size:180px;block-size:14px;background:var(--sup2);border-radius:999px;overflow:hidden;border:1px solid var(--linha)}',
    '.indice .barra i{display:block;block-size:100%;background:var(--acento)}',
    '.sev{display:inline-flex;align-items:center;gap:6px;padding:2px 9px;border-radius:999px;font-size:.76rem;font-weight:700;letter-spacing:.02em;white-space:nowrap;border:1px solid currentColor}',
    '.sev-sigla{display:inline-grid;place-items:center;inline-size:16px;block-size:16px;border-radius:50%;background:currentColor;color:var(--sup);font-size:.62rem}',
    '.sev-critico{color:var(--crit);background:var(--crit-bg)}.sev-serio{color:var(--serio);background:var(--serio-bg)}',
    '.sev-moderado{color:var(--mod);background:var(--mod-bg)}.sev-aviso{color:var(--aviso);background:var(--aviso-bg)}',
    '.filtros{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-block:16px;padding:12px;background:var(--sup);border:1px solid var(--linha);border-radius:var(--raio)}',
    '.filtros button{font:inherit;font-size:.85rem;padding:7px 13px;min-block-size:32px;border:1px solid var(--controle);background:var(--sup2);color:var(--txt);border-radius:999px;cursor:pointer}',
    '.filtros button[aria-pressed="true"]{background:var(--acento);color:var(--acao-txt);border-color:var(--acento);font-weight:700}',
    '.filtros button[aria-pressed="true"]::before{content:"\\2713\\00a0"}',
    '.achado{background:var(--sup);border:1px solid var(--linha);border-radius:var(--raio);padding:18px 20px;margin-block-end:16px}',
    '.sev-borda-critico{border-inline-start:6px solid var(--crit)}.sev-borda-serio{border-inline-start:6px solid var(--serio)}',
    '.sev-borda-moderado{border-inline-start:6px solid var(--mod)}.sev-borda-aviso{border-inline-start:6px solid var(--aviso)}',
    '.achado-titulo{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 8px;font-size:1.05rem}',
    '.meta{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}',
    '.pilula{font-size:.74rem;color:var(--txt2);background:var(--sup2);border:1px solid var(--linha);border-radius:999px;padding:2px 9px}',
    '.grade-exp{display:grid;gap:6px 28px;grid-template-columns:repeat(auto-fit,minmax(290px,1fr))}',
    '.afeta{margin:4px 0 0;padding-inline-start:20px}.afeta li{margin-block-end:2px}',
    'pre{margin:6px 0 0;padding:11px 13px;background:var(--sup2);border:1px solid var(--linha);border-radius:8px;overflow-x:auto;font-size:.82rem;line-height:1.5}',
    'code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
    '.exemplo code{white-space:pre}',
    'details.ocorrencias{margin-block-start:14px;border-block-start:1px dashed var(--linha);padding-block-start:10px}',
    'summary{cursor:pointer;font-weight:600;font-size:.9rem;padding:4px 0}',
    '.lista-oc{list-style:none;margin:10px 0 0;padding:0}',
    '.lista-oc>li{padding:9px 0;border-block-end:1px solid var(--linha)}',
    '.lista-oc>li:last-child{border-block-end:0}',
    '.sel{display:inline-block;background:var(--acento-sup);color:var(--txt);padding:2px 7px;border-radius:5px;font-size:.8rem;word-break:break-all}',
    '.det{display:block;color:var(--txt2);font-size:.85rem;margin-block-start:3px}',
    '.cod{font-size:.78rem}',
    '.mais{font-size:.85rem;color:var(--txt2);margin-block-start:8px}',
    '.contador{font-size:.78rem;background:var(--sup2);border:1px solid var(--linha);border-radius:999px;padding:1px 9px;vertical-align:middle;color:var(--txt2)}',
    '.lista-resumo{list-style:none;padding:0;margin:12px 0 0}',
    '.resumo-achado{background:var(--sup);border:1px solid var(--linha);border-radius:8px;padding:11px 14px;margin-block-end:8px}',
    '.resumo-cab{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 4px;font-weight:600}',
    '.resumo-det{margin:0;font-size:.85rem;color:var(--txt2)}',
    '.destaque{background:var(--sup);border:1px solid var(--linha);border-inline-start:6px solid var(--acento);border-radius:var(--raio);padding:16px 20px;margin-block:16px}',
    '.amostra{background:var(--sup);border:1px solid var(--linha);border-radius:var(--raio);padding:14px 16px;margin-block-end:14px}',
    '.amostra-topo{display:flex;flex-wrap:wrap;gap:12px}',
    '.sim{margin:0;text-align:center;font-size:.78rem;color:var(--txt2)}',
    '.sim .quadro{inline-size:82px;block-size:52px;display:grid;place-items:center;font-size:1.15rem;font-weight:700;border:1px solid var(--linha);border-radius:8px;margin-block-end:4px}',
    '.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.78rem;word-break:break-all}',
    '.amostra-info{margin:10px 0 0;font-size:.88rem}',
    'table.tab{inline-size:100%;border-collapse:collapse;font-size:.9rem;background:var(--sup);border:1px solid var(--linha);border-radius:var(--raio);overflow:hidden}',
    'table.tab caption{text-align:start;font-weight:600;padding-block-end:8px}',
    'table.tab th,table.tab td{padding:9px 12px;text-align:start;border-block-end:1px solid var(--linha)}',
    'table.tab th{background:var(--sup2);font-size:.78rem;text-transform:uppercase;letter-spacing:.05em}',
    '.aprovadas{columns:2 290px;column-gap:28px;list-style:none;padding:0;margin:10px 0 0}',
    '.aprovadas li{break-inside:avoid;padding:4px 0 4px 24px;position:relative;font-size:.9rem;color:var(--txt2)}',
    '.aprovadas li::before{content:"OK";position:absolute;inset-inline-start:0;font-size:.62rem;font-weight:700;color:var(--ok);background:var(--ok-bg);border-radius:4px;padding:1px 4px;top:6px}',
    '.manual{list-style:none;padding:0;margin:10px 0 0}',
    '.manual li{background:var(--sup);border:1px solid var(--linha);border-radius:8px;padding:11px 14px;margin-block-end:8px}',
    '.manual b{display:block;margin-block-end:2px}',
    'dl.glos{margin:10px 0 0}dl.glos dt{font-weight:700;margin-block-start:12px}dl.glos dd{margin:2px 0 0 0;color:var(--txt2)}',
    '.acoes{position:sticky;inset-block-end:0;background:var(--sup);border-block-start:1px solid var(--linha);padding:12px 0;margin-block-start:30px;z-index:5}',
    '.acoes .env{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}',
    '.btn{font:inherit;font-weight:600;padding:9px 18px;min-block-size:40px;border-radius:8px;border:1px solid var(--acento);background:var(--acento);color:var(--acao-txt);cursor:pointer}',
    '.btn.sec{background:var(--sup2);color:var(--txt);border-color:var(--controle)}',
    'footer.rodape{color:var(--txt2);font-size:.85rem;padding-block:20px 40px}',
    '.sumario{display:flex;flex-wrap:wrap;gap:8px;margin-block:14px;padding:0;list-style:none}',
    '.sumario a{display:inline-block;font-size:.85rem;padding:5px 12px;background:var(--sup);border:1px solid var(--linha);border-radius:999px;text-decoration:none}',
    '.sumario a:hover{background:var(--acento-sup)}',
    '.sumario a,.pilula,.sev,.det,.cartao .rot,.aprovadas li,.resumo-det,.amostra-info,.mais,.contador,.sim,.mono,h4,summary,pre,footer.rodape,.filtros button,.filtros p{font-size:max(.79rem,12.6px)}',
    '@media print{body{background:#fff}.acoes,.filtros,.sumario,.pular{display:none}.achado,.cartao,.amostra{break-inside:avoid;border:1px solid #999}details{display:block}details>summary{display:none}}',
    '@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}'
  ].join('');

  /* ------------------------------------------------------------------ */
  /* script embutido no relatorio                                        */
  /* ------------------------------------------------------------------ */

  var JS_REL = [
    '(function(){',
    'var achados=[].slice.call(document.querySelectorAll(".achado"));',
    'var filtros=[].slice.call(document.querySelectorAll("[data-filtro]"));',
    'function aplica(){',
    ' var ativos=filtros.filter(function(b){return b.getAttribute("aria-pressed")==="true";}).map(function(b){return b.dataset.filtro;});',
    ' achados.forEach(function(a){a.hidden=ativos.length?ativos.indexOf(a.dataset.sev)===-1:false;});',
    ' document.querySelectorAll(".categoria").forEach(function(s){',
    '  var vis=[].slice.call(s.querySelectorAll(".achado")).some(function(a){return !a.hidden;});s.hidden=!vis;});',
    ' var n=achados.filter(function(a){return !a.hidden;}).length;',
    ' document.getElementById("contagem-visivel").textContent=n+(n===1?" achado exibido":" achados exibidos");',
    '}',
    'filtros.forEach(function(b){b.addEventListener("click",function(){',
    ' b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")==="true"?"false":"true");aplica();});});',
    'var limpar=document.getElementById("limpar-filtros");',
    'if(limpar)limpar.addEventListener("click",function(){filtros.forEach(function(b){b.setAttribute("aria-pressed","false");});aplica();});',
    'var abrir=document.getElementById("abrir-tudo");',
    'if(abrir)abrir.addEventListener("click",function(){',
    ' var abertos=abrir.dataset.estado==="1";',
    ' document.querySelectorAll("details").forEach(function(d){d.open=!abertos;});',
    ' abrir.dataset.estado=abertos?"0":"1";',
    ' abrir.textContent=abertos?"Expandir todas as ocorrencias":"Recolher todas as ocorrencias";});',
    'var baixar=document.getElementById("baixar");',
    'if(baixar)baixar.addEventListener("click",function(){',
    ' try{',
    '  var doc="<!DOCTYPE html>\\n"+document.documentElement.outerHTML;',
    '  var b=new Blob([doc],{type:"text/html;charset=utf-8"});',
    '  var u=URL.createObjectURL(b);var a=document.createElement("a");',
    '  a.href=u;a.download=document.body.dataset.arquivo||"relatorio-acessibilidade.html";',
    '  document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},4000);',
    ' }catch(e){alert("Nao foi possivel baixar automaticamente. Use Ctrl+S / Cmd+S para salvar esta pagina.");}});',
    'aplica();',
    '})();'
  ].join('');

  /* ------------------------------------------------------------------ */
  /* textos das secoes                                                   */
  /* ------------------------------------------------------------------ */

  var agora = new Date();
  function doisDig(n) { return (n < 10 ? '0' : '') + n; }
  var carimbo = doisDig(agora.getDate()) + '/' + doisDig(agora.getMonth() + 1) + '/' + agora.getFullYear() +
    ' às ' + doisDig(agora.getHours()) + ':' + doisDig(agora.getMinutes());
  var carimboArquivo = agora.getFullYear() + '-' + doisDig(agora.getMonth() + 1) + '-' + doisDig(agora.getDate()) +
    '-' + doisDig(agora.getHours()) + doisDig(agora.getMinutes());
  var host = (location.hostname || 'pagina').replace(/[^a-z0-9.-]/gi, '');
  var nomeArquivo = 'acessibilidade-' + host + '-' + carimboArquivo + '.html';

  var HTML_SUMARIO = [
    '<nav aria-label="Seções do relatório"><ul class="sumario">',
    '<li><a href="#resumo">Resumo</a></li>',
    '<li><a href="#leitores">Leitores de tela</a></li>',
    '<li><a href="#cores">Cores e baixa visão</a></li>',
    '<li><a href="#ocorrencias">Todas as ocorrências</a></li>',
    '<li><a href="#aprovadas">Verificações aprovadas</a></li>',
    '<li><a href="#manual">O que só o teste manual vê</a></li>',
    '<li><a href="#glossario">Glossário</a></li>',
    '<li><a href="#referencias">Referências</a></li>',
    '</ul></nav>'
  ].join('');

  var HTML_RESUMO = [
    '<section class="bloco" id="resumo" aria-labelledby="h-resumo">',
    '<h2 id="h-resumo">Resumo da varredura</h2>',
    '<div class="indice">',
    '<div><span class="valor">' + nota + '</span><span class="rot"> / 100</span><br><span class="rot">índice estimado</span></div>',
    '<div class="barra"><i style="inline-size:' + nota + '%"></i></div>',
    '<p style="margin:0;flex:1 1 260px;font-size:.9rem;color:var(--txt2)">O índice é um indicador interno de priorização, calculado a partir do peso das verificações reprovadas. Ele <strong>não</strong> mede conformidade legal nem substitui uma auditoria com pessoas usuárias.</p>',
    '</div>',
    '<div class="resumo">',
    '<div class="cartao c-critico"><span class="num">' + contagem.critico + '</span><span class="rot">verificações críticas reprovadas<br>(' + ocorrencias.critico + ' ocorrências)</span></div>',
    '<div class="cartao c-serio"><span class="num">' + contagem.serio + '</span><span class="rot">sérias<br>(' + ocorrencias.serio + ' ocorrências)</span></div>',
    '<div class="cartao c-moderado"><span class="num">' + contagem.moderado + '</span><span class="rot">moderadas<br>(' + ocorrencias.moderado + ' ocorrências)</span></div>',
    '<div class="cartao c-aviso"><span class="num">' + contagem.aviso + '</span><span class="rot">avisos e boas práticas<br>(' + ocorrencias.aviso + ' ocorrências)</span></div>',
    '<div class="cartao c-ok"><span class="num">' + aprovadas.length + '</span><span class="rot">verificações aprovadas<br>(de ' + totalVerif + ' executadas)</span></div>',
    '</div>',
    '<div class="destaque">',
    '<h3 style="margin-top:0">Como ler este relatório</h3>',
    '<p>Cada bloco abaixo é uma <strong>verificação</strong>, não uma ocorrência isolada. Uma verificação reprovada pode apontar dezenas de elementos com o mesmo problema — e normalmente todos se resolvem no mesmo lugar do código ou do componente.</p>',
    '<p>A ordem sugerida de trabalho é: <strong>Crítico</strong> (impede o uso), <strong>Sério</strong> (dificulta muito), <strong>Moderado</strong> (atrito relevante) e <strong>Aviso</strong> (boa prática, ganho de qualidade).</p>',
    '<p><strong>Limite importante:</strong> testes automáticos identificam, na média de mercado, algo entre um terço e metade das barreiras reais. Eles não avaliam se o texto alternativo faz sentido, se a ordem de leitura é lógica, se a linguagem é compreensível ou se o fluxo funciona de ponta a ponta com um leitor de tela. Trate este relatório como ponto de partida de uma avaliação, nunca como o laudo final.</p>',
    '</div>',
    '<div class="destaque">',
    '<h3 style="margin-top:0">Sobre a linguagem usada aqui</h3>',
    '<p>Este relatório descreve <em>barreiras criadas pela página</em>, não limitações das pessoas. A deficiência aparece na interação entre a pessoa e um ambiente que não foi projetado para ela — quando a página melhora, a barreira deixa de existir.</p>',
    '<p>Usamos as formas recomendadas pela Lei Brasileira de Inclusão: "pessoa com deficiência", "pessoa cega", "pessoa com baixa visão", "pessoa surda". Evitamos "portador de deficiência", "deficiente", "sofre de" e "vítima de". Termos de preferência variam entre pessoas e comunidades: na dúvida, pergunte a quem você está atendendo.</p>',
    '<p>Vale lembrar que pessoas que usam leitor de tela costumam ser bastante experientes com a própria tecnologia e navegam rápido. O objetivo não é simplificar a interface por elas, e sim remover as barreiras que impedem que a experiência delas seja equivalente.</p>',
    '</div>',
    '</section>'
  ].join('');

  var HTML_LEITORES = [
    '<section class="bloco" id="leitores" aria-labelledby="h-leitores">',
    '<h2 id="h-leitores">Leitores de tela — seção especial</h2>',
    '<p>Um leitor de tela transforma a interface em fala ou em braile. Para cada elemento que recebe foco, ele anuncia basicamente quatro informações: <strong>nome</strong> (o que é), <strong>função</strong> (que tipo de controle é), <strong>estado</strong> (aberto, marcado, selecionado, inválido) e <strong>valor</strong>. Quando uma dessas informações falta no HTML, o leitor não tem como inventá-la — ele apenas silencia ou diz algo genérico como "botão".</p>',
    '<p>São softwares muito usados: <strong>NVDA</strong> e <strong>JAWS</strong> no Windows, <strong>VoiceOver</strong> no macOS e iOS, <strong>TalkBack</strong> no Android e <strong>Orca</strong> no Linux. Também dependem exatamente das mesmas marcações os leitores de linha braile, os softwares de comando de voz e as ferramentas de leitura para pessoas com dislexia.</p>',
    '<table class="tab"><caption>O que cada elemento precisa ter para ser anunciado corretamente</caption>',
    '<thead><tr><th scope="col">Elemento</th><th scope="col">O que o leitor de tela precisa encontrar</th></tr></thead><tbody>',
    '<tr><th scope="row">Imagem</th><td><code>alt</code> com a informação que ela transmite; <code>alt=""</code> quando for decorativa.</td></tr>',
    '<tr><th scope="row">Ícone em SVG</th><td><code>aria-hidden="true"</code> se for decorativo, ou <code>role="img"</code> com <code>aria-label</code> se informar algo.</td></tr>',
    '<tr><th scope="row">Link</th><td>Texto que faça sentido sozinho, fora do parágrafo. Aviso quando abrir em nova aba.</td></tr>',
    '<tr><th scope="row">Botão</th><td>Texto visível ou <code>aria-label</code>; elemento <code>&lt;button&gt;</code> de verdade, para funcionar com Enter e Espaço.</td></tr>',
    '<tr><th scope="row">Campo de formulário</th><td><code>&lt;label for&gt;</code> associado, mensagem de erro ligada por <code>aria-describedby</code> e <code>aria-invalid="true"</code>.</td></tr>',
    '<tr><th scope="row">Componente que abre e fecha</th><td><code>aria-expanded</code> atualizado por JavaScript a cada mudança.</td></tr>',
    '<tr><th scope="row">Aviso que aparece na tela</th><td>Região com <code>role="alert"</code> ou <code>aria-live</code> já presente no HTML antes da mensagem chegar.</td></tr>',
    '<tr><th scope="row">Tabela de dados</th><td><code>&lt;th&gt;</code> com <code>scope</code> e, de preferência, <code>&lt;caption&gt;</code>.</td></tr>',
    '<tr><th scope="row">Página inteira</th><td><code>lang</code> no <code>&lt;html&gt;</code>, <code>&lt;title&gt;</code> único, um <code>&lt;h1&gt;</code> e as regiões <code>header</code>, <code>nav</code>, <code>main</code>, <code>footer</code>.</td></tr>',
    '</tbody></table>',
    '<h3>Achados desta página que afetam diretamente quem usa leitor de tela</h3>',
    achadosLeitor.length
      ? '<p>' + achadosLeitor.length + ' das ' + achados.length + ' verificações reprovadas têm impacto direto no que o leitor de tela consegue anunciar. Cada item abaixo leva ao bloco completo, com explicação e exemplo de correção.</p><ul class="lista-resumo">' + achadosLeitor.map(blocoResumo).join('') + '</ul>'
      : '<p class="destaque">Nenhuma das verificações automáticas voltadas a leitores de tela foi reprovada nesta página. Isso é um bom sinal, mas não substitui percorrer a página de fato com um leitor de tela — veja o roteiro abaixo.</p>',
    '<h3>Roteiro rápido de teste manual</h3>',
    '<ol class="manual">',
    '<li><b>Navegue só pelo teclado.</b> Tab, Shift+Tab, Enter, Espaço e setas. Você consegue alcançar tudo, sempre enxergando onde o foco está, e sair de todo componente que abriu?</li>',
    '<li><b>Ligue um leitor de tela.</b> NVDA (Windows, gratuito) com Insert+seta para baixo; VoiceOver (macOS) com Cmd+F5; TalkBack (Android) pelo atalho de acessibilidade.</li>',
    '<li><b>Peça a lista de cabeçalhos</b> (no NVDA, tecla H para avançar; no VoiceOver, Ctrl+Option+U). A lista sozinha já conta a história da página?</li>',
    '<li><b>Peça a lista de links.</b> Cada link faz sentido fora do contexto do parágrafo?</li>',
    '<li><b>Percorra o formulário.</b> Cada campo anuncia o rótulo certo? Ao enviar com erro, o erro é falado e o foco vai para ele?</li>',
    '<li><b>Feche os olhos e execute a tarefa principal</b> só ouvindo. É o teste que mais revela problema de ordem de leitura e de conteúdo que muda sem aviso.</li>',
    '<li><b>Quando possível, teste com pessoas que usam leitor de tela no dia a dia.</b> Nenhum roteiro substitui isso, e a fluência delas revela problemas que a gente não imagina.</li>',
    '</ol>',
    '</section>'
  ].join('');

  var HTML_CORES = [
    '<section class="bloco" id="cores" aria-labelledby="h-cores">',
    '<h2 id="h-cores">Cores, contraste e baixa visão — seção especial</h2>',
    '<p>Cerca de 8% dos homens e 0,5% das mulheres têm alguma forma de visão de cores atípica (o que popularmente se chama daltonismo). As formas mais comuns envolvem confusão entre vermelho e verde; a confusão entre azul e amarelo é mais rara. Pessoas com baixa visão, pessoas usando o celular sob sol forte e telas antigas ou mal calibradas enfrentam dificuldades muito parecidas.</p>',
    '<p>Duas regras resolvem a maior parte dos casos: <strong>a cor nunca pode ser a única forma de transmitir uma informação</strong> e <strong>a diferença entre texto e fundo precisa ser de luminosidade, não só de matiz</strong>. Trocar vermelho por verde mantendo a mesma luminosidade não muda nada para quem não distingue esse par.</p>',
    amostras.length
      ? '<h3>Pares de cor reprovados nesta página</h3><p>Cada bloco mostra a combinação atual, uma sugestão que atinge o mínimo exigido e como o mesmo par é percebido por pessoas com os três tipos mais comuns de visão de cores atípica. As simulações são aproximações para orientar a decisão de design, não um diagnóstico.</p>' + amostras.map(blocoAmostra).join('')
      : '<p class="destaque">Nenhum par de cores reprovado foi calculado automaticamente nesta página. Confira mesmo assim os textos sobre imagem e gradiente, que a ferramenta não consegue medir.</p>',
    '<h3>Todos os achados relacionados a cor, contraste e ampliação</h3>',
    achadosCor.length ? '<ul class="lista-resumo">' + achadosCor.map(blocoResumo).join('') + '</ul>' : '<p class="destaque">Nenhuma verificação desta categoria foi reprovada.</p>',
    '<h3>O que verificar manualmente</h3>',
    '<ul class="manual">',
    '<li><b>Estados sinalizados só por cor.</b> Campo com erro em vermelho, linha de tabela em verde, gráfico com séries diferenciadas apenas pela legenda colorida. Acrescente ícone, texto, padrão de preenchimento ou rótulo direto no dado.</li>',
    '<li><b>Amplie a página para 200% e 400%.</b> O conteúdo se reorganiza em uma coluna ou aparece rolagem horizontal? Algum texto é cortado ou fica sobreposto?</li>',
    '<li><b>Aumente o espaçamento do texto.</b> Entrelinha 1,5, espaço entre letras 0,12em, entre palavras 0,16em, entre parágrafos 2em. O layout continua legível e nada é cortado?</li>',
    '<li><b>Teste em alto contraste e em modo escuro</b> (modo de contraste do Windows, inversão de cores do sistema). Ícones e bordas continuam visíveis?</li>',
    '<li><b>Confira o foco.</b> Em cada controle, o indicador de foco é visível sobre todos os fundos onde aquele controle aparece?</li>',
    '</ul>',
    '</section>'
  ].join('');

  var HTML_MANUAL = [
    '<section class="bloco" id="manual" aria-labelledby="h-manual">',
    '<h2 id="h-manual">O que a varredura automática não consegue verificar</h2>',
    '<p>Os itens abaixo exigem julgamento humano. Nenhuma ferramenta — esta ou qualquer outra — decide por você.</p>',
    '<ul class="manual">',
    '<li><b>O texto alternativo está correto?</b> A ferramenta vê que o <code>alt</code> existe; só uma pessoa avalia se ele descreve o que a imagem comunica naquele contexto.</li>',
    '<li><b>A ordem de leitura faz sentido?</b> A sequência do HTML é a sequência em que o conteúdo precisa ser entendido?</li>',
    '<li><b>Os cabeçalhos descrevem as seções?</b> Ler só a lista de cabeçalhos deveria dar um resumo fiel da página.</li>',
    '<li><b>É possível completar a tarefa inteira só pelo teclado?</b> Incluindo modais, menus suspensos, carrosséis, upload de arquivo e tabelas editáveis.</li>',
    '<li><b>O foco é gerenciado nas mudanças?</b> Ao abrir um modal, o foco entra nele e fica preso ali; ao fechar, volta para o botão que o abriu.</li>',
    '<li><b>Mensagens de erro são claras e acionáveis?</b> Dizem o que houve, onde e como corrigir — e são anunciadas quando aparecem.</li>',
    '<li><b>Há limite de tempo?</b> Sessões que expiram precisam de aviso e de opção de estender.</li>',
    '<li><b>A linguagem é compreensível?</b> Frases curtas, voz ativa, jargão explicado. Isso beneficia todo mundo, não só pessoas com deficiência cognitiva.</li>',
    '<li><b>Vídeos têm legenda revisada e audiodescrição?</b> Legenda automática sem revisão não atende ao critério.</li>',
    '<li><b>Conteúdo que muda sozinho avisa antes?</b> Atualização automática, carrossel que gira, banner que aparece por cima.</li>',
    '</ul></section>'
  ].join('');

  var HTML_GLOSSARIO = [
    '<section class="bloco" id="glossario" aria-labelledby="h-glos">',
    '<h2 id="h-glos">Glossário</h2><dl class="glos">',
    '<dt>Leitor de tela</dt><dd>Software que lê em voz alta (ou envia para uma linha braile) o conteúdo da tela. Exemplos: NVDA, JAWS, VoiceOver, TalkBack, Orca.</dd>',
    '<dt>Nome acessível</dt><dd>O texto que a tecnologia assistiva anuncia para identificar um elemento. Vem do texto visível, do <code>alt</code>, do <code>&lt;label&gt;</code>, do <code>aria-label</code> ou do <code>aria-labelledby</code>, nessa ordem de prioridade.</dd>',
    '<dt>Função (role)</dt><dd>O tipo do elemento: botão, link, caixa de seleção, aba. Vem do próprio HTML ou do atributo <code>role</code>.</dd>',
    '<dt>ARIA</dt><dd>Conjunto de atributos <code>role</code>, <code>aria-*</code> que descreve funções, estados e relações que o HTML sozinho não expressa. Regra de ouro: prefira o elemento HTML nativo; ARIA errada é pior que ARIA nenhuma.</dd>',
    '<dt>Região (landmark)</dt><dd>Área estrutural da página (<code>header</code>, <code>nav</code>, <code>main</code>, <code>aside</code>, <code>footer</code>) que o leitor de tela usa como atalho de navegação.</dd>',
    '<dt>Razão de contraste</dt><dd>Medida da diferença de luminosidade entre duas cores, de 1:1 (iguais) a 21:1 (preto sobre branco). O nível AA exige 4,5:1 para texto normal e 3:1 para texto grande.</dd>',
    '<dt>Texto grande</dt><dd>A partir de 24px, ou 18,7px em negrito.</dd>',
    '<dt>Foco visível</dt><dd>Indicação clara de qual elemento está selecionado no momento pela navegação de teclado.</dd>',
    '<dt>WCAG</dt><dd><i lang="en">Web Content Accessibility Guidelines</i>, as diretrizes internacionais do W3C. Versão de referência: 2.2, com níveis A, AA e AAA. A maior parte das exigências legais aponta para o nível AA.</dd>',
    '<dt>Daltonismo</dt><dd>Nome popular para a visão de cores atípica. Os tipos mais comuns são protanopia e deuteranopia (confusão entre vermelho e verde) e tritanopia (entre azul e amarelo).</dd>',
    '</dl></section>'
  ].join('');

  var HTML_REFS = [
    '<section class="bloco" id="referencias" aria-labelledby="h-refs">',
    '<h2 id="h-refs">Referências</h2><ul class="manual">',
    '<li><b>WCAG 2.2 (W3C, recomendação de outubro de 2023)</b> — norma internacional de referência. A WCAG 3.0 existe apenas como rascunho de trabalho e não substitui a 2.2. <span class="det">w3.org/TR/WCAG22 · traduções e material de apoio em w3.org/WAI</span></li>',
    '<li><b>ABNT NBR 17225:2025 — Acessibilidade em conteúdo e aplicações Web</b> — primeira norma técnica brasileira específica para web, lançada em março de 2025, com 146 diretrizes entre requisitos e recomendações. <span class="det">Para aplicativos móveis: ABNT NBR 17060.</span></li>',
    '<li><b>Lei Brasileira de Inclusão (Lei 13.146/2015)</b> — o artigo 63 determina que sites de empresas com sede ou representação comercial no Brasil e de órgãos públicos sejam acessíveis.</li>',
    '<li><b>eMAG</b> — modelo de acessibilidade em governo eletrônico, obrigatório para sites do governo federal brasileiro.</li>',
    '<li><b>EN 301 549</b> — norma europeia de acessibilidade em TIC, referência do European Accessibility Act; incorpora a WCAG nível AA.</li>',
    '<li><b>WAI-ARIA Authoring Practices</b> — padrões prontos de componentes acessíveis (abas, modais, menus, comboboxes). <span class="det">w3.org/WAI/ARIA/apg</span></li>',
    '</ul></section>'
  ].join('');

  var HTML_APROVADAS = [
    '<section class="bloco" id="aprovadas" aria-labelledby="h-aprov">',
    '<h2 id="h-aprov">Verificações aprovadas <span class="contador">' + aprovadas.length + '</span></h2>',
    '<p>Nenhuma ocorrência encontrada para os itens abaixo. Aprovado no teste automático não significa necessariamente correto: significa que o padrão verificável automaticamente foi atendido.</p>',
    '<ul class="aprovadas">' + aprovadas.map(function (a) { return '<li>' + esc(a.titulo) + '</li>'; }).join('') + '</ul></section>'
  ].join('');

  var avisoCss = cssBloqueadas
    ? '<p class="det" style="margin-block-start:8px">' + cssBloqueadas + ' folha(s) de estilo de outro domínio não puderam ser lidas pelo navegador (restrição de segurança). Regras de foco, animação e placeholder declaradas nelas não entraram nesta varredura.</p>'
    : '';
  var avisoErros = falhasInternas.length
    ? '<p class="det" style="margin-block-start:8px">Verificações que não puderam ser concluídas nesta página: ' + esc(falhasInternas.join('; ')) + '</p>'
    : '';

  /* ------------------------------------------------------------------ */
  /* documento final                                                     */
  /* ------------------------------------------------------------------ */

  var tituloRel = 'Relatório de acessibilidade — ' + (D.title ? norm(D.title) : location.hostname);

  var DOC = '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(tituloRel) + '</title>\n<style>' + CSS + '</style>\n</head>\n' +
    '<body data-arquivo="' + esc(nomeArquivo) + '">\n' +
    '<a class="pular" href="#conteudo">Pular para o conteúdo do relatório</a>' +
    '<header class="topo"><div class="env">' +
    '<p class="selo">Auditoria automática de acessibilidade · v' + VERSAO + '</p>' +
    '<h1>Relatório de acessibilidade</h1>' +
    '<p class="alvo"><strong>Página:</strong> ' + esc(norm(D.title) || '(sem título)') + '<br>' +
    '<strong>Endereço:</strong> ' + esc(location.href.slice(0, 300)) + '<br>' +
    '<strong>Varredura:</strong> ' + carimbo + ' · ' + totalVerif + ' verificações · ' +
    D.querySelectorAll('*').length + ' elementos analisados · ' + duracao + ' ms<br>' +
    '<strong>Janela no momento da análise:</strong> ' + W.innerWidth + ' x ' + W.innerHeight + ' px</p>' +
    avisoCss + avisoErros +
    HTML_SUMARIO +
    '</div></header>\n' +
    '<main id="conteudo" tabindex="-1"><div class="env">' +
    HTML_RESUMO +
    HTML_LEITORES +
    HTML_CORES +
    '<section class="bloco" id="ocorrencias" aria-labelledby="h-oc">' +
    '<h2 id="h-oc">Todas as ocorrências por categoria</h2>' +
    '<div class="filtros" role="group" aria-label="Filtrar achados por severidade">' +
    '<span style="font-size:.85rem;font-weight:600">Filtrar:</span>' +
    '<button type="button" data-filtro="critico" aria-pressed="false">Crítico (' + contagem.critico + ')</button>' +
    '<button type="button" data-filtro="serio" aria-pressed="false">Sério (' + contagem.serio + ')</button>' +
    '<button type="button" data-filtro="moderado" aria-pressed="false">Moderado (' + contagem.moderado + ')</button>' +
    '<button type="button" data-filtro="aviso" aria-pressed="false">Aviso (' + contagem.aviso + ')</button>' +
    '<button type="button" id="limpar-filtros">Mostrar tudo</button>' +
    '<button type="button" id="abrir-tudo" data-estado="0">Expandir todas as ocorrências</button>' +
    '<p id="contagem-visivel" role="status" style="margin:0;font-size:.85rem;color:var(--txt2)"></p>' +
    '</div>' +
    (achados.length ? htmlCategorias : '<p class="destaque">Nenhuma verificação automática foi reprovada nesta página. Siga para o roteiro de teste manual.</p>') +
    '</section>' +
    HTML_APROVADAS +
    HTML_MANUAL +
    HTML_GLOSSARIO +
    HTML_REFS +
    '</div></main>\n' +
    '<div class="acoes"><div class="env">' +
    '<p style="margin:0;font-size:.88rem;color:var(--txt2)">' + totalOcorrencias + ' ocorrências em ' + achados.length + ' verificações reprovadas</p>' +
    '<div><button type="button" class="btn sec" onclick="window.print()">Imprimir / salvar em PDF</button> ' +
    '<button type="button" class="btn" id="baixar">Baixar este relatório (.html)</button></div>' +
    '</div></div>' +
    '<footer class="rodape"><div class="env">' +
    '<p>Gerado por um bookmarklet de auditoria de acessibilidade executado no seu próprio navegador. Nenhum dado desta página foi enviado para qualquer servidor: toda a análise aconteceu localmente.</p>' +
    '<p>Este relatório é um apoio à avaliação e não constitui laudo de conformidade. A validação definitiva depende de teste manual e, principalmente, de teste com pessoas com deficiência.</p>' +
    '</div></footer>\n' +
    '<script>' + JS_REL + '<\/script>\n</body>\n</html>';

  /* ------------------------------------------------------------------ */
  /* entrega: nova aba, com queda para download                          */
  /* ------------------------------------------------------------------ */

  function aviso(mensagem, urlArquivo) {
    try {
      var caixa = D.createElement('div');
      caixa.setAttribute('data-auditor-a11y', '1');
      var sombra = caixa.attachShadow ? caixa.attachShadow({ mode: 'open' }) : null;
      var conteudo =
        '<style>:host{all:initial}' +
        '.cx{position:fixed;inset-block-end:18px;inset-inline-end:18px;z-index:2147483647;max-inline-size:340px;' +
        'font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#14181f;color:#f2f4f7;' +
        'border:1px solid #3a4250;border-radius:12px;padding:14px 16px;box-shadow:0 10px 34px rgba(0,0,0,.35)}' +
        '.cx a{color:#8ab6ff}.cx button{font:inherit;margin-block-start:10px;padding:6px 12px;border-radius:7px;' +
        'border:1px solid #3a4250;background:#222a35;color:#f2f4f7;cursor:pointer}' +
        '.cx strong{display:block;margin-block-end:4px}</style>' +
        '<div class="cx" role="status"><strong>Auditoria de acessibilidade concluída</strong>' +
        '<span>' + mensagem + '</span><br>' +
        (urlArquivo ? '<a href="' + urlArquivo + '" target="_blank" rel="noopener">Abrir o relatório em nova aba</a><br>' : '') +
        '<button type="button">Fechar</button></div>';
      if (sombra) { sombra.innerHTML = conteudo; } else { caixa.innerHTML = conteudo; }
      (sombra || caixa).querySelector('button').addEventListener('click', function () { caixa.remove(); });
      D.body.appendChild(caixa);
      setTimeout(function () { if (caixa.parentNode) caixa.remove(); }, 20000);
    } catch (e) { }
  }

  var urlBlob = null;
  try {
    var blob = new Blob([DOC], { type: 'text/html;charset=utf-8' });
    urlBlob = URL.createObjectURL(blob);
  } catch (e) {
    urlBlob = 'data:text/html;charset=utf-8,' + encodeURIComponent(DOC);
  }

  var aba = null;
  try { aba = W.open(urlBlob, '_blank'); } catch (e) { aba = null; }

  if (aba) {
    aviso('Relatório aberto em uma nova aba. ' + totalOcorrencias + ' ocorrências em ' + achados.length + ' verificações reprovadas.', urlBlob);
  } else {
    var baixou = false;
    try {
      var link = D.createElement('a');
      link.href = urlBlob;
      link.download = nomeArquivo;
      link.style.display = 'none';
      D.body.appendChild(link);
      link.click();
      link.remove();
      baixou = true;
    } catch (e) { baixou = false; }
    aviso(baixou
      ? 'O navegador bloqueou a nova aba, então o arquivo foi baixado: <strong>' + esc(nomeArquivo) + '</strong>.'
      : 'O navegador bloqueou a abertura automática. Use o link abaixo para ver o relatório.', urlBlob);
  }

  setTimeout(function () { W.__AUDITOR_A11Y_RODANDO__ = 0; }, 1500);

})();
