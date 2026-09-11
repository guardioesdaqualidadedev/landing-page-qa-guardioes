import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TabelaDefeitos from "../../src/playground/TabelaDefeitos.jsx";
import { DEFEITOS_INICIAIS } from "../../src/playground/dominio.js";

function montar(props = {}) {
  const onAtualizarStatus = vi.fn();
  const onExcluir = vi.fn();
  render(
    <TabelaDefeitos
      defeitos={DEFEITOS_INICIAIS}
      onAtualizarStatus={onAtualizarStatus}
      onExcluir={onExcluir}
      {...props}
    />
  );
  return { onAtualizarStatus, onExcluir };
}

describe("TabelaDefeitos", () => {
  it("mostra a primeira página com cinco registros", () => {
    montar();
    const corpo = screen.getByTestId("tabela-defeitos").querySelectorAll("tbody tr");
    expect(corpo).toHaveLength(5);
    expect(screen.getByTestId("contagem-resultados")).toHaveTextContent("Exibindo 1–5 de 8");
  });

  it("filtra pela busca ignorando acentos", async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByTestId("filtro-busca"), "relatorio");

    expect(screen.getByTestId("contagem-resultados")).toHaveTextContent("de 2 defeito(s)");
  });

  it("filtra por severidade", async () => {
    const user = userEvent.setup();
    montar();

    await user.selectOptions(screen.getByTestId("filtro-severidade"), "Crítica");

    expect(screen.getByTestId("contagem-resultados")).toHaveTextContent("de 2 defeito(s)");
    expect(screen.getByTestId("linha-BUG-1003")).toBeInTheDocument();
  });

  it("mostra o estado vazio quando nada casa com o filtro", async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByTestId("filtro-busca"), "xyz-nao-existe");

    expect(screen.getByTestId("linha-vazia")).toBeInTheDocument();
    expect(screen.getByTestId("contagem-resultados")).toHaveTextContent("Nenhum defeito encontrado");
  });

  it("o botão Limpar reativa a lista completa", async () => {
    const user = userEvent.setup();
    montar();

    await user.selectOptions(screen.getByTestId("filtro-severidade"), "Baixa");
    await user.click(screen.getByTestId("btn-limpar-filtros"));

    expect(screen.getByTestId("contagem-resultados")).toHaveTextContent("de 8 defeito(s)");
  });

  it("ordena por severidade da mais grave para a menos grave", async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByTestId("ordenar-severidade")); // asc
    await user.click(screen.getByTestId("ordenar-severidade")); // desc

    const primeira = screen.getByTestId("tabela-defeitos").querySelectorAll("tbody tr")[0];
    expect(within(primeira).getByText("Crítica")).toBeInTheDocument();
  });

  it("expõe a direção da ordenação em aria-sort", async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByTestId("ordenar-ocorrencias"));

    const cabecalho = screen.getByTestId("ordenar-ocorrencias").closest("th");
    expect(cabecalho).toHaveAttribute("aria-sort", "ascending");
  });

  it("navega entre as páginas", async () => {
    const user = userEvent.setup();
    montar();

    expect(screen.getByTestId("btn-pagina-anterior")).toBeDisabled();
    await user.click(screen.getByTestId("btn-pagina-proxima"));

    expect(screen.getByTestId("pagina-atual")).toHaveTextContent("Página 2 de 2");
    expect(screen.getByTestId("btn-pagina-proxima")).toBeDisabled();
  });

  it("volta para a página 1 ao aplicar um filtro", async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByTestId("btn-pagina-proxima"));
    await user.selectOptions(screen.getByTestId("filtro-status"), "Aberto");

    expect(screen.getByTestId("pagina-atual")).toHaveTextContent("Página 1 de 1");
  });

  it("avisa a mudança de status para quem renderizou a tabela", async () => {
    const user = userEvent.setup();
    const { onAtualizarStatus } = montar();

    await user.selectOptions(screen.getByTestId("status-BUG-1001"), "Corrigido");

    expect(onAtualizarStatus).toHaveBeenCalledWith("BUG-1001", "Corrigido");
  });

  it("pede confirmação antes de excluir e respeita o cancelamento", async () => {
    const user = userEvent.setup();
    const { onExcluir } = montar();

    await user.click(screen.getByTestId("excluir-BUG-1001"));
    expect(screen.getByTestId("confirmacao-BUG-1001")).toBeInTheDocument();

    await user.click(screen.getByTestId("cancelar-exclusao-BUG-1001"));
    expect(screen.queryByTestId("confirmacao-BUG-1001")).not.toBeInTheDocument();
    expect(onExcluir).not.toHaveBeenCalled();
  });

  it("exclui quando a confirmação é aceita", async () => {
    const user = userEvent.setup();
    const { onExcluir } = montar();

    await user.click(screen.getByTestId("excluir-BUG-1002"));
    await user.click(screen.getByTestId("confirmar-exclusao-BUG-1002"));

    expect(onExcluir).toHaveBeenCalledWith("BUG-1002");
  });

  it("atualiza o resumo por severidade conforme o filtro", async () => {
    const user = userEvent.setup();
    montar();

    expect(screen.getByTestId("resumo-Crítica")).toHaveTextContent("2");

    await user.selectOptions(screen.getByTestId("filtro-modulo"), "Login");

    expect(screen.getByTestId("resumo-Crítica")).toHaveTextContent("1");
  });
});
