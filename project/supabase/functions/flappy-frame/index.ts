import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ethers } from "npm:ethers@6.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Contract ABI for encoding function calls
const FLAPPY_ARB_DISTRIBUTOR_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_player", "type": "address"},
      {"internalType": "uint256", "name": "_amount", "type": "uint256"},
      {"internalType": "uint256", "name": "_score", "type": "uint256"},
      {"internalType": "uint256", "name": "_multiplier", "type": "uint256"},
      {"internalType": "bytes32", "name": "_gameSessionId", "type": "bytes32"},
      {"internalType": "bytes", "name": "_signature", "type": "bytes"}
    ],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Contract addresses - these should match your deployed contracts
const CONTRACT_ADDRESSES = {
  FLAPPY_ARB_DISTRIBUTOR: '0x6126489b4c0CA5f4D4EFC85D753F7C5cfAf4adF4', // Update with your actual address
};

interface FrameActionBody {
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
  inputText?: string;
  state?: string;
  transactionId?: string;
  address?: string;
}

interface FrameRequest {
  untrustedData: FrameActionBody;
  trustedData: {
    messageBytes: string;
  };
}

// Generate game session ID
function generateGameSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `frame_${timestamp}_${random}`;
}

// Calculate token reward
function calculateTokenReward(score: number, multiplier: number): number {
  const TOKEN_MULTIPLIER = 50;
  return Math.floor(score * multiplier * TOKEN_MULTIPLIER);
}

// Generate initial Frame HTML
function generateInitialFrame(): string {
  const baseUrl = Deno.env.get('SUPABASE_URL') || 'https://your-project.supabase.co';
  const frameUrl = `${baseUrl}/functions/v1/flappy-frame`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Flappy Arb - Earn $FLAPPY Tokens</title>
    
    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/functions/v1/flappy-frame/image?type=welcome" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:button:1" content="🎮 Play Flappy Arb" />
    <meta property="fc:frame:button:1:action" content="post_redirect" />
    <meta property="fc:frame:post_url" content="${frameUrl}" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Flappy Arb - Earn $FLAPPY Tokens" />
    <meta property="og:description" content="Play Flappy Arb and earn $FLAPPY tokens on Arbitrum!" />
    <meta property="og:image" content="${baseUrl}/functions/v1/flappy-frame/image?type=welcome" />
    
    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Flappy Arb - Earn $FLAPPY Tokens" />
    <meta name="twitter:description" content="Play Flappy Arb and earn $FLAPPY tokens on Arbitrum!" />
    <meta name="twitter:image" content="${baseUrl}/functions/v1/flappy-frame/image?type=welcome" />
</head>
<body>
    <h1>Flappy Arb</h1>
    <p>Play Flappy Arb and earn $FLAPPY tokens on the Arbitrum blockchain!</p>
    <p>Navigate through pipes, collect power-ups, and get rewarded for your skills.</p>
</body>
</html>`;
}

// Generate claim Frame HTML
function generateClaimFrame(score: number, multiplier: number, userAddress: string): string {
  const baseUrl = Deno.env.get('SUPABASE_URL') || 'https://your-project.supabase.co';
  const frameUrl = `${baseUrl}/functions/v1/flappy-frame`;
  const totalTokens = calculateTokenReward(score, multiplier);
  
  // Encode state for the claim transaction
  const state = btoa(JSON.stringify({ score, multiplier, userAddress }));
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Flappy Arb - Claim Your Tokens</title>
    
    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/functions/v1/flappy-frame/image?type=claim&score=${score}&multiplier=${multiplier}&tokens=${totalTokens}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:button:1" content="🪙 Claim ${totalTokens.toLocaleString()} $FLAPPY" />
    <meta property="fc:frame:button:1:action" content="tx" />
    <meta property="fc:frame:button:1:target" content="${frameUrl}/tx" />
    <meta property="fc:frame:button:2" content="🎮 Play Again" />
    <meta property="fc:frame:button:2:action" content="post_redirect" />
    <meta property="fc:frame:post_url" content="${frameUrl}" />
    <meta property="fc:frame:state" content="${state}" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Flappy Arb - Claim Your Tokens" />
    <meta property="og:description" content="Score: ${score} | Multiplier: ${multiplier}x | Tokens: ${totalTokens.toLocaleString()} $FLAPPY" />
    <meta property="og:image" content="${baseUrl}/functions/v1/flappy-frame/image?type=claim&score=${score}&multiplier=${multiplier}&tokens=${totalTokens}" />
</head>
<body>
    <h1>Congratulations!</h1>
    <p>Score: ${score}</p>
    <p>Multiplier: ${multiplier}x</p>
    <p>Total $FLAPPY Tokens: ${totalTokens.toLocaleString()}</p>
</body>
</html>`;
}

