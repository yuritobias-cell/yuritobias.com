"""Gera as imagens Open Graph (1200x630) seguindo o design de yuritobias.com.

- public/og.png            -> imagem padrão do site
- public/og/<slug>.png     -> uma por postagem publicada do blog (título do frontmatter)

Como usar:
  1. Baixe as fontes variáveis para /tmp/ogfonts/ (ou defina OGFONTS para outra pasta):
     curl -sL -o /tmp/ogfonts/playfair.ttf "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf"
     curl -sL -o /tmp/ogfonts/plex.ttf "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/IBMPlexSans%5Bwdth%2Cwght%5D.ttf"
  2. Crie um venv com Pillow e execute:
     python3 -m venv /tmp/ogvenv && /tmp/ogvenv/bin/pip install pillow
     /tmp/ogvenv/bin/python scripts/og-image.py

Rode de novo sempre que publicar um post novo e commite os PNGs gerados.
"""
import os
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FONTES = Path(os.environ.get("OGFONTS", "/tmp/ogfonts"))

W, H = 1200, 630
BG     = "#F8F6F1"
INK    = "#1C1917"
MUTED  = "#78716C"
ACCENT = "#1B4F4F"
RULE   = "#E2DDD6"


def playfair(size, weight=700):
    f = ImageFont.truetype(str(FONTES / "playfair.ttf"), size)
    f.set_variation_by_axes([weight])
    return f


def plex(size, weight=400):
    f = ImageFont.truetype(str(FONTES / "plex.ttf"), size)
    f.set_variation_by_axes([100, weight])  # eixos: wdth, wght
    return f


def moldura(d):
    """Moldura fina, como as hairlines do site."""
    d.rectangle([28, 28, W - 28, H - 28], outline=RULE, width=2)


def texto_espacado(d, xy, texto, fonte, cor, tracking=3):
    """Texto com tracking manual (estilo uppercase/letterspaced do site)."""
    x, y = xy
    for ch in texto:
        d.text((x, y), ch, font=fonte, fill=cor)
        x += d.textlength(ch, font=fonte) + tracking


def imagem_site():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    moldura(d)

    # Monograma YT à esquerda, na cor de destaque
    f_mono = playfair(290, 700)
    mono = "YT"
    bbox = d.textbbox((0, 0), mono, font=f_mono)
    mono_h = bbox[3] - bbox[1]
    mono_y = (H - mono_h) / 2 - bbox[1]
    d.text((105, mono_y), mono, font=f_mono, fill=ACCENT)

    # Separador vertical
    sep_x = 600
    d.line([(sep_x, 165), (sep_x, H - 165)], fill=RULE, width=2)

    # Bloco de texto à direita
    tx = 665
    d.text((tx, 195), "Yuri Tobias", font=playfair(76, 700), fill=INK)

    # Divisor de destaque (como o da home)
    d.rectangle([tx + 4, 320, tx + 4 + 48, 320 + 4], fill=ACCENT)

    f_role = plex(30, 400)
    d.text((tx, 360), "Professor de Matemática", font=f_role, fill=MUTED)
    d.text((tx, 404), "Analista de Dados Educacionais", font=f_role, fill=MUTED)

    texto_espacado(d, (tx, 478), "YURITOBIAS.COM", plex(24, 500), ACCENT)

    destino = RAIZ / "public/og.png"
    img.save(destino, optimize=True)
    print("ok", destino.relative_to(RAIZ), img.size)


def quebra_linhas(d, texto, fonte, largura_max):
    linhas, atual = [], ""
    for palavra in texto.split():
        teste = f"{atual} {palavra}".strip()
        if d.textlength(teste, font=fonte) <= largura_max:
            atual = teste
        else:
            if atual:
                linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    return linhas


def imagem_post(titulo, destino):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    moldura(d)

    mx = 105  # margem esquerda/direita do conteúdo
    largura_max = W - 2 * mx

    texto_espacado(d, (mx, 92), "BLOG · YURITOBIAS.COM", plex(24, 500), ACCENT)

    # Divisor de destaque entre o kicker e o título
    d.rectangle([mx + 4, 168, mx + 4 + 48, 168 + 4], fill=ACCENT)

    # Título em Playfair, quebrando linhas; reduz o corpo se não couber em 3 linhas
    for corpo in (76, 66, 56):
        f_titulo = playfair(corpo, 700)
        linhas = quebra_linhas(d, titulo, f_titulo, largura_max)
        if len(linhas) <= 3:
            break
    y = 205
    for linha in linhas:
        d.text((mx, y), linha, font=f_titulo, fill=INK)
        y += int(corpo * 1.24)

    d.text((mx, H - 118), "Yuri Tobias — Professor de Matemática e Analista de Dados Educacionais",
           font=plex(26, 400), fill=MUTED)

    destino.parent.mkdir(parents=True, exist_ok=True)
    img.save(destino, optimize=True)
    print("ok", destino.relative_to(RAIZ), img.size)


def posts_publicados():
    """(slug, título) de cada post não-rascunho em src/content/blog."""
    for arq in sorted((RAIZ / "src/content/blog").glob("*.md*")):
        texto = arq.read_text(encoding="utf-8")
        titulo = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', texto, re.M)
        rascunho = re.search(r"^draft:\s*true\s*$", texto, re.M)
        if titulo and not rascunho:
            yield arq.stem, titulo.group(1)


if __name__ == "__main__":
    imagem_site()
    for slug, titulo in posts_publicados():
        imagem_post(titulo, RAIZ / "public/og" / f"{slug}.png")
