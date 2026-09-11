import { describe, it, expect } from "vitest";
import { CENARIOS } from "../../src/playground/cenarios.js";
import { SYLLABUS } from "../../src/content/syllabus.js";
import {
  ETAPAS,
  ABAS_EXPLICADAS,
  CAMPOS_CASO_TESTE,
  MODELO_DOCUMENTO,
  ESTRUTURA_DRIVE,
  CRITERIOS_VALIDACAO,
  PASSOS_COMPARTILHAMENTO,
  CARGA_HORARIA,
} from "../../src/content/certificacao.js";

// A trilha do certificado é conteúdo, mas conteúdo que precisa fechar com o
// playground e com o gerador de PDF. Estes testes existem para que uma edição
// descuidada não deixe a instrução contradizendo a tela.
describe("Trilha do certificado", () => {
  it("cobre os 12 cenários do playground na estrutura de pastas sugerida", () => {
    expect(CENARIOS).toHaveLength(12);

    // A árvore de exemplo do Drive precisa listar um vídeo por cenário.
    for (let i = 1; i <= CENARIOS.length; i += 1) {
      expect(ESTRUTURA_DRIVE).toContain(`CT-${String(i).padStart(2, "0")}-`);
    }
  });

  it("distribui todos os cenários entre as abas, sem repetir nenhum", () => {
    const atribuidos = ABAS_EXPLICADAS.flatMap((a) => a.cenarios);
    const ids = CENARIOS.map((c) => c.id);

    expect(new Set(atribuidos).size).toBe(atribuidos.length);
    expect([...atribuidos].sort()).toEqual([...ids].sort());
  });

  it("descreve uma aba do playground para cada aba explicada", () => {
    // Os ids precisam bater com os da constante ABAS em Playground.jsx.
    expect(ABAS_EXPLICADAS.map((a) => a.id)).toEqual(["registrar", "tabela", "cenarios"]);
    for (const aba of ABAS_EXPLICADAS) {
      expect(aba.oQueE.length).toBeGreaterThan(80);
      expect(aba.oQueTestar.length).toBeGreaterThan(40);
      expect(aba.atencao.length).toBeGreaterThan(40);
    }
  });

  it("numera as etapas em sequência, de 01 em diante", () => {
    expect(ETAPAS.map((e) => e.n)).toEqual(["01", "02", "03", "04", "05", "06", "07"]);
    for (const etapa of ETAPAS) {
      expect(etapa.detalhes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("exige no modelo todos os campos obrigatórios do caso de teste", () => {
    const obrigatorios = CAMPOS_CASO_TESTE.filter((c) => c.obrigatorio);
    expect(obrigatorios.length).toBeGreaterThanOrEqual(9);

    // O modelo que a pessoa copia tem que conter, em texto, cada campo exigido.
    for (const rotulo of ["Técnica aplicada", "Condição prévia", "Dados de teste", "Passos", "Resultado esperado", "Resultado real", "Status", "Evidência"]) {
      expect(MODELO_DOCUMENTO).toContain(rotulo);
    }
  });

  it("abre o modelo pelo CT-01 e aponta o cenário certo", () => {
    expect(MODELO_DOCUMENTO).toContain("CT-01");
    expect(MODELO_DOCUMENTO).toContain(CENARIOS[0].titulo);
    expect(MODELO_DOCUMENTO).toContain("Análise de valor limite");
  });

  it("mantém a carga horária alinhada com o gerador de certificado", () => {
    // `scripts/gerar-certificado.mjs` emite 4 horas por padrão; a página não
    // pode prometer outro número.
    expect(CARGA_HORARIA).toBe(4);
  });

  it("orienta a permissão de compartilhamento do Drive", () => {
    const tudo = PASSOS_COMPARTILHAMENTO.join(" ");
    expect(tudo).toContain("Qualquer pessoa com o link");
    expect(tudo).toContain("Leitor");
    expect(tudo).toContain("anônima");
  });

  it("lista critérios de validação acionáveis", () => {
    expect(CRITERIOS_VALIDACAO.length).toBeGreaterThanOrEqual(5);
    for (const c of CRITERIOS_VALIDACAO) {
      expect(c.criterio).toBeTruthy();
      expect(c.detalhe).toBeTruthy();
    }
  });
});

describe("Syllabus CTFL", () => {
  it("descreve os seis capítulos da versão 4.0", () => {
    expect(SYLLABUS.versao).toBe("4.0");
    expect(SYLLABUS.capitulos).toHaveLength(6);
    expect(SYLLABUS.capitulos.map((c) => c.n)).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("aponta para links oficiais em HTTPS", () => {
    for (const url of Object.values(SYLLABUS.links)) {
      expect(url).toMatch(/^https:\/\//);
    }
    // O PDF em português é o link principal divulgado no site.
    expect(SYLLABUS.links.pdfPt).toMatch(/\.pdf$/);
  });

  it("registra o formato do exame", () => {
    const rotulos = SYLLABUS.exame.map((e) => e.rotulo);
    expect(rotulos).toContain("Questões");
    expect(rotulos).toContain("Aprovação");
    expect(rotulos).toContain("Duração");
  });
});
