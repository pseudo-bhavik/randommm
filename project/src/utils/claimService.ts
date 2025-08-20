import { CONTRACT_ADDRESSES } from '../contracts/FlappyArbDistributor';

export interface SignClaimRequest {
  playerAddress: string;
  score: number;
  multiplier: number;
  gameSessionId: string;
  contractAddress: string;
}

export interface SignClaimResponse {
  success: boolean;
  signature?: string;
  amount?: number;
  error?: string;
}

export const requestClaimSignature = async (
  playerAddress: string,
  score: number,
  multiplier: number,
  gameSessionId: string
): Promise<SignClaimResponse> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/sign-claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        playerAddress,
        score,
        multiplier,
        gameSessionId,
        contractAddress: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR,
      } as SignClaimRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: SignClaimResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get signature');
    }

    return data;
  } catch (error) {
    console.error('Error requesting claim signature:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const generateGameSessionId = (): string => {
  // Generate a unique game session ID using timestamp and random values
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `game_${timestamp}_${random}`;
};