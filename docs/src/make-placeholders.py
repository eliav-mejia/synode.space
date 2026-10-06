"""Synode v1.0.2 — writes labelled placeholder JPGs for every slot in the image catalogue.

Run from the project root:  python docs/src/make-placeholders.py
Existing files are never overwritten unless --force is passed, so your own photographs are safe.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# filename, width, height, label  — keep in sync with the catalogue in docs/src/synode-v1.0.2.html
CATALOGUE = [
    ("images/plates/hero.jpg",      2400, 1600, "Hero"),
    ("images/plates/plate-01.jpg",  1000, 1400, "Plate 01 · Aegean"),
    ("images/plates/plate-02.jpg",  1000, 1200, "Plate 02 · Aegean"),
    ("images/plates/plate-03.jpg",  1500, 1000, "Plate 03 · Aegean"),
    ("images/plates/interlude.jpg", 2400, 1600, "Interlude"),
    ("images/plates/plate-04.jpg",  1400, 1000, "Plate IV · Terracotta"),
    ("images/plates/plate-05.jpg",  1400, 1000, "Plate V · Terracotta"),
    ("images/plates/plate-06.jpg",  1400, 1000, "Plate VI · Terracotta"),
    ("images/plates/plate-07.jpg",  1200, 1600, "Plate 07 · Laurel"),
    ("images/plates/plate-08.jpg",  1260,  980, "Plate 08 · Laurel"),
    ("images/plates/plate-09.jpg",  1080, 1560, "Plate 09 · Laurel"),
    ("images/plates/plate-10.jpg",  1500, 1000, "Plate 10 · Laurel"),
    ("images/og/share.jpg",         1200,  630, "Social share image"),
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
    d.text((cx, cy + s * 0.10), f"{w} × {h} px — replace with your photograph", font=font(int(s * 0.028), italic=True), fill=PARCH, anchor="mm")
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
