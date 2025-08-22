// Game physics constants
export const PHYSICS = {
  GRAVITY: 0.12,
  JUMP_FORCE: -4.0,
  PIPE_SPEED: 2.2,
  PIPE_SPAWN_DISTANCE: 300,
  BIRD_SIZE: 45,
  PIPE_WIDTH: 60,
} as const;

// Game dimensions
export const GAME = {
  WIDTH: 400,
  HEIGHT: 700,
  GROUND_HEIGHT: 70,
  PIPE_GAP_VALUES: [180, 200, 220],
  PIPE_VERTICAL_PADDING: 55,
  BORDER_HEIGHT: 25,
} as const;

// Colors and styling
export const COLORS = {
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  secondary: {
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
  },
  accent: {
    500: '#f97316',
    600: '#ea580c',
  },
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  // New theme colors
  ARBITRUM_PURPLE: '#6249CB',
  SKY_BLUE: '#87CEEB',
  SKY_BLUE_DARK: '#4682B4',
  GRASS_GREEN: '#90EE90',
  GRASS_GREEN_DARK: '#7CB342',
  CLOUD_WHITE: '#FFFFFF',
} as const;

// Token economics
export const REWARDS = {
  TOKEN_MULTIPLIER: 50,
  MULTIPLIER_VALUE: 3, // New constant for easy multiplier value change
} as const;

// Rate limiting
export const RATE_LIMIT = {
  MAX_PLAYS_PER_DAY: 50,
  STORAGE_KEY: 'flappy-arb-plays',
  MULTIPLIER_GAME_INTERVAL: 5,
  MULTIPLIER_TRACKER_KEY: 'flappy-arb-multiplier-tracker',
  MULTIPLIER_MISSED_KEY: 'flappy-arb-multiplier-missed',
  BEST_SCORE_KEY: 'flappy-arb-best-score',
} as const;