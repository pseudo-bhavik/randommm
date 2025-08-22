import { NextApiRequest, NextApiResponse } from 'next';
import { encodeFunctionData, parseEther } from 'viem';
import { FLAPPY_ARB_DISTRIBUTOR_ABI, CONTRACT_ADDRESSES } from '../src/contracts/FlappyArbDistributor';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface FarcasterFrameData {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: number;
    castId: {
      fid: number;
      hash: string;
    };
    address?: string;
  };
  trustedData: {
    messageBytes: string;
  };
}

interface TransactionRequest {
  chainId: string;
  method: string;
  params: {
    abi: any[];
    to: string;
    data?: string;
    value?: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(200).end();
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse the Farcaster frame data
    const frameData: FarcasterFrameData = req.body;
    
    // Validate frame data structure
    if (!frameData.untrustedData || !frameData.trustedData) {
      return res.status(400).json({ error: 'Invalid frame data' });
    }

    // Extract user address from frame data
    const userAddress = frameData.untrustedData.address;
    if (!userAddress) {
      return res.status(400).json({ error: 'User address not found in frame data' });
    }

    // Parse URL to extract game data
    const { score: scoreParam, multiplier: multiplierParam } = req.query;
    const score = parseInt(scoreParam as string || '0');
    const multiplier = parseInt(multiplierParam as string || '1');
    
    if (score <= 0) {
      return res.status(400).json({ error: 'Invalid score data' });
    }

    // Generate a unique game session ID for this transaction
    const gameSessionId = `farcaster_${frameData.untrustedData.fid}_${frameData.untrustedData.timestamp}_${Date.now()}`;

    // Request signature from the sign-claim function
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Call the sign-claim function to get the signature
    const signResponse = await fetch(`${supabaseUrl}/functions/v1/sign-claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        playerAddress: userAddress,
        score,
        multiplier,
        gameSessionId,
        contractAddress: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR,
      }),
    });

    if (!signResponse.ok) {
      const errorData = await signResponse.json().catch(() => ({}));
      console.error('Sign-claim error:', errorData);
      return res.status(500).json({ error: 'Failed to authorize claim' });
    }

    const signData = await signResponse.json();
    
    if (!signData.success || !signData.signature || !signData.amount) {
      return res.status(500).json({ error: signData.error || 'Failed to get signature' });
    }

    // Convert gameSessionId to bytes32 (keccak256 hash)
    const gameSessionIdBytes32 = `0x${Buffer.from(gameSessionId).toString('hex').padStart(64, '0')}`;

    // Encode the contract function call
    const contractCallData = encodeFunctionData({
      abi: FLAPPY_ARB_DISTRIBUTOR_ABI,
      functionName: 'claimReward',
      args: [
        userAddress as `0x${string}`,
        BigInt(signData.amount),
        BigInt(score),
        BigInt(multiplier),
        gameSessionIdBytes32 as `0x${string}`,
        signData.signature as `0x${string}`,
      ],
    });

    // Construct the transaction request for Farcaster
    const transactionRequest: TransactionRequest = {
      chainId: `eip155:${process.env.NODE_ENV === 'production' ? '42161' : '11155111'}`, // Arbitrum mainnet or Sepolia testnet
      method: 'eth_sendTransaction',
      params: {
        abi: FLAPPY_ARB_DISTRIBUTOR_ABI,
        to: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR,
        data: contractCallData,
        value: '0', // No ETH value needed for this transaction
      },
    };

    return res.status(200).json(transactionRequest);

  } catch (error) {
    console.error('Error in flappy-frame-tx:', error);
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}