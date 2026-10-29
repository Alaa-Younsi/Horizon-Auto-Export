"""One-off: turn the client's white-background JPEG logo into transparent PNGs.

The artwork is two flat inks (navy + gold) on white, so each pixel is keyed as
"ink over white": alpha = how far it is from white, relative to how far the
nearest brand ink is. Colour is then snapped to that ink — JPEG noise and the
white halo disappear and the brand colours come out exact.

Outputs (in _brand/):
  logo-full.png       navy + gold, everything (footer on light, print)
  logo-full-light.png white + gold, for navy backgrounds
  logo-header.png     mark + HORIZON + AUTO EXPORT (no tagline), for the header
  logo-header-light.png
  logo-mark.png       globe + car only (favicon, app icon, loaders)

Run: python -I scripts/brand/key_logo.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
src = np.asarray(Image.open(ROOT / "_brand" / "logo-source.jpeg").convert("RGB")).astype(np.float32)

NAVY = np.array([8, 25, 61], np.float32)
GOLD = np.array([167, 124, 56], np.float32)
WHITE = np.array([255, 255, 255], np.float32)

# Gold reads warm (r well above b); everything else that isn't white is navy.
r, g, b = src[..., 0], src[..., 1], src[..., 2]
is_gold = (r - b) > 28
ink = np.where(is_gold[..., None], GOLD, NAVY)

# Projection of (white - pixel) onto (white - ink): 0 = white paper, 1 = full ink.
num = ((WHITE - src) * (WHITE - ink)).sum(axis=2)
den = ((WHITE - ink) ** 2).sum(axis=2)
alpha = np.clip(num / den, 0, 1)
alpha[alpha < 0.06] = 0  # paper noise
alpha = np.clip((alpha - 0.06) / 0.94, 0, 1)

h, w = alpha.shape


def save(name: str, colors: np.ndarray, a: np.ndarray, box: tuple[int, int, int, int]) -> None:
    rgba = np.dstack([colors, a * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA").crop(box)
    bbox = img.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    img = img.crop(bbox)
    img.save(ROOT / "_brand" / name, optimize=True)
    print(name, img.size)


light_ink = np.where(is_gold[..., None], GOLD, WHITE)
FULL = (6, 6, w - 8, h - 8)  # the JPEG has a dark 1-2px frame
HEADER = (6, 6, w - 8, 600)  # above "EXCELLENCE BEYOND BORDERS"
MARK = (150, 0, 1030, 418)  # globe + car silhouette

save("logo-full.png", ink, alpha, FULL)
save("logo-full-light.png", light_ink, alpha, FULL)
save("logo-header.png", ink, alpha, HEADER)
save("logo-header-light.png", light_ink, alpha, HEADER)
save("logo-mark.png", ink, alpha, MARK)
save("logo-mark-light.png", light_ink, alpha, MARK)
