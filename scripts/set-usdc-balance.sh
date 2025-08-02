#!/bin/bash

echo "💰 Manually setting USDC balance for Anvil account..."

# Configuration
ANVIL_RPC="http://localhost:8545"
TARGET_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
USDC_CONTRACT="0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48"

# Amount: 10,000 USDC (with 6 decimals = 10000000000)
USDC_AMOUNT="0x2540BE400"  # 10,000 USDC in hex

echo "🎯 Target Address: $TARGET_ADDRESS"
echo "🪙 USDC Contract: $USDC_CONTRACT"
echo "💵 Amount: 10,000 USDC"

# Get the storage slot for balances mapping (usually slot 9 for USDC)
# For USDC, balances are stored in slot 9
BALANCE_SLOT="9"

# Calculate storage slot for the target address
# keccak256(abi.encode(address, slot))
STORAGE_KEY=$(cast keccak "$(cast abi-encode 'f(address,uint256)' $TARGET_ADDRESS $BALANCE_SLOT)")

echo "🔍 Storage key: $STORAGE_KEY"

# Set the balance directly in storage
echo "🔧 Setting USDC balance in contract storage..."
cast rpc anvil_setStorageAt $USDC_CONTRACT $STORAGE_KEY $USDC_AMOUNT --rpc-url $ANVIL_RPC

echo "✅ USDC balance set!"

# Verify the balance
echo "🔍 Verifying new balance..."
BALANCE=$(cast call $USDC_CONTRACT "balanceOf(address)(uint256)" $TARGET_ADDRESS --rpc-url $ANVIL_RPC)
echo "Raw balance: $BALANCE"

# Convert to readable format (divide by 10^6)
BALANCE_DECIMAL=$(printf "%d" "$BALANCE")
READABLE_BALANCE=$(echo "scale=2; $BALANCE_DECIMAL / 1000000" | bc -l)
echo "💰 New USDC Balance: $READABLE_BALANCE USDC"

echo ""
echo "🎉 Done! Your account now has USDC tokens for testing!"
