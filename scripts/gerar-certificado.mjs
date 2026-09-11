#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Gerador de certificado — QA's Guardiões do Software
//
// Emite o certificado de conclusão do Playground (Guardião Tracker) para quem
// cumpriu os 12 desafios e enviou os vídeos comprovando o resultado esperado.
//
//   node scripts/gerar-certificado.mjs "Maria Aparecida de Souza"
//
// O PDF sai em A4 paisagem com duas páginas: a frente é o certificado com a
// marca da comunidade; o verso é o conteúdo programático — os 12 cenários com
// a técnica de teste por trás de cada um, que é o que dá lastro ao documento.
//
// A renderização usa o Chromium do Playwright (já é devDependency do projeto),
// então não entra nenhuma biblioteca nova de PDF.
// ─────────────────────────────────────────────────────────────────────────────

import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CENARIOS } from "../src/playground/cenarios.js";
import { MARCA } from "../src/theme.js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Carga horária padrão. São 12 desafios; cada um pede ler o cenário, executar o
// teste no playground, gravar o vídeo e conferir o resultado esperado — algo
// como 20 minutos honestos por desafio. Quatro horas é o número defensável:
// não infla o certificado e não subestima quem fez o trabalho.
const HORAS_PADRAO = 4;

const ASSINATURA_PADRAO = {
  nome: "Douglas Queiroz",
  cargo: "Instrutor · Administração do Discord",
};

const SITE = "comunidade-qa-guardioes.web.app";

// ── Argumentos ───────────────────────────────────────────────────────────────

function lerArgumentos(argv) {
  const opcoes = {
    horas: HORAS_PADRAO,
    data: new Date(),
    saida: join(RAIZ, "certificados"),
    assinante: ASSINATURA_PADRAO.nome,
    cargo: ASSINATURA_PADRAO.cargo,
    manterHtml: false,
  };
  const soltos = [];

  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      soltos.push(arg);
      continue;
    }
    const [chave, ...resto] = arg.slice(2).split("=");
    const valor = resto.join("=");

    switch (chave) {
      case "horas": {
        const n = Number(valor);
        if (!Number.isFinite(n) || n < 1 || n > 40) {
          erro(`--horas precisa ser um número entre 1 e 40 (recebi "${valor}").`);
        }
        opcoes.horas = n;
        break;
      }
      case "data": {
        // Meio-dia UTC evita que o fuso do Brasil jogue a data para o dia anterior.
        const d = new Date(`${valor}T12:00:00Z`);
        if (Number.isNaN(d.getTime())) erro(`--data precisa estar no formato AAAA-MM-DD (recebi "${valor}").`);
        opcoes.data = d;
        break;
      }
      case "saida":
        opcoes.saida = resolve(process.cwd(), valor);
        break;
      case "assinante":
        opcoes.assinante = valor;
        break;
      case "cargo":
        opcoes.cargo = valor;
        break;
      case "html":
        opcoes.manterHtml = true;
        break;
      case "help":
      case "ajuda":
        ajuda();
        process.exit(0);
        break;
      default:
        erro(`Opção desconhecida: --${chave}`);
    }
  }

  opcoes.nome = normalizarNome(soltos.join(" "));
  return opcoes;
}

function ajuda() {
  console.log(`
Gerador de certificado — QA's Guardiões do Software

  node scripts/gerar-certificado.mjs "Nome Completo do Aluno" [opções]

Opções
  --horas=N          Carga horária do certificado (padrão: ${HORAS_PADRAO})
  --data=AAAA-MM-DD  Data de emissão (padrão: hoje)
  --saida=CAMINHO    Pasta de destino (padrão: ./certificados)
  --assinante=NOME   Quem assina (padrão: ${ASSINATURA_PADRAO.nome})
  --cargo=TEXTO      Cargo de quem assina
  --html             Mantém também o HTML gerado, para conferir o layout
  --ajuda            Mostra esta mensagem

Exemplo
  node scripts/gerar-certificado.mjs "Maria Aparecida de Souza" --horas=4
`);
}

function erro(mensagem) {
  console.error(`\n✖ ${mensagem}\n`);
  process.exit(1);
}

// ── Nome do aluno ────────────────────────────────────────────────────────────

// Preposições ficam minúsculas ("de Souza", não "De Souza"); o resto ganha
// inicial maiúscula. Quem digitar TUDO EM CAIXA ALTA ou tudo minúsculo recebe
// o nome apresentável do mesmo jeito.
const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e", "di", "del", "van", "von", "la", "y"]);

