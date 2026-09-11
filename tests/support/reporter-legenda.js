// Reporter que escreve, em um arquivo de texto, qual teste está rodando agora.
//
// Existe para a gravação da aula: o ffmpeg desenha esse arquivo sobre o vídeo
// com `drawtext ... reload=1`, relendo o texto a cada quadro. Assim a faixa no
// rodapé acompanha a execução sem precisar sincronizar nada na edição.
//
// Só é usado no modo demonstração (`npm run test:all`); a suíte normal não o
// carrega. O caminho de saída vem de PW_LEGENDA.
import fs from "node:fs";

const SAIDA = process.env.PW_LEGENDA || "/tmp/legenda.txt";

// O drawtext do ffmpeg lê o arquivo literalmente, mas quebra de linha vira
// segunda linha na tela — então o texto é mantido em uma linha só.
function umaLinha(texto) {
  return String(texto).replace(/\s+/g, " ").trim();
}

export default class ReporterLegenda {
  onBegin(_config, suite) {
    this.total = suite.allTests().length;
    this.feitos = 0;
    this.escrever("Iniciando a suite de testes de interface");
  }

  onTestBegin(test) {
    const projeto = test.parent.project()?.name || "";
    const arquivo = test.location.file.split("/").pop();
    const titulo = test.titlePath().slice(3).filter(Boolean).join(" > ");
    this.escrever(`[${projeto}] ${arquivo} — ${titulo}   (${this.feitos + 1}/${this.total})`);
  }

  onTestEnd(test, result) {
    this.feitos += 1;
    const marca = result.status === "passed" ? "OK" : result.status.toUpperCase();
    const titulo = test.titlePath().slice(3).filter(Boolean).join(" > ");
    this.escrever(`${marca} — ${titulo}   (${this.feitos}/${this.total})`);
  }

  onEnd(result) {
    this.escrever(`Suite finalizada: ${result.status}   (${this.feitos}/${this.total})`);
  }

  escrever(texto) {
    try {
      // Grava em arquivo temporário e renomeia: o ffmpeg pode estar lendo o
      // arquivo neste instante, e o rename é atômico — sem isso a faixa
      // pisca com texto pela metade.
      const tmp = `${SAIDA}.tmp`;
      fs.writeFileSync(tmp, umaLinha(texto) + "\n", "utf8");
      fs.renameSync(tmp, SAIDA);
    } catch {
      /* a gravação da legenda nunca deve derrubar a suíte */
    }
  }
}
