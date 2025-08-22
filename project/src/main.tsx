import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createConfig, http } from 'wagmi';
import { sepolia, arbitrum } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { injected } from 'wagmi/connectors';
import App from './App.tsx';
import './index.css';

// Create Wagmi config
const config = createConfig({
  chains: [arbitrum],
  connectors: [
    injected(),
    farcasterMiniApp(),
  ],
  transports: {
    [arbitrum.id]: http(),
  },
});

// Create a client for TanStack Query
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
