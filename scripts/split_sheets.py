#!/usr/bin/env python3
"""Split 3×2 boss sprite sheets into 6 individual frames for the atlas.

For each `assets/boss_{name}_sheet.png`:
  1. Load image (auto-detect size)
  2. Split into 3×2 grid
  3. Trim transparency from each cell
  4. Resize to 320×320 (matching existing atlas frame size)
  5. Save as `assets/raw/boss_{name}_0.png` through `boss_{name}_5.png`

Skips bosses that already have frames in assets/raw/.
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit(
        "Missing dependency: Pillow. Install with `python3 -m pip install pillow`."
    ) from exc

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
RAW_DIR = ASSETS_DIR / "raw"

COLS = 3
ROWS = 2
TARGET_SIZE = 320


def split_sheet(sheet_path: Path, boss_name: str) -> int:
    """Split a single boss sheet into frames. Returns number of frames written."""
    # Check if frames already exist
    existing = [RAW_DIR / f"boss_{boss_name}_{i}.png" for i in range(COLS * ROWS)]
    if all(f.exists() for f in existing):
        print(f"  Skipping boss_{boss_name}: all frames already exist")
        return 0

    img = Image.open(sheet_path).convert("RGBA")
    w, h = img.size
    cell_w = w // COLS
    cell_h = h // ROWS

    written = 0
    for row in range(ROWS):
        for col in range(COLS):
            idx = row * COLS + col
            left = col * cell_w
            upper = row * cell_h
            cell = img.crop((left, upper, left + cell_w, upper + cell_h))

            # Trim transparency
            bbox = cell.getbbox()
            if bbox:
                cell = cell.crop(bbox)

            # Resize to TARGET_SIZE×TARGET_SIZE (maintain aspect, pad with transparent)
            cw, ch = cell.size
            scale = min(TARGET_SIZE / cw, TARGET_SIZE / ch)
            new_w = int(cw * scale)
            new_h = int(ch * scale)
            cell = cell.resize((new_w, new_h), Image.LANCZOS)

            # Center on TARGET_SIZE canvas
            canvas = Image.new("RGBA", (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
            paste_x = (TARGET_SIZE - new_w) // 2
            paste_y = (TARGET_SIZE - new_h) // 2
            canvas.paste(cell, (paste_x, paste_y))

            out_path = RAW_DIR / f"boss_{boss_name}_{idx}.png"
            canvas.save(out_path, format="PNG")
            written += 1

    img.close()
    return written


def main() -> int:
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    # Find all boss sheets in assets/
    sheets = sorted(ASSETS_DIR.glob("boss_*_sheet.png"))
    if not sheets:
        print("No boss sprite sheets found in assets/")
        return 1

    total = 0
    for sheet_path in sheets:
        # Extract boss name: boss_{name}_sheet.png -> {name}
        stem = sheet_path.stem  # boss_{name}_sheet
        name = stem.replace("boss_", "", 1).replace("_sheet", "")
        print(f"Processing: {sheet_path.name} -> boss_{name}_[0-5].png")
        written = split_sheet(sheet_path, name)
        total += written

    print(f"\nDone: {total} frames written from {len(sheets)} sheets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
