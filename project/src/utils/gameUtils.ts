import { Bird, Pipe } from '../types';
import { PHYSICS, GAME, REWARDS } from '../constants';

export const checkCollision = (bird: Bird, pipes: Pipe[]): boolean => {
  // Check ground collision
  if (bird.y + PHYSICS.BIRD_SIZE / 2 >= GAME.HEIGHT - 30) { // Use reduced grass height
    return true;
  }

  // Check ceiling collision
  if (bird.y - PHYSICS.BIRD_SIZE / 2 <= 0) {
    return true;
  }

  // Check pipe collision
  for (const pipe of pipes) {
    if (
      bird.x + PHYSICS.BIRD_SIZE / 2 > pipe.x &&
      bird.x - PHYSICS.BIRD_SIZE / 2 < pipe.x + PHYSICS.PIPE_WIDTH
    ) {
      if (
        bird.y - PHYSICS.BIRD_SIZE / 2 < pipe.topHeight ||
        bird.y + PHYSICS.BIRD_SIZE / 2 > GAME.HEIGHT - pipe.bottomHeight - 30 // Use reduced grass height
      ) {
        return true;
      }
    }
  }

  return false;
};

export const generatePipe = (id: number, x: number, gapSize: number): Pipe => {
  const minTopHeight = GAME.PIPE_VERTICAL_PADDING;
  const maxTopHeight = GAME.HEIGHT - gapSize - 30 - GAME.PIPE_VERTICAL_PADDING; // Use reduced grass height
  const topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;
  const bottomHeight = GAME.HEIGHT - topHeight - gapSize - 30; // Use reduced grass height

  return {
    id,
    x,
    topHeight,
    bottomHeight,
    passed: false,
  };
};

export const calculateTokenReward = (score: number, multiplier: number): number => {
  return Math.floor(score * multiplier * REWARDS.TOKEN_MULTIPLIER);
};