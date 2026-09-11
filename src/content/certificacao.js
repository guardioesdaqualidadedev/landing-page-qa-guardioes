// ─────────────────────────────────────────────────────────────────────────────
// Trilha do certificado — o caminho completo entre abrir o playground e receber
// o PDF assinado pela comunidade.
//
// Todo o texto que a aba "Certificado" exibe mora aqui. É conteúdo, não layout:
// mudou uma regra de entrega ou um critério de validação, muda este arquivo e
// a página acompanha.
//
// A terminologia segue o syllabus CTFL 4.0 (capítulos 1.4 e 5.3): caso de teste,
// condição prévia, dados de teste, resultado esperado, resultado real e status
// de execução. É de propósito — quem preencher este documento está treinando o
// vocabulário que vai encontrar na prova e no primeiro emprego.
// ─────────────────────────────────────────────────────────────────────────────

// Quanto tempo a comunidade leva para avaliar uma entrega.
export const PRAZO_VALIDACAO = "5 dias úteis";

// Carga horária que o certificado atesta — o mesmo número do gerador de PDF
// em `scripts/gerar-certificado.mjs`. Os dois precisam contar a mesma história.
export const CARGA_HORARIA = 4;

// ─── As sete etapas, em ordem ────────────────────────────────────────────────
export const ETAPAS = [
  {
    n: "01",
    titulo: "Conheça as três abas antes de testar",
    resumo: "Explore o Guardião Tracker sem pressa e sem documentar nada ainda.",
    detalhes: [
      "Abra cada aba, clique em tudo e quebre à vontade. Nada é salvo: recarregar a página devolve o sistema ao estado inicial.",
      "Esta primeira passada é teste exploratório — no CTFL, teste baseado em experiência. Ela serve para você entender o produto antes de projetar os casos.",
      "Só depois de conhecer a tela é que você começa a escrever o documento.",
    ],
  },
  {
    n: "02",
    titulo: "Escreva os casos de teste ANTES de executar",
    resumo: "Os 12 cenários da aba “Cenários de teste” são a sua suíte.",
    detalhes: [
      "Abra o documento no Word ou no Google Docs e escreva os 12 casos seguindo o modelo desta página — passos e resultado esperado preenchidos, resultado real ainda em branco.",
      "Escrever antes é o que separa teste de “clicar e ver o que acontece”: o resultado esperado precisa vir do entendimento das regras, não da tela que você acabou de ver.",
      "A aba “Cenários de teste” já entrega o título, a técnica e o resultado esperado de cada um. Seu trabalho é detalhar os passos e os dados de teste.",
    ],
  },
  {
    n: "03",
    titulo: "Restaure a massa antes de cada cenário",
    resumo: "É a sua condição prévia — sem ela o resultado não é reproduzível.",
    detalhes: [
      "Clique em “↺ Restaurar massa de dados” antes de começar cada caso. A tabela volta aos registros iniciais, e o vídeo passa a mostrar um ponto de partida conhecido.",
      "Sem isso, um cenário contamina o outro: você exclui um registro no caso 11 e a paginação do caso 10 se comporta de outro jeito.",
      "Comece a gravação com a massa já restaurada — quem for validar precisa ver de onde você partiu.",
    ],
  },
  {
    n: "04",
    titulo: "Execute gravando a tela",
    resumo: "Um vídeo por caso de teste, do começo ao resultado.",
    detalhes: [
      "Grave a janela inteira do navegador, não só o campo que você está preenchendo.",
      "Execute os passos exatamente como estão escritos no documento. Se precisar mudar o passo, mude no documento também.",
      "Não corte o final: o vídeo tem que terminar mostrando o resultado na tela — a mensagem de erro, o registro novo no topo da tabela, o filtro aplicado.",
    ],
  },
  {
    n: "05",
    titulo: "Feche o documento com o resultado real",
    resumo: "Descreva o que aconteceu e marque Passou, Falhou ou Bloqueado.",
    detalhes: [
      "Preencha o resultado real de cada caso com o que você viu de fato — a mensagem exata, o número de erros, a ordem das linhas. “Ok” não é resultado real.",
      "Encontrou divergência entre o esperado e o real? Marque Falhou e descreva. Isso não reprova a sua entrega: achar divergência é exatamente o trabalho.",
      "Cada caso precisa apontar o nome do arquivo de vídeo que comprova o resultado.",
    ],
  },
  {
    n: "06",
    titulo: "Publique tudo no seu Google Drive",
    resumo: "Uma pasta com o documento e os vídeos, compartilhada por link.",
    detalhes: [
      "Monte a pasta na estrutura sugerida nesta página e suba o documento em PDF junto com os 12 vídeos.",
      "Compartilhe com a permissão “Qualquer pessoa com o link · Leitor”. Link privado trava a validação e a entrega volta para você.",
      "Teste o próprio link numa janela anônima antes de enviar. É o mesmo princípio de testar o que você entrega.",
    ],
  },
  {
    n: "07",
    titulo: "Envie o link a um administrador",
    resumo: "A validação é do Douglas, e o certificado vem em seguida.",
    detalhes: [
      "Mande o link para qualquer administrador da comunidade pelo Discord ou pelo WhatsApp, com o seu nome completo do jeito que deve sair impresso no certificado.",
      `O Douglas revisa a entrega em até ${PRAZO_VALIDACAO}. Se faltar alguma coisa, você recebe de volta o que ajustar — e reenviar é normal, não é reprovação.`,
      "Aprovado, o certificado em PDF chega pelo mesmo canal em que você enviou o link.",
    ],
  },
];

