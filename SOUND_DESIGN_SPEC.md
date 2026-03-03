# Fire-Reader Sound Design Spec (v1.0)

## 1) Creative Direction
- Style: classic 2D side-scroller feel (8/16-bit inspired), modern polish, kid-safe.
- Tone: heroic, upbeat, non-scary, readable, short-loop friendly.
- Core motif: “small hero solving big problem” with bright melodic hooks.
- Rule: inspiration from classics, no direct melody/riff copying.

## 2) Audio Pillars
- **Clarity:** player always hears success/failure cues instantly.
- **Consistency:** one cohesive palette across all 10 levels.
- **Low fatigue:** short sessions, no harsh highs, controlled repetition.
- **Responsiveness:** every major input gets fast sonic feedback (&lt;60ms perceived).

## 3) Runtime Audio System
- Global buses: `Master`, `Music`, `SFX`, `UI`.
- Default mix at launch: Music -14 dB, SFX -8 dB, UI -10 dB.
- One music loop active at a time; SFX polyphony capped (e.g., 6-8 voices).
- Fade policy: scene transitions crossfade music in 200–350 ms.

## 4) Mute Switch Spec (Required)
- Placement: Settings panel (and optional top-right quick icon).
- Label states: `Music: On` / `Music: Off` (or `Sound: On/Off` if global).
- Behavior:
  - Toggle is instant and affects Music + SFX + UI (global mute).
  - Persist state in local profile; restore on next launch.
  - If muted, no new sounds start; currently playing sounds stop/fade out (100 ms).
  - Unmute resumes music loop on first user interaction (autoplay-safe).
- Acceptance:
  - Muted means zero audible output in all scenes.
  - Unmuted restores expected loops/cues without duplicate layers.

## 5) Music Spec
- Structure: seamless loop + optional short intro (intro may be skipped in gameplay).
- Length target: 30–60 sec loops.
- Tempo range: 105–135 BPM.
- Harmonic mood:
  - Levels 1–3: warm, playful.
  - Levels 4–7: slightly more urgency.
  - Levels 8–10: heroic/intense but still child-friendly.
- Instrument palette:
  - Chiptune square/pulse leads, soft triangle bass, light noise hats/snare.
  - Optional modern layer: soft pads/plucks for warmth.
- Required tracks:
  - `bgm_menu_loop`
  - `bgm_game_loop_a` (levels 1–3)
  - `bgm_game_loop_b` (levels 4–7)
  - `bgm_game_loop_c` (levels 8–10)
  - `stinger_level_clear`
  - `stinger_level_fail` (short, gentle)
  - `stinger_boss_end` (optional)

## 6) Basic SFX Spec (Required Set)
- UI:
  - `ui_click`, `ui_confirm`, `ui_back`, `ui_toggle_on`, `ui_toggle_off`
- Gameplay core:
  - `spray_shot` (water burst)
  - `spray_loop_short` (optional for held feeling)
  - `hit_success` (positive boss damage cue)
  - `hit_minor` (hard rating/no damage)
  - `fail_try_again` (gentle correction)
- Progress/completion:
  - `word_mastered`
  - `level_clear_fanfare` (or use stinger)
  - `unlock_reward`
- Ambient optional:
  - `fire_crackle_low` (very subtle)
  - `crowd_or_wind_soft` per environment (very subtle)
- Variation rule:
  - At least 2 variants each for `spray_shot`, `hit_success`, `fail_try_again` to reduce repetition.

## 7) Mix & Loudness Targets
- Master peak ceiling: -1 dBTP.
- Music integrated loudness target: ~ -20 to -16 LUFS (mobile/laptop-friendly).
- SFX transient peaks: audible over music without clipping.
- Ducking:
  - On `fail_try_again` and `level_clear`, music ducks by 2–4 dB for 250–400 ms.
- EQ guidance:
  - Keep speech-relevant range clear (1–4 kHz) for readability if future voice is added.

## 8) File/Format Delivery
- Source masters: 48 kHz / 24-bit WAV.
- Runtime assets:
  - Preferred: `.ogg` + `.m4a` (or `.mp3`) for browser compatibility.
  - Keep optional `.wav` for quick iteration only.
- Naming convention:
  - `audio/music/<track_name>_loop.*`
  - `audio/sfx/<event_name>_v01.*`
- Loop spec:
  - Sample-accurate loop points, click/pop-free, no DC offset.

## 9) Event-to-Sound Mapping
- App boot/menu open: `bgm_menu_loop`.
- Enter gameplay: fade to level-appropriate `bgm_game_loop_*`.
- `Easy` rating: `spray_shot` + `hit_success`.
- `Hard` rating: `spray_shot` + `hit_minor`.
- `Try again`: `fail_try_again`.
- Level complete: stop/duck gameplay loop -> `level_clear_fanfare` -> menu loop.
- Settings toggle mute: `ui_toggle_on/off` only when not muted.

## 10) QA / Acceptance Checklist
- No dead silence when unmuted; no accidental overlap stacks.
- No clipped/distorted sounds under rapid input.
- Music loops seamlessly for 5+ minutes.
- Mute persists after refresh/restart.
- All required cues trigger in correct scenes/states.
- Safari + Chrome + Edge behavior matches (including autoplay/unmute flow).

## 11) Production Scope (Lean MVP)
- Must-have now: 3 music loops + 8 core SFX + mute persistence.
- Nice-to-have later: variant pools, ambient beds, dynamic intensity layers.
