# Synode image catalogue (v1.0.2)

Drop your photographs into `images/plates/` using **exactly** these filenames. The page picks them up with no code changes.
Each placeholder currently in the folder shows its own filename and size.

| File | Where on the page | Shape | Export size (px) | Caption on page |
|---|---|---|---|---|
| `plates/hero.jpg` | Opening screen, behind the title | Landscape 3:2 | 2400 × 1600 | none (decorative) |
| `plates/plate-01.jpg` | Chapter I · Aegean, first | Portrait 5:7 | 1000 × 1400 | 01 Indigo column dress |
| `plates/plate-02.jpg` | Chapter I · Aegean, second | Portrait 5:6 | 1000 × 1200 | 02 Salt-white tunic |
| `plates/plate-03.jpg` | Chapter I · Aegean, third | Landscape 3:2 | 1500 × 1000 | 03 Blue-hour layers |
| `plates/interlude.jpg` | Quote band, behind the quote | Landscape 3:2 | 2400 × 1600 | none (decorative) |
| `plates/plate-04.jpg` | Chapter II · Terracotta, leaf IV | Landscape 7:5 | 1400 × 1000 | Amphora coat |
| `plates/plate-05.jpg` | Chapter II · Terracotta, leaf V | Landscape 7:5 | 1400 × 1000 | Ochre pleat |
| `plates/plate-06.jpg` | Chapter II · Terracotta, leaf VI | Landscape 7:5 | 1400 × 1000 | Kiln shirt |
| `plates/plate-07.jpg` | Chapter III · Laurel, top left | Portrait 3:4 | 1200 × 1600 | 07 Olive knit |
| `plates/plate-08.jpg` | Chapter III · Laurel, top right | Landscape 9:7 | 1260 × 980 | 08 Gilt cuff, detail |
| `plates/plate-09.jpg` | Chapter III · Laurel, right | Portrait 9:13 | 1080 × 1560 | 09 Sage overcoat |
| `plates/plate-10.jpg` | Chapter III · Laurel, bottom left | Landscape 3:2 | 1500 × 1000 | 10 The gathering, Delos |
| `og/share.jpg` | Preview card when the link is shared | Landscape 1.91:1 | 1200 × 630 | — |

## Before you drop them in

1. **Export web copies only.** JPEG, sRGB, quality 75–82, at the size above. Never upload originals.
2. **Keep copyright metadata, remove location.** In Lightroom: *Metadata → All except Camera & Camera Raw info*, tick *Remove Location Info*.
3. **Name the files exactly** as listed: lowercase, `.jpg`.
4. Replace the placeholder files in `images/plates/`.
5. In `index.html`, search for each filename and update the `alt="…"` text and the caption under it to describe your photo.
6. Change every `?v=1.0.2` in `index.html` to `?v=1.0.3` so visitors' browsers fetch the new files instead of cached placeholders.

Different proportions are fine: frames crop to fit around the centre. To move the crop, add `style="object-position: 50% 25%"` to that `<img>` (first number is left→right, second is top→bottom).

Full guide, legal notes and protection details: `docs/synode-v1.0.2.pdf`.
To regenerate placeholders for empty slots: `python docs/src/make-placeholders.py` (never overwrites your photos).
