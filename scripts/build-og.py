#!/usr/bin/env python3
# ============================================================
# ÉIRVOX OG image — interim, type-only (Task E).
# Renders public/og-image.png at exactly 1200x630: near-black field,
# letterspaced light ÉIRVOX wordmark (É acute), one mono caption.
# No new brand dependency; uses macOS system fonts. Re-run to regenerate.
# Replace with the real photo-split template once §11 photography lands.
# ============================================================
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
FIELD = (0x0E, 0x0D, 0x0C)      # --evx-black
PAPER = (0xF4, 0xF1, 0xEC)      # light type
SOFT  = (0xC7, 0xC2, 0xB9)      # --evx-paper-soft
PAD   = 84

WORDMARK_FONT = "/System/Library/Fonts/HelveticaNeue.ttc"
MONO_FONT     = "/System/Library/Fonts/Menlo.ttc"

img = Image.new("RGB", (W, H), FIELD)
d = ImageDraw.Draw(img)

def tracked(draw, xy, text, font, fill, tracking):
    """Draw text left-to-right with extra per-glyph tracking (px)."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking

wordmark = ImageFont.truetype(WORDMARK_FONT, 66)
caption  = ImageFont.truetype(MONO_FONT, 21)

# Wordmark, upper-left, letterspaced (~0.34em).
tracked(d, (PAD, 250), "ÉIRVOX", wordmark, PAPER, tracking=22)

# Caption, two mono lines, bottom-left, letterspaced (~0.08em).
tracked(d, (PAD, 506), "CARBON STEERING WHEELS", caption, SOFT, tracking=2)
tracked(d, (PAD, 538), "DUBLIN, IRELAND",        caption, SOFT, tracking=2)

img.save("public/og-image.png", "PNG")
print("wrote public/og-image.png", img.size)
