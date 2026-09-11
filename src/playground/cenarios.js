// Cenários sugeridos para quem está praticando teste manual no playground.
// Cada um aponta a técnica por trás — é material de estudo, não só checklist.
export const CENARIOS = [
  {
    id: "c1",
    tecnica: "Valor limite",
    titulo: "Título com 4, 5, 80 e 81 caracteres",
    esperado: "4 e 81 devem ser rejeitados; 5 e 80 devem passar.",
  },
  {
    id: "c2",
    tecnica: "Partição de equivalência",
    titulo: "E-mail sem @, sem domínio e com espaço no meio",
    esperado: "Todos rejeitados com a mesma mensagem de formato.",
  },
  {
    id: "c3",
    tecnica: "Valor limite",
    titulo: "Ocorrências com 0, 1, 999 e 1000",
    esperado: "0 e 1000 rejeitados; 1 e 999 aceitos.",
  },
  {
    id: "c4",
    tecnica: "Regra de negócio",
    titulo: "Data de detecção no futuro",
    esperado: "Rejeitada com mensagem específica sobre data futura.",
  },
  {
    id: "c5",
    tecnica: "Campo obrigatório",
    titulo: "Enviar o formulário completamente vazio",
    esperado: "Resumo indica 10 campos com erro e o foco vai para o título.",
  },
  {
    id: "c6",
    tecnica: "Acessibilidade",
    titulo: "Navegar o formulário inteiro só pelo teclado (Tab e Enter)",
    esperado: "Todos os campos alcançáveis, com foco visível e erro anunciado.",
  },
  {
    id: "c7",
    tecnica: "Fluxo feliz",
    titulo: "Registrar um defeito válido",
    esperado: "Novo registro aparece no topo da tabela com ID sequencial.",
  },
  {
    id: "c8",
    tecnica: "Filtro e busca",
    titulo: "Buscar por 'relatorio' sem acento",
    esperado: "Encontra os registros de 'Relatórios' — a busca ignora acento.",
  },
  {
    id: "c9",
    tecnica: "Ordenação",
    titulo: "Ordenar por severidade em ordem decrescente",
    esperado: "Crítica primeiro — não a ordem alfabética.",
  },
  {
    id: "c10",
    tecnica: "Paginação",
    titulo: "Filtrar estando na última página",
    esperado: "A tabela ajusta para a última página existente, sem ficar vazia.",
  },
  {
    id: "c11",
    tecnica: "Ação destrutiva",
    titulo: "Clicar em Excluir e depois em Cancelar",
    esperado: "O registro permanece na tabela e a confirmação fecha.",
  },
  {
    id: "c12",
    tecnica: "Estado",
    titulo: "Mudar o status de um defeito e aplicar o filtro por esse status",
    esperado: "O registro alterado aparece no filtro novo e some do antigo.",
  },
];
