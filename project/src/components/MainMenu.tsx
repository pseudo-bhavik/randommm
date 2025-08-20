import React from 'react';
import { Play, Coins, Zap, Info } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  remainingPlays: number;
  maxPlays: number;
  bestScore: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, remainingPlays, maxPlays, bestScore }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 overflow-y-auto">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="flying-bird-bg">
          <div className="w-8 h-8 bg-yellow-400 rounded-full shadow-md"></div>
        </div>
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-16 h-16 bg-purple-300/20 rounded-full animate-bounce"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen p-4 pt-8">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2 tracking-wide">
            Flappy <span className="text-yellow-400">Arb</span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-200">Earn $FLAPPY tokens while you play!</p>
        </div>

        {/* Best Score Display */}
        <div className="mb-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-white text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                <span className="text-yellow-900 font-bold text-lg">★</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">Best Score - {bestScore}</h3>
            </div>
            <div className="text-base sm:text-lg text-purple-200">
              Plays remaining today: {remainingPlays} / {maxPlays}
            </div>
          </div>
        </div>
        
        {/* Game Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mb-6">
          {/* How to Play */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-white">
            <div className="flex items-center mb-4">
              <Info className="w-6 h-6 mr-2 text-blue-300" />
              <h3 className="text-lg sm:text-xl font-bold">How to Play</h3>
            </div>
            <ul className="space-y-2 text-sm sm:text-base text-purple-200">
              <li>• Click or press spacebar to make the bird jump</li>
              <li>• Navigate through pipe gaps to score points</li>
              <li>• Avoid collisions with pipes or ground</li>
              <li>• Passing pipes: +1 point each</li> {/* Updated scoring explanation */}
            </ul>
          </div>

          {/* Power-ups & Rewards */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-white">
            <div className="flex items-center mb-4">
              <Zap className="w-6 h-6 mr-2 text-yellow-300" />
              <h3 className="text-lg sm:text-xl font-bold">Power-ups & Rewards</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm sm:text-base">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-purple-200">Score points by passing pipes</span>
              </div>
              <div className="flex items-center space-x-2 text-sm sm:text-base">
                <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center text-xs font-bold">3x</div>
                <span className="text-purple-200">3x Multiplier Orb</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20 text-sm">
                <span className="text-yellow-300">$FLAPPY = Score × Multiplier × 50</span>
              </div>
              <div className="mt-2 text-sm text-purple-200">
                <span className="text-blue-300">Every 5th game:</span> Special multiplier orb & coin guaranteed!
              </div>
            </div>
          </div>
        </div>

        {/* Play Button */}
        <div className="mb-8">
          {remainingPlays > 0 ? (
            <button
              onClick={onStartGame}
              className="group bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-lg sm:text-xl shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <div className="flex items-center space-x-3">
                <Play className="w-6 h-6 group-hover:animate-pulse" />
                <span>Launch Bird</span>
              </div>
            </button>
          ) : (
            <div className="bg-gray-600 text-gray-300 font-bold py-4 px-8 rounded-full text-xl shadow-xl cursor-not-allowed">
              <div className="flex items-center space-x-3">
                <Play className="w-6 h-6 opacity-50" />
                <span>Daily Limit Reached</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Branding Footer */}
        <div className="text-center pb-4">
          <div className="text-white/80 text-sm space-y-1">
            <div>Built on Farcaster</div>
            <div>Powered by Arbitrum</div>
          </div>
        </div>
      </div>
      <style>{`
        .flying-bird-bg {
          position: absolute;
          top: 20%;
          left: -50px;
          animation: flyAcross 8s linear infinite;
        }
        
        .arb-logo-flick {
          animation: flick 4s ease-in-out infinite;
        }
        
        @keyframes flyAcross {
          0% { 
            transform: translateX(-50px) translateY(0px) rotate(-10deg);
          }
          25% { 
            transform: translateX(25vw) translateY(-20px) rotate(5deg);
          }
          50% { 
            transform: translateX(50vw) translateY(-10px) rotate(-5deg);
          }
          75% { 
            transform: translateX(75vw) translateY(-30px) rotate(10deg);
          }
          100% { 
            transform: translateX(calc(100vw + 50px)) translateY(0px) rotate(-10deg);
          }
        }
      `}</style>
    </div>
  );
};