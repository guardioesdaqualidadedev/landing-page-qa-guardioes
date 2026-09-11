"""
Gerador dos arquivos de marca do site.  Uso:  python3 scripts/gerar-marca.py
(requer Pillow e numpy:  pip install pillow numpy)

Gera as variantes de marca a partir de `images/png - negativo.png`
(logo navy + laranja sobre fundo transparente).

Duas familias:
  • claro  — marca navy, para usar sobre fundo claro  (o proprio original)
  • escuro — marca branca, para usar sobre fundo escuro (o "negativo da branca")

A recoloracao NAO usa substituicao de cor exata: cada pixel e classificado
entre navy e laranja pela distancia em RGB e so o navy vira branco. Assim os
pixels de antialiasing (mistura de navy com transparencia) tambem viram branco,
sem serrilhar a borda, e o laranja da marca fica intacto.
"""
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
import os

# Raiz do projeto — o script vive em scripts/, um nível abaixo.
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = f"{BASE}/images/png - negativo.png"

NAVY = np.array([1, 34, 75], dtype=np.float32)
LARANJA = np.array([244, 122, 32], dtype=np.float32)
BRANCO = np.array([255, 255, 255], dtype=np.float32)
BAND = (11, 35, 65)          # #0B2341 — faixa da marca
CLARO = (255, 255, 255)


def carregar():
    return Image.open(SRC).convert("RGBA")


