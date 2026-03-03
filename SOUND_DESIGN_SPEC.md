# Fire-Reader Sound Design Spec (v2.0)

## 1) Creative Direction

- **Audience:** A 4-year-old child + an adult co-player. Audio must delight the
  child and not annoy the adult over repeated sessions.
- **Style:** Authentic 8-bit / chiptune (NES / Game Boy era), not raw oscillator
  bleeps. Think Mega Man, Kirby, Shovel Knight — bright, melodic, composed music
  that happens to use a retro palette.
- **Tone:** Heroic, upbeat, encouraging. Major keys predominate. Avoid minor keys,
  diminished chords, and anything tense or spooky. The child is a brave little
  firefighter solving problems — the audio should make them feel capable.
- **Core motif:** "Small hero, big heart." A short, memorable melodic phrase
  (3–5 notes) that recurs across the menu theme, victory stinger, and
  word-mastered jingle. This gives the soundtrack identity.
- **Rule:** Draw inspiration from classic game soundtracks. No direct
  melody/riff copying.

## 2) Audio Pillars

| Pillar | Meaning |
|--------|---------|
| **Encouragement** | Every sound reinforces "you're doing great." Even the fail cue should feel like a gentle nudge, not a punishment. |
| **Clarity** | Success and correction cues are instantly distinguishable. The child never wonders "did I get it right?" |
| **Low fatigue** | Sessions are 10–20 minutes. Music loops must stay pleasant after 5+ minutes. No harsh highs, no abrasive timbres. |
| **Responsiveness** | Every grading tap gets sonic feedback within ~60 ms perceived latency. The spray-and-hit sequence should feel *satisfying*. |

## 3) Emotional Design for a Young Learner

This is the most important section. Every audio cue carries emotional weight
for a 4-year-old:

- **Easy rating (got it right easily):** The most rewarding moment. A
  punchy water-spray burst followed by a bright, rising success chime.
  This should feel like a small celebration — the child just defeated a
  piece of the fire. Two-part sequence: action (spray) then reward (chime).
- **Hard rating (got it, but struggled):** Still positive! The child *did*
  read the word. Spray sound plays (they still sprayed water), followed by
  a softer, shorter acknowledgment tone. Not a penalty — a "nice effort."
- **Try again (incorrect):** Gentle and brief. A soft descending two-note
  phrase, like a kind "oops, let's try that one again." Must not sound
  harsh, alarming, or like a buzzer. Think of a patient teacher's voice
  tone translated to chiptune.
- **Word mastered:** A bright ascending arpeggio — like collecting a special
  item. This is a milestone moment.
- **Level clear:** A proper victory fanfare (1–2 seconds). Triumphant,
  celebratory, makes the child feel like a hero. Use the core motif here.
- **Level fail (10 misses):** A gentle "wind down" — not scary, not sad.
  More like "time to regroup and try again." Brief, warm.

## 4) Asset Sourcing Strategy

The previous approach of procedurally generating all audio from raw
oscillators (sine/square/triangle waves) produces thin, lifeless sound
that lacks the musicality of real chiptune. **Do not use raw waveform
synthesis for final assets.**

Recommended approach, in priority order:

1. **Source from CC0 / public domain libraries.** Curated chiptune music
   and SFX packs made by actual composers sound dramatically better.
   See the resource list in Appendix A.
2. **Use chiptune authoring tools** (ChipTone, FamiTracker, LSDJ, Bosca
   Ceoil) for any custom one-off SFX that can't be found in libraries.
   These tools model actual sound chip behavior and produce authentic
   results.
3. **Commission or compose** using a tracker or DAW with chiptune plugins
   if the CC0 options don't cover a specific need.

The `generate_audio_assets.py` script may be kept as a placeholder/fallback
generator during development, but all shipped audio should come from
sources above.

## 5) Runtime Audio System

Already implemented in `src/audio.ts`. Key parameters:

- **Global buses:** `Master`, `Music`, `SFX`, `UI`.
- **Default mix:** Music -14 dB, SFX -8 dB, UI -10 dB.
- **Polyphony cap:** 8 simultaneous SFX voices.
- **Music transitions:** 280 ms crossfade between tracks.
- **Music ducking:** -3 dB for 320 ms on fail/level-clear events.

No changes needed to the audio system architecture.

## 6) Mute Switch

Already implemented. Spec for reference:

