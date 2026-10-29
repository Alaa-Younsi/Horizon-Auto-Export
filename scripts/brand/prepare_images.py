"""One-off: pull the hero and about photos out of the client's approved mock-up.

The mock-up (_brand/mockup.jpeg) is a 591px-wide WhatsApp screenshot, so both
photos arrive tiny and with the mock-up's own text baked in. This script:
  1. crops each photo out of the page,
  2. paints out the baked-in text / decorative blade (OpenCV Telea inpainting —
     the hero's left side sits under a navy gradient on the site anyway),
  3. writes 1x PNGs that Real-ESRGAN then upscales x4 (see README, "Brand assets").

Run: python -I scripts/brand/prepare_images.py
Replace both files with the client's original photos as soon as they send them:
the upscale is a stop-gap, not a substitute for the source file.
"""
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "_brand" / "mockup.jpeg"
OUT = ROOT / "_brand"

page = cv2.imread(str(SRC))
if page is None:
    raise SystemExit(f"cannot read {SRC}")

# ---- hero: rows 385..543, full width (measured from the row luminance profile)
HERO_Y0, HERO_Y1 = 385, 544
hero = page[HERO_Y0:HERO_Y1, 0:591].copy()
# Text blocks in page coordinates (eyebrow, title, subtitle, bullets, button).
TEXT_BOXES = [
    (22, 403, 121, 416),
    (22, 414, 223, 440),
    (22, 442, 208, 469),
    (22, 475, 244, 492),
    (22, 500, 114, 526),
]
mask = np.zeros(hero.shape[:2], np.uint8)
for x0, y0, x1, y1 in TEXT_BOXES:
    mask[y0 - HERO_Y0 : y1 - HERO_Y0, x0:x1] = 255
hero = cv2.inpaint(hero, mask, 6, cv2.INPAINT_TELEA)
cv2.imwrite(str(OUT / "hero-clean.png"), hero)

# ---- about: x 0..191, rows 636..763; paint out the white + gold diagonal blade
ABOUT = page[636:764, 0:192].copy()
hsv = cv2.cvtColor(ABOUT, cv2.COLOR_BGR2HSV)
light = (hsv[..., 2] > 150) & (hsv[..., 1] < 70)
gold = (hsv[..., 0] > 8) & (hsv[..., 0] < 30) & (hsv[..., 1] > 70) & (hsv[..., 2] > 90)
blade = np.zeros(ABOUT.shape[:2], np.uint8)
blade[(light | gold)] = 255
blade[:, 85:] = 0  # the blade lives in the left third; keep the headlight's own highlights
blade = cv2.dilate(blade, np.ones((5, 5), np.uint8), iterations=2)
about = cv2.inpaint(ABOUT, blade, 7, cv2.INPAINT_TELEA)
cv2.imwrite(str(OUT / "about-clean.png"), about)

print("hero", hero.shape, "about", about.shape)
