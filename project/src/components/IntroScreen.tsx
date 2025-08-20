import React, { useEffect } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-purple-300 rounded-full animate-bounce delay-100"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-blue-300 rounded-full animate-ping delay-200"></div>
      </div>

      {/* Flying Bird Animation */}
      <div className="relative">
        <div className="bird-flight">
          <div className="w-16 h-16 bg-yellow-400 rounded-full relative shadow-lg">
            <div className="absolute top-2 left-2 w-3 h-3 bg-black rounded-full"></div>
            <div className="absolute -right-2 top-1 w-8 h-6 bg-orange-500 rounded-full transform rotate-12"></div>
          </div>
        </div>

        {/* Game Title */}
        <div className="mt-12 text-center mb-24">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-wide">
            Flappy <span className="text-yellow-400">Arb</span>
          </h1>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
      
      {/* Branding Footer */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center z-20">
        <div className="text-white/80 text-sm space-y-1">
          <div>Built on Farcaster</div>
          <div>Powered by Arbitrum</div>
        </div>
      </div>

      <style>{`
        .bird-flight {
          animation: fly 2s ease-in-out infinite;
        }
        
        .arb-logo-flick {
          animation: flick 3s ease-in-out infinite;
        }
        
        @keyframes fly {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          25% { transform: translateY(-15px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
          75% { transform: translateY(-20px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};