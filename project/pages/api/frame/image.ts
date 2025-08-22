import { NextApiRequest, NextApiResponse } from 'next';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { score, multiplier, tokens, welcome, claiming, error } = req.query;

    // Generate SVG image based on parameters
    let svg: string;

    if (error) {
      svg = generateErrorImage();
    } else if (welcome) {
      svg = generateWelcomeImage();
    } else if (claiming) {
      svg = generateClaimingImage(parseInt(tokens as string) || 0);
    } else {
      svg = generateResultImage(
        parseInt(score as string) || 0,
        parseInt(multiplier as string) || 1,
        parseInt(tokens as string) || 0
      );
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    return res.status(200).send(svg);

  } catch (error) {
    console.error('Error generating frame image:', error);
    
    const errorSvg = generateErrorImage();
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(errorSvg);
  }
}

function generateWelcomeImage(): string {
  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6249CB;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#2563eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Title -->
      <text x="600" y="200" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">
        Flappy Arb
      </text>
      
      <!-- Subtitle -->
      <text x="600" y="280" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" fill="#fbbf24">
        Earn $FLAPPY Tokens!
      </text>
      
      <!-- Description -->
      <text x="600" y="350" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#e5e7eb">
        Play the game and earn tokens on Arbitrum
      </text>
      
      <!-- Bird Icon -->
      <circle cx="600" cy="450" r="40" fill="#fbbf24"/>
      <circle cx="590" cy="440" r="8" fill="black"/>
      <polygon points="640,450 660,445 660,455" fill="#f97316"/>
      
      <!-- Call to Action -->
      <text x="600" y="550" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="white">
        Click "Play Game" to start!
      </text>
    </svg>
  `;
}

function generateResultImage(score: number, multiplier: number, tokens: number): string {
  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#0d9488;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0f766e;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Title -->
      <text x="600" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">
        Game Complete!
      </text>
      
      <!-- Score -->
      <text x="600" y="220" font-family="Arial, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" fill="#fbbf24">
        Score: ${score}
      </text>
      
      ${multiplier > 1 ? `
      <!-- Multiplier -->
      <text x="600" y="290" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="#ef4444">
        ${multiplier}x Multiplier!
      </text>
      ` : ''}
      
      <!-- Tokens Earned -->
      <text x="600" y="${multiplier > 1 ? '380' : '340'}" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">
        Earned: ${tokens.toLocaleString()} $FLAPPY
      </text>
      
      <!-- Trophy Icon -->
      <polygon points="580,450 620,450 625,480 575,480" fill="#fbbf24"/>
      <rect x="570" y="480" width="60" height="20" fill="#d97706"/>
      <circle cx="600" cy="430" r="25" fill="#fbbf24"/>
      
      <!-- Call to Action -->
      <text x="600" y="550" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="white">
        Click "Claim" to get your tokens!
      </text>
    </svg>
  `;
}

function generateClaimingImage(tokens: number): string {
  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Title -->
      <text x="600" y="180" font-family="Arial, sans-serif" font-size="56" font-weight="bold" text-anchor="middle" fill="white">
        Transaction Initiated
      </text>
      
      <!-- Tokens -->
      <text x="600" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#fbbf24">
        Claiming ${tokens.toLocaleString()} $FLAPPY
      </text>
      
      <!-- Loading Animation (represented as dots) -->
      <circle cx="550" cy="350" r="8" fill="white" opacity="0.8"/>
      <circle cx="580" cy="350" r="8" fill="white" opacity="0.6"/>
      <circle cx="610" cy="350" r="8" fill="white" opacity="0.4"/>
      <circle cx="640" cy="350" r="8" fill="white" opacity="0.2"/>
      
      <!-- Status -->
      <text x="600" y="450" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="#e5e7eb">
        Please confirm the transaction in your wallet
      </text>
      
      <!-- Footer -->
      <text x="600" y="550" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">
        Powered by Arbitrum
      </text>
    </svg>
  `;
}

function generateErrorImage(): string {
  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ef4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f87171;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Error Icon -->
      <circle cx="600" cy="250" r="60" fill="white" opacity="0.2"/>
      <text x="600" y="280" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="white">
        !
      </text>
      
      <!-- Title -->
      <text x="600" y="380" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">
        Oops! Something went wrong
      </text>
      
      <!-- Message -->
      <text x="600" y="450" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" fill="#fecaca">
        Please try again
      </text>
      
      <!-- Footer -->
      <text x="600" y="550" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">
        Flappy Arb
      </text>
    </svg>
  `;
}