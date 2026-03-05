# Fire-Reader Improvement Plan

Prioritized improvements for gameplay, engagement, and learning effectiveness.
Work through items in order within each phase. Mark `[x]` when complete.

Items marked **[NEW]** are new recommendations from expert game design and literacy review.

---

## Phase 1 — Foundations (highest ROI, smallest changes)

### - [ ] 1.2 Raise MASTERY_THRESHOLD from 1 to 3 *(DEFERRED — will address via shorter levels instead)*
**Size:** S | **Impact:** ★★★★★

Currently one Easy rating = "mastered." A 4-year-old needs 3+ correct readings for real retention. This is the single highest-impact change for learning outcomes.

**Files:** `src/constants.ts`
**Change:** `MASTERY_THRESHOLD: 1` → `MASTERY_THRESHOLD: 3`

**Verify:** Play a level, grade a word Easy once — it should reappear ~10 cards later for confirmation. Must get Easy 3 times total before the word stops reappearing.

---

### - [ ] 1.6 Fix reset progress bug **[NEW]**
**Size:** S | **Impact:** ★★★☆☆

`SettingsModal.ts` resets `unlockedLevel` and `words` but leaves `clearedLevels`, `levelStars`, and `bestStreak` untouched. After reset, menu cards still show gold borders, stars, and streak records from before the reset.

**Files:** `src/ui/SettingsModal.ts`
**Change:** In the reset handler (line ~98), also clear:
```typescript
profile.clearedLevels = [];
profile.levelStars = {};
profile.bestStreak = {};
```

**Verify:** Clear several levels, note stars/streaks. Reset progress. Return to menu — all cards should show default unlocked/locked states with no stars or streaks. Levels 1-2 unlocked, rest locked.

---

### - [ ] 1.7 Remove or integrate dead ResultScene **[NEW]**
**Size:** S | **Impact:** ★☆☆☆☆

`ResultScene.ts` (55 lines) is never transitioned to — GameScene handles win inline. It duplicates `GEAR_TEXT` and serves no purpose. Either delete it or wire it into the flow via item 4.4 (session summary).

**Files:** `src/scenes/ResultScene.ts`, `src/main.ts` (scene registration)
**Change:** Delete `ResultScene.ts` and remove its registration. If 4.4 is being implemented simultaneously, repurpose it instead.

**Verify:** `npm run typecheck` passes. Play through a level win — victory sequence works as before.

---

## Phase 2 — Core Feel

### - [ ] 2.5 Add boss defeat animation variation per level
**Size:** M | **Impact:** ★★☆☆☆

**Files:** `src/scenes/GameScene.ts` (win method)
**Change:** Parameterize defeat particles by `levelNum`:
- Levels 1, 4, 6 (kitchen/stove/bbq): fire colors (ff6600, ff3300, ffcc00)
- Level 10 (dragon): larger explosion (2x particles), longer duration (700ms), mix blue water particles
- Levels 5, 7, 8 (car/forest/warehouse): gray smoke colors (888888, aaaaaa, cccccc)
- Levels 2, 3, 9: default fire colors

**Verify:** Win different levels — defeat effects should vary in color/intensity.

---

### - [ ] 2.6 Add kid celebration variety on victory
**Size:** S | **Impact:** ★★☆☆☆

**Files:** `src/scenes/GameScene.ts` (win method)
**Change:** Add rotation wobble to victory bounce: `angle: { from: -5, to: 5 }` with yoyo and repeat -1, duration 300ms, Sine.easeInOut. Apply alongside the existing y-bounce tween.

**Verify:** Win a level — kid should wobble side-to-side during the celebration bounce, looking distinctly more excited than the idle animation.

---

### - [ ] 2.7 Animate boss sprites during gameplay **[NEW]**
**Size:** S | **Impact:** ★★★☆☆

Non-dragon bosses (levels 1-9) display as a static frame (`_1`) with only a scale-pulse tween during gameplay. Each boss has 6 animation frames (0-5) already in the atlas. Playing the full animation makes bosses feel alive and menacing — more satisfying to defeat.

**Files:** `src/scenes/GameScene.ts` (create method, boss setup)
**Change:** For non-dragon bosses, call `this.boss.play(bossAnim)` instead of using a static frame. Keep the pulse tween as a secondary effect layered on top. The animation definitions in `anims.ts` already exist for all bosses.

