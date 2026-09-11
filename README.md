# QA's Guardiões do Software — site da comunidade

Site da comunidade **QA's Guardiões do Software**: landing page institucional, o
Manifesto Ágil de Testes na versão da comunidade e um **playground de QA** — um
sistema fake para praticar teste manual e escrever testes automatizados.

Construído com as mesmas tecnologias do Projeto Social Garapuvu: **Vite + React
+ Firebase**, com deploy no Firebase Hosting.

---

## Telas

| Rota | O que é |
| --- | --- |
| `/` | Landing page: missão, objetivos, canais do Discord e grupos do WhatsApp, tabela de roteamento entre plataformas, perfis de membro, regras de convivência, governança e métricas |
| `/manifesto` | Manifesto Ágil de Testes — quatro valores e doze princípios da comunidade, com o manifesto original de 2001 reproduzido para comparação |
| `/playground` | Guardião Tracker: formulário de registro de defeito com validações reais, tabela com busca, filtros, ordenação, paginação e ações, e uma lista de cenários de teste sugeridos |

---

## Começando

```bash
npm install
cp .env.example .env      # preencha com as credenciais do seu projeto Firebase
npm run dev               # http://localhost:5173
```

O site **funciona sem o `.env`** — apenas sem o contador de visitantes e sem o
Analytics. Isso mantém `npm run dev` e a suíte de testes rodando em qualquer
máquina, inclusive em CI.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o bundle de produção em `dist/` |
| `npm run preview` | Serve o bundle de produção localmente |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:watch` | Testes unitários em modo observador |
| `npm run test:e2e` | Testes de interface (Playwright) |
| `npm run test:e2e:ui` | Playwright no modo interativo |
| `npm run deploy` | Build + deploy no Firebase Hosting |

---

## Testes

### Unitários — Vitest (81 testes)

Cobrem a lógica pura e os componentes do playground:

| Arquivo | O que cobre |
| --- | --- |
| `tests/unit/validacao.test.js` | Regras do formulário: obrigatoriedade, valor limite de título e ocorrências, partições de e-mail, data futura e fuso horário |
| `tests/unit/tabela.test.js` | Busca sem acento, filtros combinados, ordenação por gravidade, paginação e imutabilidade |
| `tests/unit/theme.test.js` | Persistência do tema, fallback em janela anônima e integridade da paleta da marca |
| `tests/unit/FormularioDefeito.test.jsx` | Envio bloqueado, `aria-invalid`, foco no primeiro erro, revalidação e limpeza |
| `tests/unit/TabelaDefeitos.test.jsx` | Filtro, ordenação, paginação, mudança de status e confirmação de exclusão |

```bash
npm test
```

### Interface — Playwright (52 testes × 2 navegadores)

```bash
npx playwright install chromium   # só na primeira vez
npm run test:e2e
```

Rodam em dois projetos: `chromium` (desktop) e `mobile` (Pixel 5). O Vite sobe
sozinho antes da suíte — não é preciso deixar `npm run dev` em outro terminal.

| Arquivo | O que cobre |
| --- | --- |
| `tests/e2e/landing.spec.js` | Landing page, alternância de tema com persistência, navegação pelo menu (desktop e celular), 404 e ausência de rolagem horizontal |
| `tests/e2e/manifesto.spec.js` | Os quatro valores, os doze princípios, o manifesto original, o link externo e a hierarquia de cabeçalhos |
| `tests/e2e/playground.spec.js` | Abas, validações do formulário (valor limite e partição), caminho feliz do registro, busca, filtros, ordenação, paginação, mudança de status, exclusão com confirmação e checklist de cenários |

Todos os elementos interativos têm `data-testid` estável — use-os como
seletores ao escrever os seus próprios testes.

---

## Design system

A paleta e a tipografia seguem o **Manual de Marca QA Guardiões**:

| Token | Cor | Uso |
| --- | --- | --- |
| Azul Marinho | `#0B2341` | Faixas de marca: cabeçalho, hero e rodapé — igual nos dois temas |
| Laranja | `#F47A20` | Ação e destaque: botões, links ativos e números |
| Branco | `#FFFFFF` | Fundo dos cartões no tema claro |
| Cinza Claro | `#EFF2F5` | Fundo geral do tema claro |

