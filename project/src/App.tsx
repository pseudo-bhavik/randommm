import React, { useCallback, useEffect } from 'react';
import { IntroScreen } from './components/IntroScreen';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { useGameState } from './hooks/useGameState';
import { getRemainingPlays, incrementTodayPlays, incrementGamesSinceLastMultiplier, resetGamesSinceLastMultiplier } from './utils/storageUtils';
import { RATE_LIMIT } from './constants';

function App() {
  const {
    gameState,
    setGameState,
    updateScreen,
    updateScore,
    updateMultiplier,
    setGameRunning,
    resetGame,
    updatePlaysToday,
    updateBestScore,
  } = useGameState();

  // Signal to Farcaster that the Mini-App is ready
  useEffect(() => {
    try {
      window.farcaster.ready();
    } catch (error) {
      console.warn('Failed to signal Farcaster readiness:', error);
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    updateScreen('menu');
  }, [updateScreen]);

  const handleStartGame = useCallback(() => {
    const remaining = getRemainingPlays();
    if (remaining <= 0) return;
    
    // Increment multiplier tracker
    const gamesSinceLastMultiplier = incrementGamesSinceLastMultiplier();
    
    // Determine if this should be a multiplier game (every 5th game)
    const shouldSpawnMultiplier = gamesSinceLastMultiplier >= RATE_LIMIT.MULTIPLIER_GAME_INTERVAL;
    
    // Reset multiplier tracker if this is a multiplier game
    if (shouldSpawnMultiplier) {
      resetGamesSinceLastMultiplier();
    }
    
    resetGame();
    setGameRunning(true);
    
    // Update game state with multiplier flag
    setGameState(prev => ({
      ...prev,
      isGameRunning: true,
      screen: 'playing',
      shouldSpawnMultiplier: shouldSpawnMultiplier,
    }));
    
    updateScreen('playing');
    
    // Increment plays count
    const newPlayCount = incrementTodayPlays();
    updatePlaysToday(newPlayCount);
  }, [resetGame, setGameRunning, setGameState, updateScreen, updatePlaysToday]);

  const handleGameOver = useCallback(() => {
    // Check if current score is a new best score
    if (gameState.score > gameState.bestScore) {
      updateBestScore(gameState.score);
    }
    
    setGameRunning(false);
    updateScreen('gameOver');
  }, [gameState.score, gameState.bestScore, updateBestScore, setGameRunning, updateScreen]);

  const handleBackToMenu = useCallback(() => {
    resetGame();
    updateScreen('menu');
  }, [resetGame, updateScreen]);

  const remainingPlays = getRemainingPlays();

  // Render current screen
  switch (gameState.screen) {
    case 'intro':
      return <IntroScreen onComplete={handleIntroComplete} />;
      
    case 'menu':
      return (
        <MainMenu
          onStartGame={handleStartGame}
          remainingPlays={remainingPlays}
          maxPlays={gameState.maxPlaysPerDay}
          bestScore={gameState.bestScore}
        />
      );
      
    case 'playing':
      return (
        <GameCanvas
          onGameOver={handleGameOver}
          onScoreUpdate={updateScore}
          onMultiplierUpdate={updateMultiplier}
          isGameRunning={gameState.isGameRunning}
          shouldSpawnMultiplier={gameState.shouldSpawnMultiplier || false}
        />
      );
      
    case 'gameOver':
      return (
        <GameOverScreen
          score={gameState.score}
          multiplier={gameState.multiplier}
          remainingPlays={remainingPlays}
          onBackToMenu={handleBackToMenu}
          onPlayAgain={handleStartGame} // Pass handleStartGame for "Play Again"
        />
      );
      
    default:
      return null;
  }
}

export default App;