export const GAME_CONSTANTS = {
  MAX_FAILS_PER_LEVEL: 10,
  REVIEW_WORDS_LIMIT: 6,

  // In-session reinsertion spacing
  REINSERT_DELAY_FAIL: 5,
  REINSERT_DELAY_HARD: 9,
  REINSERT_DELAY_EASY_CONFIRM: 10,

  // Easy streak needed for "stable" mastery
  MASTERY_THRESHOLD: 1
} as const;
