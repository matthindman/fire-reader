export const GAME_CONSTANTS = {
  MAX_FAILS_PER_LEVEL: 10,
  REVIEW_WORDS_LIMIT: 15,

  // In-session reinsertion spacing
  REINSERT_DELAY_FAIL: 3,
  REINSERT_DELAY_HARD: 6,
  REINSERT_DELAY_EASY_CONFIRM: 10,

  // Easy streak needed for "stable" mastery
  MASTERY_THRESHOLD: 2
} as const;
