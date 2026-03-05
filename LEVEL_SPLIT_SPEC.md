# Fire-Reader Level Split Specification

## Overview

Split the current 10 levels (40-50 words each) into **29 shorter levels** grouped by word family. Each level has **10-15 total words**, HP = total word count. Estimated session: **8-12 minutes**.

**Rationale:** Current levels are too long for a 4-year-old's attention span. Even with HP caps (15/25/35), the full deck contains 40-50 words, creating sessions of 20-45 minutes. Word-family grouping is also pedagogically superior — it's the approach used by Orton-Gillingham, Wilson, and other structured literacy programs.

**Vocabulary impact:** ~363 words retained from ~400 original (37 low-frequency words trimmed). Trimmed words: slug, slum, slab, slot, snuff, snob, swig, snub, snag, mash, wham, moth, sack, tick, lick, path, sock, lend, tend, bang, rang, hung, punt, tint, damp, ramp, limp, yarn, sort, port, sport, jar, perk, fern, stern, whirl, skirt, wed.

---

## Level Data (all 29 levels)

### Zone 1: Kitchen Fire — Short /a/ CVC

**Boss:** boss_kitchen | **Background:** bg1_kitchen

#### Level 1 — "Kitchen: -at & -an"
```json
{
  "id": 1,
  "title": "Kitchen: -at & -an",
  "phonics": "Short /a/ — word families -at and -an",
  "lesson": "We're learning the short 'a' sound — a-a-a like in 'apple'. These words end in -at and -an. If you can read 'cat', change the first letter to read 'bat' and 'hat'. Let's spray water on the kitchen fire!",
  "hp": 15,
  "new": ["cat","bat","mat","sat","hat","rat","pat","man","fan","pan","can","ran"],
  "trick": ["the","a","I"]
}
```
**Total: 15 words (12 new + 3 trick) | HP: 15**

#### Level 2 — "Kitchen: -ap, -ag & -am"
```json
{
  "id": 2,
  "title": "Kitchen: -ap, -ag & -am",
  "phonics": "Short /a/ — word families -ap, -ag, and -am",
  "lesson": "More short 'a' words! These end in -ap, -ag, and -am. 'Cap', 'map', 'tap' — hear the 'a' in the middle? Same fire, new words. Keep spraying!",
  "hp": 15,
  "new": ["cap","map","tap","nap","lap","gap","bag","tag","wag","jam","ham","ram"],
  "trick": ["and","to","you"]
}
```
**Total: 15 words (12 new + 3 trick) | HP: 15**

#### Level 3 — "Kitchen: -ad & pals"
```json
{
  "id": 3,
  "title": "Kitchen: -ad & pals",
  "phonics": "Short /a/ — word family -ad and mixed CVC",
  "lesson": "Last batch of short 'a' words! 'Bad', 'dad', 'sad' — they all end in -ad. A few other 'a' words too. Read them all and the kitchen fire goes out!",
  "hp": 14,
  "new": ["bad","dad","sad","mad","pad","had","lad","gas","van","cab"],
  "trick": ["is","my","we","go"]
}
```
**Total: 14 words (10 new + 4 trick) | HP: 14**

---

### Zone 2: Trash-Can Fire — Short /i/ CVC

**Boss:** boss_trash | **Background:** bg2_trash

#### Level 4 — "Trash Can: -it & -ip"
```json
{
  "id": 4,
  "title": "Trash Can: -it & -ip",
  "phonics": "Short /i/ — word families -it and -ip",
  "lesson": "Now we listen for short 'i' — i-i-i like in 'igloo'. These words end in -it and -ip. 'Sit', 'hit', 'fit' — change the first letter and you've got a new word! Let's put out the trash-can fire!",
  "hp": 14,
  "new": ["sit","hit","fit","kit","bit","lit","pit","sip","tip","zip","lip","rip","dip","hip"],
  "trick": []
}
```
**Total: 14 words (14 new) | HP: 14**

#### Level 5 — "Trash Can: -ig, -in & -im"
```json
{
  "id": 5,
  "title": "Trash Can: -ig, -in & -im",
  "phonics": "Short /i/ — word families -ig, -in, and -im",
  "lesson": "More short 'i' words! 'Pig', 'dig', 'big' end in -ig. 'Fin', 'pin', 'win' end in -in. Spot the pattern and keep spraying!",
  "hp": 15,
  "new": ["pig","dig","wig","big","fig","rig","fin","pin","win","tin","bin","him","dim","rim","gig"],
  "trick": []
}
```
**Total: 15 words (15 new) | HP: 15**

