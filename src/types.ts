export interface WordState {
  interval: number;   // hours
  ease: number;       // 1.3..2.5
  due: number;        // epoch ms
  successes: number;  // count of Easy ratings
}

export interface SaveData {
  unlockedLevel: number;
  words: Record<string, WordState>;
  muted: boolean;
  contrastHigh: boolean;
}

export interface LevelData {
  id: number;
  title: string;
  phonics: string;
  lesson: string;
  hp: number;

  new?: string[];
  trick?: string[];
  sentences?: string[];
}
