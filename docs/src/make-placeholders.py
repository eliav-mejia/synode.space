"""Synode v1.0.4 — writes labelled placeholder JPGs for every slot in the image catalogues.

Catalogues: images/synodos/README.md (main page) and images/brands/<brand>/README.md (one per brand).

Run from the project root:  python docs/src/make-placeholders.py
Existing files are never overwritten unless --force is passed, so your own photographs are safe.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# filename, width, height, label  — keep in sync with images/synodos/README.md and images/brands/*/README.md
CATALOGUE = [
    ("images/synodos/hero.jpg",      2400, 1600, "Hero"),
    ("images/synodos/plate-01.jpg",  1000, 1400, "Plate 01 · Aegean"),
    ("images/synodos/plate-02.jpg",  1000, 1200, "Plate 02 · Aegean"),
    ("images/synodos/plate-03.jpg",  1500, 1000, "Plate 03 · Aegean"),
    ("images/synodos/interlude.jpg", 2400, 1600, "Interlude"),
    ("images/synodos/plate-04.jpg",  1400, 1000, "Plate IV · Terracotta"),
    ("images/synodos/plate-05.jpg",  1400, 1000, "Plate V · Terracotta"),
    ("images/synodos/plate-06.jpg",  1400, 1000, "Plate VI · Terracotta"),
    ("images/synodos/plate-07.jpg",  1200, 1600, "Plate 07 · Laurel"),
    ("images/synodos/plate-08.jpg",  1260,  980, "Plate 08 · Laurel"),
    ("images/synodos/plate-09.jpg",  1080, 1560, "Plate 09 · Laurel"),
    ("images/synodos/plate-10.jpg",  1500, 1000, "Plate 10 · Laurel"),
    ("images/og/share.jpg",         1200,  630, "Social share image"),

    # Brand no. 1 · Reino Fiel (brands/reino_fiel/)
    ("images/brands/reino_fiel/hero.jpg",            2400, 1600, "Reino Fiel · Portada"),
    ("images/brands/reino_fiel/retrato-01.jpg",      1000, 1400, "Retrato 01"),
    ("images/brands/reino_fiel/retrato-02.jpg",      1000, 1200, "Retrato 02"),
    ("images/brands/reino_fiel/retrato-03.jpg",      1500, 1000, "Retrato 03"),
    ("images/brands/reino_fiel/interludio.jpg",      2400, 1600, "Reino Fiel · Interludio"),
    ("images/brands/reino_fiel/sesion-esencial.jpg", 1200,  900, "Sesión Esencial"),
    ("images/brands/reino_fiel/sesion-clasica.jpg",  1200,  900, "Sesión Clásica"),
    ("images/brands/reino_fiel/sesion-legado.jpg",   1200,  900, "Sesión Legado"),
    ("images/brands/reino_fiel/galeria-01.jpg",      1200, 1600, "Galería 01"),
    ("images/brands/reino_fiel/galeria-02.jpg",      1260,  980, "Galería 02"),
    ("images/brands/reino_fiel/galeria-03.jpg",      1080, 1560, "Galería 03"),
    ("images/brands/reino_fiel/galeria-04.jpg",      1500, 1000, "Galería 04"),
    ("images/brands/reino_fiel/compartir.jpg",       1200,  630, "Reino Fiel · Compartir"),
]

INK, PARCH, GOLD, RUST = (12, 24, 33), (247, 244, 238), (194, 155, 56), (163, 72, 40)


def font(size, italic=False):
    names = ["georgiai.ttf" if italic else "georgia.ttf", "DejaVuSerif.ttf"]
    for n in names:
        for d in ["C:/Windows/Fonts", "/Library/Fonts", "/usr/share/fonts/truetype/dejavu"]:
            p = os.path.join(d, n)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make(path, w, h, label):
    img = Image.new("RGB", (w, h), INK)
    d = ImageDraw.Draw(img)
    # soft vertical tone so the parallax movement is visible
    for y in range(h):
        t = y / h
        c = tuple(int(INK[i] + (60 - INK[i] * 0.4) * t * 0.5) for i in range(3))
        d.line([(0, y), (w, y)], fill=c)
    m = int(min(w, h) * 0.06)
    d.rectangle([m, m, w - m, h - m], outline=GOLD, width=max(2, w // 900))
    cx, cy = w // 2, h // 2
    s = min(w, h)
    d.text((cx, cy - s * 0.09), label.upper(), font=font(int(s * 0.055)), fill=PARCH, anchor="mm")
    d.line([(cx - s * 0.06, cy - s * 0.02), (cx + s * 0.06, cy - s * 0.02)], fill=RUST, width=max(2, s // 400))
    d.text((cx, cy + s * 0.04), path, font=font(int(s * 0.035), italic=True), fill=GOLD, anchor="mm")
    d.text((cx, cy + s * 0.10), (f"{w} × {h} px — sustituir por tu fotografía" if "/brands/" in path else f"{w} × {h} px — replace with your photograph"), font=font(int(s * 0.028), italic=True), fill=PARCH, anchor="mm")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "JPEG", quality=82, optimize=True, progressive=True)


if __name__ == "__main__":
    force = "--force" in sys.argv
    for path, w, h, label in CATALOGUE:
        if os.path.exists(path) and not force:
            print("keep ", path)
            continue
        make(path, w, h, label)
        print("wrote", path)
