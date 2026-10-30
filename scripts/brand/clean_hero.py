"""Paint the baked-in marketing copy out of the client's hero photo.

Source: _brand/hero-source.png (1672x940, "L'excellence automobile au coucher du
soleil"). The headline, subtitle, three icon bullets and the button sit on the
dark left side; the site renders its own (translated) copy there instead.

Only the glyph pixels are masked (local-contrast threshold inside each text
box, dilated), not whole boxes, so the navy gradient and the clouds behind the
headline keep their own texture; the button is a solid block, so it is masked
as a box. Output: _brand/hero-photo-clean.png -> Real-ESRGAN x4 (realesrgan-x4plus) ->
_brand/hero-photo-x4.png -> bun run optimize:assets.

Run: python -I scripts/brand/clean_hero.py
"""
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "_brand" / "hero-source.png"
OUT = ROOT / "_brand" / "hero-photo-clean.png"

img = cv2.imread(str(SRC))
if img is None:
    raise SystemExit(f"cannot read {SRC}")

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.int16)
background = cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 41).astype(np.int16)
contrast = (gray - background) > 8

# (x0, y0, x1, y1): headline line 1, line 2, subtitle, icon bullets + labels.
GLYPH_BOXES = [
    (88, 196, 960, 282),
    (88, 282, 640, 366),
    (88, 372, 632, 446),
    (88, 468, 652, 600),
]
BUTTON = (90, 626, 498, 710)

mask = np.zeros(gray.shape, np.uint8)
for x0, y0, x1, y1 in GLYPH_BOXES:
    region = contrast[y0:y1, x0:x1]
    mask[y0:y1, x0:x1][region] = 255
mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=3)
x0, y0, x1, y1 = BUTTON
mask[y0:y1, x0:x1] = 255

clean = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)

# Left of the clouds the photo is a plain navy gradient: there, Telea's local
# averaging leaves faint ghosts of each glyph's halo. Rebuild that zone from a
# normalised convolution of the UNmasked pixels (a smooth gradient fit) over a
# generously grown mask instead.
NAVY_ZONE = (500, 660)  # full gradient fit left of 500px, ramping out by 660px
wide = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=6)
wide[:, NAVY_ZONE[1]:] = 0
keep = (wide == 0).astype(np.float32)
sigma = 28
num = cv2.GaussianBlur(img.astype(np.float32) * keep[..., None], (0, 0), sigma)
den = cv2.GaussianBlur(keep, (0, 0), sigma)[..., None]
smooth = num / np.maximum(den, 1e-3)
ramp = np.clip((NAVY_ZONE[1] - np.arange(img.shape[1])) / (NAVY_ZONE[1] - NAVY_ZONE[0]), 0, 1)
feather = cv2.GaussianBlur(wide, (0, 0), 4).astype(np.float32) / 255 * ramp[None, :]
feather = feather[..., None]
clean = (clean.astype(np.float32) * (1 - feather) + smooth * feather).astype(np.uint8)
mask = np.maximum(mask, wide)

# Over the clouds (the end of headline line 1) inpainting alone leaves dark
# blots in the letter shapes. Keep its low frequencies (the right colours) and
# borrow the high-frequency cloud texture from the band just above the line.
CLOUD = (560, 186, 980, 290)  # x0, y0, x1, y1
SHIFT = 96
cx0, cy0, cx1, cy1 = CLOUD
src = img[cy0 - SHIFT : cy1 - SHIFT, cx0:cx1].astype(np.float32)
detail = src - cv2.GaussianBlur(src, (0, 0), 10)
low = cv2.GaussianBlur(clean[cy0:cy1, cx0:cx1].astype(np.float32), (0, 0), 10)
weight = cv2.GaussianBlur(
    cv2.dilate(mask[cy0:cy1, cx0:cx1], np.ones((3, 3), np.uint8), iterations=4), (0, 0), 5
).astype(np.float32) / 255
weight *= np.clip((np.arange(cx0, cx1) - NAVY_ZONE[0]) / (NAVY_ZONE[1] - NAVY_ZONE[0]), 0, 1)[None, :]
weight = weight[..., None]
region = clean[cy0:cy1, cx0:cx1].astype(np.float32)
clean[cy0:cy1, cx0:cx1] = np.clip(region * (1 - weight) + (low + detail) * weight, 0, 255).astype(np.uint8)

# Inpainting leaves the filled areas smoother than the photo's own grain; a
# matched pinch of noise keeps them from reading as flat patches.
rng = np.random.default_rng(7)
noise = rng.normal(0, 1.6, img.shape).astype(np.float32)
soft = cv2.GaussianBlur(mask, (0, 0), 3).astype(np.float32)[..., None] / 255
clean = np.clip(clean.astype(np.float32) + noise * soft, 0, 255).astype(np.uint8)

cv2.imwrite(str(OUT), clean)
print("hero", clean.shape, "masked px", int((mask > 0).sum()))