// Generate success Frame HTML
function generateSuccessFrame(): string {
  const baseUrl = Deno.env.get('SUPABASE_URL') || 'https://your-project.supabase.co';
  const frameUrl = `${baseUrl}/functions/v1/flappy-frame`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Flappy Arb - Tokens Claimed!</title>
    
    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/functions/v1/flappy-frame/image?type=success" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:button:1" content="🎮 Play Again" />
    <meta property="fc:frame:button:1:action" content="post_redirect" />
    <meta property="fc:frame:post_url" content="${frameUrl}" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Flappy Arb - Tokens Claimed!" />
    <meta property="og:description" content="Successfully claimed $FLAPPY tokens! Play again to earn more." />
    <meta property="og:image" content="${baseUrl}/functions/v1/flappy-frame/image?type=success" />
</head>
<body>
    <h1>Success!</h1>
    <p>Your $FLAPPY tokens have been claimed successfully!</p>
    <p>Play again to earn more tokens.</p>
</body>
</html>`;
}

// Request signature from sign-claim function
async function requestSignature(playerAddress: string, score: number, multiplier: number, gameSessionId: string): Promise<{signature: string, amount: string}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  // Add debugging logs
  console.log('DEBUG: Supabase URL:', supabaseUrl);
  console.log('DEBUG: Supabase Anon Key (first 10 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'N/A');
  console.log('DEBUG: Request payload:', { playerAddress, score, multiplier, gameSessionId });
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERROR: Missing Supabase configuration - URL:', !!supabaseUrl, 'Key:', !!supabaseAnonKey);
    throw new Error('Supabase configuration missing');
  }

  console.log('DEBUG: Making request to sign-claim function...');
  const response = await fetch(`${supabaseUrl}/functions/v1/sign-claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      playerAddress,
      score,
      multiplier,
      gameSessionId,
      contractAddress: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR,
    }),
  });

  console.log('DEBUG: Response status:', response.status);
  console.log('DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('ERROR: Failed to get signature - Status:', response.status, 'Response:', errorText);
    throw new Error(`Failed to get signature: ${response.status}`);
  }

  const data = await response.json();
  console.log('DEBUG: Sign-claim response success:', data.success);
  
  if (!data.success) {
    console.error('ERROR: Sign-claim returned failure:', data.error);
    throw new Error(data.error || 'Failed to get signature');
  }

  console.log('DEBUG: Successfully obtained signature');
  return {
    signature: data.signature,
    amount: data.amount,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
      status: 200
    });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    // Handle image generation endpoint
    if (pathname.includes('/image')) {
      const type = url.searchParams.get('type') || 'welcome';
      const score = url.searchParams.get('score') || '0';
      const multiplier = url.searchParams.get('multiplier') || '1';
      const tokens = url.searchParams.get('tokens') || '0';

      // Generate SVG image based on type
      let svg = '';
      
      if (type === 'welcome') {
        svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="200" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">Flappy Arb</text>
  <text x="600" y="280" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" fill="#fbbf24">Earn $FLAPPY Tokens</text>
  <text x="600" y="350" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">Navigate through pipes and earn rewards!</text>
  <text x="600" y="450" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#a78bfa">Built on Farcaster • Powered by Arbitrum</text>
  <circle cx="600" cy="520" r="40" fill="#fbbf24"/>
  <circle cx="590" cy="510" r="5" fill="black"/>
  <polygon points="640,520 660,515 660,525" fill="#ff8c00"/>
</svg>`;
      } else if (type === 'claim') {
        svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#34d399;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="150" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">Game Complete!</text>
  <text x="600" y="220" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" fill="white">Score: ${score}</text>
  <text x="600" y="280" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" fill="white">Multiplier: ${multiplier}x</text>
  <text x="600" y="380" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#fbbf24">${Number(tokens).toLocaleString()} $FLAPPY</text>
  <text x="600" y="450" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">Ready to claim your tokens!</text>
  <circle cx="600" cy="520" r="30" fill="#fbbf24"/>
  <text x="600" y="530" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="black">🪙</text>
</svg>`;
      } else if (type === 'success') {
        svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="200" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">Success!</text>
  <text x="600" y="300" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" fill="#fbbf24">Tokens Claimed Successfully</text>
  <text x="600" y="400" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">Play again to earn more $FLAPPY tokens!</text>
  <circle cx="600" cy="500" r="40" fill="#22c55e"/>
  <text x="600" y="515" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" fill="white">✓</text>
</svg>`;
      }

      return new Response(svg, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Handle transaction endpoint
    if (pathname.includes('/tx')) {
      if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      const frameRequest: FrameRequest = await req.json();
      const { untrustedData } = frameRequest;

      // Decode state to get game data
      if (!untrustedData.state) {
        throw new Error('Missing state data');
      }

      const stateData = JSON.parse(atob(untrustedData.state));
      const { score, multiplier, userAddress } = stateData;

      // Generate game session ID
      const gameSessionId = generateGameSessionId();

      // Get signature from sign-claim function
      const { signature, amount } = await requestSignature(userAddress, score, multiplier, gameSessionId);

      // Convert gameSessionId to bytes32
      const gameSessionIdBytes32 = ethers.id(gameSessionId);

      // Encode the claimReward function call
      const contractInterface = new ethers.Interface(FLAPPY_ARB_DISTRIBUTOR_ABI);
      const encodedData = contractInterface.encodeFunctionData('claimReward', [
        userAddress,
        amount,
        score,
        multiplier,
        gameSessionIdBytes32,
        signature,
      ]);

      // Return transaction data
      const txData = {
        chainId: `eip155:42161`, // Arbitrum mainnet
        method: 'eth_sendTransaction',
        params: {
          abi: FLAPPY_ARB_DISTRIBUTOR_ABI,
          to: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR,
          data: encodedData,
          value: '0',
        },
      };

      return new Response(JSON.stringify(txData), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // Handle main Frame endpoint
    if (req.method === 'GET') {
      // Check for score and multiplier parameters (coming from game)
      const score = url.searchParams.get('score');
      const multiplier = url.searchParams.get('multiplier');
      const userAddress = url.searchParams.get('address');

      if (score && multiplier && userAddress) {
        // Generate claim frame
        const html = generateClaimFrame(parseInt(score), parseInt(multiplier), userAddress);
        return new Response(html, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html',
          },
        });
      }

      // Generate initial frame
      const html = generateInitialFrame();
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
        },
      });
    }

    if (req.method === 'POST') {
      const frameRequest: FrameRequest = await req.json();
      const { untrustedData } = frameRequest;

      // Handle different button actions
      if (untrustedData.buttonIndex === 1) {
        // "Play Flappy Arb" or "Claim Tokens" button
        if (untrustedData.state) {
          // This is a claim action, but it should be handled by the /tx endpoint
          // If we reach here, something went wrong
          throw new Error('Invalid claim action');
        } else {
          // Redirect to the main game
          const gameUrl = 'https://flappy-arb.vercel.app/'; // Update with your actual game URL
          return new Response('', {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': gameUrl,
            },
          });
        }
      } else if (untrustedData.buttonIndex === 2) {
        // "Play Again" button - redirect to game
        const gameUrl = 'https://flappy-arb.vercel.app/'; // Update with your actual game URL
        return new Response('', {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': gameUrl,
          },
        });
      }

      // Default: show initial frame
      const html = generateInitialFrame();
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
        },
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    console.error('Error in flappy-frame function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});