- Global toggle (Music + SFX + UI) in Settings panel.
- Persists to local profile; restores on launch.
- Mute: fade out all audio in 100 ms, no new sounds start.
- Unmute: resume music loop on next user interaction (autoplay-safe).
- Acceptance: muted = zero audible output; unmuted = correct loops/cues,
  no duplicate layers.

## 7) Music Spec

### Required tracks

| Key | Usage | Mood | Tempo |
|-----|-------|------|-------|
| `bgm_menu_loop` | Menu / level-select screen | Inviting, cheerful, relaxed. Like a sunny morning. | 100–115 BPM |
| `bgm_game_loop_a` | Levels 1–3 (kitchen, trash, campfire) | Warm, playful, bouncy. Confidence-building. | 110–120 BPM |
| `bgm_game_loop_b` | Levels 4–7 (stove, car, bbq, forest) | More energy, light urgency, still fun. Adventure mode. | 118–128 BPM |
| `bgm_game_loop_c` | Levels 8–10 (warehouse, office, castle/dragon) | Heroic, determined, climactic but never scary. Boss-fight energy. | 125–135 BPM |
| `stinger_level_clear` | Level completion | Triumphant fanfare. Uses core motif. | Free tempo |
| `stinger_level_fail` | 10-miss restart | Gentle, brief wind-down. "We'll get 'em next time." | Free tempo |
| `stinger_boss_end` | Boss defeated (optional) | Short victory punch, can layer with level_clear. | Free tempo |

### Music guidelines

- **Loop length:** 45–90 seconds. Shorter loops get tedious faster than
  people expect. 60 seconds is the sweet spot.
- **Key signatures:** C major, G major, F major, D major preferred.
  Avoid minor keys as primary tonality (brief minor passages for
  color are fine).
- **Instrument palette:** Pulse/square leads (with duty cycle variation),
  triangle bass, noise percussion. Optional: soft saw pads for warmth
  in menu theme.
- **Composition quality:** Loops must have actual melodic phrases with
  call-and-response, not just repeated arpeggios. They should be
  *hummable*. A child should be able to recognize "the fire game music."
- **Seamless looping:** Click-free, pop-free, no DC offset. The loop
  point must be inaudible.

## 8) SFX Spec

### UI sounds

| Cue | Description | Character |
|-----|-------------|-----------|
| `ui_click` | Menu button press | Short, clean blip. ~60 ms. |
| `ui_confirm` | Level selection / start | Brighter, slightly longer rising blip. ~90 ms. |
| `ui_back` | Navigate back / close | Descending blip, same timbre as confirm. ~90 ms. |
| `ui_toggle_on` | Mute off (sound turning on) | Rising two-note chirp. ~110 ms. |
| `ui_toggle_off` | Mute on (sound turning off) | Falling two-note chirp. ~110 ms. |

### Gameplay — core feedback

| Cue | Trigger | Description | Duration |
|-----|---------|-------------|----------|
| `spray_shot` | Easy or Hard rating | Water burst / hose blast. The *action* sound. Should feel punchy and satisfying, like a power-up being used. Not just white noise — include a tonal component (pitched splash or whoosh). | ~150–200 ms |
| `hit_success` | Easy rating (after spray) | Bright, rising 2–3 note chime. Clear positive feedback. Different enough from spray to register as a separate "reward." | ~200–250 ms |
| `hit_minor` | Hard rating (after spray) | Softer single-note acknowledgment. Still positive, just understated. Same timbre family as hit_success. | ~150 ms |
| `fail_try_again` | Try-again rating | Gentle descending two-note phrase. Warm timbre (triangle wave), not harsh (no saw/buzz). Must sound kind, not punitive. | ~250–300 ms |

### Gameplay — progress milestones

| Cue | Trigger | Description | Duration |
|-----|---------|-------------|----------|
| `word_mastered` | Word reaches mastery | Bright ascending arpeggio (C-E-G-C or similar). "Item collected" feeling. Celebratory. | ~350–400 ms |
| `level_clear_fanfare` | HP reaches 0 | Victory fanfare. Most rewarding sound in the game. Should make the child want to cheer. Can incorporate the core motif. | 1.0–1.5 sec |
| `unlock_reward` | New level unlocked | Ascending flourish, slightly different character than word_mastered. "Door opening" or "achievement" feeling. | ~500–600 ms |

### Variation requirements

To prevent repetition fatigue, provide at least 2 variants for
high-frequency cues. The audio system already supports random variant
selection:

- `spray_shot_v01`, `spray_shot_v02` (different pitch/character)
- `hit_success_v01`, `hit_success_v02` (different intervals)
- `fail_try_again_v01`, `fail_try_again_v02` (different note pairs)

