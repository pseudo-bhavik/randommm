export interface GameState {
  screen: 'intro' | 'menu' | 'playing' | 'gameOver';
  score: number;
  multiplier: number;
  bestScore: number;
  playsToday: number;
  maxPlaysPerDay: number;
  isGameRunning: boolean;
  shouldSpawnMultiplier?: boolean;
}

export interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
}

export interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

export interface GameStats {
  totalTokens: number;
  breakdown: {
    baseScore: number;
    multiplier: number;
    finalAmount: number;
  };
}