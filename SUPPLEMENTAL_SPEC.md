# Fire-Reader MVP Supplemental Spec

This document fills in implementation details that are implied by the TDD but not fully spelled out.

## Session deck and review selection (levels 1-9)
- Targets are the unique union of level `new` and `trick` words. Boss HP equals the number of unique targets.
- Review candidates are pulled from saved words with `due <= now` and not in targets, ordered by earliest due, capped at 15. If fewer than 15 are due, fill the remainder by random selection from the remaining saved words (also excluding targets).
- Deck composition interleaves 3-4 targets, then 1 review word (if any remain). Targets and reviews are shuffled independently before interleaving.
- The scheduler uses the deck order and reinserts words in-session per rating (fail: +3, hard: +6, easy-confirm: +10).

## Boss HP and clearance
- HP decreases only when a target word is graded Easy for the first time in the current session.
- Hard or Fail never reduce HP. Repeated Easy on the same target does not reduce HP again.
- If the scheduler runs out of words while HP > 0, the level restarts after a short delay.

## Sentence mode mechanics (level 10)
- HP for level 10 is `min(level.hp, sentences.length)`.
- A session uses a shuffled subset of sentences sized to HP. When the subset is exhausted and HP > 0, reshuffle and continue (no dead end).
- The sentence display splits on spaces; punctuation remains visible but is ignored for persistence scoring.
- For each graded word, normalize by lowercasing and removing non-letter characters, then update spaced repetition state with the same rating rules as word mode.
- On Fail, the sentence resets to the first word and increments the mistake counter.

## Mistake handling and restart
- Mistakes increment only on Fail. At 10 failures, show a full-screen message, lock input, and restart the scene after ~900ms.

## Storage behavior and warnings
- Save data merges with defaults on load; invalid numeric fields are coerced to safe defaults.
- If IndexedDB is unavailable, use an in-memory store and show a one-time menu warning that progress will not persist.
- Saves are debounced during play; a flush is forced on scene shutdown and on level win.

## Input and UI layout
- Buttons are rendered at fixed positions in a 960x540 canvas and scale with Phaser's FIT mode.
- Keyboard shortcuts: E (Easy), H (Hard), F (Try again). Pointer/touch activation is supported.
- Settings and Parent Dashboard are modal overlays; ESC closes them.

## Asset naming requirements (clarified)
- Atlas frame prefixes per level:
  - L1: boss_kitchen, L2: boss_trash, L3: boss_campfire, L4: boss_stove,
    L5: boss_car, L6: boss_bbq, L7: boss_forest, L8: boss_warehouse, L9: boss_office,
    L10: dragon.
- Each non-dragon boss requires frames 0-5. Dragon requires frames 0-11. The kid idle requires frames 0-3 and water.
- Frame names may be stored as `name` or `name.png` in the atlas; code accepts either.

## Audio behavior
- Background music is looped at 0.4 volume and only starts after a user gesture.
- Mute toggles both the Phaser sound manager and the current BGM instance. Unmuting resumes or restarts playback.
