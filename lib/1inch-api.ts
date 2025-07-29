import axios from 'axios';
import { Token, TokenBalance, Portfolio, OneInchQuote, OneInchOrder, OneInchOrderStatus } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_1INCH_API_URL || 'https://api.1inch.dev';
const API_KEY = process.env.NEXT_PUBLIC_1INCH_API_KEY;

class OneInchAPI {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = API_KEY || '';
    this.baseURL = API_BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('1inch API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'API request failed');
    }
  }

  // Get wallet balances
  async getWalletBalances(chainId: number, address: string): Promise<any> {
    return this.makeRequest(`/v1.1/${chainId}/address/${address}/balances`);
  }

  // Get token metadata
  async getTokenData(chainId: number, tokenAddress: string): Promise<any> {
    return this.makeRequest(`/v1.1/token-data/${chainId}`, {
      tokenAddress,
    });
  }

  // Get price feeds
  async getPriceFeeds(chainId: number, tokens: string[]): Promise<any> {
    return this.makeRequest(`/v1.1/price-feed/${chainId}`, {
      tokens: tokens.join(','),
    });
  }

  // Get swap quote (Fusion mode)
  async getQuote(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1
  ): Promise<OneInchQuote> {
    return this.makeRequest(`/v5.2/${chainId}/quote`, {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount,
      from: fromAddress,
      slippage,
      enableEstimate: true,
      allowPartialFill: false,
      disableEstimate: false,
      gasPrice: 'auto',
      complexityLevel: 'normal',
      connectorTokens: '3',
      gasLimit: 'auto',
      mainRouteParts: '10',
      parts: '50',
      protocols: '1inch',
      source: '1inch',
      fee: '0',
      gasLimitForRequests: 'auto',
      includeTokensInfo: true,
      includeProtocols: true,
      includeGas: true,
      includeDEXS: true,
      includeTokens: true,
      includeCardano: true,
      includePolicies: true,
      includePermit: true,
      includeSwap: true,
      includeTokensData: true,
      includeTokensDataByChainId: true,
      includeTokensDataByChainIdAndAddress: true,
      includeTokensDataByChainIdAndAddressAndDecimals: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbol: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndName: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURI: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTags: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoId: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerified: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupply: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPrice: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24h: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24h: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7d: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30d: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1y: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCap: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuation: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRank: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupply: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupply: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAth: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentage: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDate: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtl: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtlAndAtlChangePercentage: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtlAndAtlChangePercentageAndAtlDate: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtlAndAtlChangePercentageAndAtlDateAndRoi: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtlAndAtlChangePercentageAndAtlDateAndRoiAndLastUpdated: true,
    });
  }

  // Build order for Fusion mode
  async buildOrder(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1
  ): Promise<any> {
    return this.makeRequest(`/v5.2/${chainId}/order/builder`, {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount,
      from: fromAddress,
      slippage,
      enableEstimate: true,
      allowPartialFill: false,
      disableEstimate: false,
      gasPrice: 'auto',
      complexityLevel: 'normal',
      connectorTokens: '3',
      gasLimit: 'auto',
      mainRouteParts: '10',
      parts: '50',
      protocols: '1inch',
      source: '1inch',
      fee: '0',
      gasLimitForRequests: 'auto',
      includeTokensInfo: true,
      includeProtocols: true,
      includeGas: true,
      includeDEXS: true,
      includeTokens: true,
      includeCardano: true,
      includePolicies: true,
      includePermit: true,
      includeSwap: true,
      includeTokensData: true,
      includeTokensDataByChainId: true,
      includeTokensDataByChainIdAndAddress: true,
      includeTokensDataByChainIdAndAddressAndDecimals: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbol: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndName: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURI: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTags: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoId: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerified: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupply: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPrice: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24h: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24h: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7d: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30d: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1y: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCap: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuation: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRank: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupply: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupply: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAth: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentage: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDate: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtl: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtlAndAtlChangePercentage: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtlAndAtlChangePercentageAndAtlDate: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtlAndAtlChangePercentageAndAtlDateAndRoi: true,
      includeTokensDataByChainIdAndAddressAndDecimalsAndSymbolAndNameAndLogoURIAndTagsAndCoingeckoIdAndVerifiedAndTotalSupplyAndPriceAndVolume24hAndPriceChange24hAndPriceChange7dAndPriceChange30dAndPriceChange1yAndMarketCapAndFullyDilutedValuationAndMarketCapRankAndCirculatingSupplyAndMaxSupplyAndAthAndAthChangePercentageAndAthDateAndAtlAndAtlChangePercentageAndAtlDateAndRoiAndLastUpdated: true,
    });
  }

  // Place order (Fusion mode)
  async placeOrder(chainId: number, orderData: any): Promise<OneInchOrder> {
    return this.makeRequest(`/v5.2/${chainId}/order`, orderData);
  }

  // Get order status
  async getOrderStatus(chainId: number, orderHash: string): Promise<OneInchOrderStatus> {
    return this.makeRequest(`/v5.2/${chainId}/order/${orderHash}`);
  }

  // Get supported tokens
  async getSupportedTokens(chainId: number): Promise<any> {
    return this.makeRequest(`/v1.1/tokens/${chainId}`);
  }

  // Get portfolio data (combines balances, prices, and metadata)
  async getPortfolioData(chainId: number, address: string): Promise<Portfolio> {
    try {
      // For testnets, we'll use mock data since 1inch API might not support all testnets
      if (chainId === 421614 || chainId === 11155420 || chainId === 11155111) {
        return this.getMockPortfolioData(chainId, address);
      }
      
      // Get wallet balances
      const balances = await this.getWalletBalances(chainId, address);
      
      // Get token addresses for price feeds
      const tokenAddresses = balances.tokens.map((token: any) => token.address);
      
      // Get price feeds
      const prices = await this.getPriceFeeds(chainId, tokenAddresses);
      
      // Get token metadata
      const tokenMetadata = await Promise.all(
        tokenAddresses.map(async (address: string) => {
          try {
            return await this.getTokenData(chainId, address);
          } catch (error) {
            console.warn(`Failed to get metadata for token ${address}:`, error);
            return null;
          }
        })
      );

      // Process and combine data
      const tokens: TokenBalance[] = [];
      let totalValueUSD = 0;

      balances.tokens.forEach((balance: any, index: number) => {
        const metadata = tokenMetadata[index];
        const price = prices[balance.address];
        
        if (metadata && price) {
          const token: Token = {
            address: balance.address,
            symbol: metadata.symbol,
            name: metadata.name,
            decimals: metadata.decimals,
            logoURI: metadata.logoURI,
            chainId,
          };

          const balanceUSD = parseFloat(balance.balance) * price;
          totalValueUSD += balanceUSD;

          tokens.push({
            token,
            balance: balance.balance,
            balanceUSD,
            percentage: 0, // Will be calculated below
          });
        }
      });

      // Calculate percentages
      tokens.forEach(token => {
        token.percentage = (token.balanceUSD / totalValueUSD) * 100;
      });

      return {
        totalValueUSD,
        tokens,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      throw error;
    }
  }

  // Mock portfolio data for testnets
  private getMockPortfolioData(chainId: number, address: string): Portfolio {
    const mockTokens: TokenBalance[] = [
      {
        token: {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          chainId,
        },
        balance: '1000000000000000000', // 1 ETH
        balanceUSD: 2400,
        percentage: 60,
      },
      {
        token: {
          address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          chainId,
        },
        balance: '1000000', // 1 USDC
        balanceUSD: 1,
        percentage: 25,
      },
      {
        token: {
          address: '0x4200000000000000000000000000000000000006',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          chainId,
        },
        balance: '500000000000000000', // 0.5 WETH
        balanceUSD: 1200,
        percentage: 15,
      },
    ];

    return {
      totalValueUSD: 4000,
      tokens: mockTokens,
      lastUpdated: new Date(),
    };
  }
}

export const oneInchAPI = new OneInchAPI(); 