#### Level 6 — "Trash Can: -id, -ix & -ib"
```json
{
  "id": 6,
  "title": "Trash Can: -id, -ix & -ib",
  "phonics": "Short /i/ — word families -id, -ix, and -ib",
  "lesson": "Last group of short 'i' words. 'Kid', 'lid', 'rid' end in -id. 'Mix', 'fix', 'six' end in -ix. Read them all and the trash-can fire is out!",
  "hp": 14,
  "new": ["kid","lid","rid","did","mix","fix","six","bib","rib","his"],
  "trick": ["was","of","for","me"]
}
```
**Total: 14 words (10 new + 4 trick) | HP: 14**

---

### Zone 3: Campfire — Short /o/ CVC

**Boss:** boss_campfire | **Background:** bg3_campfire

#### Level 7 — "Campfire: -ot"
```json
{
  "id": 7,
  "title": "Campfire: -ot",
  "phonics": "Short /o/ — word family -ot",
  "lesson": "Short 'o' sounds like o-o-o in 'octopus'. All these words end in -ot. 'Hot', 'pot', 'dot' — hear the 'o'? Let's cool down the campfire!",
  "hp": 14,
  "new": ["cot","dot","hot","pot","lot","not","rot","got","jot","tot"],
  "trick": ["said","are","one","two"]
}
```
**Total: 14 words (10 new + 4 trick) | HP: 14**

#### Level 8 — "Campfire: -op, -og & -ox"
```json
{
  "id": 8,
  "title": "Campfire: -op, -og & -ox",
  "phonics": "Short /o/ — word families -op, -og, and -ox",
  "lesson": "'Hop', 'mop', 'pop' end in -op. 'Dog', 'log', 'fog' end in -og. Same short 'o' in the middle. Keep reading and spraying!",
  "hp": 15,
  "new": ["hop","mop","pop","top","cop","sop","log","dog","fog","hog","jog","bog","box","fox","ox"],
  "trick": []
}
```
**Total: 15 words (15 new) | HP: 15**

#### Level 9 — "Campfire: -ob, -od & more"
```json
{
  "id": 9,
  "title": "Campfire: -ob, -od & more",
  "phonics": "Short /o/ — word families -ob, -od, -om, and -on",
  "lesson": "Last short 'o' words! 'Job', 'rob', 'sob' end in -ob. 'Rod', 'nod', 'pod' end in -od. Read them all and the campfire goes out!",
  "hp": 15,
  "new": ["rob","sob","bob","cob","lob","mob","job","rod","nod","pod","sod","mom","tom","con","don"],
  "trick": []
}
```
**Total: 15 words (15 new) | HP: 15**

> **Note:** Trick words "three, four, five, here, there, where" from original L3 are redistributed. See trick word allocation table below.

---

### Zone 4: Stove Fire — Short /u/ CVC

**Boss:** boss_stove | **Background:** bg4_stove

#### Level 10 — "Stove: -un & -ug"
```json
{
  "id": 10,
  "title": "Stove: -un & -ug",
  "phonics": "Short /u/ — word families -un and -ug",
  "lesson": "Short 'u' sounds like u-u-u in 'umbrella'. 'Sun', 'fun', 'run' end in -un. 'Bug', 'hug', 'rug' end in -ug. Let's spray the stove fire!",
  "hp": 15,
  "new": ["sun","fun","bun","run","nun","pun","bug","dug","hug","rug","mug","jug","tug","lug","pug"],
  "trick": []
}
```
**Total: 15 words (15 new) | HP: 15**

#### Level 11 — "Stove: -ut, -ub & -ud"
```json
{
  "id": 11,
  "title": "Stove: -ut, -ub & -ud",
  "phonics": "Short /u/ — word families -ut, -ub, and -ud",
  "lesson": "'Cut', 'but', 'hut' end in -ut. 'Tub', 'rub', 'cub' end in -ub. Same short 'u' in each one!",
  "hp": 14,
  "new": ["cut","but","hut","nut","rut","gut","tub","rub","sub","cub","hub","bud","mud","dud"],
  "trick": []
}
```
**Total: 14 words (14 new) | HP: 14**

