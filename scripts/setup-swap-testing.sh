#!/bin/bash

# Setup tokens for swap testing on Anvil forked mainnet
echo "🔧 Setting up tokens for swap testing on Anvil forked mainnet..."

# Check if Anvil is running
if ! curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' http://localhost:8545 > /dev/null 2>&1; then
    echo "❌ Anvil is not running on localhost:8545"
    echo "Please run: anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/q5nyl5T11-vTcF_ZRTvjvIoM1q1lEWqk"
    exit 1
fi

# Test account (first Anvil account)
TEST_ACCOUNT="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Whale addresses with large token balances
USDC_WHALE="0x28C6c06298d514Db089934071355E5743bf21d60"  # Binance14
USDT_WHALE="0x5754284f345afc66a98fbb0a0afa77336dbcc6e4"  # Binance17
DAI_WHALE="0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf"   # Polygon Bridge
WETH_WHALE="0x8EB8a3b98659Cce290402893d0123abb75E3ab28"  # Avalanche Bridge

# Token addresses (mainnet)
USDC="0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48"
USDT="0xdAC17F958D2ee523a2206206994597C13D831ec7" 
DAI="0x6B175474E89094C44Da98b954EedeAC495271d0F"
WETH="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

echo "📋 Impersonating whale accounts and transferring tokens..."

# Function to transfer tokens
transfer_tokens() {
    local token_address=$1
    local whale_address=$2
    local token_name=$3
    local amount=$4
    
    echo "   💰 Transferring $token_name from $whale_address..."
    
    # Impersonate whale account
    curl -s -X POST -H "Content-Type: application/json" \
        --data "{\"jsonrpc\":\"2.0\",\"method\":\"anvil_impersonateAccount\",\"params\":[\"$whale_address\"],\"id\":1}" \
        http://localhost:8545 > /dev/null
    
    # Transfer tokens to test account
    if [ "$token_name" = "USDC" ] || [ "$token_name" = "USDT" ]; then
        # USDC/USDT have 6 decimals
        cast send $token_address "transfer(address,uint256)" $TEST_ACCOUNT $amount \
            --rpc-url http://localhost:8545 --from $whale_address --unlocked > /dev/null 2>&1
    else
        # DAI/WETH have 18 decimals  
        cast send $token_address "transfer(address,uint256)" $TEST_ACCOUNT $amount \
            --rpc-url http://localhost:8545 --from $whale_address --unlocked > /dev/null 2>&1
    fi
    
    # Stop impersonating
    curl -s -X POST -H "Content-Type: application/json" \
        --data "{\"jsonrpc\":\"2.0\",\"method\":\"anvil_stopImpersonatingAccount\",\"params\":[\"$whale_address\"],\"id\":1}" \
        http://localhost:8545 > /dev/null
}

# Transfer tokens (amounts in wei)
transfer_tokens $USDC $USDC_WHALE "USDC" "10000000000"        # 10,000 USDC (6 decimals)
transfer_tokens $USDT $USDT_WHALE "USDT" "10000000000"        # 10,000 USDT (6 decimals)  
transfer_tokens $DAI $DAI_WHALE "DAI" "10000000000000000000000"   # 10,000 DAI (18 decimals)
transfer_tokens $WETH $WETH_WHALE "WETH" "10000000000000000000"  # 10 WETH (18 decimals)

echo ""
echo "✅ Token setup complete! Checking balances..."

# Check balances
echo "📊 Token balances for test account $TEST_ACCOUNT:"

# USDC balance
USDC_BALANCE=$(cast call $USDC "balanceOf(address)" $TEST_ACCOUNT --rpc-url http://localhost:8545)
USDC_FORMATTED=$(echo "scale=2; $((16#${USDC_BALANCE#0x})) / 1000000" | bc -l)
echo "   💙 USDC: $USDC_FORMATTED"

# USDT balance  
USDT_BALANCE=$(cast call $USDT "balanceOf(address)" $TEST_ACCOUNT --rpc-url http://localhost:8545)
USDT_FORMATTED=$(echo "scale=2; $((16#${USDT_BALANCE#0x})) / 1000000" | bc -l)
echo "   💚 USDT: $USDT_FORMATTED"

# DAI balance
DAI_BALANCE=$(cast call $DAI "balanceOf(address)" $TEST_ACCOUNT --rpc-url http://localhost:8545)
DAI_FORMATTED=$(echo "scale=2; $((16#${DAI_BALANCE#0x})) / 1000000000000000000" | bc -l)
echo "   💛 DAI: $DAI_FORMATTED"

# WETH balance
WETH_BALANCE=$(cast call $WETH "balanceOf(address)" $TEST_ACCOUNT --rpc-url http://localhost:8545)
WETH_FORMATTED=$(echo "scale=4; $((16#${WETH_BALANCE#0x})) / 1000000000000000000" | bc -l)
echo "   🔷 WETH: $WETH_FORMATTED"

# ETH balance
ETH_BALANCE=$(cast balance $TEST_ACCOUNT --rpc-url http://localhost:8545)
ETH_FORMATTED=$(echo "scale=2; $((16#${ETH_BALANCE#0x})) / 1000000000000000000" | bc -l)
echo "   ⚡ ETH: $ETH_FORMATTED"

echo ""
echo "🎉 Setup complete! You can now:"
echo "   1. Import test account private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "   2. Connect to localhost:8545 (Chain ID: 31337)" 
echo "   3. Test swaps with real tokens and 1inch liquidity!"
echo ""
echo "💡 Note: 1inch API calls use mainnet data, but transactions execute on your local fork"
