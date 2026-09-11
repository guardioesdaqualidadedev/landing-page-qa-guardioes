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
| `/` | Landing page: missão, objetivos, canais do Discord e grupos do WhatsApp, tabela de roteamento entre plataformas, perfis de membro, regras de convivência, governança, métricas, o syllabus CTFL 4.0 e o carrossel de parceiros |
| `/manifesto` | Manifesto Ágil de Testes — quatro valores e doze princípios da comunidade, com o manifesto original de 2001 reproduzido para comparação |
| `/playground` | Guardião Tracker: formulário de registro de defeito com validações reais, tabela com busca, filtros, ordenação, paginação e ações, uma lista de cenários de teste sugeridos e a trilha completa do certificado de conclusão |

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
| `npm run certificado -- "Nome do Aluno"` | Gera o certificado de conclusão do playground em PDF |

---

## Testes

### Unitários — Vitest (95 testes)

Cobrem a lógica pura e os componentes do playground:

| Arquivo | O que cobre |
| --- | --- |
| `tests/unit/validacao.test.js` | Regras do formulário: obrigatoriedade, valor limite de título e ocorrências, partições de e-mail, data futura e fuso horário |
| `tests/unit/tabela.test.js` | Busca sem acento, filtros combinados, ordenação por gravidade, paginação e imutabilidade |
| `tests/unit/theme.test.js` | Persistência do tema, fallback em janela anônima e integridade da paleta da marca |
| `tests/unit/FormularioDefeito.test.jsx` | Envio bloqueado, `aria-invalid`, foco no primeiro erro, revalidação e limpeza |
| `tests/unit/TabelaDefeitos.test.jsx` | Filtro, ordenação, paginação, mudança de status e confirmação de exclusão |
| `tests/unit/datas.test.js` | Formatação brasileira `dd/mm/aaaa`, fuso local e recusa de datas inexistentes |

```bash
npm test
```

### Interface — Playwright (64 testes × 2 navegadores)

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

## Marca, temas e ícone

Toda arte da marca existe em **duas versões** e o site escolhe a do tema em uso.
Cor de PNG não se resolve por CSS, então a escolha acontece em JS: `App.jsx`
publica o tema num contexto (`src/hooks/useTema.js`) e `BrandMark` e `Banner`
leem de lá.

| Onde | Tema claro | Tema escuro |
| --- | --- | --- |
| Símbolo (cabeçalho e rodapé) | `marca-simbolo-claro.png` — disco branco, marca azul-marinho | `marca-simbolo-escuro.png` — disco azul-marinho, marca branca |
| Banner da landing | `banner-claro.png` | `banner-escuro.png` |
| Favicon | disco azul-marinho — **uma família só**, ver abaixo | idem |

As duas capas foram normalizadas em **1600×400**: com alturas diferentes, trocar
o tema empurraria meia página para baixo.

### Regerando os arquivos

Tudo é derivado de `images/png - negativo.png` (a marca azul-marinho sobre
fundo transparente) por um único script:

```bash
pip install pillow numpy
python3 scripts/gerar-marca.py
```

Ele produz:

- **`images/png - negativo branco.png`** — o logo completo em branco sobre
  transparência, o "negativo da versão branca"; é o `logo.png` sem o retângulo
  azul ao redor.
- **`src/assets/marca-simbolo-{claro,escuro}.png`** — o escudo recortado do
  lettering, centralizado num disco.
- **`public/favicon-*.png`, `apple-touch-icon.png` e `favicon.ico`** — todos
  **circulares**.

Três detalhes que valem a leitura do script:

1. A recoloração classifica cada pixel entre navy e laranja **por distância em
   RGB**, em vez de trocar uma cor exata — é o que faz o antialiasing virar
   branco junto, sem serrilhar a borda.
2. Até 64px o ícone usa **só o escudo**, sem a órbita, preenchendo o disco quase
   até a borda. A órbita ocupa metade da largura do símbolo e, a 16px, some —
   deixando o escudo minúsculo no meio do disco. Isolado, ele enche o ícone e o
   traço engrossa junto. Acima de 64px cabe a marca inteira.
3. **Há uma família só.** Existiu uma variante de disco branco atrás de
   `media="(prefers-color-scheme: dark)"`, mas o Chrome só respeita `media` em
   `<link rel="icon">` com SVG: na prática quem usava o navegador no tema escuro
   continuava recebendo o disco navy, que sumia na barra. O enquadramento atual
   se sustenta nas duas barras — no fundo claro vale o disco, no escuro vale o
   escudo branco dentro dele.

---

## Datas

O site troca datas com o navegador em **ISO** (`aaaa-mm-dd`) — é o que o
`<input type="date">` entrega e o único formato que ordena como texto. Para o
visitante, porém, data é **sempre `dd/mm/aaaa`**: célula de tabela, dica de
campo, painel de regras e mensagem de erro.

`src/utils/datas.js` é a única fronteira entre os dois mundos. Ele monta a data
local peça por peça em vez de deixar `new Date("2026-09-09")` interpretar como
UTC — no Brasil isso devolveria o dia anterior — e recusa datas que não existem
(`2026-02-31`), que o construtor do `Date` "corrigiria" em silêncio para 03/03.

Há um teste que varre as mensagens de erro de data e falha se qualquer uma
voltar a exibir ISO.

---

## Estrutura

