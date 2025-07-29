import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { SUPPORTED_CHAINS } from '@/types';

// Create custom chain objects for testnets
const arbitrumSepolia = {
  ...sepolia,
  id: 421614,
  name: 'Arbitrum Sepolia',
  network: 'arbitrum-sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
    },
  },
} as const;

const optimismSepolia = {
  ...sepolia,
  id: 11155420,
  name: 'Optimism Sepolia',
  network: 'optimism-sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.optimism.io'],
    },
    public: {
      http: ['https://sepolia.optimism.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia-optimism.etherscan.io',
    },
  },
} as const;

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, arbitrumSepolia, optimismSepolia, sepolia],
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