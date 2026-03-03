#!/usr/bin/env python3
"""Build `assets/atlas.png` and `assets/atlas.json` from `assets/raw/*.png`.

This is a local fallback for environments where `texturepacker` is unavailable.
Output is compatible with Phaser JSON Array atlas loading.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Missing dependency: Pillow. Install with `python3 -m pip install pillow`."
    ) from exc

MAX_WIDTH = 4096
PADDING = 2

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "assets" / "raw"
ATLAS_PNG = PROJECT_ROOT / "assets" / "atlas.png"
ATLAS_JSON = PROJECT_ROOT / "assets" / "atlas.json"


@dataclass(frozen=True)
class Sprite:
    name: str
    path: Path
    width: int
    height: int


def required_frame_names() -> set[str]:
    names = {f"kid_idle_{i}" for i in range(4)}
    names.add("water")

    bosses = [
        "boss_kitchen",
        "boss_trash",
        "boss_campfire",
        "boss_stove",
        "boss_car",
        "boss_bbq",
        "boss_forest",
        "boss_warehouse",
        "boss_office",
    ]
    for boss in bosses:
        names.update(f"{boss}_{i}" for i in range(6))

    names.update(f"dragon_{i}" for i in range(12))
    return names


def load_sprites() -> list[Sprite]:
    if not RAW_DIR.exists():
        raise SystemExit(f"Missing directory: {RAW_DIR}")

    sprites: list[Sprite] = []
    for path in sorted(RAW_DIR.glob("*.png")):
        with Image.open(path) as img:
            width, height = img.size
        sprites.append(Sprite(name=path.stem, path=path, width=width, height=height))

    if not sprites:
        raise SystemExit(f"No PNG files found in {RAW_DIR}")

    present = {s.name for s in sprites}
    missing = sorted(required_frame_names() - present)
    if missing:
        sample = ", ".join(missing[:12])
        if len(missing) > 12:
            sample += ", ..."
        raise SystemExit(
            f"Missing required frames in {RAW_DIR}: {sample} (total missing: {len(missing)})"
        )

    return sprites


def pack_shelf(sprites: list[Sprite]) -> tuple[int, int, list[tuple[Sprite, int, int]]]:
    ordered = sorted(sprites, key=lambda s: (-s.height, -s.width, s.name))

    x = 0
    y = 0
    row_h = 0
    used_w = 0
    placements: list[tuple[Sprite, int, int]] = []

    for sprite in ordered:
        if x > 0 and x + sprite.width > MAX_WIDTH:
            y += row_h + PADDING
            x = 0
            row_h = 0

        placements.append((sprite, x, y))
        x += sprite.width + PADDING
        row_h = max(row_h, sprite.height)
        used_w = max(used_w, x - PADDING)

    atlas_w = max(used_w, 1)
    atlas_h = max(y + row_h, 1)
    return atlas_w, atlas_h, placements


def build_atlas(sprites: list[Sprite]) -> tuple[Image.Image, list[dict]]:
    atlas_w, atlas_h, placements = pack_shelf(sprites)
    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    frames: list[dict] = []
    for sprite, px, py in placements:
        with Image.open(sprite.path) as frame_img:
            frame_rgba = frame_img.convert("RGBA")
        atlas.paste(frame_rgba, (px, py))

        w, h = sprite.width, sprite.height
        frames.append(
            {
                "filename": sprite.name,
                "frame": {"x": px, "y": py, "w": w, "h": h},
                "rotated": False,
                "trimmed": False,
                "spriteSourceSize": {"x": 0, "y": 0, "w": w, "h": h},
                "sourceSize": {"w": w, "h": h},
                "pivot": {"x": 0.5, "y": 0.5},
            }
        )

    frames.sort(key=lambda frame: frame["filename"])
    return atlas, frames


def write_outputs(atlas: Image.Image, frames: list[dict]) -> None:
    ATLAS_PNG.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(ATLAS_PNG, format="PNG", optimize=True)

    data = {
        "frames": frames,
        "meta": {
            "app": "python-atlas-fallback",
            "version": "1.0",
            "image": ATLAS_PNG.name,
            "format": "RGBA8888",
            "size": {"w": atlas.width, "h": atlas.height},
            "scale": "1",
        },
    }
    ATLAS_JSON.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    sprites = load_sprites()
    atlas, frames = build_atlas(sprites)
    write_outputs(atlas, frames)
    print(f"Wrote {ATLAS_PNG} ({atlas.width}x{atlas.height})")
    print(f"Wrote {ATLAS_JSON} (frames: {len(frames)})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
