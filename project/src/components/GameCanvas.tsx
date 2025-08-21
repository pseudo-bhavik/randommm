import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Bird, Pipe } from '../types';
import { PHYSICS, GAME, REWARDS, COLORS } from '../constants';
import { checkCollision, generatePipe } from '../utils/gameUtils';

interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface GrassTuft {
  x: number;
  y: number;
  width: number;
  height: number;
  segments: number;
}

interface GameCanvasProps {
  onGameOver: () => void;
  onScoreUpdate: (score: number) => void;
  onMultiplierUpdate: (multiplier: number) => void;
  isGameRunning: boolean;
  shouldSpawnMultiplier: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onGameOver,
  onScoreUpdate,
  onMultiplierUpdate,
  isGameRunning,
  shouldSpawnMultiplier
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [gameInitialized, setGameInitialized] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [birdImage, setBirdImage] = useState<HTMLImageElement | null>(null);
  const [isBirdImageLoaded, setIsBirdImageLoaded] = useState(false);
  const staticGrassBladesRef = useRef<{ x: number; width: number; height: number }[]>([]);
  const grassTuftsRef = useRef<GrassTuft[]>([]);
  
  // Pre-created gradients for performance
  const skyGradientRef = useRef<CanvasGradient | null>(null);
  const groundGradientRef = useRef<CanvasGradient | null>(null);
  const pipeGradientRef = useRef<CanvasGradient | null>(null);
  const capGradientRef = useRef<CanvasGradient | null>(null);
  const birdGradientRef = useRef<CanvasGradient | null>(null);
  
  // Game state
  const birdRef = useRef<Bird>({
    x: 100,
    y: GAME.HEIGHT / 2,
    velocity: 0,
    rotation: 0
  });
  
