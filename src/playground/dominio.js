// ─────────────────────────────────────────────────────────────────────────────
// Playground QA — domínio do sistema fake "Guardião Tracker".
//
// Listas de opções e a massa inicial de dados. Ficam separadas dos componentes
// para os testes unitários poderem usar as mesmas constantes que a tela usa —
// se alguém acrescentar uma severidade, o teste acompanha sozinho.
// ─────────────────────────────────────────────────────────────────────────────

export const SEVERIDADES = ["Crítica", "Alta", "Média", "Baixa"];
export const PRIORIDADES = ["P1", "P2", "P3"];
export const AMBIENTES = ["Produção", "Homologação", "Desenvolvimento"];
export const MODULOS = ["Login", "Cadastro", "Pagamentos", "Relatórios", "Notificações", "API"];
export const STATUS = ["Aberto", "Em análise", "Corrigido", "Reprovado"];

// Peso usado na ordenação por severidade: ordenar alfabeticamente colocaria
// "Alta" antes de "Crítica", o que não é o que a pessoa espera ao clicar.
export const PESO_SEVERIDADE = { "Crítica": 4, Alta: 3, "Média": 2, Baixa: 1 };

export const DEFEITOS_INICIAIS = [
  {
    id: "BUG-1001",
    titulo: "Login aceita senha com espaços no início",
    modulo: "Login",
    severidade: "Alta",
    prioridade: "P1",
    ambiente: "Produção",
    status: "Aberto",
    reporter: "camila@guardioes.dev",
    data: "2026-08-28",
    ocorrencias: 12,
    passos: "1. Abrir a tela de login. 2. Informar a senha com um espaço à frente. 3. Confirmar que o acesso é concedido.",
  },
  {
    id: "BUG-1002",
    titulo: "Relatório mensal exporta CSV sem cabeçalho",
    modulo: "Relatórios",
    severidade: "Média",
    prioridade: "P2",
    ambiente: "Homologação",
    status: "Em análise",
    reporter: "amanda@guardioes.dev",
    data: "2026-08-30",
    ocorrencias: 4,
    passos: "1. Acessar Relatórios. 2. Selecionar o mês corrente. 3. Exportar em CSV e abrir o arquivo.",
  },
  {
    id: "BUG-1003",
    titulo: "Pagamento em duplicidade ao clicar duas vezes",
    modulo: "Pagamentos",
    severidade: "Crítica",
    prioridade: "P1",
    ambiente: "Produção",
    status: "Aberto",
    reporter: "douglas@guardioes.dev",
    data: "2026-09-01",
    ocorrencias: 27,
    passos: "1. Iniciar um pagamento. 2. Clicar em Confirmar duas vezes rapidamente. 3. Observar dois lançamentos.",
  },
  {
    id: "BUG-1004",
    titulo: "Notificação por e-mail chega sem o nome do usuário",
    modulo: "Notificações",
    severidade: "Baixa",
    prioridade: "P3",
    ambiente: "Homologação",
    status: "Corrigido",
    reporter: "camila@guardioes.dev",
    data: "2026-08-19",
    ocorrencias: 2,
    passos: "1. Criar um usuário novo. 2. Disparar a notificação de boas-vindas. 3. Conferir o corpo do e-mail.",
  },
  {
    id: "BUG-1005",
    titulo: "API retorna 200 mesmo com payload inválido",
    modulo: "API",
    severidade: "Alta",
    prioridade: "P2",
    ambiente: "Desenvolvimento",
    status: "Em análise",
    reporter: "douglas@guardioes.dev",
    data: "2026-09-03",
    ocorrencias: 9,
    passos: "1. Enviar POST /pedidos sem o campo obrigatório valor. 2. Observar o status 200 na resposta.",
  },
  {
    id: "BUG-1006",
    titulo: "Cadastro permite CEP com letras",
    modulo: "Cadastro",
    severidade: "Média",
    prioridade: "P3",
    ambiente: "Produção",
    status: "Reprovado",
    reporter: "amanda@guardioes.dev",
    data: "2026-07-22",
    ocorrencias: 1,
    passos: "1. Abrir o cadastro. 2. Digitar ABC12345 no campo CEP. 3. Salvar e observar que o registro é aceito.",
  },
  {
    id: "BUG-1007",
    titulo: "Sessão não expira após 30 minutos de inatividade",
    modulo: "Login",
    severidade: "Crítica",
    prioridade: "P1",
    ambiente: "Produção",
    status: "Aberto",
    reporter: "douglas@guardioes.dev",
    data: "2026-09-05",
    ocorrencias: 18,
    passos: "1. Autenticar no sistema. 2. Deixar a aba aberta por 40 minutos. 3. Recarregar e observar a sessão ativa.",
  },
  {
    id: "BUG-1008",
    titulo: "Filtro de relatórios ignora o segundo critério",
    modulo: "Relatórios",
    severidade: "Baixa",
    prioridade: "P3",
    ambiente: "Homologação",
    status: "Corrigido",
    reporter: "camila@guardioes.dev",
    data: "2026-08-11",
    ocorrencias: 3,
    passos: "1. Abrir Relatórios. 2. Aplicar filtro de status e de período juntos. 3. Observar que só o primeiro é considerado.",
  },
];

// Gera o próximo identificador na sequência BUG-XXXX a partir da lista atual.
export function proximoId(lista) {
  const maior = lista.reduce((max, d) => {
    const n = Number(String(d.id).replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 1000);
  return `BUG-${maior + 1}`;
}
