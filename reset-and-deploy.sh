#!/bin/bash
# Reset and Deploy Script - Fresh Start

echo "🔄 MEDENC Reset and Deploy Script"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
  echo "❌ Error: Please run this script from the medenc root directory"
  exit 1
fi

echo "This script will:"
echo "  1. Clean blockchain artifacts"
echo "  2. Recompile smart contracts"
echo "  3. Deploy fresh contract"
echo "  4. Update contract address in code"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "Step 1: Cleaning artifacts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend
rm -rf artifacts/ cache/
echo "✅ Cleaned artifacts and cache"
echo ""

echo "Step 2: Recompiling contracts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx hardhat compile
if [ $? -ne 0 ]; then
  echo "❌ Compilation failed"
  exit 1
fi
echo "✅ Contracts compiled"
echo ""

echo "Step 3: Deploying to local Hardhat network..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  Make sure Hardhat node is running in another terminal:"
echo "    cd backend && npx hardhat node"
echo ""
read -p "Is Hardhat node running? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Please start Hardhat node first:"
  echo "  cd backend && npx hardhat node"
  exit 1
fi

# Deploy and capture the contract address
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network localhost 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract contract address from output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Contract address:" | awk '{print $NF}')

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "❌ Failed to extract contract address"
  exit 1
fi

echo ""
echo "✅ Contract deployed at: $CONTRACT_ADDRESS"
echo ""

echo "Step 4: Updating contract address in code..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update the contract address in fileRoutes.js
sed -i.bak "s/const contractAddress = \"0x[a-fA-F0-9]*\"/const contractAddress = \"$CONTRACT_ADDRESS\"/" routes/fileRoutes.js

if [ $? -eq 0 ]; then
  echo "✅ Updated routes/fileRoutes.js"
  rm routes/fileRoutes.js.bak
else
  echo "⚠️  Could not auto-update. Please manually update the address in:"
  echo "   backend/routes/fileRoutes.js"
  echo "   Line 22: const contractAddress = \"$CONTRACT_ADDRESS\";"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. (Re)start backend: cd backend && npm start"
echo "  2. Start frontend: cd frontend && npm run dev"
echo "  3. Upload fresh images through the UI"
echo "  4. Test tamper detection: ./test-tamper-detection.sh"
echo ""
echo "📝 Contract Address: $CONTRACT_ADDRESS"
echo ""