  const pipesRef = useRef<Pipe[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const scoreRef = useRef(0);
  const pipeIdRef = useRef(0);
  const pipeGapIndexRef = useRef(0);
  const lastPipeXRef = useRef(GAME.WIDTH);

  // Initialize gradients once when canvas is available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, COLORS.SKY_BLUE);
    skyGradient.addColorStop(0.7, COLORS.SKY_BLUE_DARK);
    skyGradient.addColorStop(1, COLORS.ARBITRUM_PURPLE);
    skyGradientRef.current = skyGradient;
    
    // Create ground gradient
    const grassHeight = 30;
    const groundGradient = ctx.createLinearGradient(0, canvas.height - grassHeight, 0, canvas.height);
    groundGradient.addColorStop(0, COLORS.GRASS_GREEN);
    groundGradient.addColorStop(1, COLORS.GRASS_GREEN_DARK);
    groundGradientRef.current = groundGradient;
    
    // Create pipe gradient
    const pipeGradient = ctx.createLinearGradient(0, 0, PHYSICS.PIPE_WIDTH, 0);
    pipeGradient.addColorStop(0, '#99D94A');
    pipeGradient.addColorStop(0.5, '#AEF359');
    pipeGradient.addColorStop(1, '#88C839');
    pipeGradientRef.current = pipeGradient;
    
    // Create pipe cap gradient
    const capGradient = ctx.createLinearGradient(0, 0, PHYSICS.PIPE_WIDTH + 10, 0);
    capGradient.addColorStop(0, '#C0F870');
    capGradient.addColorStop(0.5, '#D0FF80');
    capGradient.addColorStop(1, '#C0F870');
    capGradientRef.current = capGradient;
    
    // Create bird gradient
    const birdGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, PHYSICS.BIRD_SIZE / 2);
    birdGradient.addColorStop(0, '#fbbf24');
    birdGradient.addColorStop(0.7, '#f59e0b');
    birdGradient.addColorStop(1, '#d97706');
    birdGradientRef.current = birdGradient;
  }, []);

  // Load custom bird image
  useEffect(() => {
    setIsLoadingAssets(true);
    const img = new Image();
    img.src = '/my-bird.png'; // Make sure this path matches your image file name
    img.onload = () => {
      setBirdImage(img);
      setIsBirdImageLoaded(true);
      setIsLoadingAssets(false);
    };
    img.onerror = () => {
      console.error('Failed to load bird image.');
      setIsBirdImageLoaded(false); // Ensure it's false on error
      setIsLoadingAssets(false); // Allow game to continue with fallback
    };
  }, []);

  // Generate initial clouds
  const generateClouds = useCallback((): Cloud[] => {
    const clouds: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * GAME.WIDTH * 2,
        y: Math.random() * (GAME.HEIGHT * 0.4) + 20,
        size: Math.random() * 30 + 20,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
    return clouds;
  }, []);

  // Generate static grass blades
  const generateStaticGrass = useCallback((): { 
    blades: { x: number; width: number; height: number }[], 
    tufts: GrassTuft[] 
  } => {
    // Return empty arrays - no grass details, just solid ground color
    return { blades: [], tufts: [] };
  }, []);

  // Initialize game when component mounts or game starts
  const initializeGame = useCallback(() => {
    birdRef.current = {
      x: 100,
      y: GAME.HEIGHT / 2,
      velocity: 0,
      rotation: 0
    };
    pipesRef.current = [];
    cloudsRef.current = generateClouds();
    const grassData = generateStaticGrass();
    staticGrassBladesRef.current = grassData.blades;
    grassTuftsRef.current = grassData.tufts;
    scoreRef.current = 0;
    pipeIdRef.current = 0;
    pipeGapIndexRef.current = 0;
    lastPipeXRef.current = GAME.WIDTH;
    
    // Set multiplier if this is a multiplier game
    if (shouldSpawnMultiplier) {
      onMultiplierUpdate(REWARDS.MULTIPLIER_VALUE);
    } else {
      onMultiplierUpdate(1);
    }
    
    onScoreUpdate(0);
    setGameInitialized(true);
  }, [shouldSpawnMultiplier, onMultiplierUpdate, onScoreUpdate, generateClouds, generateStaticGrass]);

  // Handle user input
  const handleJump = useCallback(() => {
    // Don't allow input while assets are loading
    if (isLoadingAssets) return;
    
    if (!gameStarted) {
      // First tap/click starts the game
      setGameStarted(true);
      birdRef.current.velocity = PHYSICS.JUMP_FORCE;
    } else if (gameStarted) {
      // Subsequent taps/clicks make the bird jump
      birdRef.current.velocity = PHYSICS.JUMP_FORCE;
    }
  }, [gameStarted, isLoadingAssets]);

  // Add event listeners
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };

    const handleClick = () => {
      handleJump();
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
    };
  }, [handleJump]);

  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isGameRunning) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If game hasn't started yet, just render static scene
    if (!gameStarted) {
      render(ctx, birdRef.current, pipesRef.current, cloudsRef.current);
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Update bird physics
    const bird = birdRef.current;
    bird.velocity += PHYSICS.GRAVITY;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 90);

    // Update clouds
    const clouds = cloudsRef.current;
    for (let i = clouds.length - 1; i >= 0; i--) {
      const cloud = clouds[i];
      cloud.x -= cloud.speed;
      
      // Remove clouds that are off screen and add new ones
      if (cloud.x + cloud.size < 0) {
        clouds.splice(i, 1);
        clouds.push({
          x: GAME.WIDTH + Math.random() * 200,
          y: Math.random() * (GAME.HEIGHT * 0.4) + 20,
          size: Math.random() * 30 + 20,
          speed: Math.random() * 0.5 + 0.2,
        });
      }
    }

    // Update pipes
    const pipes = pipesRef.current;
    for (let i = pipes.length - 1; i >= 0; i--) {
      const pipe = pipes[i];
      pipe.x -= PHYSICS.PIPE_SPEED;

      // Remove pipes that are off screen
      if (pipe.x + PHYSICS.PIPE_WIDTH < 0) {
        pipes.splice(i, 1);
        continue;
      }

      // Check if bird passed pipe
      if (!pipe.passed && bird.x > pipe.x + PHYSICS.PIPE_WIDTH) {
        pipe.passed = true;
        scoreRef.current += 1;
        onScoreUpdate(scoreRef.current);
      }
    }

    // Generate new pipes
    if (lastPipeXRef.current - pipes[pipes.length - 1]?.x >= PHYSICS.PIPE_SPAWN_DISTANCE || pipes.length === 0) {
      // Alternate gap size
      const currentGapSize = GAME.PIPE_GAP_VALUES[pipeGapIndexRef.current];
      pipeGapIndexRef.current = (pipeGapIndexRef.current + 1) % GAME.PIPE_GAP_VALUES.length;
      const newPipe = generatePipe(pipeIdRef.current++, lastPipeXRef.current, currentGapSize);
      pipes.push(newPipe);
      lastPipeXRef.current += PHYSICS.PIPE_SPAWN_DISTANCE;
    }

    // Check collisions
    if (checkCollision(bird, pipes)) {
      onGameOver();
      return;
    }

    // Render
    render(ctx, bird, pipes, clouds);

    // Continue game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isGameRunning, gameStarted, onGameOver, onScoreUpdate]);

  // Render function
  const render = (ctx: CanvasRenderingContext2D, bird: Bird, pipes: Pipe[], clouds: Cloud[]) => {
    const canvas = ctx.canvas;
    
    // Clear canvas with pre-created sky gradient
    if (skyGradientRef.current) {
      ctx.fillStyle = skyGradientRef.current;
    } else {
      // Fallback if gradient not ready
      ctx.fillStyle = COLORS.SKY_BLUE;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    ctx.fillStyle = COLORS.CLOUD_WHITE;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 5;
    clouds.forEach(cloud => {
      // Draw cloud as overlapping circles
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cloud.x + cloud.size * 0.4, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cloud.x - cloud.size * 0.4, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y - cloud.size * 0.3, cloud.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw small grass ground (reduced height)
    const grassHeight = 30; // Reduced from GAME.GROUND_HEIGHT (70)
    if (groundGradientRef.current) {
      ctx.fillStyle = groundGradientRef.current;
    } else {
      // Fallback if gradient not ready
      ctx.fillStyle = COLORS.GRASS_GREEN;
    }
    ctx.fillRect(0, canvas.height - grassHeight, canvas.width, grassHeight);
    
    // No grass details - just solid ground color

    // Draw pipes with gradient
    pipes.forEach(pipe => {
      // Use pre-created pipe gradient
      if (pipeGradientRef.current) {
        ctx.fillStyle = pipeGradientRef.current;
      } else {
        // Fallback if gradient not ready
        ctx.fillStyle = '#AEF359';
      }
      
      // Top pipe
      ctx.fillRect(pipe.x, 0, PHYSICS.PIPE_WIDTH, pipe.topHeight);
      // Bottom pipe
      ctx.fillRect(
        pipe.x,
        canvas.height - pipe.bottomHeight - 30, // Use reduced grass height
        PHYSICS.PIPE_WIDTH,
        pipe.bottomHeight
      );
      
      // Use pre-created pipe cap gradient
      if (capGradientRef.current) {
        ctx.fillStyle = capGradientRef.current;
      } else {
        // Fallback if gradient not ready
        ctx.fillStyle = '#C0F870';
      }
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, PHYSICS.PIPE_WIDTH + 10, 30);
      ctx.fillRect(
        pipe.x - 5,
        canvas.height - pipe.bottomHeight - 30, // Use reduced grass height
        PHYSICS.PIPE_WIDTH + 10,
        30
      );
    });

    // Draw bird
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate((bird.rotation * Math.PI) / 180);
    
    if (isBirdImageLoaded && birdImage) {
      // Draw the custom bird image
      // Adjust the x, y, width, and height based on your image's dimensions
      // and the desired size relative to PHYSICS.BIRD_SIZE
      const imageWidth = PHYSICS.BIRD_SIZE * 1.5; // Example: make image slightly larger
      const imageHeight = PHYSICS.BIRD_SIZE * 1.5; // Example: make image slightly larger
      ctx.drawImage(birdImage, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
    } else {
      // Fallback: Draw the default bird if image is not loaded
      if (birdGradientRef.current) {
        ctx.fillStyle = birdGradientRef.current;
      } else {
        ctx.fillStyle = '#fbbf24';
      }
      ctx.beginPath();
      ctx.arc(0, 0, PHYSICS.BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Bird glow effect (optional for fallback)
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, PHYSICS.BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Bird eye (optional for fallback)
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-5, -5, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Bird beak (optional for fallback)
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.moveTo(PHYSICS.BIRD_SIZE / 2 - 5, 0);
      ctx.lineTo(PHYSICS.BIRD_SIZE / 2 + 5, -2);
      ctx.lineTo(PHYSICS.BIRD_SIZE / 2 + 5, 2);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();

    // Draw score
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 3;
    ctx.strokeText(scoreRef.current.toString(), canvas.width / 2, 60);
    ctx.fillText(scoreRef.current.toString(), canvas.width / 2, 60);

    // Draw "Tap to Start" message if game hasn't started
    if (isLoadingAssets) {
      // Loading screen
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Loading spinner
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const time = Date.now() * 0.005;
      
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 20, 20, time, time + Math.PI * 1.5);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 2;
      const loadingText = 'LOADING ASSETS...';
      ctx.strokeText(loadingText, centerX, centerY + 30);
      ctx.fillText(loadingText, centerX, centerY + 30);
      
      ctx.font = 'bold 14px "Courier New", monospace';
      const subText = 'Preparing your bird';
      ctx.strokeText(subText, centerX, centerY + 55);
      ctx.fillText(subText, centerX, centerY + 55);
      // Loading screen with horizontal bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw horizontal bar in center
      const barWidth = 280;
      const barHeight = 70;
      
      // Draw the bar background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(centerX - barWidth / 2, centerY - barHeight / 2, barWidth, barHeight);
      
      // Draw the bar border
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 3;
      ctx.strokeRect(centerX - barWidth / 2, centerY - barHeight / 2, barWidth, barHeight);
      
      // Draw "Tap to Start" text centered in the bar
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Tap to Start', centerX, centerY + 8);
    } else if (!gameStarted) {
      // Add semi-transparent background for better readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(canvas.width / 2 - 120, canvas.height / 2 + 20, 240, 60);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 2;
      const startText = 'TAP TO START';
      ctx.strokeText(startText, canvas.width / 2, canvas.height / 2 + 50);
      ctx.fillText(startText, canvas.width / 2, canvas.height / 2 + 50);
    }

    // Draw multiplier indicator if this is a multiplier game
    if (shouldSpawnMultiplier) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      const multiplierText = `${REWARDS.MULTIPLIER_VALUE}x Multiplier Round`;
      ctx.strokeText(multiplierText, canvas.width / 2, 100);
      ctx.fillText(multiplierText, canvas.width / 2, 100);
    }
  };

  // Initialize game when component mounts or when game starts
  useEffect(() => {
    if (isGameRunning && !gameInitialized) {
      initializeGame();
      setGameStarted(false); // Reset game started state
    }
  }, [isGameRunning, gameInitialized, initializeGame]);

  // Start game loop when game is running
  useEffect(() => {
    if (isGameRunning && gameInitialized) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isGameRunning, gameInitialized, gameLoop]);

  // Reset game initialization when game stops
  useEffect(() => {
    if (!isGameRunning) {
      setGameInitialized(false);
      setGameStarted(false);
    }
  }, [isGameRunning]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 p-2 sm:p-4">
      <canvas
        ref={canvasRef}
        width={GAME.WIDTH}
        height={GAME.HEIGHT}
        className={`border-2 sm:border-4 border-white rounded-lg shadow-2xl max-w-full ${isLoadingAssets ? 'cursor-wait' : 'cursor-pointer'}`}
        style={{ 
          maxWidth: '100vw', 
          maxHeight: '70vh',
          width: 'auto',
          height: 'auto'
        }}
      />
      <div className="mt-2 sm:mt-4 text-white text-center px-4">
        <p className="text-sm sm:text-lg font-semibold">
          {isLoadingAssets ? 'Loading your bird...' : !gameStarted ? 'Tap to start flying!' : 'Tap to keep flying!'}
        </p>
      </div>
    </div>
  );
};