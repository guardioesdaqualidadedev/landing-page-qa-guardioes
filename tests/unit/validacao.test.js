import { describe, it, expect } from "vitest";
import { validarDefeito, formularioValido, paraDataLocal, LIMITES } from "../../src/playground/validacao.js";

// Um conjunto válido de referência. Cada teste parte dele e altera UM campo —
// assim o que falha é sempre a regra sob teste, não outra coisa.
const HOJE = new Date(2026, 8, 9); // 9 de setembro de 2026

function base(sobrescrever = {}) {
  return {
    titulo: "Botão Salvar não responde no Safari",
    modulo: "Login",
    severidade: "Alta",
    prioridade: "P1",
    ambiente: "Produção",
    reporter: "douglas@guardioes.dev",
    data: "2026-09-01",
    ocorrencias: "3",
    passos: "1. Abrir a tela. 2. Clicar em Salvar. 3. Observar que nada acontece.",
    aceite: true,
    ...sobrescrever,
  };
}

describe("validarDefeito — caminho feliz", () => {
  it("não acusa erro em um formulário completo e válido", () => {
    expect(validarDefeito(base(), HOJE)).toEqual({});
    expect(formularioValido(base(), HOJE)).toBe(true);
  });
});

describe("validarDefeito — campos obrigatórios", () => {
  it("acusa os dez campos quando o formulário chega vazio", () => {
    const erros = validarDefeito({}, HOJE);
    expect(Object.keys(erros)).toHaveLength(10);
    expect(erros.titulo).toBeDefined();
    expect(erros.aceite).toBeDefined();
  });

  it("trata valores só com espaço como ausentes", () => {
    const erros = validarDefeito(base({ titulo: "     " }), HOJE);
    expect(erros.titulo).toBe("Informe o título do defeito.");
  });
});

describe("validarDefeito — título (valor limite)", () => {
  it.each([
    [LIMITES.tituloMin - 1, false],
    [LIMITES.tituloMin, true],
    [LIMITES.tituloMax, true],
    [LIMITES.tituloMax + 1, false],
  ])("título com %i caracteres é válido? %s", (tamanho, esperado) => {
    const erros = validarDefeito(base({ titulo: "a".repeat(tamanho) }), HOJE);
    expect(erros.titulo === undefined).toBe(esperado);
  });
});

describe("validarDefeito — ocorrências (valor limite)", () => {
  it.each([
    ["0", false],
    ["1", true],
    ["999", true],
    ["1000", false],
  ])("ocorrências = %s é válido? %s", (valor, esperado) => {
    const erros = validarDefeito(base({ ocorrencias: valor }), HOJE);
    expect(erros.ocorrencias === undefined).toBe(esperado);
  });

  it("rejeita número quebrado", () => {
    expect(validarDefeito(base({ ocorrencias: "2.5" }), HOJE).ocorrencias).toBe("Use um número inteiro.");
  });

  it("rejeita texto", () => {
    expect(validarDefeito(base({ ocorrencias: "muitas" }), HOJE).ocorrencias).toBe("Use um número inteiro.");
  });
});

describe("validarDefeito — e-mail (partição de equivalência)", () => {
  it.each(["semarroba.com", "sem@dominio", "com espaco@dominio.com", "@dominio.com"])(
    "rejeita o e-mail inválido %s",
    (email) => {
      expect(validarDefeito(base({ reporter: email }), HOJE).reporter).toContain("E-mail inválido");
    }
  );

  it.each(["a@b.co", "nome.sobrenome@empresa.com.br", "qa+teste@guardioes.dev"])(
    "aceita o e-mail válido %s",
    (email) => {
      expect(validarDefeito(base({ reporter: email }), HOJE).reporter).toBeUndefined();
    }
  );
});

describe("validarDefeito — data de detecção", () => {
  it("aceita a data de hoje", () => {
    expect(validarDefeito(base({ data: "2026-09-09" }), HOJE).data).toBeUndefined();
  });

  it("rejeita data no futuro", () => {
    expect(validarDefeito(base({ data: "2026-09-10" }), HOJE).data).toBe(
      "A data de detecção não pode estar no futuro (hoje é 09/09/2026)."
    );
  });

  it("rejeita data anterior ao limite do sistema", () => {
    expect(validarDefeito(base({ data: "2019-12-31" }), HOJE).data).toContain("não pode ser anterior");
  });

  it("aceita exatamente a data mínima", () => {
    expect(validarDefeito(base({ data: LIMITES.dataMinima }), HOJE).data).toBeUndefined();
  });

  // ── Formato brasileiro nas mensagens ───────────────────────────────────
  // O limite é guardado em ISO porque é o que o <input type="date"> usa. Se
  // ele vazar para a mensagem, o visitante lê "2020-01-01" — foi exatamente o
  // defeito encontrado no playground.
  it("mostra o limite mínimo em dd/mm/aaaa, nunca em ISO", () => {
    const msg = validarDefeito(base({ data: "2019-12-31" }), HOJE).data;
    expect(msg).toContain("01/01/2020");
    expect(msg).not.toContain("2020-01-01");
  });

  it("nenhuma mensagem de data escapa no formato ISO", () => {
    const casos = ["2019-12-31", "2026-09-10", "31/12/2019", "", "abacaxi", "2026-02-31"];
    for (const data of casos) {
      const msg = validarDefeito(base({ data }), HOJE).data;
      expect(msg, `caso ${JSON.stringify(data)}`).toBeTypeOf("string");
      expect(msg, `caso ${JSON.stringify(data)}`).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });

  it("diz qual é o formato esperado quando a data não dá para ler", () => {
    expect(validarDefeito(base({ data: "31/12/2019" }), HOJE).data).toBe(
      "Data inválida. Use o formato dd/mm/aaaa."
    );
  });

  it("rejeita data que não existe no calendário (31 de fevereiro)", () => {
    expect(validarDefeito(base({ data: "2026-02-31" }), HOJE).data).toContain("Data inválida");
  });
});

describe("paraDataLocal", () => {
  it("interpreta a data no fuso local, sem deslocar um dia", () => {
    const d = paraDataLocal("2026-09-09");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(9);
  });

  it("devolve null para formatos inválidos", () => {
    expect(paraDataLocal("09/09/2026")).toBeNull();
    expect(paraDataLocal("")).toBeNull();
    expect(paraDataLocal(null)).toBeNull();
  });
});

describe("validarDefeito — listas fechadas", () => {
  it("rejeita valor fora da lista de severidades", () => {
    expect(validarDefeito(base({ severidade: "Catastrófica" }), HOJE).severidade).toBe("Severidade inválida.");
  });

  it("exige o aceite das diretrizes", () => {
    expect(validarDefeito(base({ aceite: false }), HOJE).aceite).toContain("dados sensíveis");
  });

  it("exige passos com no mínimo o tamanho configurado", () => {
    expect(validarDefeito(base({ passos: "quebra" }), HOJE).passos).toContain(String(LIMITES.passosMin));
  });
});
