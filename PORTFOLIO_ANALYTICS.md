# Portfolio Analytics Feature

## Overview

The Portfolio Analytics feature provides comprehensive AI-powered analysis of cryptocurrency portfolios using 1inch APIs. Users can generate detailed reports with insights, risk assessments, and personalized recommendations.

## Features

### 🔍 Comprehensive Portfolio Analysis
- **Portfolio Overview**: Total value, token count, P&L, and key metrics
- **Token Analytics**: Individual token performance, allocation percentages
- **Transaction History**: Complete transaction analysis across supported chains
- **Risk Assessment**: AI-powered risk scoring and factor analysis
- **Performance Grading**: Portfolio performance evaluation with benchmarks

### 🤖 AI-Powered Insights
- **Google Gemini 2.0 Flash**: Primary AI model for advanced portfolio analysis
- **OpenAI GPT-4o-mini**: Fallback AI model for comprehensive insights  
- **Demo Analytics**: Intelligent fallback that works without API keys
- **Smart Analysis**: Risk assessment, diversification scoring, performance grading
- **Actionable Recommendations**: Prioritized action items with impact estimates

### 📊 Visual Analytics
- **Portfolio Value History**: Historical performance tracking
- **Token Allocation Charts**: Visual breakdown of holdings
- **Profit/Loss Trends**: P&L analysis over time
- **Risk Metrics**: Volatility, Sharpe ratio, max drawdown

### 📥 Report Generation
- **Downloadable Reports**: Export comprehensive analytics as text files
- **Real-time Analysis**: Live data from 1inch APIs
- **Multi-chain Support**: Ethereum, Polygon, BSC, Arbitrum, Optimism

## How to Use

### 1. Access Analytics Dashboard
```typescript
// Navigate to Dashboard and click "Generate Analytics Report"
// Or access directly through the Portfolio Analytics component
```

### 2. Input Wallet Address
- Enter any Ethereum-compatible wallet address (0x...)
- Select the blockchain network
- Click "Generate Analytics Report"

### 3. Review AI Insights
- Portfolio summary and key metrics
- Strengths and improvement areas
- Risk assessment with scoring
- Suggested protocols and strategies

### 4. Download Report
- Comprehensive text report with all analytics
- Includes charts data and transaction history
- Formatted for easy sharing and review

## API Integration

### 1inch APIs Used
- **Balance API**: Current token balances and values
- **Portfolio API**: Detailed portfolio composition
- **History API**: Transaction history and activity
- **Token API**: Token metadata and information
- **Price API**: Real-time token pricing

### OpenAI Integration
- **GPT-4o-mini**: Portfolio analysis and insights generation
- **Prompt Engineering**: Structured analysis framework
- **Error Handling**: Fallback insights if AI unavailable

### Google Gemini Integration
- **Gemini 2.0 Flash**: Primary AI model for portfolio analysis
- **Advanced Reasoning**: Enhanced analysis capabilities
- **JSON Structured Output**: Reliable response format
- **Cost Effective**: Lower cost per analysis compared to OpenAI

## Configuration

### Environment Variables
```bash
# Primary AI model (recommended)
GEMINI_API_KEY=your_gemini_api_key_here

# Fallback AI model 
OPENAI_API_KEY=your_openai_api_key_here

# 1inch API credentials
NEXT_PUBLIC_1INCH_API_KEY=your_1inch_api_key_here
```

### API Endpoints
```typescript
POST /api/portfolio/analytics
{
  "walletAddress": "0x...",
  "chainId": 1,
  "timeframe": "30d",
  "includeTransactionHistory": true,
  "includeAIInsights": true
}
```

## Components

### PortfolioAnalytics.tsx
Main analytics interface component with:
- Wallet address input
- Report generation controls
- Results display with charts
- Download functionality

### GeminiPortfolioAIService (lib/gemini-ai-service.ts)
Primary AI service using Google's Gemini 2.0 Flash:
```typescript
class GeminiPortfolioAIService {
  async generatePortfolioInsights(portfolioData): Promise<AIInsights>
}
```

### PortfolioAIService (lib/ai-service.ts)
Fallback AI service using OpenAI:
```typescript
class PortfolioAIService {
  async generatePortfolioInsights(portfolioData): Promise<AIInsights>
}
```

### DemoPortfolioAIService (lib/demo-ai-service.ts)
Demo service that works without API keys:
```typescript
class DemoPortfolioAIService {
  async generatePortfolioInsights(portfolioData): Promise<AIInsights>
}
```

### Enhanced 1inch API (lib/1inch-api.ts)
Extended with analytics methods:
- `getTransactionHistory()`
- `getPortfolioMetrics()`
- `getComprehensivePortfolioData()`

## Use Cases

### 1. Portfolio Health Check
- Assess overall portfolio performance
- Identify overconcentration risks
- Review diversification levels

### 2. Investment Strategy Planning
- Discover new yield opportunities
- Evaluate trending protocols
- Plan portfolio rebalancing

### 3. Risk Management
- Monitor portfolio volatility
- Assess correlation risks
- Track performance metrics

### 4. Educational Insights
- Learn about DeFi protocols
- Understand market trends
- Get personalized recommendations

## Future Enhancements

### Advanced Analytics
- [ ] Historical backtesting
- [ ] Comparative portfolio analysis
- [ ] Yield farming optimization
- [ ] Liquidity provision analytics

### Enhanced AI Features
- [ ] Sentiment analysis integration
- [ ] Market timing recommendations
- [ ] Risk-adjusted portfolio suggestions
- [ ] Automated rebalancing triggers

### Additional Integrations
- [ ] Multiple AI model support
- [ ] Social trading insights
- [ ] Governance participation analysis
- [ ] NFT portfolio analytics

## Error Handling

The system includes comprehensive error handling:
- **API Failures**: Graceful degradation with fallback data
- **AI Unavailability**: Default insights without AI analysis
- **Network Issues**: Retry mechanisms and user feedback
- **Invalid Addresses**: Input validation and user guidance

## Performance

- **Optimized API Calls**: Batched requests with rate limiting
- **Caching**: Portfolio data caching for improved response times
- **Progressive Loading**: Incremental data display
- **Background Processing**: Non-blocking report generation

## Contributing

To extend the analytics features:

1. **Add New Metrics**: Extend `PortfolioMetrics` interface
2. **Enhance AI Prompts**: Modify prompt engineering in `ai-service.ts`
3. **Add Visualizations**: Create new chart components
4. **Extend API Coverage**: Add support for additional 1inch endpoints

## Support

For issues or questions:
- Check console logs for detailed error information
- Verify API key configuration
- Ensure wallet address format is correct
- Review network connectivity

This feature transforms raw blockchain data into actionable portfolio insights, helping users make informed investment decisions in the DeFi ecosystem.