Tipografia: **Barlow Condensed** (condensada em negrito) nos títulos e **Inter**
(sans-serif limpa) no texto corrido, como pede o manual.

O tema vive em variáveis CSS (`src/theme.js`) com nomes **semânticos** — o que a
cor faz, não que cor é. A troca entre claro e escuro só reescreve o atributo
`data-theme` no `<html>`; o navegador resolve o resto sem re-renderizar nada. O
`index.html` aplica o tema salvo antes da primeira pintura, evitando o piscar
escuro em quem escolheu o tema claro.

O laranja tem dois tokens: `--qa-accent` (a cor pura, para fundos e ícones) e
`--qa-accent-text` (calibrado para texto — o laranja puro sobre branco dá 2,9:1,
abaixo do mínimo de acessibilidade).

---

## Estrutura

```
src/
├── App.jsx                  Rotas, CSS global e tokens de tema
├── main.jsx                 Ponto de entrada
├── firebase.js              Inicialização do Firebase (config via .env)
├── theme.js                 Design system: paleta, temas e persistência
├── assets/                  Marca em versão clara, escura e símbolo
├── components/
│   ├── Header.jsx           Cabeçalho fixo: marca, menu, redes e botão de tema
│   ├── Footer.jsx           Rodapé
│   ├── BrandMark.jsx        Assinatura da marca
│   ├── ThemeToggle.jsx      Botão claro/escuro
│   ├── OrbitBackground.jsx  Fundo decorativo em SVG (órbitas e escudo)
│   ├── Section.jsx          Cabeçalho padrão de seção
│   └── Reveal.jsx           Animação de entrada respeitando reduced-motion
├── content/
│   ├── comunidade.js        Conteúdo da landing, extraído do documento oficial
│   └── manifesto.js         Valores e princípios do manifesto
├── hooks/
│   └── useVisitorCount.js   Contador de visitantes em tempo real (Firestore)
├── pages/
│   ├── Home.jsx             Landing page
│   ├── Manifesto.jsx        Manifesto Ágil de Testes
│   ├── Playground.jsx       Playground QA
│   └── NaoEncontrada.jsx    404
└── playground/
    ├── dominio.js           Listas de opções e massa de dados inicial
    ├── validacao.js         Regras de validação (funções puras)
    ├── tabela.js            Filtro, ordenação e paginação (funções puras)
    ├── cenarios.js          Cenários de teste sugeridos
    ├── Campo.jsx            Envelope acessível de campo de formulário
    ├── FormularioDefeito.jsx
    ├── TabelaDefeitos.jsx
    └── Cenarios.jsx
```

A lógica de validação e de tabela vive **fora** dos componentes, em funções
puras. É o que permite testá-las em unidade sem renderizar nada — e é o exemplo
que a comunidade recomenda para quem está aprendendo automação.

---

## Deploy

```bash
cp .firebaserc.example .firebaserc   # informe o ID do seu projeto
npm run deploy
```

O `firebase.json` já traz o rewrite de SPA (`**` → `/index.html`), necessário
para `/manifesto` e `/playground` funcionarem ao serem abertos direto pela URL,
e cache longo para os assets versionados.

As regras do Firestore (`firestore.rules`) liberam leitura do contador de
visitantes e restringem a escrita ao campo `count`:

```bash
firebase deploy --only firestore:rules
```

---

## Acessibilidade

O que já está coberto e é verificado pelos testes:

- Campos com `aria-invalid` e mensagem de erro ligada por `aria-describedby`
- Foco levado ao primeiro campo com erro no envio
- Grupo de rádios em `fieldset`/`legend`
- Colunas ordenáveis com `aria-sort`
- Abas com `role="tablist"`, `aria-selected` e `aria-controls`
- Link "Pular para o conteúdo" e foco visível em todos os controles
- Confirmação de exclusão dentro da página, sem `window.confirm` — diálogo
  nativo trava a automação e não é estilizável
- `prefers-reduced-motion` respeitado nas animações de entrada

---

*Este site é da comunidade e é um documento vivo. Toda decisão aqui pode ser
questionada no canal `#feedbacks-melhorias` do Discord.*