// ─── O que cada aba do playground é, e o que testar nela ─────────────────────
export const ABAS_EXPLICADAS = [
  {
    id: "registrar",
    rotulo: "Registrar defeito",
    oQueE:
      "O formulário de abertura de defeito do Guardião Tracker: 10 campos com validação real, do título ao aceite das diretrizes. Ao lado dele fica o painel “Regras de validação”, que lista todos os limites — de 5 a 80 caracteres no título, de 1 a 999 ocorrências, data que não pode ser futura, e assim por diante.",
    oQueTestar:
      "É aqui que você exercita as técnicas de caixa-preta: análise de valor limite nos campos com faixa, partição de equivalência no e-mail, campo obrigatório no envio vazio e regra de negócio na data de detecção.",
    atencao:
      "O painel de regras é a sua especificação. O resultado esperado de cada caso sai dele — não do que a tela faz. Se a tela divergir do painel, você encontrou um defeito.",
    cenarios: ["c1", "c2", "c3", "c4", "c5", "c6", "c7"],
  },
  {
    id: "tabela",
    rotulo: "Tabela de defeitos",
    oQueE:
      "A listagem dos defeitos, com o resumo por severidade no topo, busca livre, três filtros (severidade, status e módulo), ordenação por coluna, paginação e duas ações por linha: trocar o status e excluir com confirmação.",
    oQueTestar:
      "Consulta e manipulação de dados: busca que ignora acento, filtros combinados, ordenação por severidade — que precisa ser Crítica primeiro, e não a ordem alfabética —, comportamento da paginação e a confirmação da ação destrutiva.",
    atencao:
      "Combinações importam. Filtrar estando na última página e mudar o status de um registro que o filtro atual mostra são os dois pontos onde esse tipo de tela costuma falhar de verdade.",
    cenarios: ["c8", "c9", "c10", "c11", "c12"],
  },
  {
    id: "cenarios",
    rotulo: "Cenários de teste",
    oQueE:
      "O roteiro da sua sessão: os 12 cenários, cada um com a técnica de teste que ele treina e o resultado esperado já declarado. Marcar a caixa alimenta a barra de progresso do topo.",
    oQueTestar:
      "Esta aba não é objeto de teste — é o seu plano. Use-a como índice: o cenário c1 vira o caso CT-01 do seu documento, e assim por diante.",
    atencao:
      "As caixas marcadas somem quando você recarrega a página, e nada delas é enviado a lugar nenhum. Elas não valem como evidência: o que comprova a sua execução é o vídeo e o documento.",
    cenarios: [],
  },
];

