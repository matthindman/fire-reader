# Fire-Reader — Claude Code Project Guide

## Project Overview

Educational phonics game for 4-year-olds with adult co-play. Built with TypeScript (strict), Phaser 3.70, Parcel 2.11. Child reads words aloud; adult grades Easy/Hard/Fail; correct reading = water spray = boss damage. 10 levels covering CVC words → blends → digraphs → r-controlled vowels → sentences.

## Key Commands

```bash
npm run dev          # Dev server at localhost:1234
npm run typecheck    # TypeScript strict check
npm run build        # Production build to dist/
npm run atlas        # Rebuild texture atlas
```

## Architecture

- **Scenes:** Boot → Menu → Lesson → Game → (Result) → Menu
- **Core loop:** `GameScene.ts` — word display → grade (E/H/F) → spray animation → HP update → next word
- **Spaced repetition:** `spacedRepetition.ts` — SM-2 lite algorithm + in-session scheduler
- **Storage:** `storage.ts` — IndexedDB primary, localStorage fallback, in-memory fallback
- **Audio:** `audio.ts` — music buses, SFX cues, ducking, volume overlay

## Source Layout

```
src/
  main.ts              # Phaser config, error handling
  types.ts             # TypeScript interfaces (WordState, SaveData, LevelData)
  constants.ts         # Game balance parameters
  spacedRepetition.ts  # SM-2 lite + Scheduler class
  storage.ts           # IndexedDB persistence
  audio.ts             # Music/SFX system
  visuals.ts           # Level→background/boss mappings
  anims.ts             # Animation frame definitions
  atlasUtil.ts         # Atlas frame resolution
  scenes/
    BootScene.ts       # Asset preload + validation
    MenuScene.ts       # 5x2 level grid, card states
    LessonScene.ts     # Pre-level lesson + boss intro
    GameScene.ts       # Core gameplay loop (~500 lines)
    ResultScene.ts     # Post-level results (minimal)
  ui/
    SentenceCard.ts    # Level 10 word-by-word sentences
    SettingsModal.ts   # Mute, contrast, reset
    ParentDashboard.ts # Word progress table + CSV export
    VolumeOverlay.ts   # Music/SFX volume sliders
data/
  levels.ts            # Level loader + validation
  level01-10.json      # Phonics curricula
```

## Design Constraints

- Target audience: 4-year-old child + adult helper
- Adult-mediated: adult reads instructions and grades, child focuses on reading
- Sessions: 10-20 minutes max (respect toddler attention span)
- Gentle failure: "try again" not punishment
- Offline-first: no backend, no cloud, local IndexedDB only
- Single developer scope: fixed 10-level curriculum

## Active Improvement Plan

See **IMPROVEMENTS.md** for the prioritized task list. Work through items in order — each task includes files to modify, what to change, and verification steps. Mark checkboxes as you complete each item.

## Verification After Each Change

1. `npm run typecheck` — no errors
2. `npm run dev` — manual playtest in browser
3. Test all three rating types (E/H/F) for visual/audio changes
4. Refresh browser to verify persistence for storage changes