#### Level 12 — "Stove: -up, -us & -um"
```json
{
  "id": 12,
  "title": "Stove: -up, -us & -um",
  "phonics": "Short /u/ — word families -up, -us, and -um",
  "lesson": "Last short 'u' words! 'Cup', 'pup', 'up' end in -up. 'Bus', 'fuss', 'us' end in -us. Read them all and the stove fire goes out!",
  "hp": 14,
  "new": ["pup","cup","up","bus","fuss","us","hum","gum","sum","yum"],
  "trick": ["he","she","be","do"]
}
```
**Total: 14 words (10 new + 4 trick) | HP: 14**

---

### Zone 5: Car Fire — Short /e/ CVC & CVCC

**Boss:** boss_car | **Background:** bg5_car

#### Level 13 — "Car: -et"
```json
{
  "id": 13,
  "title": "Car: -et",
  "phonics": "Short /e/ — word family -et",
  "lesson": "Short 'e' sounds like e-e-e in 'elephant'. All these words end in -et. 'Set', 'get', 'let', 'met' — hear the 'e'? Let's put out the car fire!",
  "hp": 14,
  "new": ["set","get","let","met","net","pet","vet","wet","bet","yet","jet"],
  "trick": ["no","so","they"]
}
```
**Total: 14 words (11 new + 3 trick) | HP: 14**

#### Level 14 — "Car: -ed, -en & -eg"
```json
{
  "id": 14,
  "title": "Car: -ed, -en & -eg",
  "phonics": "Short /e/ — word families -ed, -en, -eg, and more",
  "lesson": "'Bed', 'fed', 'red' end in -ed. 'Hen', 'pen', 'ten' end in -en. Same short 'e' in the middle!",
  "hp": 15,
  "new": ["bed","fed","red","led","hen","pen","ten","den","men","leg","beg","peg","gem","hem","web"],
  "trick": []
}
```
**Total: 15 words (15 new) | HP: 15**

#### Level 15 — "Car: -ess, -est & -ell"
```json
{
  "id": 15,
  "title": "Car: -ess, -est & -ell",
  "phonics": "Short /e/ — CVCC words with -ess, -est, -ell, and more",
  "lesson": "These short 'e' words are a bit longer! 'Nest', 'rest', 'test' end in -est. 'Bell', 'tell', 'well' end in -ell. Two consonants at the end — you can do it!",
  "hp": 15,
  "new": ["mess","less","nest","rest","test","bell","tell","sell","well","fell","end","kept","next"],
  "trick": ["this","that"]
}
```
**Total: 15 words (13 new + 2 trick) | HP: 15**

---

### Zone 6: BBQ — Initial Blends

**Boss:** boss_bbq | **Background:** bg6_bbq

#### Level 16 — "BBQ: st- blends"
```json
{
  "id": 16,
  "title": "BBQ: st- blends",
  "phonics": "Initial blend st-",
  "lesson": "Blends are two consonants that slide together. In 'stop', you hear both s and t: s-t-op. All these words start with st-. Say both sounds, then blend! Let's keep the BBQ safe!",
  "hp": 14,
  "new": ["stop","step","stem","stab","stack","stiff","still","staff","stand","stamp","stag","stun","stub","sting"],
  "trick": []
}
```
**Total: 14 words | HP: 14**

#### Level 17 — "BBQ: sp- blends"
```json
{
  "id": 17,
  "title": "BBQ: sp- blends",
  "phonics": "Initial blend sp-",
  "lesson": "Now we try sp- words. 'Spot', 'spin', 'spell' — hear the s and p together? S-p-ot. Say both sounds, then add the rest of the word!",
  "hp": 12,
  "new": ["spot","spit","spin","span","spat","spank","spill","spell","sped","spud","spun","spilt"],
  "trick": []
}
```
**Total: 12 words | HP: 12**