def versao_branca(im):
    """Troca o navy por branco preservando o laranja e o antialiasing."""
    a = np.array(im).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3]

    # Pixels com alpha baixo tem RGB indefinido; ignora.
    visivel = alpha > 0

    d_navy = np.linalg.norm(rgb - NAVY, axis=-1)
    d_laranja = np.linalg.norm(rgb - LARANJA, axis=-1)
    ehNavy = (d_navy <= d_laranja) & visivel

    saida = rgb.copy()
    saida[ehNavy] = BRANCO
    out = np.dstack([saida, alpha]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def recortar_simbolo(im):
    """So o escudo + orbita (o logo completo tem o lettering embaixo)."""
    a = np.array(im)
    alpha = a[..., 3]
    linhas = (alpha > 60).sum(axis=1)
    # A primeira faixa totalmente vazia depois do simbolo separa-o do lettering.
    fim = None
    dentro = False
    for y, v in enumerate(linhas):
        if v > 0:
            dentro = True
        elif dentro:
            fim = y
            break
    recorte = im.crop((0, 0, im.width, fim))
    return recorte.crop(recorte.getbbox())


# Fracoes da largura do simbolo que delimitam o ESCUDO, sem as pontas da orbita.
# Medidas sobre a arte oficial (o escudo vai de x=255 a x=915 num simbolo de
# 1191px); em fracao, sobrevivem a uma reexportacao em outra resolucao.
ESCUDO_ESQ, ESCUDO_DIR = 0.214, 0.768


def recortar_escudo(simbolo):
    """So o escudo + o check.

    A 16px o simbolo inteiro vira um borrao: a orbita ocupa metade da largura e
    some, deixando o escudo minusculo no meio. Isolando o escudo, ele passa a
    encher o icone e o traco engrossa na mesma proporcao — que e a diferenca
    entre o nosso favicon e o de um GitHub da vida, que e uma silhueta cheia.
    """
    esq = int(simbolo.width * ESCUDO_ESQ)
    dir_ = int(simbolo.width * ESCUDO_DIR)
    recorte = simbolo.crop((esq, 0, dir_, simbolo.height))
    return recorte.crop(recorte.getbbox())


def disco(simbolo, tamanho, fundo, margem=0.16, anel=None, ajuste="tudo"):
    """Simbolo centralizado num circulo solido, renderizado com sobreamostragem.

    Desenhar 4x maior e reduzir com LANCZOS e o que da nitidez real: reduzir
    direto do PNG de 1254px perde os tracos finos da orbita.
    """
    ss = tamanho * 4
    tela = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))

    circulo = Image.new("L", (ss * 4, ss * 4), 0)
    ImageDraw.Draw(circulo).ellipse((0, 0, ss * 4 - 1, ss * 4 - 1), fill=255)
    circulo = circulo.resize((ss, ss), Image.LANCZOS)

    fundo_img = Image.new("RGBA", (ss, ss), fundo + (255,))
    tela = Image.composite(fundo_img, tela, circulo)

    if anel:
        anel_mask = Image.new("L", (ss * 4, ss * 4), 0)
        d = ImageDraw.Draw(anel_mask)
        largura = max(4, int(ss * 4 * 0.028))
        d.ellipse((largura // 2, largura // 2, ss * 4 - 1 - largura // 2, ss * 4 - 1 - largura // 2),
                  outline=255, width=largura)
        anel_mask = anel_mask.resize((ss, ss), Image.LANCZOS)
        tela = Image.composite(Image.new("RGBA", (ss, ss), anel + (255,)), tela, anel_mask)

    # `tudo`   — cabe inteiro no circulo (logo grande, le-se tudo).
    # `altura` — preenche pela altura: o escudo cresce e as pontas da orbita
    #            saem pela borda do circulo. E o que salva o icone a 16px, onde
    #            o simbolo inteiro vira um borrao.
    util = int(ss * (1 - 2 * margem))
    if ajuste == "altura":
        escala = util / simbolo.height
    else:
        escala = min(util / simbolo.width, util / simbolo.height)
    novo = simbolo.resize((max(1, round(simbolo.width * escala)),
                           max(1, round(simbolo.height * escala))), Image.LANCZOS)
    camada = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    camada.alpha_composite(novo, ((ss - novo.width) // 2, (ss - novo.height) // 2))
    # Recorta o que passou da borda do disco antes de compor.
    camada.putalpha(Image.fromarray(
        (np.array(camada.getchannel("A")).astype(np.uint16) *
         np.array(circulo).astype(np.uint16) // 255).astype(np.uint8)))
    tela.alpha_composite(camada)

    final = tela.resize((tamanho, tamanho), Image.LANCZOS)
    # Nos tamanhos minusculos o LANCZOS amacia demais; um unsharp devolve o traco.
    if tamanho <= 64:
        final = final.filter(ImageFilter.UnsharpMask(radius=0.7, percent=110, threshold=2))
    return final


if __name__ == "__main__":
    original = carregar()
    branca = versao_branca(original)

    # 1) Logo completo em branco — o "negativo da versao branca" pedido.
    branca.save(f"{BASE}/images/png - negativo branco.png")
    branca.resize((900, 900), Image.LANCZOS).save(f"{BASE}/src/assets/logo-negativo-branco.png")
    print("logo branco ok")

    sim_navy = recortar_simbolo(original)
    sim_branco = recortar_simbolo(branca)
    print("simbolo", sim_navy.size)

    # 2) Simbolo circular por tema (usado no cabecalho/rodape).
    #    claro  = disco branco + marca navy
    #    escuro = disco navy   + marca branca
    for nome, sim, fundo in (("claro", sim_navy, CLARO), ("escuro", sim_branco, BAND)):
        disco(sim, 256, fundo, margem=0.13, anel=None).save(
            f"{BASE}/src/assets/marca-simbolo-{nome}.png")
    print("simbolos de tema ok")

    # 3) Favicons circulares. O disco navy tem contraste proprio e funciona
    #    tanto na aba clara quanto na escura; o disco claro entra por media
    #    query para quem usa o navegador no tema escuro.
    escudo_branco = recortar_escudo(sim_branco)
    print("escudo", escudo_branco.size)

    # Uma familia so. A versao de disco claro por `prefers-color-scheme` foi
    # removida: o Chrome so respeita `media` em <link rel="icon"> de forma
    # confiavel com SVG, entao na pratica quem usa o navegador no tema escuro
    # continuava recebendo o disco navy. Este enquadramento se sustenta nas duas
    # barras — no fundo claro vale o disco, no escuro vale o escudo branco.
    for tam in (16, 32, 48, 192, 512):
        if tam <= 64:
            # Escudo isolado, quase encostando na borda do disco.
            arte, margem, ajuste = escudo_branco, 0.03, "altura"
        else:
            # Aqui ja cabe a marca inteira, com a orbita.
            arte, margem, ajuste = sim_branco, 0.12, "tudo"
        disco(arte, tam, BAND, margem=margem, ajuste=ajuste).save(
            f"{BASE}/public/favicon-{tam}.png")
    disco(sim_branco, 180, BAND, margem=0.12).save(f"{BASE}/public/apple-touch-icon.png")
    print("favicons ok")

    # 4) .ico multi-resolucao
    # O .ico guarda varias resolucoes num arquivo so; o Pillow reduz a partir
    # da maior, entao entregamos ja no enquadramento dos tamanhos pequenos.
    disco(escudo_branco, 256, BAND, margem=0.03, ajuste="altura").save(
        f"{BASE}/public/favicon.ico", format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("ico ok")