**Verify:** Play any level 1-9 — boss should visually animate (not just pulse). Dragon level 10 unchanged.

---

## Phase 3 — Engagement Loop

### - [ ] 3.2 Implement visible gear/cosmetic rewards on kid sprite
**Size:** M | **Impact:** ★★★★☆ | **Depends on:** 1.5

Make gear unlocks visual (currently text-only). No new art assets needed — use tint/glow/particle effects.

**Files:** `src/types.ts`, `src/scenes/GameScene.ts`, `src/scenes/MenuScene.ts`, `src/storage.ts`
**Change:** Apply cumulative effects based on cleared level count:
- 1 level cleared: subtle golden tint on kid sprite
- 3 levels cleared: slight scale increase (1.0→1.05)
- 5 levels cleared: particle trail on kid jump (2-3 golden dots)
- 7 levels cleared: persistent subtle glow (additive blend circle behind kid)
- 10 levels cleared: rainbow tint cycle (slow hue rotation)

Show effects in both MenuScene and GameScene kid sprites.

**Verify:** Clear levels progressively — kid should visually evolve. Effects should be cumulative and persistent across sessions.

---

### - [ ] 3.4 Add simple achievement badges
**Size:** L | **Impact:** ★★★☆☆ | **Depends on:** 1.5, 3.1

**Achievements:**
- "First Fire" — Clear Level 1
- "Word Warrior" — Master 50 unique words (successes >= 3 in SaveData)
- "Streak Star" — Achieve a streak of 10 in any level
- "Sentence Reader" — Clear Level 10
- "Perfect Level" — Clear any level with 0 mistakes
- "Fire Chief" — Clear all 10 levels

**Files:** `src/types.ts` (achievement definitions + unlocked set in SaveData), `src/storage.ts`, new `src/ui/AchievementPopup.ts`, new `src/ui/BadgeGallery.ts`, `src/scenes/GameScene.ts` (check triggers), `src/scenes/MenuScene.ts` (badge button), `src/main.ts` (register scenes)

**Verify:** Trigger each achievement condition — popup should appear. Gallery should show earned vs locked badges. Persist across sessions.

---

### - [ ] 3.5 End-of-session encouragement with concrete stats **[NEW]**
**Size:** S | **Impact:** ★★★★☆

After winning, the victory screen shows gear text and stars but no specific praise about what the child accomplished. Young learners thrive on concrete positive feedback: "You read 15 words today!" or "You got 8 words right on the first try!"

**Files:** `src/scenes/GameScene.ts` (win sequence)
**Change:** In the victory sequence, add a text element (appearing ~T=2000ms) showing:
- Total words practiced this session (boss targets + review words graded)
- Words read correctly on first try (Easy with no prior Fail/Hard in this session)
- Use encouraging framing: "You read X words! Y were perfect!"

**Verify:** Win a level — the victory screen should show personalized stats alongside the existing gear text and stars.

---

## Phase 4 — Literacy & Pedagogy

### - [ ] 4.1 Add visual phoneme highlighting in displayed words **[NEW]**
**Size:** M | **Impact:** ★★★★★

The single most impactful literacy feature missing. When displaying a word like "cat," the target phoneme ('a') should be visually distinct — a different color or underline. This teaches phonemic awareness (isolating sounds within words) rather than pure whole-word memorization.

Research basis: Explicit phoneme cuing during reading practice significantly improves decoding skills in beginning readers (National Reading Panel, 2000).

