import { NextApiRequest, NextApiResponse } from 'next';
import { generateFrameHtml } from '../../src/utils/farcasterUtils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://flappy-arb.vercel.app/'; // Replace with your actual domain

    if (req.method === 'GET') {
      // Handle initial frame display
      const { score, multiplier, address } = req.query;

      let frameContent;

      if (score && multiplier && address) {
        // Show game results frame with claim button
        const gameScore = parseInt(score as string) || 0;
        const gameMultiplier = parseInt(multiplier as string) || 1;
        const totalTokens = Math.floor(gameScore * gameMultiplier * 50); // TOKEN_MULTIPLIER = 50

        frameContent = {
          title: `Flappy Arb - ${gameScore} Points Scored!`,
          description: `Earned ${totalTokens.toLocaleString()} $FLAPPY tokens${gameMultiplier > 1 ? ` with ${gameMultiplier}x multiplier` : ''}!`,
          image: `${baseUrl}/api/frame/image?score=${gameScore}&multiplier=${gameMultiplier}&tokens=${totalTokens}`,
          buttons: [
            {
              text: `Claim ${totalTokens.toLocaleString()} $FLAPPY`,
              action: 'tx' as const,
              target: `${baseUrl}/api/flappy-frame-tx?score=${gameScore}&multiplier=${gameMultiplier}&address=${address}`,
            },
            {
              text: 'Play Game',
              action: 'post_redirect' as const,
              target: baseUrl,
            }
          ],
          postUrl: `${baseUrl}/api/frame`,
          state: JSON.stringify({ score: gameScore, multiplier: gameMultiplier, address }),
        };
      } else {
        // Show initial welcome frame
        frameContent = {
          title: 'Flappy Arb - Earn $FLAPPY Tokens!',
          description: 'Play Flappy Arb and earn $FLAPPY tokens on Arbitrum. Navigate through pipes and get rewarded!',
          image: `${baseUrl}/api/frame/image?welcome=true`,
          buttons: [
            {
              text: 'Play Game',
              action: 'post_redirect' as const,
              target: baseUrl,
            }
          ],
          postUrl: `${baseUrl}/api/frame`,
        };
      }

      const html = generateFrameHtml(frameContent);
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);

    } else if (req.method === 'POST') {
      // Handle frame interactions
      const frameData: FarcasterFrameData = req.body;

      // Validate frame data
      if (!frameData.untrustedData || !frameData.trustedData) {
        return res.status(400).json({ error: 'Invalid frame data' });
      }

      const buttonIndex = frameData.untrustedData.buttonIndex;
      const url = new URL(frameData.untrustedData.url);

      // Parse current state from URL or frame state
      const score = parseInt(url.searchParams.get('score') || '0');
      const multiplier = parseInt(url.searchParams.get('multiplier') || '1');
      const address = url.searchParams.get('address') || frameData.untrustedData.address;

      let responseFrame;

      if (buttonIndex === 1) {
        if (score > 0 && address) {
          // User clicked "Claim Tokens" - this should be handled by the tx endpoint
          // Return a confirmation frame
          const totalTokens = Math.floor(score * multiplier * 50);
          
          responseFrame = {
            title: 'Flappy Arb - Transaction Initiated',
            description: `Claiming ${totalTokens.toLocaleString()} $FLAPPY tokens...`,
            image: `${baseUrl}/api/frame/image?claiming=true&tokens=${totalTokens}`,
            buttons: [
              {
                text: 'Play Again',
                action: 'post_redirect' as const,
                target: baseUrl,
              }
            ],
            postUrl: `${baseUrl}/api/frame`,
          };
        } else {
          // User clicked "Play Game" from welcome frame
          // Redirect to the main game
          return res.status(302).setHeader('Location', baseUrl).end();
        }
      } else if (buttonIndex === 2) {
        // User clicked "Play Game" from results frame
        return res.status(302).setHeader('Location', baseUrl).end();
      } else {
        // Default case - show welcome frame
        responseFrame = {
          title: 'Flappy Arb - Earn $FLAPPY Tokens!',
          description: 'Play Flappy Arb and earn $FLAPPY tokens on Arbitrum.',
          image: `${baseUrl}/api/frame/image?welcome=true`,
          buttons: [
            {
              text: 'Play Game',
              action: 'post_redirect' as const,
              target: baseUrl,
            }
          ],
          postUrl: `${baseUrl}/api/frame`,
        };
      }

      const html = generateFrameHtml(responseFrame);
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in frame handler:', error);
    
    // Return error frame
    const errorFrame = {
      title: 'Flappy Arb - Error',
      description: 'Something went wrong. Please try again.',
      image: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/frame/image?error=true`,
      buttons: [
        {
          text: 'Try Again',
          action: 'post_redirect' as const,
          target: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        }
      ],
      postUrl: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/frame`,
    };

    const html = generateFrameHtml(errorFrame);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(html);
  }
}