#!/bin/bash

# Whale Impersonation Script for Anvil Fork
# This script impersonates a USDC whale and transfers USDC to the default Anvil account

echo "🐋 Starting Whale Impersonation Script..."

# Configuration
ANVIL_RPC="http://localhost:8545"
TARGET_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"  # Default Anvil Account #0
USDC_CONTRACT="0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48"   # USDC on Mainnet (correct address)
USDT_CONTRACT="0xdAC17F958D2ee523a2206206994597C13D831ec7"   # USDT on Mainnet

# Known whale addresses (have large amounts of tokens)
USDC_WHALE="0x55FE002aefF02F77364de339a1292923A15844B8"      # Circle: USDC Treasury with lots of USDC
USDT_WHALE="0x5754284f345afc66a98fbB0a0Afe71e0F007B949"      # Large USDT holder
ETH_WHALE="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"       # Vitalik's address

echo "🎯 Target Address: $TARGET_ADDRESS"
echo "🐋 USDC Whale: $USDC_WHALE"
echo "🐋 USDT Whale: $USDT_WHALE"
echo "🐋 ETH Whale: $ETH_WHALE"

# Function to check if address has tokens
check_balance() {
    local token_contract=$1
    local address=$2
    local token_name=$3
    
    echo "💰 Checking $token_name balance for $address..."
    cast call $token_contract "balanceOf(address)" $address --rpc-url $ANVIL_RPC
}

# Function to impersonate account and transfer tokens
transfer_tokens() {
    local whale_address=$1
    local token_contract=$2
    local target_address=$3
    local amount=$4
    local token_name=$5
    
    echo "🔄 Impersonating $whale_address to transfer $token_name..."
    
    # Impersonate the whale account
    cast rpc anvil_impersonateAccount $whale_address --rpc-url $ANVIL_RPC
    
    # Check whale's balance before transfer
    echo "📊 Whale's $token_name balance before transfer:"
    check_balance $token_contract $whale_address $token_name
    
    # Transfer tokens to target address
    echo "💸 Transferring $amount $token_name to $target_address..."
    cast send $token_contract "transfer(address,uint256)" $target_address $amount \
        --from $whale_address \
        --rpc-url $ANVIL_RPC \
        --unlocked
    
    # Stop impersonating
    cast rpc anvil_stopImpersonatingAccount $whale_address --rpc-url $ANVIL_RPC
    
    echo "✅ Transfer completed!"
}

# Give ETH to target address (10 ETH)
echo "💎 Giving 10 ETH to target address..."
cast rpc anvil_setBalance $TARGET_ADDRESS "0x8AC7230489E80000" --rpc-url $ANVIL_RPC  # 10 ETH in hex

# Transfer 10,000 USDC (6 decimals)
USDC_AMOUNT="10000000000"  # 10,000 USDC with 6 decimals
transfer_tokens $USDC_WHALE $USDC_CONTRACT $TARGET_ADDRESS $USDC_AMOUNT "USDC"

# Transfer 5,000 USDT (6 decimals)
USDT_AMOUNT="5000000000"   # 5,000 USDT with 6 decimals
transfer_tokens $USDT_WHALE $USDT_CONTRACT $TARGET_ADDRESS $USDT_AMOUNT "USDT"

echo ""
echo "🎉 Whale impersonation complete! Final balances:"
echo ""

# Check final balances
echo "📊 ETH Balance:"
cast balance $TARGET_ADDRESS --rpc-url $ANVIL_RPC

echo "📊 USDC Balance:"
usdc_balance=$(cast call $USDC_CONTRACT "balanceOf(address)" $TARGET_ADDRESS --rpc-url $ANVIL_RPC)
usdc_formatted=$(cast --to-dec $usdc_balance)
echo "Raw: $usdc_balance"
echo "Formatted: $(echo "scale=6; $usdc_formatted / 1000000" | bc) USDC"

echo "📊 USDT Balance:"
usdt_balance=$(cast call $USDT_CONTRACT "balanceOf(address)" $TARGET_ADDRESS --rpc-url $ANVIL_RPC)
usdt_formatted=$(cast --to-dec $usdt_balance)
echo "Raw: $usdt_balance"
echo "Formatted: $(echo "scale=6; $usdt_formatted / 1000000" | bc) USDT"

echo ""
echo "🚀 Ready for testing! Your account now has:"
echo "   • 10 ETH"
echo "   • 10,000 USDC" 
echo "   • 5,000 USDT"
echo ""
echo "💡 You can now test swaps in your dApp!"
