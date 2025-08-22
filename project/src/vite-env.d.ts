declare global {
  interface Window {
    farcaster: {
      ready: () => void;
    };
  }
}