#!/usr/bin/env python3
# ============================================================
# Fix the wordmark accent: the supplied artwork renders ÈIRVOX
# (grave) — it must be ÉIRVOX (acute, U+00C9). The accent is a
# single isolated mark above a white gap (rows ~97-122, cols
# ~125-162), so we crop a padded box around it and mirror it
# horizontally: grave "\" -> acute "/", in the artwork's own font.
#
# Usage: python3 scripts/fix-wordmark-accent.py [in.png] [out.png]
# Defaults preserve the original and write a sibling *-acute.png so
# the result can be reviewed before overwriting the asset.
# ============================================================
import sys
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else "public/brand/wordmark.png"
dst = sys.argv[2] if len(sys.argv) > 2 else "/tmp/wordmark-acute.png"

im = Image.open(src).convert("RGBA")

# Accent box, padded into the surrounding white margin / gap so the
# flip can't clip the glyph and leaves no fringe (everything outside
# the mark in this band is transparent/white).
BOX = (118, 92, 170, 130)  # (left, top, right, bottom)

region = im.crop(BOX)
region = region.transpose(Image.FLIP_LEFT_RIGHT)
im.paste(region, BOX)
im.save(dst)
print(f"wrote {dst}")
