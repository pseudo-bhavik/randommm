import React, { useState } from 'react';
import { Trophy, Zap, ArrowLeft, ExternalLink, RotateCcw, Home } from 'lucide-react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { calculateTokenReward } from '../utils/gameUtils';
import { useFlappyArbContract, useContractReads } from '../hooks/useContract';
import { requestClaimSignature, generateGameSessionId } from '../utils/claimService';
import { CONTRACT_CONFIG } from '../contracts/FlappyArbDistributor';

interface GameOverScreenProps {
  score: number;
  multiplier: number;
  remainingPlays: number;
  onBackToMenu: () => void;
  onPlayAgain: () => void; // New prop for playing again
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  multiplier,
  remainingPlays,
  onBackToMenu,
  onPlayAgain,
}) => {
  const [isClaimingTokens, setIsClaimingTokens] = useState(false);
  const [tokensClaimed, setTokensClaimed] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  
  // Contract hooks
  const { claimReward, hash, isPending: isContractPending, isConfirming, isConfirmed, error: contractError } = useFlappyArbContract();
  const { dailyClaims, maxClaimsPerDay } = useContractReads(address);
  
  const totalTokens = calculateTokenReward(score, multiplier);
  
  // Check if user has reached daily claim limit
  const hasReachedDailyLimit = dailyClaims >= maxClaimsPerDay;
  
  // Generate a unique game session ID for this claim
  const gameSessionId = React.useMemo(() => generateGameSessionId(), []);
  
  // Watch for transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && hash) {
      setTokensClaimed(true);
      setTransactionHash(hash);
      setIsClaimingTokens(false);
    }
  }, [isConfirmed, hash]);
  
  // Handle contract errors
  React.useEffect(() => {
    if (contractError) {
      setClaimError(contractError.message || 'Transaction failed');
      setIsClaimingTokens(false);
    }
  }, [contractError]);
  
  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    
    try {
      // Try Farcaster MiniApp connector first
      const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp');
      if (farcasterConnector) {
        await connect({ connector: farcasterConnector });
      } else {
        // Fall back to injected connector
        const injectedConnector = connectors.find(c => c.id === 'injected');
        if (injectedConnector) {
          await connect({ connector: injectedConnector });
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnectingWallet(false);
    }
  };
  
  const handleClaimTokens = async () => {
    // If wallet is not connected, connect first
    if (!isConnected) {
      await handleConnectWallet();
      return;
    }
    
    // Check daily limit
    if (hasReachedDailyLimit) {
      setClaimError('Daily claim limit reached. Try again tomorrow.');
      return;
    }
    
    // Reset any previous errors
    setClaimError(null);
    setIsClaimingTokens(true);
    
    try {
      // Step 1: Request signature from backend
      const signatureResponse = await requestClaimSignature(
        address!,
        score,
        multiplier,
        gameSessionId
      );
      
      if (!signatureResponse.success || !signatureResponse.signature) {
        throw new Error(signatureResponse.error || 'Failed to get signature from server');
      }
      
      // Step 2: Call smart contract with the signature
      await claimReward({
        playerAddress: address!,
        amount: BigInt(signatureResponse.amount || totalTokens),
        score,
        multiplier,
        gameSessionId,
        signature: signatureResponse.signature as `0x${string}`,
      });
      
      // Transaction is now pending, waiting for confirmation...
      // The useEffect above will handle success/error states
      
    } catch (error) {
      console.error('Error claiming tokens:', error);
      setClaimError(error instanceof Error ? error.message : 'Failed to claim tokens');
      setIsClaimingTokens(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
          <p className="text-gray-600">Here's how you performed</p>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Base Score</span>
              <span className="text-xl font-bold text-blue-600">{score}</span>
            </div>
            
            {multiplier > 1 && (
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-red-500" />
                  <span className="text-gray-700 font-medium">Multiplier</span>
                </div>
                <span className="text-xl font-bold text-red-600">{multiplier}x</span>
              </div>
            )}
            
            <div className="border-t pt-2 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-bold">Total $SMOL Tokens</span>
                <span className="text-2xl font-bold text-green-600">{totalTokens.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Token Claim Section */}
        {!tokensClaimed && !transactionHash ? (
          <div className="mb-6">
            {/* Error Display */}
            {claimError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-800 text-sm font-medium">Error</span>
                </div>
                <p className="text-red-700 text-xs mt-1">{claimError}</p>
              </div>
            )}
            
            {/* Daily Limit Warning */}
            {hasReachedDailyLimit && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-800 text-sm font-medium">Daily Limit Reached</span>
                </div>
                <p className="text-yellow-700 text-xs mt-1">
                  You've claimed {dailyClaims}/{maxClaimsPerDay} times today. Try again tomorrow!
                </p>
              </div>
            )}
            
            {/* Wallet Connection Status */}
            {isConnected && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 text-sm font-medium">Wallet Connected</span>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="text-green-600 hover:text-green-800 text-xs underline"
                  >
                    Disconnect
                  </button>
                </div>
                <p className="text-green-700 text-xs mt-1">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                </p>
              </div>
            )}
            
            <button
              onClick={handleClaimTokens}
              disabled={isClaimingTokens || isConnectingWallet || totalTokens === 0 || hasReachedDailyLimit || isContractPending || isConfirming}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isConnectingWallet ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting Wallet...</span>
                </div>
              ) : isClaimingTokens || isContractPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing Transaction...</span>
                </div>
              ) : isConfirming ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Confirming Transaction...</span>
                </div>
              ) : totalTokens === 0 ? (
                <span>No Tokens to Claim</span>
              ) : hasReachedDailyLimit ? (
                <span>Daily Limit Reached</span>
              ) : !isConnected ? (
                <div className="flex items-center justify-center space-x-2">
                  <ExternalLink className="w-5 h-5" />
                  <span>Connect Wallet & Claim {totalTokens.toLocaleString()} $SMOL</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <ExternalLink className="w-5 h-5" />
                  <span>Claim {totalTokens.toLocaleString()} $SMOL Tokens</span>
                </div>
              )}
            </button>
            
            {totalTokens > 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">
                {!isConnected 
                  ? 'Connect your wallet to claim tokens' 
                  : hasReachedDailyLimit 
                    ? 'You have reached your daily claim limit'
                    : "You'll only pay gas fees. Tokens are the rewards!"
                }
              </p>
            )}
          </div>
        ) : (
          <div className="mb-6 text-center">
            <div className="bg-green-100 border border-green-400 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-2 text-green-800">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="font-medium">Tokens Successfully Claimed!</span>
              </div>
              <p className="text-green-700 text-sm mt-2">
                {totalTokens.toLocaleString()} $SMOL tokens have been added to your wallet.
              </p>
              {transactionHash && (
                <a
                  href={`${CONTRACT_CONFIG.BLOCK_EXPLORER_URL}/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 text-xs underline mt-2 inline-block"
                >
                  View Transaction ↗
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 mb-24">
          {remainingPlays > 0 && (tokensClaimed || totalTokens === 0 || hasReachedDailyLimit) && (
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          )}
          
          {/* Always show "Go to Home Page" button */}
          <button
            onClick={onBackToMenu}
            className={`flex-1 ${remainingPlays > 0 && (tokensClaimed || totalTokens === 0 || hasReachedDailyLimit) ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2`}
          >
            <Home className="w-4 h-4" />
            <span>Go to Home Page</span>
          </button>
        </div>
        
        {/* Branding Footer */}
        <div className="text-center mt-4 pt-3 border-t border-gray-200">
          <div className="text-gray-500 text-sm space-y-1">
            <div>Built on Farcaster</div>
            <div>Powered by Arbitrum</div>
          </div>
        </div>
      </div>
    </div>
  );
};