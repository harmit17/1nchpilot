#!/bin/bash

# Check Anvil balance script
echo "🔍 Checking Anvil status and balances..."

# Check if Anvil is running
if ! curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545 > /dev/null 2>&1; then
  echo "❌ Anvil is not running on port 8545"
  echo "💡 Start Anvil with: anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
  exit 1
fi

echo "✅ Anvil is running!"

# Default Anvil account
ANVIL_ACCOUNT="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo "📍 Checking balance for default Anvil account: $ANVIL_ACCOUNT"

# Get ETH balance
ETH_BALANCE=$(curl -s -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ANVIL_ACCOUNT\",\"latest\"],\"id\":1}" \
  http://localhost:8545 | jq -r '.result')

if [ "$ETH_BALANCE" != "null" ] && [ "$ETH_BALANCE" != "" ]; then
  # Convert from wei to ETH (divide by 10^18)
  # Remove 0x prefix and convert hex to decimal, then divide by 10^18
  ETH_WEI_DECIMAL=$(printf "%d" "$ETH_BALANCE")
  ETH_READABLE=$(echo "scale=4; $ETH_WEI_DECIMAL / 1000000000000000000" | bc -l)
  echo "💰 ETH Balance: $ETH_READABLE ETH"
else
  echo "❌ Failed to get ETH balance"
fi

# Check USDC balance (0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48 - USDC contract)
USDC_CONTRACT="0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48"
USDC_BALANCE=$(curl -s -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$USDC_CONTRACT\",\"data\":\"0x70a08231000000000000000000000000${ANVIL_ACCOUNT#0x}\"},\"latest\"],\"id\":1}" \
  http://localhost:8545 | jq -r '.result')

if [ "$USDC_BALANCE" != "null" ] && [ "$USDC_BALANCE" != "" ] && [ "$USDC_BALANCE" != "0x" ]; then
  # Convert from smallest unit to USDC (divide by 10^6)
  # Remove 0x prefix and convert hex to decimal, then divide by 10^6
  USDC_WEI_DECIMAL=$(printf "%d" "$USDC_BALANCE")
  USDC_READABLE=$(echo "scale=2; $USDC_WEI_DECIMAL / 1000000" | bc -l)
  echo "💵 USDC Balance: $USDC_READABLE USDC"
else
  echo "💵 USDC Balance: 0 USDC"
fi

echo ""
echo "🌐 Connect your MetaMask to:"
echo "   Network Name: Anvil Local"
echo "   RPC URL: http://localhost:8545"
echo "   Chain ID: 31337"
echo "   Currency Symbol: ETH"
echo ""
echo "📝 Import this account to MetaMask:"
echo "   Address: $ANVIL_ACCOUNT"
echo "   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