function normalizarNome(bruto) {
  const limpo = bruto.trim().replace(/\s+/g, " ");

  if (!limpo) erro('Informe o nome completo do aluno: node scripts/gerar-certificado.mjs "Nome Completo"');
  if (limpo.length > 70) erro("O nome passa de 70 caracteres — confira se não veio texto a mais.");
  if (!/^[\p{L}\p{M}'.\- ]+$/u.test(limpo)) erro(`"${limpo}" tem caracteres que não são de nome (números ou símbolos).`);

  const partes = limpo.split(" ");
  if (partes.length < 2) erro("O certificado precisa do nome completo — pelo menos nome e sobrenome.");

  return partes
    .map((parte, i) => {
      const minuscula = parte.toLocaleLowerCase("pt-BR");
      if (i > 0 && PARTICULAS.has(minuscula)) return minuscula;
      // Trata nomes compostos por hífen: "Ana-Clara" → "Ana-Clara".
      return minuscula.replace(/(^|[-'])(\p{L})/gu, (_, sep, letra) => sep + letra.toLocaleUpperCase("pt-BR"));
    })
    .join(" ");
}

function apelidoArquivo(nome) {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Código de verificação ────────────────────────────────────────────────────

// Determinístico: o mesmo aluno, na mesma data e carga horária, sempre gera o
// mesmo código. Reemitir o certificado não invalida o que já foi divulgado.
function codigoVerificacao(nome, dataISO, horas) {
  const semente = `${nome.toLowerCase()}|${dataISO}|${horas}`;
  const digest = createHash("sha256").update(semente).digest("hex").slice(0, 6).toUpperCase();
  return `QAG-${dataISO.slice(0, 4)}-${digest}`;
}

// ── HTML ─────────────────────────────────────────────────────────────────────

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

async function imagemBase64(caminhoRelativo) {
  const buffer = await readFile(join(RAIZ, caminhoRelativo));
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function dataPorExtenso(data) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(data);
}

function montarHtml({ nome, horas, data, codigo, assinante, cargo, logoNavy, logoBranca, simbolo }) {
  const { azulMarinho, laranja, cinzaClaro } = MARCA;
  const plural = horas === 1 ? "hora" : "horas";

  const listaCenarios = CENARIOS.map(
    (c, i) => `
      <li class="item">
        <span class="numero">${String(i + 1).padStart(2, "0")}</span>
        <div>
          <span class="tecnica">${escapar(c.tecnica)}</span>
          <p class="item-titulo">${escapar(c.titulo)}</p>
          <p class="item-esperado">${escapar(c.esperado)}</p>
        </div>
      </li>`,
  ).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Certificado — ${escapar(nome)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: ${azulMarinho};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pagina {
    width: 297mm;
    height: 210mm;
    position: relative;
    overflow: hidden;
    background: #FFFFFF;
    page-break-after: always;
  }
  .pagina:last-child { page-break-after: auto; }

  /* Faixa laranja no topo e moldura azul: a assinatura visual da marca. */
  .faixa { position: absolute; top: 0; left: 0; right: 0; height: 7mm; background: ${laranja}; }
  .moldura {
    position: absolute; inset: 11mm 11mm 11mm 11mm;
    border: 1.2pt solid ${azulMarinho};
  }
  .moldura::after {
    content: ""; position: absolute; inset: 2.2mm;
    border: 0.5pt solid rgba(11, 35, 65, .28);
  }

  /* O símbolo da marca em marca-d'água — presente, mas sem competir com o texto. */
  .marca-dagua {
    position: absolute; left: 50%; top: 52%;
    transform: translate(-50%, -50%);
    width: 128mm; opacity: .035;
  }

  .conteudo { position: absolute; inset: 11mm; padding: 13mm 22mm 12mm; display: flex; flex-direction: column; height: calc(210mm - 22mm); }

  /* ── Frente ── */
  .logo-topo { height: 27mm; align-self: center; }

  .eyebrow {
    margin-top: 7mm;
    text-align: center;
    font-size: 9.5pt;
    font-weight: 700;
    letter-spacing: .42em;
    text-transform: uppercase;
    color: ${laranja};
  }
  .subtitulo {
    margin-top: 3mm;
    text-align: center;
    font-size: 10pt;
    letter-spacing: .06em;
    color: #55677E;
  }

  .certificamos { margin-top: 9mm; text-align: center; font-size: 11pt; color: #55677E; }

  .nome {
    margin-top: 4mm;
    text-align: center;
    font-family: Georgia, "Times New Roman", serif;
    font-size: ${nome.length > 40 ? "26pt" : nome.length > 30 ? "30pt" : "34pt"};
    font-weight: 700;
    line-height: 1.15;
    color: ${azulMarinho};
  }
  /* 0.6mm em vez de 1pt: fio de 1pt cai em offset subpixel e some em alguns
     renderizadores quando o nome quebra em duas linhas. */
  .regua { width: 120mm; height: 0.6mm; background: ${laranja}; margin: 5mm auto 0; }

  .corpo {
    margin: 7mm auto 0;
    max-width: 205mm;
    text-align: center;
    font-size: 11.5pt;
    line-height: 1.75;
    color: #1B3A5E;
  }
  .corpo strong { color: ${azulMarinho}; }

  /* Três dados objetivos ancorados no meio da página: preenchem o vão entre o
     texto e a assinatura e resumem o que o certificado atesta. */
  .selos {
    margin: 11mm auto 0;
    display: flex;
    justify-content: center;
    align-items: stretch;
  }
  .selo { padding: 0 14mm; text-align: center; }
  .selo + .selo { border-left: 0.7pt solid #D5DFEA; }
  .selo .valor { font-family: Georgia, serif; font-size: 17pt; font-weight: 700; color: ${azulMarinho}; }
  .selo .rotulo {
    margin-top: 1.5mm; font-size: 7pt; font-weight: 700;
    letter-spacing: .18em; text-transform: uppercase; color: #93A9C4;
  }

  .rodape {
    /* O auto empurra o rodapé para o fim da página; o padding garante folga
       mesmo quando um nome muito longo quebra em duas linhas e zera esse auto. */
    margin-top: auto;
    padding-top: 10mm;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: 10mm;
    font-size: 8.5pt;
    color: #55677E;
  }
  .rodape .rotulo {
    font-size: 7pt; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: #93A9C4; margin-bottom: 1.5mm;
  }
  .assinatura { text-align: center; min-width: 78mm; }
  .assinatura .linha { border-top: 1pt solid ${azulMarinho}; padding-top: 2.5mm; }
  .assinatura .quem { font-size: 11pt; font-weight: 700; color: ${azulMarinho}; }
  .assinatura .cargo { font-size: 8.5pt; color: #55677E; margin-top: 1mm; }
  .codigo { text-align: right; }
  .codigo .valor { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 11pt; font-weight: 700; color: ${azulMarinho}; letter-spacing: .04em; }
  .codigo .onde { font-size: 7.5pt; color: #93A9C4; margin-top: 1mm; }

  /* ── Verso ── */
  .banda {
    position: absolute; top: 0; left: 0; right: 0; height: 34mm;
    background: ${azulMarinho};
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 22mm;
  }
  .banda img { height: 21mm; }
  .banda span {
    font-size: 8pt; font-weight: 700; letter-spacing: .3em;
    text-transform: uppercase; color: ${laranja};
  }

  .verso { position: absolute; inset: 34mm 0 0; padding: 10mm 22mm 13mm; display: flex; flex-direction: column; height: calc(210mm - 34mm); }
  .verso h2 { font-size: 15pt; letter-spacing: .01em; }
  .verso .intro { margin-top: 2.5mm; font-size: 9.5pt; color: #55677E; line-height: 1.6; max-width: 215mm; }

  .grade {
    margin-top: 7mm;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 12mm;
    row-gap: 3.4mm;
    list-style: none;
  }
  .item { display: flex; gap: 3.5mm; break-inside: avoid; }
  .numero {
    font-family: Georgia, serif; font-size: 12pt; font-weight: 700;
    color: ${laranja}; min-width: 8mm; line-height: 1.2;
  }
  .tecnica {
    display: inline-block; font-size: 6.5pt; font-weight: 700;
    letter-spacing: .13em; text-transform: uppercase; color: #55677E;
    background: ${cinzaClaro}; border-radius: 2mm; padding: .8mm 2mm;
  }
  .item-titulo { font-size: 9.5pt; font-weight: 600; color: ${azulMarinho}; margin-top: 1.2mm; line-height: 1.35; }
  .item-esperado { font-size: 8.5pt; color: #55677E; margin-top: .8mm; line-height: 1.4; }

  .nota {
    margin-top: auto;
    border-top: 0.7pt solid #D5DFEA;
    padding-top: 4mm;
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 8pt; color: #93A9C4;
  }
  .nota strong { color: ${azulMarinho}; font-weight: 600; }
</style>
</head>
<body>

<!-- Página 1 — o certificado -->
<section class="pagina">
  <div class="faixa"></div>
  <div class="moldura"></div>
  <img class="marca-dagua" src="${simbolo}" alt="">
  <div class="conteudo">
    <img class="logo-topo" src="${logoNavy}" alt="QA's Guardiões do Software">

    <p class="eyebrow">Certificado de conclusão</p>
    <p class="subtitulo">Playground de QA · Guardião Tracker</p>

    <p class="certificamos">Certificamos que</p>
    <h1 class="nome">${escapar(nome)}</h1>
    <div class="regua"></div>

    <p class="corpo">
      concluiu os <strong>12 desafios de teste</strong> do playground Guardião Tracker e
      apresentou <strong>evidência em vídeo</strong> de cada execução, comprovando o
      resultado esperado. A trilha cobre valor limite, partição de equivalência, regra de
      negócio, acessibilidade por teclado, busca, ordenação, paginação e ações destrutivas,
      totalizando <strong>${horas} ${plural}</strong> de prática.
    </p>

    <div class="selos">
      <div class="selo"><p class="valor">12</p><p class="rotulo">Desafios concluídos</p></div>
      <div class="selo"><p class="valor">Vídeo</p><p class="rotulo">Evidência de cada teste</p></div>
      <div class="selo"><p class="valor">${horas}h</p><p class="rotulo">Carga horária</p></div>
    </div>

    <div class="rodape">
      <div>
        <p class="rotulo">Emitido em</p>
        <p>${dataPorExtenso(data)}</p>
      </div>
      <div class="assinatura">
        <div class="linha">
          <p class="quem">${escapar(assinante)}</p>
          <p class="cargo">${escapar(cargo)}</p>
        </div>
      </div>
      <div class="codigo">
        <p class="rotulo">Código de verificação</p>
        <p class="valor">${codigo}</p>
        <p class="onde">${SITE}</p>
      </div>
    </div>
  </div>
</section>

<!-- Página 2 — o que foi efetivamente testado -->
<section class="pagina">
  <div class="banda">
    <img src="${logoBranca}" alt="QA's Guardiões do Software">
    <span>Mais qualidade. Mais conquistas.</span>
  </div>
  <div class="verso">
    <h2>Conteúdo programático</h2>
    <p class="intro">
      Os 12 desafios executados no Guardião Tracker, com a técnica de teste por trás de cada
      um. Para cada desafio houve execução no playground, gravação em vídeo e conferência do
      resultado esperado.
    </p>

    <ol class="grade">${listaCenarios}</ol>

    <div class="nota">
      <span>Certificado de <strong>${escapar(nome)}</strong> · ${horas} ${plural}</span>
      <span>Código <strong>${codigo}</strong> · ${SITE}</span>
    </div>
  </div>
</section>

</body>
</html>`;
}

// ── Registro de emissões ─────────────────────────────────────────────────────

// Um código de verificação só serve para alguma coisa se existir onde conferir.
// O registro é o índice local de tudo que foi emitido.
async function registrar(pasta, emissao) {
  const caminho = join(pasta, "registro.json");
  let registro = [];

  if (existsSync(caminho)) {
    try {
      registro = JSON.parse(await readFile(caminho, "utf8"));
      if (!Array.isArray(registro)) registro = [];
    } catch {
      console.warn("⚠ registro.json ilegível — o arquivo será recriado.");
      registro = [];
    }
  }

  const existente = registro.findIndex((r) => r.codigo === emissao.codigo);
  if (existente >= 0) registro[existente] = emissao;
  else registro.push(emissao);

  registro.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  await writeFile(caminho, `${JSON.stringify(registro, null, 2)}\n`, "utf8");
  return existente >= 0;
}

// ── Execução ─────────────────────────────────────────────────────────────────

async function main() {
  const { nome, horas, data, saida, assinante, cargo, manterHtml } = lerArgumentos(process.argv.slice(2));

  const dataISO = data.toISOString().slice(0, 10);
  const codigo = codigoVerificacao(nome, dataISO, horas);

  const [logoNavy, logoBranca, simbolo] = await Promise.all([
    imagemBase64("src/assets/logo-horizontal-navy.png"),
    imagemBase64("src/assets/logo-horizontal-branca.png"),
    imagemBase64("src/assets/marca-simbolo.png"),
  ]);

  const html = montarHtml({ nome, horas, data, codigo, assinante, cargo, logoNavy, logoBranca, simbolo });

  await mkdir(saida, { recursive: true });
  const base = join(saida, `certificado-${apelidoArquivo(nome)}`);
  const pdf = `${base}.pdf`;

  if (manterHtml) await writeFile(`${base}.html`, html, "utf8");

  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage();
    await pagina.setContent(html, { waitUntil: "load" });
    await pagina.pdf({ path: pdf, format: "A4", landscape: true, printBackground: true, preferCSSPageSize: true });
  } finally {
    await navegador.close();
  }

  const reemissao = await registrar(saida, {
    codigo,
    nome,
    horas,
    emitidoEm: dataISO,
    trilha: "Playground Guardião Tracker — 12 desafios",
    arquivo: `certificado-${apelidoArquivo(nome)}.pdf`,
  });

  console.log(`
✔ Certificado ${reemissao ? "reemitido" : "gerado"}

  Aluno    ${nome}
  Carga    ${horas} ${horas === 1 ? "hora" : "horas"}
  Emissão  ${dataPorExtenso(data)}
  Código   ${codigo}
  PDF      ${pdf}${manterHtml ? `\n  HTML     ${base}.html` : ""}
`);
}

main().catch((e) => erro(e.stack || e.message));
