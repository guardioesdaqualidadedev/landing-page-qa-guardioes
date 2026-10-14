// ─────────────────────────────────────────────────────────────────────────────
// Conteúdo da comunidade — extraído do Documento Oficial v1.0 (setembro/2026).
//
// Tudo que a landing page exibe mora aqui. Assim, atualizar um canal, um número
// ou uma regra é editar um objeto — não caçar texto no meio do JSX.
// ─────────────────────────────────────────────────────────────────────────────

export const LINKS = {
  linkedin: "https://www.linkedin.com/company/guardioesqa/",
  discord: "https://discord.gg/7aA3C2MxzD",
  // Conta que hospeda o código aberto da comunidade — inclusive o deste site.
  github: "https://github.com/guardioesdaqualidadedev",
  whatsapp: "https://chat.whatsapp.com/I5iW4tCcwcj5Ng1OxRsgPr",
  manifestoOriginal: "https://agilemanifesto.org/iso/ptbr/manifesto.html",
};

export const PRINCIPIO_CHAVE = {
  frase: "O WhatsApp avisa. O Discord aprofunda.",
  explicacao:
    "Se a mensagem precisa ser lida hoje e some amanhã, é WhatsApp. Se alguém pode querer encontrar aquilo daqui a três meses, é Discord.",
};

export const MISSAO =
  "Ser um espaço gratuito, organizado e seguro onde profissionais de QA aprendem com prática real, trocam experiência sem hierarquia e encontram oportunidades — do primeiro emprego à especialização em automação e qualidade.";

// `falado`: como o leitor de tela deve dizer o valor, quando a forma escrita
// é abreviada ("24h" vira "vinte e quatro agá" no NVDA).
export const STATS = [
  { valor: "8", label: "Canais no Discord" },
  { valor: "6", label: "Grupos no WhatsApp" },
  { valor: "100%", label: "Gratuita e aberta" },
  { valor: "24h", falado: "24 horas", label: "Meta de resposta a dúvidas" },
];

export const OBJETIVOS = [
  {
    n: "01",
    titulo: "Aprendizado contínuo e prático",
    onde: "#duvidas · #automações · Dúvidas (WhatsApp)",
    indicador: "Percentual de dúvidas respondidas em até 24h",
  },
  {
    n: "02",
    titulo: "Empregabilidade real",
    onde: "#oportunidades-de-emprego · VAGAS E JOBS · #banco-curriculos",
    indicador: "Vagas publicadas por mês e contratações reportadas",
  },
  {
    n: "03",
    titulo: "Networking profissional genuíno",
    onde: "#networking-linkedin (nas duas plataformas)",
    indicador: "Conexões relatadas e participação em eventos",
  },
  {
    n: "04",
    titulo: "Produção de conteúdo próprio",
    onde: "#automações · #novidades-de-qa",
    indicador: "Publicações autorais por mês",
  },
  {
    n: "05",
    titulo: "Formação de novos QAs",
    onde: "#duvidas · mentorias e eventos",
    indicador: "Iniciantes que passam a responder outras pessoas",
  },
  {
    n: "06",
    titulo: "Ambiente seguro e moderado",
    onde: "Todos os canais · #feedbacks-melhorias",
    indicador: "Tempo médio de resposta a feedback e a incidentes",
  },
];

export const CANAIS_DISCORD = [
  { nome: "#geral", frase: "Porta de entrada e convivência", tipo: "Conversa aberta, apresentações" },
  { nome: "#duvidas", frase: "Onde se pergunta sem medo", tipo: "Perguntas técnicas e de carreira" },
  { nome: "#novidades-de-qa", frase: "O que mudou no mundo de QA", tipo: "Notícias, releases, artigos" },
  { nome: "#oportunidades-de-emprego", frase: "Vaga com nome, link e critério", tipo: "Divulgação de vagas" },
  { nome: "#banco-curriculos", frase: "Quem está disponível no mercado", tipo: "Mini-perfis profissionais" },
  { nome: "#feedbacks-melhorias", frase: "A comunidade se corrigindo", tipo: "Sugestões e críticas" },
  { nome: "#automações", frase: "O canal técnico pesado", tipo: "Código, frameworks, CI/CD" },
  { nome: "#networking-linkedin", frase: "Conexão profissional", tipo: "Perfis e interação no LinkedIn" },
];