```
src/
├── App.jsx                  Rotas, CSS global e tokens de tema
├── main.jsx                 Ponto de entrada
├── firebase.js              Inicialização do Firebase (config via .env)
├── theme.js                 Design system: paleta, temas e persistência
├── assets/                  Marca por tema: símbolo, logo negativo e banners
├── components/
│   ├── Header.jsx           Cabeçalho fixo: marca, menu, redes e botão de tema
│   ├── Footer.jsx           Rodapé
│   ├── BrandMark.jsx        Assinatura da marca (símbolo troca com o tema)
│   ├── Banner.jsx           Capa da marca na versão do tema em uso
│   ├── Icones.jsx           Ícones das redes + botão social reutilizável
│   ├── Parceiros.jsx        Carrossel de parceiros da comunidade
│   ├── ThemeToggle.jsx      Botão claro/escuro
│   ├── OrbitBackground.jsx  Fundo decorativo em SVG (órbitas e escudo)
│   ├── Section.jsx          Cabeçalho padrão de seção
│   └── Reveal.jsx           Animação de entrada respeitando reduced-motion
├── content/
│   ├── comunidade.js        Conteúdo da landing, extraído do documento oficial
│   ├── manifesto.js         Valores e princípios do manifesto
│   ├── syllabus.js          Capítulos, formato do exame e links do CTFL 4.0
│   └── certificacao.js      Trilha do certificado: etapas, modelo e critérios
├── hooks/
│   ├── useTema.js           Tema atual via contexto (quem escolhe ARTE precisa dele)
│   └── useVisitorCount.js   Contador de visitantes em tempo real (Firestore)
├── utils/
│   └── datas.js             Única fronteira entre ISO e o formato brasileiro
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
    ├── Cenarios.jsx
    └── Certificacao.jsx     Aba "Certificado": o passo a passo da entrega
```

A lógica de validação e de tabela vive **fora** dos componentes, em funções
puras. É o que permite testá-las em unidade sem renderizar nada — e é o exemplo
que a comunidade recomenda para quem está aprendendo automação.

---

## Certificado de conclusão

Quem cumpre os **12 desafios do playground** e envia os **vídeos** comprovando o
resultado esperado de cada um recebe um certificado em PDF com a marca da
comunidade.

O passo a passo que o participante segue está publicado na aba **“Certificado”**
do playground (`src/playground/Certificacao.jsx`), com o conteúdo em
`src/content/certificacao.js`: o que é cada aba do sistema, para que serve o
botão de restaurar massa, como gravar as evidências, o modelo de documento no
padrão CTFL pronto para copiar, a estrutura de pastas do Google Drive e os
critérios da validação.

Do lado de quem emite, o PDF sai por linha de comando:

```bash
npm run certificado -- "Maria Aparecida de Souza"
```

O PDF sai em `certificados/` — pasta ignorada pelo Git, porque carrega nome de
aluno. São duas páginas em A4 paisagem: a **frente** com o nome, a carga horária
e o código de verificação; o **verso** com o conteúdo programático, gerado a
partir do mesmo `src/playground/cenarios.js` que a página do playground usa —
mudou o cenário lá, o certificado acompanha.

| Opção | Padrão | Para quê |
| --- | --- | --- |
| `--horas=N` | `4` | Carga horária. Quatro horas é a conta honesta: 12 desafios × ~20 min entre executar, gravar e conferir |
| `--data=AAAA-MM-DD` | hoje | Data de emissão |
| `--saida=CAMINHO` | `./certificados` | Pasta de destino |
| `--assinante=NOME` / `--cargo=TEXTO` | Douglas Queiroz | Quem assina |
| `--html` | — | Mantém também o HTML, para conferir o layout no navegador |

O **código de verificação** (`QAG-2026-A9DDF3`) é um hash de nome + data + carga
horária: reemitir o mesmo certificado devolve o mesmo código, e cada emissão fica
registrada em `certificados/registro.json` para consulta.

A renderização usa o Chromium do Playwright, que já é dependência de teste do
projeto — nenhuma biblioteca de PDF a mais. Se for a primeira vez na máquina,
rode `npx playwright install chromium`.

---

## Contador de visitantes

O rodapé mostra o total acumulado, guardado no documento `stats/visits` do
Firestore. Duas travas evitam que o número minta:

- **Uma visita por navegador.** A marca fica no `localStorage`; recarregar a
  página não soma de novo.
- **Nada de ambiente de teste.** `deveContar()` em `src/hooks/useVisitorCount.js`
  recusa `localhost`, hostnames `.local`, faixas de IP privadas e qualquer
  navegador com `navigator.webdriver` ligado. Sem isso a suíte Playwright — que
  sobe o site em localhost apontando para o **Firebase de produção**, com um
  navegador limpo por teste — somava dezenas de "visitantes" a cada
  `npm run test:e2e`. Era a causa do contador subir sozinho.

As `firestore.rules` completam a trava: a escrita só é aceita se o novo `count`
for exatamente o anterior **+ 1**. A regra antiga validava apenas o tipo, então
qualquer pessoa podia abrir o console do navegador e gravar o número que
quisesse.

Contar por **endereço IP** não é possível a partir do navegador — o IP não fica
exposto ao JavaScript da página. Para isso seria preciso uma Cloud Function
(plano Blaze) lendo o cabeçalho da requisição. A trava por navegador é a
aproximação possível do lado do cliente.

**Para zerar o contador**, use o console do Firebase (Firestore → `stats/visits`),
que roda com privilégio de administrador e não passa pelas regras.

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
