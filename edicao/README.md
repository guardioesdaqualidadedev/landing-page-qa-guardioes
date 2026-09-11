# Edição do Encontro 11

O compartilhamento de tela do encontro caiu em **1:09:00**. Daquele ponto até o
fim (34min33s) sobrou só o áudio. Esta pasta contém o que foi usado para cobrir
esse trecho com a execução dos testes de interface, **sem tocar no áudio**.

## Resultado

`../Encontro11-editado.mp4` — 1h43min33s, 1920×1080, 24 fps.

- Vídeo original preservado de 0:00 a 1:09:00
- De 1:09:00 ao fim: captura dos testes rodando em navegador visível
- **Áudio original do início ao fim.** Verificado: o MD5 do fluxo de áudio do
  arquivo editado é idêntico ao do original (`3af3947d713f4b4544f9b63f3670326e`) —
  ele foi copiado, não reencodado

## O que aparece no trecho substituído

| De | Até | Conteúdo |
| --- | --- | --- |
| 1:09:00 | 1:14:26 | Suíte de testes no desktop — 51 testes passando, um por vez, em janela visível |
| 1:14:26 | 1:17:46 | A mesma suíte na largura de um celular, sobre o playground |
| 1:17:46 | 1:43:33 | Passeio guiado pelo sistema: landing page, tema claro, manifesto, formulário campo a campo com as validações, tabela com todas as ações, cenários de teste e a página 404 |

Uma faixa no rodapé, nas cores da marca, nomeia o teste ou a etapa em execução —
é o que permite acompanhar visualmente mesmo ouvindo o áudio do encontro.

## Como a captura foi gerada

Pela própria suíte do projeto, em modo demonstração:

```bash
npm run test:all      # 1 worker, janela visível, slowMo de 1,5s
```

Esse script liga `PW_DEMO=1` e `PW_RITMO=2.4`, que em `playwright.config.js`
ativam: um único worker, `headless: false`, `slowMo` de 1500 ms, timeout folgado
e o reporter `tests/support/reporter-legenda.js`, que publica o nome do teste
atual em um arquivo de texto.

O `PW_RITMO` multiplica as pausas do roteiro de demonstração
(`tests/e2e/passeio.spec.js`) — é o que calibra a duração da gravação sem
reescrever o roteiro. Foi assim que os 34min33s do trecho foram preenchidos.

Fora do modo demonstração nada disso vale: `npm run test:e2e` continua rodando
os 52 testes em paralelo, headless, e o passeio guiado nem é coletado.

A captura de tela em si foi feita em Linux com `Xvfb` + `ffmpeg -f x11grab`,
desenhando a faixa de legenda com `drawtext ... reload=1`, que relê o arquivo do
reporter a cada quadro. Em macOS o equivalente é gravar a tela com
`ffmpeg -f avfoundation`.

## Como a montagem foi feita

`montar-encontro11.sh` — roda em segundos porque **nada é reencodado**. A captura
foi gerada com exatamente os mesmos parâmetros do original (H.264 High, level
4.0, yuv420p, 24 fps, timebase 1/12288), então a montagem é só:

1. separar o vídeo original até 1:09:00 (`-c:v copy`)
2. concatenar com a captura (`-f concat -c copy`)
3. casar o resultado com o áudio original inteiro (`-map 1:a:0 -c copy`)

Para refazer a montagem com outra captura, substitua `screencast.mp4` e rode:

```bash
bash edicao/montar-encontro11.sh
```

Para mudar o ponto de corte, edite a variável `CORTE` no script (em segundos).