// O botão fica fora das abas, no canto direito — e é o mais ignorado dos três.
export const BOTAO_RESTAURAR = {
  rotulo: "↺ Restaurar massa de dados",
  oQueFaz:
    "Devolve a tabela aos registros iniciais: apaga os defeitos que você criou e traz de volta os que você excluiu ou alterou.",
  porQueImporta:
    "É o que garante a repetibilidade da sua execução. No vocabulário do CTFL, ele estabelece a condição prévia de cada caso de teste: quem assistir ao seu vídeo tem que conseguir refazer o mesmo caminho e chegar ao mesmo lugar.",
  quandoUsar:
    "Sempre no início da gravação de cada cenário, antes do primeiro clique que conta. Recarregar a página faz o mesmo efeito.",
};

// ─── Gravação das evidências ─────────────────────────────────────────────────
export const COMO_GRAVAR = {
  ferramentas: [
    { onde: "Windows", como: "Xbox Game Bar — tecla Windows + Alt + R" },
    { onde: "macOS", como: "Shift + Command + 5, opção “Gravar a tela inteira”" },
    { onde: "Linux", como: "OBS Studio ou o gravador do GNOME (Ctrl + Alt + Shift + R)" },
    { onde: "Qualquer sistema", como: "Loom, Screencastify ou a gravação de tela do Google Meet" },
  ],
  regras: [
    {
      titulo: "Uma gravação por caso de teste",
      texto:
        "Doze arquivos, não um vídeo de quarenta minutos. Quem valida precisa abrir o caso CT-07 e ver só o CT-07.",
    },
    {
      titulo: "Comece pela massa restaurada",
      texto:
        "O primeiro clique do vídeo é o “Restaurar massa de dados”. É o que prova que o ponto de partida era o estado inicial.",
    },
    {
      titulo: "Tela cheia do navegador, 1280×720 no mínimo",
      texto:
        "Não recorte só o campo. A validação precisa enxergar a URL, a aba aberta e a tela inteira para entender o contexto.",
    },
    {
      titulo: "Termine no resultado, sem cortar",
      texto:
        "A mensagem de erro, o registro novo no topo, a tabela reordenada — o último quadro do vídeo é a evidência. Deixe dois ou três segundos parado nela.",
    },
    {
      titulo: "Sem pressa no preenchimento",
      texto:
        "Digitar rápido demais deixa o vídeo ilegível. Se um campo é o alvo do caso, dê tempo de quem assiste ler o que você digitou.",
    },
    {
      titulo: "Narração é opcional",
      texto:
        "Você não precisa falar. Quem explica o teste é o documento; o vídeo só comprova que aconteceu. Se quiser narrar, melhor ainda.",
    },
    {
      titulo: "Nomeie pelo ID do caso",
      texto:
        "CT-01-valor-limite-titulo.mp4. O nome do arquivo tem que bater com o campo “Evidência” do documento.",
    },
    {
      titulo: "De um a três minutos cada",
      texto:
        "Vídeo curto é sinal de caso bem projetado. Se passou de cinco minutos, provavelmente você juntou dois casos em um.",
    },
  ],
};

// ─── O modelo do documento ───────────────────────────────────────────────────

// Cabeçalho: identifica quem testou, onde e com quê. No CTFL isso é parte do
// relatório de progresso de teste (capítulo 5.3).
export const CABECALHO_DOCUMENTO = [
  { campo: "Título do documento", exemplo: "Relatório de Testes — Playground Guardião Tracker" },
  { campo: "Nome completo", exemplo: "Como deve sair impresso no certificado" },
  { campo: "E-mail e usuário no Discord", exemplo: "maria@email.com · maria_qa" },
  { campo: "Data de execução", exemplo: "11/09/2026" },
  { campo: "URL testada", exemplo: "https://comunidade-qa-guardioes.web.app/playground" },
  { campo: "Navegador e versão", exemplo: "Chrome 129 · Windows 11" },
  { campo: "Resumo da execução", exemplo: "12 casos executados · 11 Passou · 1 Falhou · 0 Bloqueado" },
];