#### Level 18 — "BBQ: sl-, sn- & sw-"
```json
{
  "id": 18,
  "title": "BBQ: sl-, sn- & sw-",
  "phonics": "Initial blends sl-, sn-, and sw-",
  "lesson": "Three more beginning blends! 'Slip' starts with sl-, 'snap' starts with sn-, and 'swim' starts with sw-. Say both letters, then blend into the word!",
  "hp": 15,
  "new": ["slip","slap","slam","sled","slim","slop","snap","snip","snug","sniff","swim","swam","swap","swan","swat"],
  "trick": []
}
```
**Total: 15 words | HP: 15**

---

### Zone 7: Forest Fire — Digraphs

**Boss:** boss_forest | **Background:** bg7_forest

#### Level 19 — "Forest: sh & wh"
```json
{
  "id": 19,
  "title": "Forest: sh & wh",
  "phonics": "Digraphs sh and wh",
  "lesson": "A digraph is two letters that make one new sound. 'sh' says /sh/ — one sound, not two! 'Ship', 'shop', 'shut' all start with /sh/. 'What', 'when', 'which' start with /wh/. These letter teams work together!",
  "hp": 15,
  "new": ["ship","shop","shut","dish","fish","wish","dash","cash","rash","push","rush","what","when","which","whip"],
  "trick": []
}
```
**Total: 15 words | HP: 15**

#### Level 20 — "Forest: ch"
```json
{
  "id": 20,
  "title": "Forest: ch",
  "phonics": "Digraph ch",
  "lesson": "'ch' makes one sound — /ch/! 'Chip', 'chin', 'chat' start with /ch/. 'Much', 'such', 'rich' end with /ch/. Listen for that /ch/ sound!",
  "hp": 12,
  "new": ["chip","chin","chat","chop","much","such","rich","chest","chick","munch","lunch","pinch"],
  "trick": []
}
```
**Total: 12 words | HP: 12**

#### Level 21 — "Forest: th & ck"
```json
{
  "id": 21,
  "title": "Forest: th & ck",
  "phonics": "Digraphs th and ck",
  "lesson": "'th' makes one sound. 'Thin' and 'then' use /th/. 'ck' says /k/ at the end of short words — 'duck', 'back', 'rock'. Two letters, one sound!",
  "hp": 15,
  "new": ["thin","this","that","with","bath","math","both","then","them","duck","luck","back","pack","rock","kick"],
  "trick": []
}
```
**Total: 15 words | HP: 15**

---

### Zone 8: Warehouse Blaze — Final Blends

**Boss:** boss_warehouse | **Background:** bg8_warehouse

#### Level 22 — "Warehouse: -nd & -ng"
```json
{
  "id": 22,
  "title": "Warehouse: -nd & -ng",
  "phonics": "Final blends -nd and -ng",
  "lesson": "Now we practice blends at the end of words. 'Sand', 'hand', 'band' end in -nd. 'Sing', 'ring', 'king' end in -ng. Listen for the ending sounds!",
  "hp": 15,
  "new": ["sand","hand","band","land","pond","end","bend","send","sing","ring","wing","king","song","long","sting"],
  "trick": []
}
```
**Total: 15 words | HP: 15**

#### Level 23 — "Warehouse: -nt & -mp"
```json
{
  "id": 23,
  "title": "Warehouse: -nt & -mp",
  "phonics": "Final blends -nt and -mp",
  "lesson": "'Tent', 'bent', 'went' end in -nt. 'Jump', 'bump', 'camp' end in -mp. Say the word, listen for the two sounds at the end!",
  "hp": 15,
  "new": ["tent","bent","went","hunt","mint","sent","rent","hint","lamp","camp","jump","bump","dump","lump","pump"],
  "trick": []
}
```
**Total: 15 words | HP: 15**

#### Level 24 — "Warehouse: -st endings"
```json
{
  "id": 24,
  "title": "Warehouse: -st endings",
  "phonics": "Final blend -st",
  "lesson": "'Last', 'fast', 'past' end in -st. 'Best', 'rest', 'nest' end in -st too. Hear the s and t at the end? Read them all and the warehouse fire is out!",
  "hp": 13,
  "new": ["last","fast","past","mast","best","rest","nest","test","cost","lost"],
  "trick": ["with","when","from"]
}
```
**Total: 13 words (10 new + 3 trick) | HP: 13**

---

### Zone 9: Office Tower — R-Controlled Vowels

**Boss:** boss_office | **Background:** bg9_office

