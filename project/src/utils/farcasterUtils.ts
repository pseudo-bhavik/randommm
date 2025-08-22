// Utility functions for Farcaster Mini-App integration

export function generateFarcasterShareUrl(text: string): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
}

export function generateShareText(score: number, multiplier: number, totalTokens: number): string {
  const multiplierText = multiplier > 1 ? ` with a ${multiplier}x multiplier` : '';
  return `Just scored ${score} points in Flappy Arb${multiplierText}! 🎮\n\nEarned ${totalTokens.toLocaleString()} $FLAPPY tokens on @arbitrum! 🪙\n\nPlay now in the Flappy Arb Mini-App! 🚀`;
}