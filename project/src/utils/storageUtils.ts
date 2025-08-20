import { RATE_LIMIT } from '../constants';

interface PlayData {
  date: string;
  count: number;
}

interface MultiplierTrackerData {
  gamesSinceLastMultiplier: number;
}

export const getTodayPlays = (): number => {
  const today = new Date().toDateString();
  const stored = localStorage.getItem(RATE_LIMIT.STORAGE_KEY);
  
  if (!stored) return 0;
  
  try {
    const playData: PlayData = JSON.parse(stored);
    return playData.date === today ? playData.count : 0;
  } catch {
    return 0;
  }
};

export const incrementTodayPlays = (): number => {
  const today = new Date().toDateString();
  const currentPlays = getTodayPlays();
  const newCount = currentPlays + 1;
  
  const playData: PlayData = {
    date: today,
    count: newCount,
  };
  
  localStorage.setItem(RATE_LIMIT.STORAGE_KEY, JSON.stringify(playData));
  return newCount;
};

export const getRemainingPlays = (): number => {
  return Math.max(0, RATE_LIMIT.MAX_PLAYS_PER_DAY - getTodayPlays());
};

export const getMultiplierTracker = (): MultiplierTrackerData => {
  const stored = localStorage.getItem(RATE_LIMIT.MULTIPLIER_TRACKER_KEY);
  
  if (!stored) {
    return { gamesSinceLastMultiplier: 0 };
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return { gamesSinceLastMultiplier: 0 };
  }
};

export const updateMultiplierTracker = (data: MultiplierTrackerData): void => {
  localStorage.setItem(RATE_LIMIT.MULTIPLIER_TRACKER_KEY, JSON.stringify(data));
};

export const incrementGamesSinceLastMultiplier = (): number => {
  const tracker = getMultiplierTracker();
  const newCount = tracker.gamesSinceLastMultiplier + 1;
  
  updateMultiplierTracker({ gamesSinceLastMultiplier: newCount });
  return newCount;
};

export const resetGamesSinceLastMultiplier = (): void => {
  updateMultiplierTracker({ gamesSinceLastMultiplier: 0 });
};

export const getBestScore = (): number => {
  const stored = localStorage.getItem(RATE_LIMIT.BEST_SCORE_KEY);
  
  if (!stored) return 0;
  
  try {
    const score = parseInt(stored, 10);
    return isNaN(score) ? 0 : score;
  } catch {
    return 0;
  }
};

export const setBestScore = (score: number): void => {
  localStorage.setItem(RATE_LIMIT.BEST_SCORE_KEY, score.toString());
};