export const GRUPOS_WHATSAPP = [
  { nome: "Avisos", frase: "Megafone oficial da comunidade", quem: "Somente administradores" },
  { nome: "ADMINS - Comunidade QA", frase: "Bastidor da gestão", quem: "Somente administradores" },
  { nome: "Conversas Gerais | QA", frase: "Convivência e assuntos abertos", quem: "Todos os membros" },
  { nome: "QA's - VAGAS E JOBS", frase: "Vagas com template obrigatório", quem: "Todos, sob regra" },
  { nome: "Dúvidas", frase: "Perguntas rápidas do dia a dia", quem: "Todos os membros" },
  { nome: "networking-linkedin", frase: "Conexão profissional", quem: "Todos, sob regra" },
];

// Tabela de roteamento oficial (Seção 5.2 do documento).
export const ROTEAMENTO = [
  ["Aviso oficial da comunidade", "WhatsApp — Avisos", "Discord — #avisos, fixado"],
  ["Vaga de emprego", "Pode nascer nas duas", "Discord — #oportunidades-de-emprego"],
  ["Currículo / perfil profissional", "Só Discord", "Discord — #banco-curriculos"],
  ["Dúvida rápida (até 3 mensagens)", "WhatsApp — Dúvidas", "Resolve no WhatsApp mesmo"],
  ["Dúvida com código, log ou print", "Onde surgir", "Discord — #duvidas, em thread"],
  ["Notícia, release, artigo", "Só Discord", "Discord — #novidades-de-qa"],
  ["Conteúdo técnico de automação", "Só Discord", "Discord — #automações"],
  ["Sugestão sobre a comunidade", "Onde surgir", "Discord — #feedbacks-melhorias"],
  ["Evento, live, mentoria", "Divulga no WhatsApp", "Discord — recurso Eventos"],
];

export const PERFIS = [
  {
    perfil: "Iniciante ou em transição",
    busca: "Entender por onde começar, perder o medo de perguntar, primeira vaga",
    entrega: "#duvidas com resposta garantida, trilhas de estudo e mentoria em eventos",
  },
  {
    perfil: "QA pleno",
    busca: "Sair do manual, aprender automação de verdade, comparar ferramentas",
    entrega: "#automações, série de artigos, dojos e repositórios de exemplo",
  },
  {
    perfil: "QA sênior ou especialista",
    busca: "Discussão técnica de nível, visibilidade e retribuir",
    entrega: "Espaço para publicar conteúdo autoral, conduzir dojos e ser referência",
  },
  {
    perfil: "Em recolocação",
    busca: "Vaga real, currículo visto, preparação para entrevista",
    entrega: "Canal de vagas curado, banco de currículos e simulações de entrevista",
  },
  {
    perfil: "Recrutador",
    busca: "Encontrar talento de QA qualificado",
    entrega: "Banco de currículos e canal de vagas com regra clara e cadastro prévio",
  },
  {
    perfil: "Voluntário e administração",
    busca: "Construir algo que dure, sem se esgotar",
    entrega: "Papéis definidos, backup por canal, rotatividade e porta de saída",
  },
];

export const REGRAS = [
  "Respeito acima de tudo. Aqui não existe pergunta boba.",
  "Cada assunto no seu canal. Postou no lugar errado, a moderação redireciona — sem drama.",
  "O Discord é a casa oficial. Tudo que precisa durar termina lá.",
  "Nada de spam, corrente, MMN, link de afiliado ou venda de curso sem autorização.",
  "Vaga só no template oficial, com link de aplicação. Vaga que cobra do candidato é removida na hora.",
  "Não exponha dados sensíveis: nem seus, nem do seu empregador.",
  "Não peça, nem entregue, teste técnico ou tarefa pronta. Orientar sim, fazer no lugar não.",
  "Autopromoção com moderação: no máximo um post por pessoa a cada 7 dias.",
  "Sem política partidária, religião ou conteúdo adulto.",
  "Crítica é bem-vinda — no #feedbacks-melhorias.",
];

