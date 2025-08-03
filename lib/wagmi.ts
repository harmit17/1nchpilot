import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { mainnet, sepolia, polygon } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia, polygon], // Multiple chains to show dropdown
  [
    alchemyProvider({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_API_KEY || '',
    }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: '1nchPilot - Autonomous DeFi Portfolio Co-Pilot',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '1nchpilot-project',
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains }; 