### Ambient (future enhancement)

Not required for MVP, but would add atmosphere with minimal effort:

- `fire_crackle_low` — Very subtle fire ambience, looping. Mixed well
  below music.
- Environment-specific ambient (wind for forest, kitchen hum, etc.) —
  low priority.

## 9) Mix & Loudness Targets

- **Master peak ceiling:** -1 dBTP.
- **Music integrated loudness:** -20 to -16 LUFS (laptop speaker friendly).
- **SFX transient peaks:** Clearly audible over music without clipping.
- **Ducking:** On `fail_try_again` and `level_clear`, music ducks 2–4 dB
  for 250–400 ms (already implemented).
- **EQ guidance:** Keep 1–4 kHz range relatively clear in music mix, in
  case voice-over is added later.

## 10) File / Format Delivery

- **Source masters:** 44.1 or 48 kHz, 16 or 24-bit WAV.
- **Runtime assets:** `.ogg` + `.m4a` (or `.mp3`) for cross-browser
  compatibility. `.wav` acceptable during development.
- **Naming convention:**
  - `assets/audio/music/<track_name>.wav`
  - `assets/audio/sfx/<cue_name>_v01.wav`
- **Loop spec:** Sample-accurate loop points, click/pop-free, no DC offset.

## 11) Event-to-Sound Mapping

| Game Event | Audio Cue(s) | Bus |
|------------|-------------|-----|
| App boot / menu open | `bgm_menu_loop` | music |
| Enter gameplay | Crossfade to `bgm_game_loop_a/b/c` | music |
| Easy rating | `spray_shot` → `hit_success` | sfx |
| Hard rating | `spray_shot` → `hit_minor` | sfx |
| Try again rating | `fail_try_again` (+ duck music) | sfx |
| Word mastered | `word_mastered` | sfx |
| Level complete (HP=0) | Duck music → `level_clear_fanfare` → crossfade to menu | sfx |
| Level fail (10 misses) | `stinger_level_fail` → restart | sfx |
| Boss defeated | `stinger_boss_end` (optional, can combine with level_clear) | sfx |
| UI button press | `ui_click` | ui |
| Level selected | `ui_confirm` | ui |
| Back / close | `ui_back` | ui |
| Mute toggle | `ui_toggle_on` / `ui_toggle_off` (only when unmuting) | ui |

## 12) QA / Acceptance Checklist

- [ ] No dead silence when unmuted; no accidental overlap stacks.
- [ ] No clipped/distorted sounds under rapid grading input.
- [ ] Music loops seamlessly for 5+ minutes without audible seam.
- [ ] Music is *pleasant* after 5 minutes — not grating or monotonous.
- [ ] Mute state persists after refresh/restart.
- [ ] All required cues trigger in correct scenes/states.
- [ ] Safari + Chrome + Edge behavior matches (autoplay/unmute flow).
- [ ] Success and fail cues are immediately distinguishable by a child.
- [ ] The fail cue does not upset or discourage (test with target user).
- [ ] The victory fanfare makes the child visibly happy (test with target user).
- [ ] Adult co-player does not find audio annoying after a full session.

## 13) Production Scope

### MVP (ship with these)
- 4 music tracks: menu loop + 3 gameplay loops (a/b/c)
- 3 stingers: level clear, level fail, boss end
- 5 UI cues: click, confirm, back, toggle on, toggle off
- 6 gameplay SFX: spray (x2), hit_success (x2), hit_minor, fail_try_again (x2)
- 3 progress SFX: word_mastered, level_clear_fanfare, unlock_reward
- Mute persistence (already implemented)

### Future enhancements
- Larger variant pools (3–4 per high-frequency cue)
- Ambient beds (fire crackle, environment sounds)
- Dynamic intensity layers (music builds as HP gets low)
- Boss-specific music or motifs

---

## Appendix A: CC0 / Public Domain Audio Resources

All resources below are CC0 (public domain) unless noted. They can be
used commercially without attribution.

### Background Music

