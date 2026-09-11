import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormularioDefeito from "../../src/playground/FormularioDefeito.jsx";

// Preenche o formulário com um conjunto válido. Recebe sobrescritas para o
// teste alterar apenas o campo que está sob análise.
async function preencherValido(user, sobrescrever = {}) {
  const v = {
    titulo: "Botão Salvar não responde no Safari",
    modulo: "Login",
    severidade: "Alta",
    ambiente: "Produção",
    reporter: "douglas@guardioes.dev",
    data: "2026-09-01",
    ocorrencias: "3",
    passos: "1. Abrir a tela. 2. Clicar em Salvar. 3. Observar que nada acontece.",
    prioridade: "P1",
    ...sobrescrever,
  };

  if (v.titulo) await user.type(screen.getByTestId("input-titulo"), v.titulo);
  if (v.modulo) await user.selectOptions(screen.getByTestId("select-modulo"), v.modulo);
  if (v.severidade) await user.selectOptions(screen.getByTestId("select-severidade"), v.severidade);
  if (v.ambiente) await user.selectOptions(screen.getByTestId("select-ambiente"), v.ambiente);
  if (v.reporter) await user.type(screen.getByTestId("input-reporter"), v.reporter);
  if (v.data) await user.type(screen.getByTestId("input-data"), v.data);
  if (v.ocorrencias) await user.type(screen.getByTestId("input-ocorrencias"), v.ocorrencias);
  if (v.passos) await user.type(screen.getByTestId("input-passos"), v.passos);
  if (v.prioridade) await user.click(screen.getByTestId(`radio-prioridade-${v.prioridade}`));
  await user.click(screen.getByTestId("check-aceite"));
  return v;
}

describe("FormularioDefeito", () => {
  let onRegistrar;

  beforeEach(() => {
    onRegistrar = vi.fn();
  });

  it("não envia e mostra o resumo de erros quando o formulário está vazio", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await user.click(screen.getByTestId("btn-registrar"));

    expect(onRegistrar).not.toHaveBeenCalled();
    expect(screen.getByTestId("resumo-erros")).toHaveTextContent("10 campos precisam de atenção");
    expect(screen.getByTestId("campo-titulo-erro")).toBeInTheDocument();
  });

  it("marca o campo inválido com aria-invalid e liga a mensagem por aria-describedby", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await user.click(screen.getByTestId("btn-registrar"));

    const titulo = screen.getByTestId("input-titulo");
    expect(titulo).toHaveAttribute("aria-invalid", "true");
    expect(titulo.getAttribute("aria-describedby")).toContain("campo-titulo-erro");
  });

  it("leva o foco para o primeiro campo com erro", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await user.click(screen.getByTestId("btn-registrar"));

    expect(screen.getByTestId("input-titulo")).toHaveFocus();
  });

  it("registra o defeito quando todos os campos são válidos", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await preencherValido(user);
    await user.click(screen.getByTestId("btn-registrar"));

    expect(onRegistrar).toHaveBeenCalledTimes(1);
    const enviado = onRegistrar.mock.calls[0][0];
    expect(enviado.titulo).toBe("Botão Salvar não responde no Safari");
    expect(enviado.severidade).toBe("Alta");
    expect(enviado.ocorrencias).toBe(3);
    expect(typeof enviado.ocorrencias).toBe("number");
  });

  it("limpa os campos depois de registrar", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await preencherValido(user);
    await user.click(screen.getByTestId("btn-registrar"));

    expect(screen.getByTestId("input-titulo")).toHaveValue("");
    expect(screen.getByTestId("select-severidade")).toHaveValue("");
    expect(screen.getByTestId("check-aceite")).not.toBeChecked();
  });

  it("revalida a cada digitação depois da primeira tentativa de envio", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await user.click(screen.getByTestId("btn-registrar"));
    expect(screen.getByTestId("campo-titulo-erro")).toBeInTheDocument();

    await user.type(screen.getByTestId("input-titulo"), "Título suficientemente longo");
    expect(screen.queryByTestId("campo-titulo-erro")).not.toBeInTheDocument();
  });

  it("rejeita e-mail sem arroba", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await preencherValido(user, { reporter: "douglas.guardioes.dev" });
    await user.click(screen.getByTestId("btn-registrar"));

    expect(onRegistrar).not.toHaveBeenCalled();
    expect(screen.getByTestId("campo-reporter-erro")).toHaveTextContent("E-mail inválido");
  });

  it("rejeita ocorrências fora da faixa de 1 a 999", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await preencherValido(user, { ocorrencias: "1000" });
    await user.click(screen.getByTestId("btn-registrar"));

    expect(onRegistrar).not.toHaveBeenCalled();
    expect(screen.getByTestId("campo-ocorrencias-erro")).toHaveTextContent("entre 1 e 999");
  });

  it("exige o aceite das diretrizes antes de registrar", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await preencherValido(user);
    await user.click(screen.getByTestId("check-aceite")); // desmarca
    await user.click(screen.getByTestId("btn-registrar"));

    expect(onRegistrar).not.toHaveBeenCalled();
    expect(screen.getByTestId("campo-aceite-erro")).toBeInTheDocument();
  });

  it("o botão Limpar zera os campos e apaga os erros", async () => {
    const user = userEvent.setup();
    render(<FormularioDefeito onRegistrar={onRegistrar} />);

    await user.click(screen.getByTestId("btn-registrar"));
    await user.type(screen.getByTestId("input-titulo"), "Alguma coisa");
    await user.click(screen.getByTestId("btn-limpar"));

    expect(screen.getByTestId("input-titulo")).toHaveValue("");
    expect(screen.queryByTestId("resumo-erros")).not.toBeInTheDocument();
  });

  it("apresenta a prioridade como um grupo de rádios nomeado", () => {
    render(<FormularioDefeito onRegistrar={onRegistrar} />);
    const grupo = screen.getByTestId("grupo-prioridade");
    expect(within(grupo).getAllByRole("radio")).toHaveLength(3);
  });
});