#### Level 25 — "Office: ar & or"
```json
{
  "id": 25,
  "title": "Office: ar & or",
  "phonics": "R-controlled vowels ar and or",
  "lesson": "Sometimes 'r' changes a vowel's sound. 'Car' has ar — the 'a' doesn't say its short sound anymore! 'Corn' has or — the 'o' changes too. Listen for those r-controlled sounds!",
  "hp": 15,
  "new": ["car","far","bar","star","park","dark","hard","farm","for","or","corn","fork","horn","storm","short"],
  "trick": []
}
```
**Total: 15 words | HP: 15**

#### Level 26 — "Office: er & ir"
```json
{
  "id": 26,
  "title": "Office: er & ir",
  "phonics": "R-controlled vowels er and ir",
  "lesson": "'Her' has er and 'bird' has ir — they sound almost the same! The 'r' changes the vowel. 'Term', 'herd', 'dirt', 'girl' — listen for that /er/ sound!",
  "hp": 15,
  "new": ["her","term","jerk","germ","herd","perch","verb","bird","dirt","girl","shirt","stir","third","first","firm"],
  "trick": []
}
```
**Total: 15 words | HP: 15**

#### Level 27 — "Office: ur"
```json
{
  "id": 27,
  "title": "Office: ur",
  "phonics": "R-controlled vowel ur",
  "lesson": "Last r-controlled sound — 'ur'! 'Fur', 'burn', 'turn' all have ur. It sounds just like er and ir. Read them all and the office-tower fire goes out!",
  "hp": 14,
  "new": ["fur","burn","turn","surf","hurt","curb","curl","blur","burst","purse"],
  "trick": ["where","why","again","friend"]
}
```
**Total: 14 words (10 new + 4 trick) | HP: 14**

---

### Zone 10: Burning Castle — Dragon Sentences

**Boss:** dragon | **Background:** bg10_castle

#### Level 28 — "Castle: Short Sentences"
```json
{
  "id": 28,
  "title": "Castle: Short Sentences",
  "phonics": "Mixed review — short sentences (3-5 words)",
  "lesson": "You have learned so many words! Now we read short sentences. Point to each word. Say it clearly. When you read a whole sentence, the dragon's fire gets weaker!",
  "hp": 12,
  "sentences": [
    "A big bug ran.",
    "I can run fast.",
    "We can get wet.",
    "The duck went in.",
    "The duck can swim.",
    "The barn is far.",
    "The storm is big.",
    "Look at the map.",
    "The band can sing.",
    "The car can turn.",
    "The bird can chirp.",
    "Dad had a red cap.",
    "The cat sat on me.",
    "She said yes to me.",
    "The dog ran from me.",
    "The frog is not here.",
    "The kid can jump fast.",
    "The girl can jump up.",
    "The fish can swim fast.",
    "The king has a staff.",
    "He can kick the ball.",
    "We will stop and rest.",
    "The campfire is hot.",
    "The dog dug in sand.",
    "The best wish is kind."
  ]
}
```
**Total: 25 sentences (12 selected per session) | HP: 12**

#### Level 29 — "Castle: Longer Sentences"
```json
{
  "id": 29,
  "title": "Castle: Longer Sentences",
  "phonics": "Mixed review — longer sentences (5-7 words)",
  "lesson": "The dragon is almost beaten! These sentences are a bit longer. Take your time, say each word, and read all the way across. You can do it!",
  "hp": 12,
  "sentences": [
    "We went to the park.",
    "The fish swam in a tub.",
    "The moth is on the rug.",
    "The bird is in the nest.",
    "The dog can run with you.",
    "We can shop and get gum.",
    "The kid will swat a bug.",
    "The truck is in the lot.",
    "The fish is on the dish.",
    "The camp is near the pond.",
    "The kid can spot the fox.",
    "The bug is under the rug.",
    "The cat is on the box.",
    "We can rest in the tent.",
    "The duck went to the pond.",
    "The girl can help you.",
    "The kid can look here.",
    "The bird is on the perch.",
    "The dog can sniff the mud.",
    "The cat can nap on the bed.",
    "We can play in the yard.",
    "The car is in the lot.",
    "The cat can sit still.",
    "Please help me, friend.",
    "The dragon is not kind."
  ]
}
```
**Total: 25 sentences (12 selected per session) | HP: 12**

---

## Trick Word Distribution

