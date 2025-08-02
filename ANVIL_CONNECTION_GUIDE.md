# 🔗 Connecting UI to Anvil Forked Mainnet

## Current Setup Status ✅

Your UI is already configured to connect to Anvil Local (forked mainnet):

- **Chain ID:** 31337
- **Network Name:** Anvil Fork (Mainnet)
- **RPC URL:** http://localhost:8545
- **Currency:** ETH

## Step-by-Step Connection Guide

### 1. Make Sure Anvil is Running
```bash
# Check if Anvil is running
curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545

# If not running, start Anvil:
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/q5nyl5T11-vTcF_ZRTvjvIoM1q1lEWqk --host 0.0.0.0 --port 8545
```

### 2. Add Anvil Network to MetaMask

**Manual Setup:**
- Network Name: `Anvil Local`
- RPC URL: `http://localhost:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`
- Block Explorer: `http://localhost:8545` (optional)

**Or use this quick-add button in your dApp:**

### 3. Import Test Account
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 4. Verify Your Balances
Current balances on your Anvil account:
- ✅ ETH: ~9.22 ETH
- ✅ USDC: 10,000 USDC
- ✅ USDT: 5,000 USDT

### 5. Start Your dApp
```bash
npm run dev
```

### 6. Connect & Test
1. Open http://localhost:3000/dashboard
2. Click "Connect Wallet" 
3. Select MetaMask
4. Switch to "Anvil Local" network
5. Connect with the imported account
6. You should see your balances and can test swaps!

## Troubleshooting

**If connection fails:**
- Make sure Anvil is running on port 8545
- Check that MetaMask is on the correct network (Chain ID 31337)
- Verify the RPC URL is exactly `http://localhost:8545`

**If balances are zero:**
- Run the whale script: `./scripts/setup-whale-tokens.sh`
- Check balances: `./scripts/check-anvil-balance.sh`

## Ready to Test! 🚀

Your UI is now configured to work with the Anvil forked mainnet. You can:
- View real mainnet data (forked)
- Test swaps with actual token contracts
- Use your 10,000 USDC and 5,000 USDT for testing
- Experience real DeFi interactions in a safe local environment
