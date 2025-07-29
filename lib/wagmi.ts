import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { mainnet, polygon, optimism } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { SUPPORTED_CHAINS } from '@/types';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon, optimism],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: '1nchPilot - Autonomous DeFi Portfolio Co-Pilot',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains }; 