| Resource | URL | Contents | Notes |
|----------|-----|----------|-------|
| HydroGene 8-bit Musics | https://hydrogene.itch.io/high-quality-8-bit-musics | 18 looping chiptune tracks (WAV + MIDI) | High quality, action-oriented. Good candidates for gameplay loops. |
| Not Jam Music Pack 2 | https://not-jam.itch.io/not-jam-music-pack-2 | NES/Game Boy style tracks + 22 SFX | Authentic chiptune. Browse for bouncy/upbeat tracks. |
| CC0 Retro Music (josepharaoh99) | https://opengameart.org/content/cc0-retro-music | 100+ 8-bit compositions | Huge variety. Includes peaceful tracks ("Puppy Playing in The Garden") and victory fanfares. |
| CC0 8-Bit Chiptune (ImogiaGames) | https://opengameart.org/content/audio-cc0-8bit-chiptune | 100+ curated chiptune pieces | Boss themes, level music, victory jingles. |
| Signature Sounds 8-Bit | https://signaturesounds.org/store/p/8-bit-game-music-cc0 | 23 authentic chiptune songs (327 MB) | Designed for game soundtracks. |
| Duckhive Game Music Vol 1 | https://duckhive.itch.io/game-music-1 | 10 retro tracks, 30–40 sec loops | Small but focused. |
| Ragnar Random Chiptune | https://ragnarrandom.itch.io/retro-game-music | C-64/Genesis style fakebit | Varied moods. |
| 8-Bit Victory Loop | https://opengameart.org/content/8-bit-victory-loop | Victory loop for level completion | Perfect for level clear stinger. |
| Kenney Music Jingles | https://kenney.nl/assets/music-jingles | 85 jingles | Victory, reward, achievement jingles. |

### UI Sound Effects

| Resource | URL | Contents |
|----------|-----|----------|
| Kenney UI Audio | https://kenney.nl/assets/ui-audio | 50 button/switch/click sounds |
| Kenney Interface Sounds | https://kenney.nl/assets/interface-sounds | 100 interface effects |
| ObsydianX Interface SFX | https://obsydianx.itch.io/interface-sfx-pack-1 | High-quality UI sounds |
| GUI Sound Effects (LokiF) | https://opengameart.org/content/gui-sound-effects | Menu clicks, feedback sounds |

### Gameplay SFX

| Resource | URL | Contents | Notes |
|----------|-----|----------|-------|
| 512 Sound Effects 8-bit (SubspaceAudio) | https://opengameart.org/content/512-sound-effects-8-bit-style | 512 organized retro SFX | The single best general-purpose collection. 92K+ downloads. |
| 40 CC0 Water/Splash SFX | https://opengameart.org/content/40-cc0-water-splash-slime-sfx | Bubbles, splash, water loops | Directly relevant for water-spray mechanic. |
| NES Sounds (Basto) | https://opengameart.org/content/nes-sounds | 23 NES-style SFX incl. splash, achieved | Water drain/fill sounds for fire hose. |
| 8-bit Sound FX (Dizzy Crow) | https://opengameart.org/content/8-bit-sound-fx | WaterSplash, VictoryBig/Small | Water + victory in one pack. |
| Kenney Impact Sounds | https://kenney.nl/assets/impact-sounds | 130 impact effects | Hit/collision sounds. |
| SoundFX Library CC0 | https://opengameart.org/content/soundfx-library-cc0 | 705+ sounds in 13 packs | Includes retro/synth, water, bang/firework packs. |
| Kronbits 200 Free SFX | https://kronbits.itch.io/freesfx | 200+ retro SFX | General purpose. |

### Sound Generation Tools (output is CC0)

| Tool | URL | Notes |
|------|-----|-------|
| ChipTone (SFBGames) | https://sfbgames.itch.io/chiptone | Browser-based. Best option for custom SFX. Output explicitly CC0. |
| jsfxr | https://sfxr.me/ | Quick 8-bit SFX generator with presets (coin, laser, powerup, hit). |

### Top Picks for Fire-Reader

For fastest results, I'd recommend this sourcing plan:

1. **Music loops:** Start with **HydroGene's pack** (18 high-quality loops)
   and **CC0 Retro Music on OpenGameArt** (100+ tracks). Between them
   you should find 4 tracks that fit the menu/easy/medium/hard moods.
2. **Victory/reward jingles:** **Kenney Music Jingles** (85 jingles, CC0)
   plus the **8-Bit Victory Loop** on OpenGameArt.
3. **Water/spray SFX:** **NES Sounds (Basto)** for chiptune-style splash,
   plus **40 CC0 Water/Splash SFX** for more realistic options.
4. **UI sounds:** **Kenney UI Audio** — industry standard, clean, done.
5. **Hit/success/fail SFX:** **512 Sound Effects 8-bit** has everything
   organized by category. Pick the best-sounding options.
6. **Custom gaps:** Use **ChipTone** in-browser to generate anything
   missing. Its output is CC0.
