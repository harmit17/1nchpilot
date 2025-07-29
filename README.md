# 1nchPilot - Autonomous DeFi Portfolio Co-Pilot

🚀 **Build, manage, and automate your DeFi portfolio with intelligent rebalancing. Gasless & MEV-Protected. Powered by 1inch Fusion. Mainnet Ready for Arbitrum & Optimism.**

## 🏛️ Overview

1nchPilot is a comprehensive DeFi portfolio management platform that leverages the power of 1inch Fusion to provide gasless, MEV-protected portfolio rebalancing. The platform offers intelligent drift detection, automated rebalancing, and real-time portfolio analytics.

### Key Features

- **🔄 Intelligent Rebalancing**: Automatically rebalance portfolios based on target allocations with smart drift detection
- **⛽ Gasless Transactions**: Execute trades without gas fees using 1inch Fusion
- **🛡️ MEV Protection**: Protected from MEV attacks through 1inch's advanced routing
- **📊 Real-time Analytics**: Monitor portfolio performance with detailed charts and drift analysis
- **📋 Strategy Templates**: Choose from pre-built strategies or create custom allocations
- **⚡ Lightning Fast**: Execute complex multi-token rebalancing in seconds

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **RainbowKit** for wallet integration
- **Recharts** for data visualization

### Backend
- **1inch API** for portfolio data and trading
- **Supabase** for user data and strategies
- **Vercel** for deployment and serverless functions

### Key Integrations
- **1inch Fusion API** - Core trading engine
- **Wagmi** - Ethereum hooks and utilities
- **Viem** - Low-level Ethereum interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- 1inch API key (get one at [1inch.dev](https://1inch.dev))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/1nch-pilot.git
   cd 1nch-pilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   NEXT_PUBLIC_1INCH_API_KEY=your_1inch_api_key_here
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
1nch-pilot/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Landing page
│   └── providers.tsx     # App providers
├── components/            # React components
│   ├── PortfolioChart.tsx
│   ├── PortfolioOverview.tsx
│   ├── RebalancingPanel.tsx
│   ├── StrategySelector.tsx
│   └── TokenList.tsx
├── lib/                   # Utility libraries
│   ├── 1inch-api.ts      # 1inch API service
│   └── wagmi.ts          # Wagmi configuration
├── types/                 # TypeScript types
│   └── index.ts
├── utils/                 # Utility functions
│   └── index.ts
└── public/               # Static assets
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_1INCH_API_KEY` | Your 1inch API key | ✅ |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ❌ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ❌ |

### Supported Chains

- **Arbitrum One** (Chain ID: 42161) - Primary mainnet
- **Optimism** (Chain ID: 10) - Secondary mainnet
- **Ethereum** (Chain ID: 1) - Ethereum mainnet

## 🎯 User Flow

### 1. Landing & Onboarding
- User visits the dApp and sees the value proposition
- Connects wallet using RainbowKit
- Views portfolio overview instantly

### 2. Portfolio Analysis
- Real-time portfolio data from 1inch API
- Visual charts showing asset allocation
- Token list with balances and percentages

### 3. Strategy Creation
- Choose from pre-built templates (DeFi Blue Chips, L2 Scalers, etc.)
- Create custom strategies with target allocations
- Set drift thresholds and automation preferences

### 4. Rebalancing Execution
- Review rebalancing plan with current vs target allocations
- Execute gasless trades via 1inch Fusion
- Real-time status updates and confirmation

### 5. Monitoring & Automation
- Track portfolio drift over time
- Automated rebalancing when thresholds are exceeded
- Historical performance analytics

## 🔌 API Integration

### 1inch API Endpoints Used

- `GET /v1.1/{chain}/address/{address}/balances` - Get wallet balances
- `GET /v1.1/token-data/{chain}` - Get token metadata
- `GET /v1.1/price-feed/{chain}` - Get price feeds
- `GET /v5.2/{chain}/quote` - Get swap quotes (Fusion mode)
- `POST /v5.2/{chain}/order/builder` - Build orders
- `POST /v5.2/{chain}/order` - Place orders

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Tailwind CSS** for consistent styling

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **1inch** for providing the Fusion API and DEX aggregation
- **RainbowKit** for excellent wallet integration
- **Vercel** for hosting and deployment
- **Tailwind CSS** for the utility-first CSS framework

## 📞 Support

- **Documentation**: [docs.1nchpilot.com](https://docs.1nchpilot.com)
- **Discord**: [discord.gg/1nchpilot](https://discord.gg/1nchpilot)
- **Twitter**: [@1nchPilot](https://twitter.com/1nchPilot)
- **Email**: support@1nchpilot.com

---

**Built with ❤️ for the DeFi community** 