The 50 original trick words are distributed across CVC levels. Each batch groups naturally:

| Level | Trick Words | Theme |
|-------|-------------|-------|
| 1 | the, a, I | Articles + pronoun (most common) |
| 2 | and, to, you | Connectors |
| 3 | is, my, we, go | Being + pronouns |
| 6 | was, of, for, me | Past tense + prepositions |
| 7 | said, are, one, two | Speech + counting |
| 12 | he, she, be, do | Pronouns + verbs |
| 13 | no, so, they | Negation + pronoun |
| 15 | this, that | Demonstratives |
| 24 | with, when, from | Prepositions + question |
| 27 | where, why, again, friend | Questions + common words |

**Unallocated (10 words from original trick lists):** three, four, five, here, there, come, some, done, gone, give, have, does, says, your, who

These 15 words exceed the original 50 — the originals had duplicates across levels. The unique set of 50 trick words across all original levels is:

*Original L1:* the, a, I, and, to, you, is, my, we, go
*Original L2:* was, of, for, me, he, she, be, do, no, so
*Original L3:* said, are, one, two, three, four, five, here, there, where
*Original L4:* come, some, done, gone, give, have, does, says, your, who
*Original L5:* they, this, that, with, when, where, why, from, again, friend

Remaining unallocated trick words (10): **three, four, five, here, there, come, some, done, gone, give, have, does, says, your, who** — these can be added to levels 4, 5, 8, 9, 10, 11 which currently have no trick words, or held for review-word pools.

**Proposed redistribution of remaining trick words:**

| Level | Add Trick Words |
|-------|----------------|
| 4 | here, there, come |
| 5 | some, done, gone |
| 8 | three, four, five |
| 9 | give, have |
| 10 | does, says |
| 11 | your, who |

This brings those levels to 14-18 total words. Since HP = new words only in these cases... **wait, this changes the design.** With the current code, trick words ARE boss targets. Two options:

### Option A: Keep trick words as HP targets (current behavior)
Adding trick words increases HP. Levels 4, 5, 8, 9 go from 14-15 to 17-18 total. This slightly exceeds the 15-word target.

### Option B: Make trick words practice-only (code change)
Trick words enter the deck but don't reduce HP. HP = `new[]` count only. This is pedagogically better (trick words are sight words, not phonics targets) and keeps HP at 14-15.

**Recommendation: Option B.** One code change in `GameScene.initWordMode()` — build `bossTargets` from `new[]` only instead of `new[] + trick[]`.

With Option B, the redistribution works cleanly and every level has 14-18 total words in deck with HP 10-15.

---

## Boss & Background Mapping

Sub-levels within a zone share the same boss and background. The `visuals.ts` mappings become:

```typescript
export const LEVEL_BGS: Record<number, string> = {
  // Zone 1: Kitchen
  1: 'bg1', 2: 'bg1', 3: 'bg1',
  // Zone 2: Trash Can
  4: 'bg2', 5: 'bg2', 6: 'bg2',
  // Zone 3: Campfire
  7: 'bg3', 8: 'bg3', 9: 'bg3',
  // Zone 4: Stove
  10: 'bg4', 11: 'bg4', 12: 'bg4',
  // Zone 5: Car
  13: 'bg5', 14: 'bg5', 15: 'bg5',
  // Zone 6: BBQ
  16: 'bg6', 17: 'bg6', 18: 'bg6',
  // Zone 7: Forest
  19: 'bg7', 20: 'bg7', 21: 'bg7',
  // Zone 8: Warehouse
  22: 'bg8', 23: 'bg8', 24: 'bg8',
  // Zone 9: Office
  25: 'bg9', 26: 'bg9', 27: 'bg9',
  // Zone 10: Castle
  28: 'bg10', 29: 'bg10'
};

export const LEVEL_BOSS_ANIMS: Record<number, string> = {
  1: 'boss_kitchen', 2: 'boss_kitchen', 3: 'boss_kitchen',
  4: 'boss_trash', 5: 'boss_trash', 6: 'boss_trash',
  7: 'boss_campfire', 8: 'boss_campfire', 9: 'boss_campfire',
  10: 'boss_stove', 11: 'boss_stove', 12: 'boss_stove',
  13: 'boss_car', 14: 'boss_car', 15: 'boss_car',
  16: 'boss_bbq', 17: 'boss_bbq', 18: 'boss_bbq',
  19: 'boss_forest', 20: 'boss_forest', 21: 'boss_forest',
  22: 'boss_warehouse', 23: 'boss_warehouse', 24: 'boss_warehouse',
  25: 'boss_office', 26: 'boss_office', 27: 'boss_office',
  28: 'dragon', 29: 'dragon'
};
```