**Files:** `src/scenes/GameScene.ts` (word display), `data/level01-09.json` (add phoneme patterns)
**Change:**
1. Add a `pattern` field to each level JSON specifying the target letter(s) to highlight (e.g., level 1: `"pattern": "a"`, level 7: `"pattern": ["sh", "ch", "th", "wh", "ck"]`)
2. In `setWordText()`, render the word with the target phoneme in gold (#FFD700) and the rest in white. Use Phaser's `setText` with multiple Text objects or a bitmap text approach.
3. For trick/sight words, skip phoneme highlighting (they don't follow the pattern).

**Verify:** Play Level 1 — word "cat" shows "c" in white, "a" in gold, "t" in white. Trick word "the" shows all white. Level 7 digraph word "ship" shows "sh" in gold, "ip" in white.

---

### - [ ] 4.2 Implement adaptive within-session pacing
**Size:** M | **Impact:** ★★★☆☆ | **Depends on:** 1.2, 1.3

**Files:** `src/spacedRepetition.ts`, `src/constants.ts`
**Change:** Track rolling window of last 10 ratings. If fail rate > 40%, reduce fail reinsertion delay by 2 (show sooner). If streak > 5, increase easy-confirm delay by 3 (push further back). Clamp all delays to reasonable bounds (min 2, max 15).

**Verify:** Deliberately fail several words in a row — failed words should reappear sooner. Get a long streak — confirmed words should space out more.

---

### - [ ] 4.3 Distinguish trick/sight words visually **[NEW]**
**Size:** S | **Impact:** ★★★★☆

Levels 1-5 mix decodable CVC words with high-frequency irregular "trick" words (the, was, said, etc.). Best practice in structured literacy separates these tracks — the child should know "this word doesn't follow the rules, you just have to remember it."

**Files:** `src/scenes/GameScene.ts` (word display), level JSON data
**Change:**
1. When the current word is from the level's `trick[]` array, show a small "Tricky!" label above the word in orange (#FF8C00), and display the word with a dotted underline or different background tint.
2. This visual cue tells the adult: "Don't try to sound this one out — just tell them the word."

**Verify:** Play Level 1. Decodable words (cat, bat) appear normally. Trick words (the, a, I) show the "Tricky!" label and distinct styling.

---

### - [ ] 4.4 Add session summary with per-word breakdown
**Size:** L | **Impact:** ★★★★☆

Give the adult actionable feedback about which words to practice offline.

**Files:**
- `src/scenes/GameScene.ts` — add a `wordStats: Map<string, {easy: number, hard: number, fail: number}>` tracker. Increment on each grade. Pass to ResultScene via Phaser registry on win.
- `src/scenes/ResultScene.ts` — rewrite to show:
  - Green section: words Easy on first try
  - Yellow section: words needing multiple attempts (hard > 0 or easy > 1)
  - Red section: words that caused fails
  - Stats bar: total words, accuracy %, best streak, time elapsed
  - "Back to Menu" button

**Verify:** Complete a level with mixed performance. ResultScene should show color-coded word lists and accurate stats. "Back to Menu" returns to menu with correct level state.

---

### - [ ] 4.6 Progressive word introduction within levels **[NEW]**
**Size:** M | **Impact:** ★★★★☆

Currently, all 15-35 boss target words are shuffled into the deck at once. A 4-year-old seeing word #14 while still struggling with word #2 feels overwhelmed. Progressive introduction (teach 3-4 words → practice → introduce 3-4 more) matches how literacy tutors scaffold new vocabulary.

**Files:** `src/scenes/GameScene.ts` (initWordMode), `src/spacedRepetition.ts`
**Change:**
1. Split boss targets into "waves" of 4 words each
2. Start with wave 1 only in the active deck
3. When all words in the current wave have been rated Easy at least once, add the next wave and show a brief "New words incoming!" banner
4. Review words and previously cleared waves continue cycling
5. HP only decrements on Easy as before — this changes deck composition, not the win condition

**Verify:** Start Level 1. Only ~4 words appear initially. After reading all 4 correctly, the next batch appears with a visual cue. Total session length remains the same.

---

### - [ ] 4.7 Add "tap to hear" word pronunciation via Web Speech API **[NEW]**
**Size:** M | **Impact:** ★★★★★

The biggest missing feature for independent play. The adult currently must always read the word aloud. Adding a "hear it" button using the browser's built-in Web Speech API (free, no API key) lets the child tap to hear the word pronounced. This doesn't replace adult interaction but provides scaffolding when the child is stuck.

**Files:** `src/scenes/GameScene.ts`, new `src/speech.ts`
**Change:**
1. Create `speech.ts` with a `speakWord(word: string)` function wrapping `SpeechSynthesisUtterance` with rate=0.8 (slower for young learners), pitch=1.1 (slightly higher/friendlier)
2. Add a small speaker icon button (🔊) near the word text in GameScene
3. On tap, call `speakWord()` — does NOT count as a grade
4. Track usage: if the child taps "hear it" before the adult helps, it signals struggling (could inform future adaptive features)
5. Feature can be disabled in Settings (some parents may prefer fully adult-mediated)

**Verify:** Play a level, tap the speaker icon — the browser speaks the word aloud at a child-friendly pace. Grading buttons still work independently. Works on Chrome, Safari, iOS.

---

### - [ ] 4.8 Add warm-up review at the start of new phonics levels **[NEW]**
**Size:** S | **Impact:** ★★★☆☆

Level 6 jumps from short-vowel CVC words (cat, sit) to initial consonant blends (stop, snap, sled) with no bridge. A 3-5 word warm-up of previously mastered words from earlier levels eases the transition and builds confidence before new material.

**Files:** `src/scenes/GameScene.ts` (initWordMode)
**Change:**
1. Before building the main deck, pull 3-5 words from previous levels that have `successes >= 3` in the profile (truly mastered words)
2. Place these at the front of the deck as "warm-up" words
3. Show a brief "Warm-up!" label for these words (optional visual distinction)
4. Warm-up words are NOT boss targets and don't affect HP

**Verify:** Start Level 6 having previously mastered words from Levels 1-5. First 3-5 words should be familiar review words. Then new blend words begin.

---

### - [ ] 4.9 Sentence mode difficulty graduation **[NEW]**
**Size:** M | **Impact:** ★★★☆☆

Level 10's 50 sentences range from "I can run fast" (4 words, all CVC) to "The camp is near the pond" (7 words, mixed patterns). Currently they're shuffled randomly. Ordering by difficulty (word count, phoneme complexity) provides a smoother ramp.

**Files:** `data/level10.json`, `src/scenes/GameScene.ts` (initSentenceMode)
**Change:**
1. Add a `difficulty` field (1-3) to each sentence in the JSON, or compute it from word count + average word length
2. In `initSentenceMode()`, sort the selected subset by difficulty before building the sentence order (easiest first)
3. Alternatively, use a tiered approach: first 1/3 of HP targets are easy sentences, middle 1/3 medium, final 1/3 hard

**Verify:** Play Level 10 — early sentences should be short and simple ("A big bug ran"), later sentences longer and more complex ("The camp is near the pond").

---

## Phase 5 — Parent Tools & Analytics

### - [ ] 5.1 Add session history tracking
**Size:** M | **Impact:** ★★★☆☆

**Files:**
- `src/types.ts` — add `SessionRecord` interface: `{timestamp: number, level: number, result: 'win'|'restart', mistakes: number, bestStreak: number, duration: number}`. Add `sessions: SessionRecord[]` to SaveData.
- `src/storage.ts` — normalize (default empty array, cap at 50 entries, trim oldest)
- `src/scenes/GameScene.ts` — record `sessionStart = Date.now()` on create. On win or restart, push a SessionRecord.
- `src/ui/ParentDashboard.ts` — add a "Session History" section below the word table, showing recent sessions as a simple table.

**Verify:** Play two sessions. Open ParentDashboard — should show both sessions with timestamps, levels, results, and stats.

---

### - [ ] 5.2 Add learning velocity chart to dashboard
**Size:** M | **Impact:** ★★☆☆☆ | **Depends on:** 5.1

**Files:** `src/ui/ParentDashboard.ts`
**Change:** From session history, render a simple bar chart (Phaser rectangles): X-axis = sessions, Y-axis = words mastered. Add cumulative mastery line. No external charting library.

**Verify:** After 3+ sessions, open dashboard — chart should show bars for each session and a cumulative trend.

---

### - [ ] 5.3 Add "words to practice" export for struggling words
**Size:** S | **Impact:** ★★★☆☆

**Files:** `src/ui/ParentDashboard.ts`
**Change:** Add a "Practice List" button that filters to words with `successes < 3` or `ease < 1.5`, sorted by most recent failure. Copy to clipboard as a simple word list (one per line, large enough to print).

**Verify:** After playing with some fails, open dashboard, click "Practice List" — clipboard should contain only struggling words.

---

### - [ ] 5.4 Add SFX preview to volume overlay
**Size:** S | **Impact:** ★★☆☆☆

**Files:** `src/ui/VolumeOverlay.ts`
**Change:** After user taps an SFX volume step and `setVolumes` is called, play `playCue(this, 'ui_click')` so they can hear the new volume level.

**Verify:** Open volume overlay, adjust SFX slider — should hear a click at the new volume for each step change.

---

### - [ ] 5.5 Add phoneme-family weakness analysis to Parent Dashboard **[NEW]**
**Size:** M | **Impact:** ★★★★☆ | **Depends on:** 5.1

The current Parent Dashboard shows raw SM-2 data per word (interval, ease, successes) but doesn't help the adult understand *patterns* in the child's struggles. A parent seeing that "ship, shop, shut, chin, chop" all have low ease doesn't necessarily realize the child is struggling with digraphs as a category.

**Files:** `src/ui/ParentDashboard.ts`, level JSON data
**Change:**
1. Map each word to its phoneme family using the level's phonics focus (e.g., all Level 7 words → "digraphs")
2. Aggregate word-level stats by phoneme family: average ease, total fails, mastery rate
3. Display a "Phonics Summary" section above the word table showing families ranked by struggle (lowest mastery rate first)
4. For each struggling family, show 2-3 example words and a suggestion ("Practice 'sh' words: ship, shop, shut")

**Verify:** Play several levels with mixed performance. Open dashboard — phonics summary should highlight the weakest areas with actionable practice suggestions.

---

### - [ ] 5.6 Add parent guide/coaching tips **[NEW]**
**Size:** S | **Impact:** ★★★★☆

The game assumes the adult knows how to tutor reading. Many parents don't. Brief, contextual tips improve the adult's effectiveness dramatically.

**Files:** `src/scenes/LessonScene.ts`, `src/ui/SettingsModal.ts`
**Change:**
1. In LessonScene, below the existing lesson paragraph, add a collapsible "Tips for the helper" section with level-appropriate coaching guidance:
   - Levels 1-5: "Help your child sound out each letter: c...a...t → cat. If they get it with help, press Hard. If they can't get it at all, press Try Again."
   - Levels 6-9: "These words have letter groups that make one sound. Point to 'sh' and say 'these two letters say /sh/.' Then blend: sh...i...p."
   - Level 10: "Point to each word as your child reads. If they get stuck, help with that word and press Hard. Only press Easy if they read it smoothly."
2. Add a "Show tips" toggle in Settings (default: on for first 5 sessions, then off)

**Verify:** Start Level 1 — lesson screen shows expandable coaching tips. Tips are contextually appropriate per level tier.

---

## Phase 6 — UX & Game Feel (Stretch)

### - [ ] 6.1 Add pause/resume support **[NEW]**
**Size:** M | **Impact:** ★★★☆☆

No way to pause mid-level. A 4-year-old may need a bathroom break, snack, or emotional reset. Currently the only option is to let the game sit (no timeout) or restart the level.

**Files:** `src/scenes/GameScene.ts`
**Change:**
1. Add a pause button (⏸) in the top-right corner (small, unobtrusive)
2. On tap: overlay a semi-transparent screen with "Paused" text and "Resume" / "Quit to Menu" buttons
3. Pause freezes: word display, grading input, timers, streak decay (if added), session duration tracking
4. ESC key also triggers pause (currently unbound during gameplay)
5. "Quit to Menu" saves current session data before exiting

**Verify:** Mid-level, tap pause — game freezes. Resume — continues exactly where left off. Quit — returns to menu with progress saved.

---

### - [ ] 6.2 Add tutorial/onboarding for first play **[NEW]**
**Size:** M | **Impact:** ★★★★☆

Level 1 assumes the adult understands the mechanics (read word → grade → spray). A brief interactive tutorial (3 words, scripted) teaches the flow and makes the first session smoother.

**Files:** `src/scenes/GameScene.ts` or new `src/scenes/TutorialScene.ts`, `src/storage.ts`
**Change:**
1. Track `tutorialComplete: boolean` in SaveData (default false)
2. On first launch, before Level 1, show TutorialScene:
   - Display "cat" with an arrow pointing to it: "Read this word together!"
   - After 2 seconds or adult tap, show grading buttons with labels: "Got it easily? Press Easy!" / "Needed help? Press Hard!" / "Couldn't read it? Press Try Again!"
   - Walk through 3 words with guided prompts, showing water spray on Easy, gentle feedback on Fail
   - End with "Great! You're ready to fight fires!"
3. Set `tutorialComplete = true` after completion
4. Accessible via Settings ("Replay Tutorial") for new adults

**Verify:** Fresh profile — tutorial plays before Level 1 with guided prompts. After completion, Level 1 starts normally. Subsequent plays skip the tutorial. "Replay Tutorial" in Settings re-triggers it.

---

### - [ ] 6.3 Add review/practice mode (no HP, no win condition) **[NEW]**
**Size:** M | **Impact:** ★★★★☆

After clearing a level, the adult may want to revisit specific words without the pressure of HP and fail limits. A review mode presents all words from a level (or all words due for review across levels) in a low-stakes practice loop.

**Files:** `src/scenes/MenuScene.ts`, `src/scenes/GameScene.ts`
**Change:**
1. On cleared level cards, add a small "Practice" button alongside the existing level start
2. Practice mode: no HP bar, no boss damage, no fail counter, no restart at 10 fails
3. Words still update SM-2 state normally (practice still counts for spaced repetition)
4. Session ends when the adult taps a "Done" button (always visible) or the deck is exhausted
5. Streak still tracked for engagement, but no stars awarded

**Verify:** Clear Level 1, return to menu. Tap "Practice" on Level 1 — enters a relaxed mode with no HP bar. Grade words — SM-2 updates normally. Tap "Done" — returns to menu.

---

### - [ ] 6.4 Add child-friendly progress visualization **[NEW]**
**Size:** M | **Impact:** ★★★☆☆

The HP bar is an abstract red rectangle — meaningful to adults but not to a 4-year-old. Adding a supplementary visual metaphor (fire shrinking, water level rising, building getting "saved") makes progress tangible for the child.

**Files:** `src/scenes/GameScene.ts`
**Change:**
1. Behind the boss sprite, render a simple fire effect (orange/red rectangle or particle cluster) sized proportionally to remaining HP
2. As HP decreases, the fire visually shrinks (scale tween)
3. At HP=0, the fire disappears entirely before the boss collapse animation
4. This supplements (doesn't replace) the HP bar — adults still have the precise numeric feedback

**Verify:** Start a level — fire effect visible behind boss. Grade words Easy — fire noticeably shrinks. At 0 HP, fire is gone before victory sequence plays.

---

### - [ ] 6.5 Expand kid sprite animation to use all 4 frames **[NEW]**
**Size:** S | **Impact:** ★★☆☆☆

The kid sprite has 4 raw animation frames (0-3) but only frames 0-1 are used in the idle animation at 1.5fps. Using all 4 frames at a slightly higher framerate makes the kid feel more alive.

**Files:** `src/anims.ts`
**Change:** Update the kid_idle animation to use frames 0, 1, 2, 3 (all four) at 3fps instead of 1.5fps. Review the raw frames to confirm they form a coherent idle loop — if frames 2-3 are distinct poses, consider a 0-1-2-3-2-1 ping-pong sequence.

**Verify:** Run the game — kid sprite should animate more fluidly with visible multi-frame movement.

---

### - [ ] 6.6 Add blending animation for CVC words **[NEW]**
**Size:** L | **Impact:** ★★★★★ | **Depends on:** 4.1

For CVC words (the core of Levels 1-5), animate a "blending" sequence: show each letter separately with a brief pause (c...a...t), then smoothly merge them together (cat). This teaches the fundamental decoding skill — segmenting and blending — which is the #1 predictor of early reading success.

**Files:** `src/scenes/GameScene.ts`, possibly new `src/ui/BlendingAnimation.ts`
**Change:**
1. Add a "Blend" button (or auto-trigger on Fail) that plays the blending animation
2. Animation: word splits into individual letters spaced apart → each letter briefly highlights in sequence (200ms each) → letters slide together into the full word (300ms)
3. Adult can tap "Blend" anytime to model the decoding process for the child
4. Auto-trigger after a Fail rating to scaffold the child's retry
5. For digraphs/blends (Levels 6-9), keep letter groups together (e.g., "sh" stays as one unit)

**Verify:** Play Level 1, tap "Blend" on "cat" — letters separate, highlight in sequence (c, a, t), then merge back. After a Fail, blending auto-plays before the word reappears.

---

## Completed Items (reference)

### - [x] 1.1 Fix mute-toggle sound playing on mute
### - [x] 1.3 Fix Hard-rated review words being silently dropped
### - [x] 1.4 Add word transition animation
### - [x] 1.5 Add "completed" visual state to menu level cards
### - [x] 2.1 Upgrade Hard-rating feedback
### - [x] 2.2 Add boss HP bar flash and damage numbers
### - [x] 2.3 Add fail-rating visual "ouch" feedback
### - [x] 2.4 Add sentence mode token highlighting
### - [x] 3.1 Track and display per-level star rating (1-3 stars)
### - [x] 3.3 Add "best streak" per-level high score
### - [x] 4.5 Progressive HP based on level number
