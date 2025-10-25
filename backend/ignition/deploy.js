import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const EHR = await hre.ethers.getContractFactory("ElectronicHealthRecords");

  // In Ethers v6, deploy() returns the deployed contract directly
  const ehr = await EHR.deploy();

  // Wait for the deployment transaction to be mined
  await ehr.waitForDeployment();

  console.log("ElectronicHealthRecords deployed to:", ehr.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
