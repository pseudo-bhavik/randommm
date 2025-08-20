import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHash } from "https://deno.land/std@0.177.0/node/crypto.ts"

// Import ethers for signing (using npm: specifier)
import { ethers } from "npm:ethers@6.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface ClaimRequest {
  playerAddress: string
  score: number
  multiplier: number
  gameSessionId: string
  contractAddress: string
}

interface ClaimResponse {
  success: boolean
  signature?: string
  amount?: number
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const body: ClaimRequest = await req.json()
    const { playerAddress, score, multiplier, gameSessionId, contractAddress } = body

    // Validate input
    if (!playerAddress || !ethers.isAddress(playerAddress)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid player address' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid contract address' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (typeof score !== 'number' || score < 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid score' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (typeof multiplier !== 'number' || multiplier < 1) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid multiplier' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!gameSessionId || typeof gameSessionId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid game session ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the private key from environment variables
    const privateKey = Deno.env.get('GAME_SERVER_PRIVATE_KEY')
    if (!privateKey) {
      console.error('GAME_SERVER_PRIVATE_KEY environment variable not set')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Calculate token amount (same logic as frontend)
    const TOKEN_MULTIPLIER = 50
    const amount = BigInt(Math.floor(score * multiplier * TOKEN_MULTIPLIER))

    // Convert gameSessionId to bytes32
    const gameSessionIdBytes32 = ethers.id(gameSessionId)

    // Create the message hash that matches the contract's expectation
    // This must match exactly what the contract expects in claimReward function
    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'uint256', 'bytes32', 'address'],
      [playerAddress, amount, score, multiplier, gameSessionIdBytes32, contractAddress]
    )

    // Create wallet instance for signing
    const wallet = new ethers.Wallet(privateKey)

    // Sign the message hash
    const signature = await wallet.signMessage(ethers.getBytes(messageHash))

    // Return the signature and calculated amount
    const response: ClaimResponse = {
      success: true,
      signature,
      amount: Number(amount), // Convert back to number for frontend
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in sign-claim function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})