---

## Menu Redesign: Scrolling Grid

Replace the fixed 5×2 grid with a scrollable 5-wide grid.

### Layout
- **Grid:** 5 columns × 6 rows (30 slots, 29 used)
- **Card size:** 144×120px (slightly shorter to fit 6 rows)
- **Visible area:** Show 5×4 (20 cards) at once, scroll to see remaining 9
- **Scroll:** Touch drag or mouse wheel on the grid area. Scroll indicator (thin bar) on right edge.
- **Zone labels:** Small colored zone header text above each row of related sub-levels (e.g., "Kitchen Fire" above levels 1-3 in row 1)

### Card display
Same as current: background thumbnail, boss sprite, level number, title, stars, best streak. Locked/unlocked/cleared states unchanged.

### Row layout
```
Row 1: [L1] [L2] [L3] [ — ] [ — ]     ← Kitchen (3 levels, 2 empty)
Row 2: [L4] [L5] [L6] [ — ] [ — ]     ← Trash Can
Row 3: [L7] [L8] [L9] [ — ] [ — ]     ← Campfire
Row 4: [L10][L11][L12] [ — ] [ — ]     ← Stove
Row 5: [L13][L14][L15] [ — ] [ — ]     ← Car
Row 6: [L16][L17][L18] [ — ] [ — ]     ← BBQ
```
*(scroll down)*
```
Row 7: [L19][L20][L21] [ — ] [ — ]     ← Forest
Row 8: [L22][L23][L24] [ — ] [ — ]     ← Warehouse
Row 9: [L25][L26][L27] [ — ] [ — ]     ← Office
Row 10:[L28][L29] [ — ] [ — ] [ — ]    ← Castle
```

Actually, stacking 3 per row wastes space. Better: **pack all 29 into a continuous 5-wide grid:**

```
Row 1: [L1]  [L2]  [L3]  [L4]  [L5]
Row 2: [L6]  [L7]  [L8]  [L9]  [L10]
Row 3: [L11] [L12] [L13] [L14] [L15]
Row 4: [L16] [L17] [L18] [L19] [L20]
Row 5: [L21] [L22] [L23] [L24] [L25]
Row 6: [L26] [L27] [L28] [L29] [  ]
```

Show rows 1-4 (20 cards) initially. Scroll down to see rows 5-6 (9 more cards). Each card is color-tinted by zone for visual grouping. Zone color bands or left-edge markers distinguish zones within the continuous grid.

**Recommended: zone-grouped rows** (first option) for clearer visual organization despite empty slots. Each zone gets its own row. 10 rows × 3-wide with zone labels is cleaner than 6 rows × 5-wide.

### Alternative: 3-wide with zone headers

```
         ── Kitchen Fire ──
[L1: -at & -an] [L2: -ap, -ag & -am] [L3: -ad & pals]

         ── Trash-Can Fire ──
[L4: -it & -ip] [L5: -ig, -in & -im] [L6: -id, -ix & -ib]

         ...etc...
```

3 columns × 10 zone groups. Cards can be wider (200×110px). Show ~4 zones at a time, scroll for the rest. Zone headers provide clear structure.

---

## Unlock Progression

- **Starting state:** Levels 1 and 2 unlocked (first two sub-levels of Zone 1)
- **Sequential unlock:** Clearing level N unlocks level N+1
- **Zone completion:** When all sub-levels in a zone are cleared, show a zone-completion celebration (confetti burst, "Zone Complete!" text, unlock-reward sound)
- **No skip-ahead:** Must clear all sub-levels in order

`STARTING_UNLOCKED_LEVEL` changes from 2 to 2 (still unlock first 2). `unlockedLevel` max changes from 10 to 29.

---

## Code Changes Required

### 1. Level data files
- Delete `data/level01.json` through `data/level10.json`
- Create `data/level01.json` through `data/level29.json` (contents as specified above)

