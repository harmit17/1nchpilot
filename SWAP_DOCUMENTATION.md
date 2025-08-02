# Swap Functionality Documentation

## Overview
The swap functionality allows users to perform token swaps using the 1inch DEX aggregator directly from the dashboard.

## Features

### 🔄 Token Swap Popup
- **Location**: Dashboard page, next to "Create Strategy" button
- **Access**: Click the "Swap Tokens" button
- **Functionality**: Complete token swapping interface

### 🎯 Key Components

#### SwapPopup Component (`/components/SwapPopup.tsx`)
- Modern popup interface with gradient header
- Form validation and error handling
- Integration with 1inch API for quotes and orders
- Support for common token presets
- Slippage tolerance configuration
- Real-time quote display

#### Dashboard Integration (`/app/dashboard/page.tsx`)
- New "Swap Tokens" button in action buttons grid
- Modal state management
- Seamless integration with existing portfolio tools

## How to Use

### 1. Access Swap Interface
- Navigate to the Dashboard
- Click the "Swap Tokens" button (blue button with swap icon)

### 2. Configure Swap
1. **Connect Wallet**: Ensure your wallet is connected
2. **Select Source Token**: Enter token contract address or click preset
3. **Select Destination Token**: Enter target token contract address
4. **Enter Amount**: Specify how much you want to swap
5. **Set Slippage**: Choose tolerance (0.5%, 1%, 2%, 3% or custom)

### 3. Execute Swap
1. **Get Quote**: Click "Get Quote" to see swap details
2. **Review Terms**: Check amounts, gas costs, and rates
3. **Execute**: Click "Execute Swap" to build the transaction

## Technical Details

### API Integration
- Uses 1inch Portfolio API v4 via proxy
- Endpoints used:
  - `/v5.2/{chainId}/quote` - Get swap quotes
  - `/v5.2/{chainId}/order/builder` - Build swap orders

### Supported Networks
- Ethereum Mainnet (Chain ID: 1)
- All networks supported by 1inch API

### Common Token Addresses (Ethereum)
- **USDC**: `0xA0b86a33E6441c8C06DD6F01adf9c10C7E901Fb0`
- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **WETH**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **DAI**: `0x6B175474E89094C44Da98b954EedeAC495271d0F`
- **UNI**: `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`
- **ETH**: `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`

## Implementation Status

### ✅ Completed Features
- [x] Swap popup component with modern UI
- [x] Dashboard integration with action button
- [x] 1inch API integration for quotes
- [x] Form validation and error handling
- [x] Common token presets
- [x] Slippage configuration
- [x] Quote display with details
- [x] Loading states and animations

### 🚧 Demo Implementation Notes
- **Transaction Execution**: Currently shows order data in console
- **Wallet Integration**: Ready for wagmi transaction sending
- **Real Implementation**: Would require:
  1. Transaction signing with user's wallet
  2. Blockchain transaction submission
  3. Transaction confirmation monitoring
  4. Success/failure notification

## Security Considerations

### ⚠️ Important Warnings
- Always verify token contract addresses before swapping
- High slippage can result in significant price impact
- Gas fees will be deducted from wallet balance
- This is a demo implementation - review code before production use

### 🔒 Best Practices
- Start with small amounts for testing
- Use well-known token addresses
- Keep slippage as low as possible (typically 1-3%)
- Check gas prices before executing large swaps

## Future Enhancements

### Planned Features
- [ ] Token search and selection interface
- [ ] Price impact warnings
- [ ] Historical swap tracking
- [ ] Advanced routing options
- [ ] MEV protection settings
- [ ] Multi-hop swap visualization

### Integration Opportunities
- Portfolio rebalancing automation
- Strategy execution swaps
- Analytics integration for swap tracking
- Gas optimization recommendations

## Error Handling

### Common Issues
1. **Invalid token address**: Check format (0x + 40 hex characters)
2. **Insufficient liquidity**: Try smaller amounts or different tokens
3. **High slippage**: Increase tolerance or check market conditions
4. **Network errors**: Verify internet connection and API status

### Troubleshooting
- Check browser console for detailed error messages
- Verify wallet connection and network
- Ensure sufficient balance for gas fees
- Try refreshing the page if persistent issues occur

This swap functionality provides a seamless way for users to exchange tokens while managing their portfolio, integrated directly into the 1nchPilot dashboard experience.
