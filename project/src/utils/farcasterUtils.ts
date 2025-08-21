// Utility functions for Farcaster integration

export interface FarcasterFrameMetadata {
  title: string;
  description: string;
  image: string;
  buttons: Array<{
    text: string;
    action?: 'post' | 'post_redirect' | 'tx';
    target?: string;
  }>;
  postUrl?: string;
  state?: string;
}

export function generateFrameHtml(metadata: FarcasterFrameMetadata): string {
  const { title, description, image, buttons, postUrl, state } = metadata;
  
  let metaTags = `
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${image}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  `;
  
  // Add buttons
  buttons.forEach((button, index) => {
    const buttonIndex = index + 1;
    metaTags += `<meta property="fc:frame:button:${buttonIndex}" content="${button.text}" />`;
    
    if (button.action) {
      metaTags += `<meta property="fc:frame:button:${buttonIndex}:action" content="${button.action}" />`;
    }
    
    if (button.target) {
      metaTags += `<meta property="fc:frame:button:${buttonIndex}:target" content="${button.target}" />`;
    }
  });
  
  // Add post URL
  if (postUrl) {
    metaTags += `<meta property="fc:frame:post_url" content="${postUrl}" />`;
  }
  
  // Add state
  if (state) {
    metaTags += `<meta property="fc:frame:state" content="${state}" />`;
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    
    ${metaTags}
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    
    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
</body>
</html>`;
}

export function generateFarcasterShareUrl(text: string, frameUrl?: string): string {
  let shareText = text;
  
  if (frameUrl) {
    shareText += `\n\n${frameUrl}`;
  }
  
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
}

export function validateFrameSignature(frameData: any): boolean {
  // This is a simplified validation
  // In production, you should use @farcaster/hub-nodejs for proper validation
  return frameData && frameData.untrustedData && frameData.trustedData;
}