'use client';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig, chains } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        initialChain={31337} // Default to Anvil Local Fork
        chains={chains}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
} 