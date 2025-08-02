#!/bin/bash

echo "🔧 Installing Foundry (Forge, Cast, Anvil)..."

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Add foundry to PATH for current session
export PATH="$PATH:$HOME/.foundry/bin"

echo "✅ Foundry installation initiated!"
echo ""
echo "📝 Next steps:"
echo "1. Restart your terminal or run: source ~/.zshrc"
echo "2. Or manually add to your PATH: export PATH=\"\$PATH:\$HOME/.foundry/bin\""
echo "3. Then run: foundryup"
echo "4. Start Anvil with: anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/q5nyl5T11-vTcF_ZRTvjvIoM1q1lEWqk"
echo ""
echo "💡 Alternative: Use Hardhat instead:"
echo "   npm install --save-dev hardhat"
echo "   npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/q5nyl5T11-vTcF_ZRTvjvIoM1q1lEWqk"
