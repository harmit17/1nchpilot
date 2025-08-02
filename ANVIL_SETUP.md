# Local Forked Network Setup for Testing Swaps

## Quick Setup Instructions

### 1. Install Foundry (if not already installed)
```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

### 2. Start Anvil Fork
```bash
anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/q5nyl5T11-vTcF_ZRTvjvIoM1q1lEWqk --port 8545 --host 0.0.0.0
```

### 3. Anvil Default Accounts
Anvil will provide you with 10 test accounts, each with 10,000 ETH. Here are the first few:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

## Configuration Changes Needed

### Update wagmi config for local network
Add to your `lib/wagmi.ts`:

```typescript
import { foundry } from 'wagmi/chains'

const chains = [mainnet, polygon, arbitrum, optimism, foundry] as const
```

### Update environment variables
Add to your `.env.local`:

```bash
# Local Development Network
NEXT_PUBLIC_LOCAL_RPC_URL=http://localhost:8545
NEXT_PUBLIC_ANVIL_CHAIN_ID=31337
```

## Testing the Swap Module

### 1. Connect to Local Network
- Open your app
- Connect wallet and switch to "Foundry" network (Chain ID: 31337)
- Import one of the Anvil accounts using the private keys above

### 2. Get Test Tokens
Since this is a mainnet fork, you can:
- Use the ETH you already have (10,000 ETH per account)
- Impersonate accounts that have tokens you want to test with
- Use Anvil's `anvil_setBalance` to give yourself tokens

### 3. Test Swap Functionality
- Navigate to Dashboard
- Click "Swap Tokens" 
- Try swapping ETH for USDC or other tokens
- All transactions will be on the local fork

## Advanced Anvil Commands

### Impersonate Account (to get tokens)
```bash
# Impersonate Vitalik's account to access his tokens
anvil_impersonateAccount 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

### Set Token Balance
```bash
# Give yourself 1000 USDC (6 decimals)
cast rpc anvil_setStorageAt 0xA0b86a33E6441c8C06DD6F01adf9c10C7E901Fb0 0x$(cast index address 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0) 0x$(printf '%064x' 1000000000)
```

### Mine Blocks
```bash
# Mine 10 blocks
cast rpc anvil_mine 10
```

## Troubleshooting

### Common Issues:
1. **"Network not supported"** - Add foundry chain to wagmi config
2. **"Insufficient funds"** - Use anvil accounts with 10k ETH each  
3. **"Transaction reverted"** - Check token addresses and amounts
4. **"RPC not responding"** - Ensure Anvil is running on port 8545

### Verify Anvil is Running:
```bash
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545
```

## Next Steps

1. Start Anvil with the command above
2. Update wagmi config to include local network
3. Connect wallet to local network
4. Test the swap functionality with real mainnet state

This setup gives you a complete mainnet fork where you can test swaps with real liquidity and prices, but without spending real ETH!
