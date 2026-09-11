// ─────────────────────────────────────────────────────────────────────────────
// Manifesto Ágil de Testes — versão QA's Guardiões do Software
//
// A estrutura segue a forma do Manifesto Ágil original ("X mais que Y", com a
// ressalva final de que há valor nos dois lados). O conteúdo é da comunidade:
// os quatro valores traduzem para o trabalho de QA o que o manifesto original
// diz sobre desenvolvimento de software.
//
// O texto original está em https://agilemanifesto.org/iso/ptbr/manifesto.html
// e é reproduzido na íntegra em ORIGINAL, com o aviso de direitos exigido pelos
// autores.
// ─────────────────────────────────────────────────────────────────────────────

export const ABERTURA =
  "Estamos descobrindo maneiras melhores de garantir qualidade de software, fazendo-o e ajudando outros a fazê-lo. Através deste trabalho, passamos a valorizar:";

export const FECHAMENTO =
  "Mesmo havendo valor nos itens à direita, valorizamos mais os itens à esquerda.";

export const VALORES = [
  {
    n: "01",
    esquerda: "Qualidade construída pelo time",
    direita: "defeitos encontrados no fim",
    explicacao:
      "Testar não é a última etapa nem o portão de saída. Qualidade se decide no refinamento, na revisão de código e na conversa sobre o requisito — quando o defeito ainda é uma frase, e não uma correção em produção.",
  },
  {
    n: "02",
    esquerda: "Risco coberto",
    direita: "quantidade de casos de teste",
    explicacao:
      "Mil casos que passam sobre o caminho feliz protegem menos que dez sobre o que realmente pode quebrar. Testamos onde dói: o que o usuário mais usa, o que mais muda e o que custa mais caro se falhar.",
  },
  {
    n: "03",
    esquerda: "Colaboração com quem constrói",
    direita: "relatórios que acusam",
    explicacao:
      "O bug não é troféu de QA nem falha pessoal de quem desenvolveu. Um defeito bem descrito, reproduzido e conversado vale mais que uma planilha de números levada para a reunião.",
  },
  {
    n: "04",
    esquerda: "Automação que sustenta o ritmo",
    direita: "automação que impressiona",
    explicacao:
      "Suíte boa é a que roda em toda entrega, falha por motivo real e alguém conserta no mesmo dia. Cobertura alta com teste instável é dívida técnica com nome bonito.",
  },
];

export const PRINCIPIOS = [
  "Nossa maior prioridade é proteger quem usa o software — e a pessoa que usa raramente lê o relatório de teste.",
  "Aceitamos mudanças de requisito, mesmo tarde. Quem testa cedo e em pequenos pedaços muda de direção sem refazer tudo.",
  "Entregamos informação sobre qualidade com frequência, da mesma forma que o time entrega software: em ciclos curtos.",
  "Quem testa, quem desenvolve e quem define o produto trabalham juntos, todos os dias. Fase de teste separada é sintoma, não processo.",
  "Construa o time em torno de pessoas motivadas: dê o ambiente, o acesso e o suporte, e confie no julgamento delas sobre o que testar.",
  "A conversa cara a cara — ou a chamada, ou a thread aberta — resolve mais que a descrição perfeita do defeito.",
  "Software funcionando é a medida principal de progresso; teste passando sem software funcionando é só um número verde.",
  "Ritmo sustentável também vale para a qualidade: suíte que ninguém consegue manter é suíte que vai ser ignorada.",
  "Atenção contínua à excelência técnica e ao bom design aumenta a testabilidade — código difícil de testar é aviso de arquitetura.",
  "Simplicidade — a arte de maximizar o que não precisa ser testado — é essencial.",
  "As melhores estratégias de teste emergem de times que se organizam sozinhos, não de um plano herdado de outro projeto.",
  "Em intervalos regulares o time reflete sobre o que escapou para produção e ajusta seu comportamento de acordo.",
];

// Reprodução do Manifesto Ágil original, em português.
// © 2001, os autores do manifesto ágil. Esta declaração pode ser livremente
// copiada em qualquer forma, mas somente em sua totalidade, incluindo esta nota.
export const ORIGINAL = {
  titulo: "Manifesto para Desenvolvimento Ágil de Software",
  abertura:
    "Estamos descobrindo maneiras melhores de desenvolver software, fazendo-o nós mesmos e ajudando outros a fazê-lo. Através deste trabalho, passamos a valorizar:",
  valores: [
    ["Indivíduos e interações", "processos e ferramentas"],
    ["Software em funcionamento", "documentação abrangente"],
    ["Colaboração com o cliente", "negociação de contratos"],
    ["Responder a mudanças", "seguir um plano"],
  ],
  fechamento:
    "Ou seja, mesmo havendo valor nos itens à direita, valorizamos mais os itens à esquerda.",
  aviso:
    "© 2001, os autores do manifesto ágil. Esta declaração pode ser livremente copiada em qualquer forma, mas somente em sua totalidade, através desta nota.",
  fonte: "https://agilemanifesto.org/iso/ptbr/manifesto.html",
};
