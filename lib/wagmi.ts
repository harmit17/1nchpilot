import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { SUPPORTED_CHAINS } from '@/types';

// Create custom chain objects for testnets
const arbitrum = {
  ...mainnet,
  id: 42161,
  name: 'Arbitrum One',
  network: 'arbitrum',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
    },
  },
} as const;

const optimism = {
  ...mainnet,
  id: 10,
  name: 'Optimism',
  network: 'optimism',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.optimism.io'],
    },
    public: {
      http: ['https://mainnet.optimism.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://optimistic.etherscan.io',
    },
  },
} as const;

// Local Anvil network configuration
const anvil = {
  ...mainnet,
  id: 1,
  name: 'Anvil Local',
  network: 'anvil',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
    public: {
      http: ['http://localhost:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Local Explorer',
      url: 'http://localhost:8545',
    },
  },
} as const;

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, arbitrum, optimism, anvil],
  [
    alchemyProvider({ 
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_API_KEY || ''
    }),
    alchemyProvider({ 
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ARBITRUM_API_KEY || ''
    }),
    publicProvider()
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