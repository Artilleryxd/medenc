// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ImageRegistry contract...\n");

  // Get the contract factory
  const ImageRegistry = await hre.ethers.getContractFactory("ImageRegistry");

  // Deploy the contract
  console.log("📝 Deploying contract...");
  const registry = await ImageRegistry.deploy();

  // Wait for deployment
  await registry.waitForDeployment();

  const address = await registry.getAddress();

  console.log("✅ ImageRegistry deployed successfully!");
  console.log(`📍 Contract address: ${address}`);
  console.log(`🔗 Network: ${hre.network.name}`);
  console.log("\n⚠️  Update the contract address in routes/fileRoutes.js\n");

  // Verify deployment
  const imageCount = await registry.getImageCount();
  console.log(`📊 Initial image count: ${imageCount}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
