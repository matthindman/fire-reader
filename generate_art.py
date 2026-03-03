#!/usr/bin/env python3
"""
Fire-Reader art generator using Gemini Nano Banana 2 (gemini-3.1-flash-image-preview).
Reads API key from ProfFlow's .env.local and generates game assets.
"""

import base64
import json
import os
import ssl
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CTX = ssl.create_default_context()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL = "gemini-2.5-flash-image"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

PROJECT_ROOT = Path(__file__).resolve().parent
ASSETS_DIR = PROJECT_ROOT / "assets"
BG_DIR = ASSETS_DIR / "backgrounds"
RAW_DIR = ASSETS_DIR / "raw"  # individual sprite PNGs for TexturePacker

# Shared style prefix for all prompts
STYLE = (
    "Bright, cheerful, cartoon style suitable for a 4-year-old child. "
    "Simple shapes, bold outlines, saturated colors, friendly and non-scary. "
    "No text or words in the image."
)

SPRITE_STYLE = (
    "Game sprite on a transparent background (PNG with alpha). "
    "Centered in frame, clean edges, no drop shadow. "
    f"{STYLE}"
)

BG_STYLE = (
    "Wide scene background for a 2D game, 960x540 pixels aspect ratio (16:9). "
    "Slight cartoon perspective, colorful and inviting. "
    f"{STYLE}"
)

# ---------------------------------------------------------------------------
# Asset definitions
# ---------------------------------------------------------------------------

BACKGROUNDS = {
    "bg1_kitchen.png": f"{BG_STYLE} A warm, cozy kitchen interior with a small fire on the stovetop. Pots and pans visible, tiled floor, window with curtains.",
    "bg2_alley.png": f"{BG_STYLE} A city alley at dusk with trash cans and a small trash fire. Brick walls, fire escape ladders, puddles on the ground.",
    "bg3_campsite.png": f"{BG_STYLE} A forest campsite at night with a campfire burning brightly. Tent, logs for sitting, pine trees, starry sky.",
    "bg4_home_stove.png": f"{BG_STYLE} A home interior with a wood-burning stove that has flames coming out. Cozy living room, rug, bookshelf.",
    "bg5_parkinglot.png": f"{BG_STYLE} A parking lot with a car that has smoke and small flames under the hood. Streetlights, other parked cars, asphalt.",
    "bg6_backyard_bbq.png": f"{BG_STYLE} A sunny backyard with a BBQ grill that has big flames. Green grass, fence, picnic table, garden flowers.",
    "bg7_forest.png": f"{BG_STYLE} A lush forest with a wildfire spreading through distant trees. Green foreground, orange glow in background, wildlife fleeing.",
    "bg8_warehouse.png": f"{BG_STYLE} An industrial warehouse interior with fire along one wall. Metal shelving, concrete floor, high ceiling with skylights.",
    "bg9_office.png": f"{BG_STYLE} A modern office with a small fire on a desk. Cubicles, computers, office chairs, fluorescent lighting.",
    "bg10_castle.png": f"{BG_STYLE} A medieval castle interior throne room with dramatic fire and a dragon's lair feel. Stone walls, torches, grand pillars.",
}

# Boss sprites: each boss has 6 frames (0-5) showing progressive fire damage/extinguishing
BOSS_SPRITES = {
    "boss_kitchen": {
        "desc": "A cartoon kitchen stove/oven on fire",
        "frames": 6,
    },
    "boss_trash": {
        "desc": "A cartoon overflowing trash can on fire",
        "frames": 6,
    },
    "boss_campfire": {
        "desc": "A cartoon campfire with logs",
        "frames": 6,
    },
    "boss_stove": {
        "desc": "A cartoon wood-burning stove on fire",
        "frames": 6,
    },
    "boss_car": {
        "desc": "A cartoon car with the hood open and engine on fire",
        "frames": 6,
    },
    "boss_bbq": {
        "desc": "A cartoon BBQ grill with big flames",
        "frames": 6,
    },
    "boss_forest": {
        "desc": "A cartoon burning tree",
        "frames": 6,
    },
    "boss_warehouse": {
        "desc": "A cartoon stack of warehouse crates on fire",
        "frames": 6,
    },
    "boss_office": {
        "desc": "A cartoon office desk with computer on fire",
        "frames": 6,
    },
}

