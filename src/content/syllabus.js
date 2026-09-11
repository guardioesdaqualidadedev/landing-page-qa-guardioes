// ─────────────────────────────────────────────────────────────────────────────
// Syllabus CTFL 4.0 — o programa oficial do Certified Tester Foundation Level.
//
// É a referência de estudo que a comunidade adota: gratuito, público e o mesmo
// documento que define o que cai na prova. A trilha do certificado do playground
// aponta para ele, e a landing page o divulga.
//
// Os dados abaixo vêm da página oficial do ISTQB e do PDF traduzido pelo BSTQB,
// o board brasileiro. Se sair uma versão nova, é este arquivo que muda.
// ─────────────────────────────────────────────────────────────────────────────

export const SYLLABUS = {
  versao: "4.0",
  nome: "Certified Tester Foundation Level",
  sigla: "CTFL",

  // Quem emite a certificação e quem responde por ela no Brasil.
  board: "ISTQB — International Software Testing Qualifications Board",
  boardBr: "BSTQB — Brazilian Software Testing Qualifications Board",

  resumo:
    "O CTFL é a certificação de nível básico em teste de software reconhecida internacionalmente. O syllabus é o programa oficial do exame — ele diz, capítulo por capítulo, o que um testador precisa saber. É público e gratuito: dá para estudar por ele sem pagar nada e sem fazer curso.",

  // Os seis capítulos da versão 4.0, na ordem do documento.
  capitulos: [
    {
      n: "1",
      titulo: "Fundamentos de teste",
      descricao:
        "O que é teste e por que ele é necessário, os sete princípios, as atividades e os papéis do processo, e as habilidades esperadas de quem testa.",
    },
    {
      n: "2",
      titulo: "Teste ao longo do ciclo de vida",
      descricao:
        "Como o teste se encaixa em cada modelo de desenvolvimento, os níveis de teste (unidade, integração, sistema, aceitação), os tipos de teste e o teste de manutenção.",
    },
    {
      n: "3",
      titulo: "Teste estático",
      descricao:
        "Testar sem executar o software: revisão de requisitos, de código e de documentos, e o processo de feedback que encontra defeito antes de existir tela.",
    },
    {
      n: "4",
      titulo: "Análise e modelagem de teste",
      descricao:
        "As técnicas que este playground exercita: partição de equivalência, análise de valor limite, tabela de decisão, transição de estado e teste baseado em experiência.",
    },
    {
      n: "5",
      titulo: "Gerenciamento das atividades de teste",
      descricao:
        "Planejamento, análise de risco, estimativa, monitoramento e controle, gestão de configuração e gestão de defeitos.",
    },
    {
      n: "6",
      titulo: "Ferramentas de teste",
      descricao:
        "Que tipos de ferramenta apoiam o teste, o que a automação entrega de fato e quais riscos ela traz quando entra sem critério.",
    },
  ],

  // Formato do exame, conforme a página oficial do ISTQB.
  exame: [
    { rotulo: "Questões", valor: "40", detalhe: "múltipla escolha" },
    { rotulo: "Aprovação", valor: "26 pontos", detalhe: "65% do total" },
    { rotulo: "Duração", valor: "60 min", detalhe: "+25% em idioma não nativo" },
    { rotulo: "Custo do syllabus", valor: "R$ 0", detalhe: "o PDF é gratuito" },
  ],

  links: {
    pdfPt: "https://bstqb.online/files/syllabus_ctfl_4.0br.pdf",
    pdfEn: "https://astqb.org/assets/documents/ISTQB_CTFL_Syllabus_v4.0.1.pdf",
    oficial: "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/",
    bstqb: "https://bstqb.online/",
  },
};