export const NAO_SOMOS = [
  "Vitrine de infoproduto, mentoria paga ou link de afiliado",
  "Suporte gratuito para resolver o teste técnico de outra pessoa",
  "Canal de denúncia nominal contra empresas ou profissionais",
  "Espaço para código, dados ou processos internos do seu empregador",
  "Grupo de engajamento mútuo automático no LinkedIn",
];

export const ADMINS = [
  {
    nome: "Douglas",
    onde: "Discord",
    papeis: ["Administração do Discord", "Conteúdo", "Instrutor"],
    escopo: "Estrutura, permissões e moderação dos canais; conteúdo técnico em #automações e #novidades-de-qa",
    linkedin: "https://www.linkedin.com/in/douglas-adriano-queiroz-ctfl-680b1978/",
  },
  {
    nome: "Camila",
    onde: "WhatsApp e LinkedIn",
    papeis: ["Administração do WhatsApp", "Presença digital", "Conteúdo"],
    escopo: "Grupos do WhatsApp e grupo Avisos; presença pública e calendário de publicação no LinkedIn",
    linkedin: "https://www.linkedin.com/in/camila-lopes-ferreira-carvalho43235429/",
  },
  {
    nome: "Gabriel",
    onde: "WhatsApp",
    papeis: ["Administração do WhatsApp"],
    escopo: "Grupos do WhatsApp: acolhimento de quem entra, moderação do dia a dia e roteamento das conversas para o canal certo",
    linkedin: "https://www.linkedin.com/in/gabriel-rocc%C3%A0-32a978421/",
  },
  {
    nome: "Patrícia",
    onde: "WhatsApp",
    papeis: ["Administração do WhatsApp"],
    escopo: "Grupos do WhatsApp: acolhimento de quem entra, moderação do dia a dia e roteamento das conversas para o canal certo",
    linkedin: "https://www.linkedin.com/in/patricia-silva-correa/",
  },
];

// Administração afastada temporariamente — não aparece no site. Para voltar,
// basta mover o cartão de novo para ADMINS (a posição na lista é a ordem na
// tela). A Amanda saiu em outubro de 2026.
export const ADMINS_AFASTADOS = [
  {
    nome: "Amanda",
    onde: "WhatsApp e Design",
    papeis: ["Liderança de Design", "Administração do WhatsApp"],
    escopo:
      "Direção visual da comunidade — identidade, peças de divulgação e consistência da marca em todos os canais; moderação dos grupos do WhatsApp",
    linkedin: "https://www.linkedin.com/in/amanda-marino-28b34a324/",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Parceiros — iniciativas que caminham junto com a comunidade.
//
// A vitrine é um carrossel desde o primeiro parceiro: entra o segundo e não há
// layout para refazer, só um item nesta lista.
// ─────────────────────────────────────────────────────────────────────────────
export const PARCEIROS = [
  {
    id: "garapuvu",
    nome: "Projeto Social Garapuvu",
    chamada: "Formação gratuita em tecnologia e qualidade de software",
    descricao:
      "Projeto social que abre a porta da tecnologia para quem não teria como pagar por ela: aulas gratuitas, material aberto e acompanhamento de quem está dando os primeiros passos em desenvolvimento e em QA.",
    links: [
      { tipo: "site", rotulo: "Site do projeto", href: "https://projeto-garapuvu.web.app/" },
      {
        tipo: "youtube",
        rotulo: "Canal no YouTube",
        href: "https://www.youtube.com/channel/UCST9VOQUtVUC2A2enxcJsQQ",
      },
    ],
  },
];

export const METRICAS = [
  { indicador: "Membros ativos por semana", porque: "Total de membros engana; ativo é o número real" },
  { indicador: "Taxa de resposta em dúvidas", porque: "É a promessa central da comunidade" },
  { indicador: "Vagas publicadas e encerradas", porque: "Mede o valor prático entregue" },
  { indicador: "Contratações reportadas", porque: "É o indicador de impacto real" },
  { indicador: "Conteúdo autoral publicado", porque: "Mede se o diferencial está vivo" },
  { indicador: "Feedbacks respondidos", porque: "Mede se a escuta é real ou decorativa" },
];
