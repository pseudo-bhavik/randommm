/// <reference types="vite/client" />

declare global {
  interface Window {
    farcaster: {
      ready(): void;
    };
  }
}