### 2. `src/data/levels.ts`
- Update the level loader to import/load levels 1-29
- Update `isValidLevelData` if needed (no schema change — same fields)

### 3. `src/visuals.ts`
- Replace `LEVEL_BGS` and `LEVEL_BOSS_ANIMS` with 29-entry mappings (see above)

### 4. `src/constants.ts`
- Remove `HP_CAP_TIER_1`, `HP_CAP_TIER_2`, `HP_CAP_TIER_3` (HP = word count, no caps)
- Optionally add `TOTAL_LEVELS: 29` and `ZONES` mapping

### 5. `src/scenes/GameScene.ts`
- Remove HP cap logic in `initWordMode()` (lines 266-270). HP = `allTargets.length`
- **(If Option B for trick words):** Change `rawTargets` to only use `this.levelData.new`, not `trick`. Trick words enter deck as practice-only (not in `bossTargets`).
- Update `GEAR_TEXT` for 29 levels (or simplify to milestone-based: every 3 levels gets a gear unlock)
- Update dragon check: `this.levelNum === 10` → `this.levelNum >= 28` (levels 28-29 are dragon/sentence levels)

### 6. `src/scenes/MenuScene.ts`
- Replace 5×2 fixed grid with scrollable 3-wide zone-grouped grid
- Add zone header labels
- Add scroll support (touch drag + mouse wheel)
- Update card rendering for 29 levels
- Card size adjustment: 200×110px or similar for 3-wide layout

### 7. `src/scenes/LessonScene.ts`
- No structural changes needed (reads title, phonics, lesson from level data)
- May want to show zone name above level title

### 8. `src/storage.ts`
- Update `STARTING_UNLOCKED_LEVEL` if changed
- `normalizeProfile`: ensure `unlockedLevel` clamps to [1, 29]
- `clearedLevels`, `levelStars`, `bestStreak` arrays/records work with any level number — no change needed

### 9. `src/types.ts`
- No changes needed (LevelData interface already supports all required fields)

### 10. `src/validate.ts`
- Update expected level count from 10 to 29

### 11. `GEAR_TEXT` revision
Current: 10 gear texts for 10 levels. New: either 29 gear texts, or milestone-based:

```typescript
const GEAR_TEXT: Record<number, string> = {
  // Zone completions (every 3rd level = zone clear)
  3: 'Zone Clear! Unlocked: Kid helmet sticker',
  6: 'Zone Clear! Unlocked: Stronger hose nozzle',
  9: 'Zone Clear! Unlocked: Boots upgrade',
  12: 'Zone Clear! Unlocked: Water tank upgrade',
  15: 'Zone Clear! Unlocked: Fire truck badge',
  18: 'Zone Clear! Unlocked: Super soaker mode',
  21: 'Zone Clear! Unlocked: Heat shield',
  24: 'Zone Clear! Unlocked: Rescue rope',
  27: 'Zone Clear! Unlocked: Chief hat',
  29: 'Zone Clear! Unlocked: Dragon medal'
};
```

---

## Migration Plan

### Save data compatibility
Existing profiles have `unlockedLevel` (1-10), `clearedLevels` ([1-10]), `levelStars` ({1-10: 1-3}), `bestStreak` ({1-10: N}). After the split, level numbers change meaning entirely.

**Approach:** On first load after update, detect old profile (any `unlockedLevel <= 10` with `clearedLevels` containing values ≤ 10) and migrate:
- Map old level 1 cleared → new levels 1-3 cleared
- Map old level 2 cleared → new levels 4-6 cleared
- ...and so on
- Set `unlockedLevel` to the first un-cleared new level
- Stars and streaks: carry forward to the last sub-level of each zone (or reset)

**Simpler alternative:** Reset all progress on update. Given this is a home game for one child, a one-time reset is acceptable. Show a message: "Fire-Reader has been updated with more levels! Your progress has been reset for the new adventure."

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Total levels | 10 | 29 |
| Words per level | 40-50 | 10-15 |
| HP per level | 15-35 (capped) | 10-15 (= word count) |
| Est. session time | 12-45 min | 8-12 min |
| Total vocabulary | ~400 | ~363 |
| Boss fights | 10 | 29 (3× more!) |
| Star opportunities | 30 | 87 (3× more!) |
| Art assets needed | — | None (reuse) |