// Os campos de cada caso, com o nome que o syllabus usa entre parênteses.
export const CAMPOS_CASO_TESTE = [
  {
    campo: "ID e título",
    obrigatorio: true,
    explicacao: "CT-01 até CT-12, na ordem dos cenários da aba. O título é o do cenário.",
  },
  {
    campo: "Técnica aplicada",
    obrigatorio: true,
    explicacao:
      "A que a aba já indica: análise de valor limite, partição de equivalência, regra de negócio, acessibilidade, e assim por diante.",
  },
  {
    campo: "Condição prévia",
    obrigatorio: true,
    explicacao:
      "O estado em que o sistema precisa estar antes do primeiro passo. Quase sempre: massa restaurada e aba X aberta.",
  },
  {
    campo: "Dados de teste",
    obrigatorio: true,
    explicacao:
      "Os valores exatos que você vai usar. Em um caso de valor limite, são eles o caso: 4, 5, 80 e 81 caracteres.",
  },
  {
    campo: "Passos",
    obrigatorio: true,
    explicacao:
      "Numerados, uma ação por linha, no imperativo. Alguém que nunca viu a tela tem que conseguir repetir.",
  },
  {
    campo: "Resultado esperado",
    obrigatorio: true,
    explicacao:
      "O que deve acontecer segundo as regras — escrito antes de executar. Específico: qual mensagem, em qual campo.",
  },
  {
    campo: "Resultado real",
    obrigatorio: true,
    explicacao: "O que aconteceu de fato, com as palavras que apareceram na tela. Preenchido durante a execução.",
  },
  {
    campo: "Status",
    obrigatorio: true,
    explicacao:
      "Passou quando o real bate com o esperado; Falhou quando diverge; Bloqueado quando não deu para executar.",
  },
  {
    campo: "Evidência",
    obrigatorio: true,
    explicacao: "O nome do arquivo de vídeo, e o minuto do resultado se a gravação for longa.",
  },
  {
    campo: "Observações",
    obrigatorio: false,
    explicacao: "Espaço livre: o que te surpreendeu, uma dúvida sobre a regra, uma sugestão de melhoria.",
  },
];

// O modelo em texto puro — a página oferece um botão que copia isto para a área
// de transferência, pronto para colar no Word ou no Google Docs.
export const MODELO_DOCUMENTO = `RELATÓRIO DE TESTES — PLAYGROUND GUARDIÃO TRACKER
QA's Guardiões do Software

Nome completo:
E-mail / Discord:
Data de execução:
URL testada: https://comunidade-qa-guardioes.web.app/playground
Navegador e versão:
Sistema operacional:

Resumo da execução: 12 casos · __ Passou · __ Falhou · __ Bloqueado

════════════════════════════════════════════════════════════

CT-01 — Título com 4, 5, 80 e 81 caracteres
Técnica aplicada: Análise de valor limite
Condição prévia: Massa de dados restaurada; aba "Registrar defeito" aberta.
Dados de teste: títulos com 4, 5, 80 e 81 caracteres

Passos:
  1. Clicar em "Restaurar massa de dados".
  2. Preencher o campo Título com um texto de 4 caracteres.
  3. Preencher os demais campos obrigatórios com dados válidos.
  4. Clicar em "Registrar defeito".
  5. Repetir os passos 2 a 4 com 5, 80 e 81 caracteres.

Resultado esperado:
  Títulos de 4 e 81 caracteres são rejeitados com mensagem de erro no campo
  Título. Títulos de 5 e 80 caracteres são aceitos e o defeito é registrado.

Resultado real:
  (preencher durante a execução, com a mensagem exata que apareceu na tela)

Status: Passou / Falhou / Bloqueado
Evidência: CT-01-valor-limite-titulo.mp4
Observações:

════════════════════════════════════════════════════════════

CT-02 — E-mail sem @, sem domínio e com espaço no meio
Técnica aplicada: Partição de equivalência
Condição prévia:
Dados de teste:

Passos:
  1.
  2.

Resultado esperado:
Resultado real:
Status:
Evidência:
Observações:

════════════════════════════════════════════════════════════

(repita o bloco até CT-12, seguindo a ordem da aba "Cenários de teste")

════════════════════════════════════════════════════════════

CONCLUSÃO

Casos executados:
Casos que passaram:
Casos que falharam:
Divergências encontradas:
Observações gerais sobre a sessão:
`;