DRAGON_FRAMES = 12  # dragon_0 .. dragon_11

KID_FRAMES = 4  # kid_idle_0 .. kid_idle_3

# ---------------------------------------------------------------------------
# Frame-level prompt helpers
# ---------------------------------------------------------------------------

def boss_frame_prompt(boss_key: str, frame: int, total: int) -> str:
    info = BOSS_SPRITES[boss_key]
    # Frame 0 = fully on fire, frame 5 = fully extinguished / smoldering
    fire_pct = max(0, 100 - int((frame / (total - 1)) * 100))
    if frame == 0:
        state = "fully engulfed in bright orange flames"
    elif frame == total - 1:
        state = "completely extinguished, wet and steaming, no flames, just wisps of smoke"
    else:
        state = f"partially on fire ({fire_pct}% flames remaining), some water splashes and steam visible"
    return f"{SPRITE_STYLE} {info['desc']}, {state}. Animation frame {frame+1} of {total}."


def dragon_frame_prompt(frame: int) -> str:
    # 12-frame dragon animation: flying/breathing fire cycle
    phase = frame / (DRAGON_FRAMES - 1)
    if phase < 0.25:
        action = "wings up, mouth closed, hovering"
    elif phase < 0.5:
        action = "wings mid-flap, mouth opening, sparks visible"
    elif phase < 0.75:
        action = "wings down, breathing a stream of fire from its mouth"
    else:
        action = "wings rising back up, fire trail fading, mouth closing"
    return (
        f"{SPRITE_STYLE} A friendly cartoon dragon (not scary, suitable for a 4-year-old). "
        f"Green and orange scales, big eyes, small wings. {action}. "
        f"Animation frame {frame+1} of {DRAGON_FRAMES}."
    )


def kid_frame_prompt(frame: int) -> str:
    # 4-frame idle animation: slight bounce/sway
    poses = [
        "standing straight, holding a fire hose at their side",
        "slight lean to the right, hose lifted a bit",
        "standing straight again, hose at side, slight smile",
        "slight lean to the left, hose lifted a bit the other way",
    ]
    return (
        f"{SPRITE_STYLE} A cute cartoon child firefighter wearing an oversized red fire helmet "
        f"and yellow turnout coat with reflective stripes, rubber boots. "
        f"{poses[frame]}. Animation frame {frame+1} of {KID_FRAMES}."
    )


WATER_PROMPT = (
    f"{SPRITE_STYLE} A burst of blue water spray / splash effect, "
    "like water shooting from a fire hose. Dynamic droplets radiating outward."
)

# ---------------------------------------------------------------------------
# API call
# ---------------------------------------------------------------------------

def load_api_key() -> str:
    env_path = Path.home() / "ProfFlow" / ".env.local"
    if not env_path.exists():
        sys.exit(f"ERROR: Cannot find API key at {env_path}")
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"ERROR: GEMINI_API_KEY not found in {env_path}")


def generate_image(api_key: str, prompt: str, aspect_ratio: str = "1:1") -> bytes:
    """Call Nano Banana 2 and return raw PNG bytes."""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": {
                "aspectRatio": aspect_ratio,
            },
        },
    }
    url = f"{API_URL}?key={api_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120, context=SSL_CTX) as resp:
            body = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"  HTTP {e.code}: {err_body[:500]}", file=sys.stderr)
        raise

    # Extract base64 image from response
    for candidate in body.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "inlineData" in part:
                b64 = part["inlineData"]["data"]
                return base64.b64decode(b64)
            # Also check snake_case variant
            if "inline_data" in part:
                b64 = part["inline_data"]["data"]
                return base64.b64decode(b64)

    # Debug: print response structure if no image found
    print(f"  WARNING: No image in response. Keys: {json.dumps(body, indent=2)[:1000]}", file=sys.stderr)
    raise RuntimeError("No image data in API response")


