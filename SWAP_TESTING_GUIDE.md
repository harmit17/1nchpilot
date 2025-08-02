# Testing Swap Component on Anvil Forked Mainnet

## 🎯 Testing Strategy

The swap component works on Anvil forked mainnet by:
- **1inch API calls**: Use mainnet (Chain ID 1) for quotes and transaction data
- **Transaction execution**: Happens on local fork (Chain ID 31337) with instant confirmation
- **Token contracts**: Real mainnet contracts with forked state and liquidity

## 🚀 Step-by-Step Testing Process

### 1. **Prerequisites**
- ✅ Anvil running: `anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/q5nyl5T11-vTcF_ZRTvjvIoM1q1lEWqk`
- ✅ Tokens set up: `./scripts/setup-swap-testing.sh`
- ✅ Dev server running: `npm run dev` (http://localhost:3002)

### 2. **Wallet Setup**
```bash
# Import test account in MetaMask:
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Add Anvil network in MetaMask:
Network Name: Anvil Fork
RPC URL: http://localhost:8545
Chain ID: 31337
Currency Symbol: ETH
```

### 3. **Test Scenarios**

#### **Test 1: ETH → USDC Swap**
- From Token: `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` (ETH)
- To Token: `0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48` (USDC)
- Amount: `1` ETH
- Expected: Should get ~3,400 USDC

#### **Test 2: USDC → USDT Swap** 
- From Token: `0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48` (USDC)
- To Token: `0xdAC17F958D2ee523a2206206994597C13D831ec7` (USDT)
- Amount: `1000` USDC
- Expected: Should get ~1,000 USDT + approval step

#### **Test 3: USDC → DAI Swap**
- From Token: `0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48` (USDC)
- To Token: `0x6B175474E89094C44Da98b954EedeAC495271d0F` (DAI)
- Amount: `500` USDC
- Expected: Should get ~500 DAI + approval step

### 4. **What to Verify**

#### **UI Behavior:**
- ✅ Network detection shows "Anvil Fork (Mainnet)"
- ✅ Token presets show correct Ethereum mainnet addresses
- ✅ Quote fetching works (gets real mainnet liquidity data)
- ✅ Approval step appears for ERC-20 tokens
- ✅ Transaction hash displays
- ✅ Step progression works (form → approval → swap → complete)

#### **API Behavior:**
- ✅ 1inch API calls use mainnet (Chain ID 1) even when on fork (31337)
- ✅ Quotes return realistic amounts based on mainnet liquidity
- ✅ Approval transactions work on local fork
- ✅ Swap transactions execute on local fork

#### **Transaction Behavior:**
- ✅ Instant confirmation (no waiting for mainnet blocks)
- ✅ Gas costs are realistic (based on mainnet)
- ✅ Token balances update correctly
- ✅ No actual mainnet transactions (stays on fork)

### 5. **Troubleshooting**

#### **Common Issues:**
```bash
# If quote fails:
# Check that 1inch API is using mainnet (Chain ID 1) 

# If approval fails:
# Ensure token has sufficient balance (run setup script again)

# If swap fails:
# Check that approval went through first
# Verify slippage is reasonable (1-5%)

# If network detection fails:
# Make sure MetaMask is connected to localhost:8545 with Chain ID 31337
```

#### **Debug Commands:**
```bash
# Check token balances
cast call 0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48 "balanceOf(address)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545

# Check ETH balance  
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545

# Monitor transactions
cast logs --rpc-url http://localhost:8545
```

### 6. **Success Criteria**

✅ **Complete test successful when:**
- Quote fetches successfully 
- Approval transaction completes (for ERC-20)
- Swap transaction completes
- Token balances update correctly
- Transaction hash is displayed
- No errors in console

## 🎉 Ready for Production!

Once these tests pass, the swap component is ready for:
- ✅ Ethereum mainnet
- ✅ Arbitrum mainnet  
- ✅ Local testing on forks
- ✅ Production deployment

The component intelligently handles both live networks and forked environments!
