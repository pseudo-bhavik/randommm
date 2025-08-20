import { useState, useCallback } from 'react';
import { GameState } from '../types';
import { RATE_LIMIT } from '../constants';
import { getTodayPlays, getBestScore, setBestScore } from '../utils/storageUtils';

const initialState: GameState = {
  screen: 'intro',
  score: 0,
  multiplier: 1,
  bestScore: getBestScore(),
  playsToday: getTodayPlays(),
  maxPlaysPerDay: RATE_LIMIT.MAX_PLAYS_PER_DAY,
  isGameRunning: false,
  shouldSpawnMultiplier: false,
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);

  const updateScreen = useCallback((screen: GameState['screen']) => {
    setGameState(prev => ({ ...prev, screen }));
  }, []);

  const updateScore = useCallback((score: number) => {
    setGameState(prev => ({ ...prev, score }));
  }, []);

  const updateMultiplier = useCallback((multiplier: number) => {
    setGameState(prev => ({ ...prev, multiplier }));
  }, []);

  const setGameRunning = useCallback((isRunning: boolean) => {
    setGameState(prev => ({ ...prev, isGameRunning: isRunning }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      multiplier: 1,
      isGameRunning: false,
      shouldSpawnMultiplier: false,
    }));
  }, []);

  const updatePlaysToday = useCallback((plays: number) => {
    setGameState(prev => ({ ...prev, playsToday: plays }));
  }, []);

  const updateBestScore = useCallback((score: number) => {
    setBestScore(score);
    setGameState(prev => ({ ...prev, bestScore: score }));
  }, []);

  return {
    gameState,
    setGameState,
    updateScreen,
    updateScore,
    updateMultiplier,
    setGameRunning,
    resetGame,
    updatePlaysToday,
    updateBestScore,
  };
};