// ─── Entrega no Drive ────────────────────────────────────────────────────────
export const ESTRUTURA_DRIVE = `Certificado QA Guardiões — Maria Aparecida de Souza/
├── Relatorio-de-Testes-Maria-Aparecida-de-Souza.pdf
└── evidencias/
    ├── CT-01-valor-limite-titulo.mp4
    ├── CT-02-particao-equivalencia-email.mp4
    ├── CT-03-valor-limite-ocorrencias.mp4
    ├── CT-04-regra-negocio-data-futura.mp4
    ├── CT-05-campos-obrigatorios.mp4
    ├── CT-06-acessibilidade-teclado.mp4
    ├── CT-07-fluxo-feliz.mp4
    ├── CT-08-busca-sem-acento.mp4
    ├── CT-09-ordenacao-severidade.mp4
    ├── CT-10-paginacao-com-filtro.mp4
    ├── CT-11-exclusao-cancelada.mp4
    └── CT-12-mudanca-de-status.mp4`;

export const PASSOS_COMPARTILHAMENTO = [
  "Crie a pasta no seu Google Drive com o nome “Certificado QA Guardiões — Seu Nome Completo”.",
  "Suba o relatório em PDF na raiz da pasta e os 12 vídeos dentro de uma subpasta “evidencias”.",
  "Clique com o botão direito na pasta principal e escolha “Compartilhar”.",
  "Em “Acesso geral”, troque “Restrito” por “Qualquer pessoa com o link”.",
  "Deixe a permissão como “Leitor” — ninguém precisa editar a sua entrega.",
  "Copie o link e abra-o numa janela anônima para confirmar que ele realmente abre.",
  "Envie o link a um administrador pelo Discord ou WhatsApp, junto com o seu nome completo.",
];

// ─── O que o Douglas confere ─────────────────────────────────────────────────
export const CRITERIOS_VALIDACAO = [
  {
    criterio: "Os 12 casos documentados",
    detalhe: "Todos os campos obrigatórios preenchidos, nenhum caso em branco.",
  },
  {
    criterio: "12 vídeos, um por caso",
    detalhe: "Legíveis, começando pela massa restaurada e terminando no resultado.",
  },
  {
    criterio: "Resultado real descrito de verdade",
    detalhe: "Com a mensagem que apareceu na tela. “Ok” e “funcionou” voltam para revisão.",
  },
  {
    criterio: "Resultado esperado coerente com as regras",
    detalhe: "Tirado do painel de validação, não copiado da tela depois do fato.",
  },
  {
    criterio: "Nome do vídeo batendo com o campo Evidência",
    detalhe: "Cada caso aponta para um arquivo que existe na pasta.",
  },
  {
    criterio: "Link do Drive acessível",
    detalhe: "Aberto para qualquer pessoa com o link, em modo leitor.",
  },
];

export const NAO_REPROVA = [
  "Encontrar divergência entre o esperado e o real — é o objetivo do exercício, não um erro seu.",
  "Marcar um caso como Falhou, desde que você descreva o que aconteceu.",
  "Reenviar a entrega depois de um ajuste pedido na revisão.",
  "Escrever passos com as suas palavras, contanto que dê para repetir.",
];
