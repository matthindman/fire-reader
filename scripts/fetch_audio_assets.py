#!/usr/bin/env python3
"""
Fire-Reader CC0 audio asset fetcher (v2.0)

Downloads CC0 sound packs and selects the best files for SFX, UI sounds,
and stingers. Converts OGG→WAV (mono, 16-bit, 44100 Hz) via ffmpeg.

CC0 packs used:
  - SubspaceAudio "512 Sound Effects (8-bit style)" — OpenGameArt, WAV
  - Kenney UI Audio — kenney.nl, OGG
  - Kenney Music Jingles — kenney.nl, OGG
  - NES Sounds (Basto) — OpenGameArt, OGG

All packs are CC0 (public domain). No attribution required.

Usage:
  python3 scripts/fetch_audio_assets.py

Requires: ffmpeg (brew install ffmpeg)
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

# ---------------------------------------------------------------------------
# CC0 pack definitions
# ---------------------------------------------------------------------------

PACKS = {
    'subspace512': {
        'url': 'https://opengameart.org/sites/default/files/The%20Essential%20Retro%20Video%20Game%20Sound%20Effects%20Collection%20%5B512%20sounds%5D.zip',
        'desc': 'SubspaceAudio 512 8-bit SFX (WAV, CC0)',
    },
    'kenney_ui': {
        'url': 'https://kenney.nl/media/pages/assets/ui-audio/e19c9b1814-1677590494/kenney_ui-audio.zip',
        'desc': 'Kenney UI Audio (OGG, CC0)',
    },
    'kenney_jingles': {
        'url': 'https://kenney.nl/media/pages/assets/music-jingles/4f5dd770b7-1677590399/kenney_music-jingles.zip',
        'desc': 'Kenney Music Jingles (OGG, CC0)',
    },
    'nes_sounds': {
        'url': 'https://opengameart.org/sites/default/files/sounds_5.zip',
        'desc': 'NES Sounds by Basto (OGG, CC0)',
    },
}

# ---------------------------------------------------------------------------
# File mapping: which CC0 file maps to which game asset
#
# Each entry: (pack_name, glob_pattern, target_path)
# glob_pattern matches files within the extracted pack.
# If multiple matches, the first alphabetically is used.
# ---------------------------------------------------------------------------

# Mapping from game audio slot → (pack_key, search_patterns, target_path)
# search_patterns: list of substrings to search for in filenames (case-insensitive)
# We try patterns in order and take the first match.

SFX_DIR = Path('assets/audio/sfx')
MUSIC_DIR = Path('assets/audio/music')
LEGACY_DIR = Path('assets/audio')

FILE_MAPPINGS = [
    # UI sounds (from Kenney UI Audio)
    {
        'target': SFX_DIR / 'ui_click_v01.wav',
        'pack': 'kenney_ui',
        'patterns': ['click', 'tap', 'select'],
        'desc': 'UI click',
    },
    {
        'target': SFX_DIR / 'ui_confirm_v01.wav',
        'pack': 'kenney_ui',
        'patterns': ['confirm', 'accept', 'positive'],
        'desc': 'UI confirm',
    },
    {
        'target': SFX_DIR / 'ui_back_v01.wav',
        'pack': 'kenney_ui',
        'patterns': ['back', 'cancel', 'close', 'negative'],
        'desc': 'UI back',
    },
    {
        'target': SFX_DIR / 'ui_toggle_on_v01.wav',
        'pack': 'kenney_ui',
        'patterns': ['switch', 'toggle', 'on'],
        'desc': 'UI toggle on',
    },
    {
        'target': SFX_DIR / 'ui_toggle_off_v01.wav',
        'pack': 'kenney_ui',
        'patterns': ['switch', 'toggle', 'off'],
        'desc': 'UI toggle off',
        'offset': 1,  # Use 2nd match to differ from toggle_on
    },

    # Gameplay SFX (from SubspaceAudio 512)
    {
        'target': SFX_DIR / 'spray_shot_v01.wav',
        'pack': 'subspace512',
        'patterns': ['water', 'splash', 'spray', 'squirt', 'liquid'],
        'desc': 'Spray shot v1',
    },
    {
        'target': SFX_DIR / 'spray_shot_v02.wav',
        'pack': 'nes_sounds',
        'patterns': ['splash', 'water', 'drain', 'fill'],
        'desc': 'Spray shot v2',
    },
    {
        'target': SFX_DIR / 'hit_success_v01.wav',
        'pack': 'subspace512',
        'patterns': ['powerup', 'power_up', 'coin', 'collect', 'pickup'],
        'desc': 'Hit success v1',
    },
    {
        'target': SFX_DIR / 'hit_success_v02.wav',
        'pack': 'subspace512',
        'patterns': ['score', 'point', 'bonus', 'reward'],
        'desc': 'Hit success v2',
    },
    {
        'target': SFX_DIR / 'hit_minor_v01.wav',
        'pack': 'subspace512',
        'patterns': ['blip', 'beep', 'tone', 'ping'],
        'desc': 'Hit minor',
    },
    {
        'target': SFX_DIR / 'fail_try_again_v01.wav',
        'pack': 'subspace512',
        'patterns': ['hurt', 'damage', 'negative', 'wrong', 'miss'],
        'desc': 'Fail/try-again v1',
    },
    {
        'target': SFX_DIR / 'fail_try_again_v02.wav',
        'pack': 'subspace512',
        'patterns': ['lose', 'fail', 'down', 'sad'],
        'desc': 'Fail/try-again v2',
    },
    {
        'target': SFX_DIR / 'word_mastered_v01.wav',
        'pack': 'subspace512',
        'patterns': ['levelup', 'level_up', 'achievement', 'fanfare', 'tada'],
        'desc': 'Word mastered',
    },
    {
        'target': SFX_DIR / 'unlock_reward_v01.wav',
        'pack': 'subspace512',
        'patterns': ['unlock', 'open', 'chest', 'treasure', 'secret'],
        'desc': 'Unlock reward',
    },

    # Stingers (from Kenney Music Jingles)
    {
        'target': MUSIC_DIR / 'stinger_level_clear.wav',
        'pack': 'kenney_jingles',
        'patterns': ['victory', 'win', 'success', 'fanfare', 'complete'],
        'desc': 'Level clear stinger',
    },
    {
        'target': MUSIC_DIR / 'stinger_level_fail.wav',
        'pack': 'kenney_jingles',
        'patterns': ['lose', 'fail', 'game_over', 'gameover', 'sad'],
        'desc': 'Level fail stinger',
    },
    {
        'target': MUSIC_DIR / 'stinger_boss_end.wav',
        'pack': 'kenney_jingles',
        'patterns': ['boss', 'epic', 'hero', 'power', 'trumpet'],
        'desc': 'Boss end stinger',
    },
]

# Legacy fallback copies
LEGACY_COPIES = [
    (SFX_DIR / 'spray_shot_v01.wav', LEGACY_DIR / 'spray.wav'),
    (SFX_DIR / 'hit_success_v01.wav', LEGACY_DIR / 'hit.wav'),
    (SFX_DIR / 'fail_try_again_v01.wav', LEGACY_DIR / 'fail.wav'),
    (MUSIC_DIR / 'stinger_level_clear.wav', LEGACY_DIR / 'victory.wav'),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def check_ffmpeg() -> bool:
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def download_pack(url: str, dest: Path, desc: str) -> Path:
    """Download a ZIP file and return the path."""
    zip_path = dest / 'pack.zip'
    print(f'  Downloading {desc}...')
    print(f'    URL: {url}')
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Fire-Reader game asset fetcher)'
        })
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
        zip_path.write_bytes(data)
        print(f'    Downloaded {len(data) / 1024 / 1024:.1f} MB')
        return zip_path
    except Exception as e:
        print(f'    ERROR downloading: {e}')
        raise


def extract_pack(zip_path: Path, extract_to: Path) -> None:
    """Extract a ZIP file."""
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(extract_to)
    file_count = sum(1 for _ in extract_to.rglob('*') if _.is_file())
    print(f'    Extracted {file_count} files')


def find_audio_files(pack_dir: Path) -> list[Path]:
    """Find all audio files in a directory (WAV, OGG, MP3)."""
    extensions = {'.wav', '.ogg', '.mp3', '.flac'}
    files = []
    for f in pack_dir.rglob('*'):
        if f.is_file() and f.suffix.lower() in extensions:
            files.append(f)
    files.sort(key=lambda p: p.name.lower())
    return files


def find_best_match(files: list[Path], patterns: list[str], offset: int = 0) -> Path | None:
    """Find the best matching audio file for given search patterns."""
    for pattern in patterns:
        matches = [f for f in files
                   if pattern.lower() in f.stem.lower()]
        if len(matches) > offset:
            return matches[offset]
    # Fallback: return a file by index based on offset
    if files:
        return files[min(offset, len(files) - 1)]
    return None


def convert_to_wav(src: Path, dst: Path) -> bool:
    """Convert audio file to WAV (mono, 16-bit, 44100 Hz) via ffmpeg."""
    dst.parent.mkdir(parents=True, exist_ok=True)

    # If already WAV, just copy (ffmpeg will normalize format)
    try:
        result = subprocess.run([
            'ffmpeg', '-y', '-i', str(src),
            '-ac', '1',           # mono
            '-ar', '44100',       # 44.1 kHz
            '-sample_fmt', 's16', # 16-bit
            '-acodec', 'pcm_s16le',
            str(dst)
        ], capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f'    ffmpeg error: {result.stderr[:200]}')
            return False
        return True
    except Exception as e:
        print(f'    Conversion error: {e}')
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    if not check_ffmpeg():
        print('ERROR: ffmpeg not found. Install with: brew install ffmpeg')
        return 1

    out_sfx = Path('assets/audio/sfx')
    out_music = Path('assets/audio/music')
    out_legacy = Path('assets/audio')
    out_sfx.mkdir(parents=True, exist_ok=True)
    out_music.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix='fire-reader-audio-') as tmpdir:
        tmp = Path(tmpdir)
        pack_dirs: dict[str, Path] = {}

        # Download and extract all packs
        print('Downloading CC0 audio packs...')
        for pack_key, pack_info in PACKS.items():
            pack_tmp = tmp / pack_key
            pack_tmp.mkdir()
            try:
                zip_path = download_pack(pack_info['url'], pack_tmp, pack_info['desc'])
                extract_dir = pack_tmp / 'extracted'
                extract_dir.mkdir()
                extract_pack(zip_path, extract_dir)
                pack_dirs[pack_key] = extract_dir
            except Exception as e:
                print(f'  WARNING: Failed to download {pack_key}: {e}')
                print(f'  Will use generated fallback for these sounds.')

        # Index audio files per pack
        pack_files: dict[str, list[Path]] = {}
        for pack_key, pack_dir in pack_dirs.items():
            files = find_audio_files(pack_dir)
            pack_files[pack_key] = files
            print(f'  {pack_key}: {len(files)} audio files found')

        # Process each mapping
        print('\nMapping CC0 assets to game slots...')
        success_count = 0
        fail_count = 0

        for mapping in FILE_MAPPINGS:
            target = mapping['target']
            pack_key = mapping['pack']
            patterns = mapping['patterns']
            desc = mapping['desc']
            offset = mapping.get('offset', 0)

            if pack_key not in pack_files:
                print(f'  SKIP {desc} — pack {pack_key} not available')
                fail_count += 1
                continue

            files = pack_files[pack_key]
            match = find_best_match(files, patterns, offset)

            if match is None:
                print(f'  SKIP {desc} — no matching file found')
                fail_count += 1
                continue

            print(f'  {desc}: {match.name} → {target.name}')
            if convert_to_wav(match, target):
                success_count += 1
            else:
                print(f'    FAILED to convert {match.name}')
                fail_count += 1

        # Legacy fallback copies
        print('\nCopying legacy fallbacks...')
        for src, dst in LEGACY_COPIES:
            if src.exists():
                shutil.copy2(src, dst)
                print(f'  {src.name} → {dst.name}')

        # Also copy menu loop to bgm.wav if it exists
        menu_loop = out_music / 'bgm_menu_loop.wav'
        if menu_loop.exists():
            shutil.copy2(menu_loop, out_legacy / 'bgm.wav')
            print(f'  bgm_menu_loop.wav → bgm.wav')

    # Verify
    print(f'\nResults: {success_count} files placed, {fail_count} skipped/failed')

    all_expected = [m['target'] for m in FILE_MAPPINGS]
    missing = [p for p in all_expected if not p.exists()]
    if missing:
        print(f'\nWARNING: {len(missing)} target files missing:')
        for p in missing:
            print(f'  {p}')
        print('\nRun `npm run audio:generate` to fill gaps with generated audio.')
    else:
        print(f'\nAll {len(all_expected)} CC0 target files in place!')

    return 0


if __name__ == '__main__':
    sys.exit(main())