def save_image(data: bytes, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    print(f"  Saved {path} ({len(data):,} bytes)")


# ---------------------------------------------------------------------------
# Build the full job list
# ---------------------------------------------------------------------------

def build_jobs() -> list[dict]:
    """Return list of {name, path, prompt, aspect_ratio} dicts."""
    jobs = []

    # Backgrounds (16:9)
    for filename, prompt in BACKGROUNDS.items():
        jobs.append({
            "name": f"bg/{filename}",
            "path": BG_DIR / filename,
            "prompt": prompt,
            "aspect_ratio": "16:9",
        })

    # Boss sprites (1:1)
    for boss_key, info in BOSS_SPRITES.items():
        for f in range(info["frames"]):
            fname = f"{boss_key}_{f}.png"
            jobs.append({
                "name": f"sprite/{fname}",
                "path": RAW_DIR / fname,
                "prompt": boss_frame_prompt(boss_key, f, info["frames"]),
                "aspect_ratio": "1:1",
            })

    # Dragon (1:1)
    for f in range(DRAGON_FRAMES):
        fname = f"dragon_{f}.png"
        jobs.append({
            "name": f"sprite/{fname}",
            "path": RAW_DIR / fname,
            "prompt": dragon_frame_prompt(f),
            "aspect_ratio": "1:1",
        })

    # Kid idle (1:1)
    for f in range(KID_FRAMES):
        fname = f"kid_idle_{f}.png"
        jobs.append({
            "name": f"sprite/{fname}",
            "path": RAW_DIR / fname,
            "prompt": kid_frame_prompt(f),
            "aspect_ratio": "1:1",
        })

    # Water sprite (1:1)
    jobs.append({
        "name": "sprite/water.png",
        "path": RAW_DIR / "water.png",
        "prompt": WATER_PROMPT,
        "aspect_ratio": "1:1",
    })

    return jobs


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate Fire-Reader art via Nano Banana 2")
    parser.add_argument("--test", action="store_true", help="Generate only 2 test images")
    parser.add_argument("--all", action="store_true", help="Generate all images")
    parser.add_argument("--only", type=str, help="Generate a specific asset by name prefix (e.g. 'bg/bg1' or 'sprite/dragon_0')")
    parser.add_argument("--delay", type=float, default=2.0, help="Seconds between API calls (default: 2)")
    args = parser.parse_args()

    if not args.test and not args.all and not args.only:
        parser.print_help()
        print("\nUse --test for a quick 2-image trial, or --all for everything.")
        sys.exit(1)

    api_key = load_api_key()
    jobs = build_jobs()

    if args.test:
        # Pick one background and one sprite for testing
        test_jobs = [
            next(j for j in jobs if j["name"] == "bg/bg1_kitchen.png"),
            next(j for j in jobs if j["name"] == "sprite/kid_idle_0.png"),
        ]
        jobs = test_jobs
    elif args.only:
        jobs = [j for j in jobs if j["name"].startswith(args.only)]
        if not jobs:
            print(f"No jobs matching '{args.only}'. Available prefixes:")
            for j in build_jobs()[:10]:
                print(f"  {j['name']}")
            sys.exit(1)

    print(f"Generating {len(jobs)} image(s) using {MODEL}...")
    print(f"Delay between calls: {args.delay}s\n")

    success = 0
    failed = 0
    for i, job in enumerate(jobs):
        print(f"[{i+1}/{len(jobs)}] {job['name']}")
        try:
            data = generate_image(api_key, job["prompt"], job["aspect_ratio"])
            save_image(data, job["path"])
            success += 1
        except Exception as e:
            print(f"  FAILED: {e}", file=sys.stderr)
            failed += 1

        if i < len(jobs) - 1:
            time.sleep(args.delay)

    print(f"\nDone: {success} succeeded, {failed} failed out of {len(jobs)} total.")


if __name__ == "__main__":
    main()
