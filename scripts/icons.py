"""Gera os ícones PWA (192, 512) e o apple-touch-icon (180) com o monograma YT.

Pré-requisitos: os mesmos de og-image.py (fontes em /tmp/ogfonts, venv com Pillow).
Execução: /tmp/ogvenv/bin/python scripts/icons.py
"""
from PIL import Image, ImageDraw, ImageFont

ACCENT = "#1B4F4F"
CREAM  = "#F8F6F1"

def gerar(tamanho, destino):
    img = Image.new("RGB", (tamanho, tamanho), ACCENT)
    d = ImageDraw.Draw(img)
    # ~42% do lado: monograma confortável dentro da zona segura maskable (80%)
    f = ImageFont.truetype("/tmp/ogfonts/playfair.ttf", int(tamanho * 0.42))
    f.set_variation_by_axes([700])
    bbox = d.textbbox((0, 0), "YT", font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((tamanho - w) / 2 - bbox[0], (tamanho - h) / 2 - bbox[1]), "YT", font=f, fill=CREAM)
    img.save(destino, optimize=True)
    print(destino, img.size)

base = "/Users/yuricorrearamos/Projetos/yuritobias.com/public"
gerar(192, f"{base}/icon-192.png")
gerar(512, f"{base}/icon-512.png")
gerar(180, f"{base}/apple-touch-icon.png")
