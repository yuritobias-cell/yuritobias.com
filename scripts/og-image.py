"""Gera a imagem Open Graph (1200x630) seguindo o design de yuritobias.com.

Como usar:
  1. Baixe as fontes variáveis para /tmp/ogfonts/:
     curl -sL -o /tmp/ogfonts/playfair.ttf "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf"
     curl -sL -o /tmp/ogfonts/plex.ttf "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/IBMPlexSans%5Bwdth%2Cwght%5D.ttf"
  2. Crie um venv com Pillow e execute:
     python3 -m venv /tmp/ogvenv && /tmp/ogvenv/bin/pip install pillow
     /tmp/ogvenv/bin/python scripts/og-image.py

O resultado é salvo em public/og.png.
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG     = "#F8F6F1"
INK    = "#1C1917"
MUTED  = "#78716C"
ACCENT = "#1B4F4F"
RULE   = "#E2DDD6"

def playfair(size, weight=700):
    f = ImageFont.truetype("/tmp/ogfonts/playfair.ttf", size)
    f.set_variation_by_axes([weight])
    return f

def plex(size, weight=400):
    f = ImageFont.truetype("/tmp/ogfonts/plex.ttf", size)
    f.set_variation_by_axes([100, weight])  # eixos: wdth, wght
    return f

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# Moldura fina (como as hairlines do site)
d.rectangle([28, 28, W - 28, H - 28], outline=RULE, width=2)

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
f_nome = playfair(76, 700)
d.text((tx, 195), "Yuri Tobias", font=f_nome, fill=INK)

# Divisor de destaque (como o da home)
d.rectangle([tx + 4, 320, tx + 4 + 48, 320 + 4], fill=ACCENT)

f_role = plex(30, 400)
d.text((tx, 360), "Professor de Matemática", font=f_role, fill=MUTED)
d.text((tx, 404), "Analista de Dados Educacionais", font=f_role, fill=MUTED)

# URL com tracking manual (estilo uppercase/letterspaced do site)
f_url = plex(24, 500)
url = "YURITOBIAS.COM"
x = tx
y = 478
for ch in url:
    d.text((x, y), ch, font=f_url, fill=ACCENT)
    x += d.textlength(ch, font=f_url) + 3

img.save("/Users/yuricorrearamos/Projetos/yuritobias.com/public/og.png", optimize=True)
print("ok", img.size)
