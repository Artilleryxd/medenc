import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Connect to local Hardhat node
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Load ABI
const artifactPath = path.join(process.cwd(), "backend", "artifacts", "contracts", "EHR.sol", "ElectronicHealthRecords.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
const abi = artifact.abi;

// Contract address after deployment
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // replace after deployment

// Export contract instance with signer
export const ehrContract = new ethers.Contract(contractAddress, abi, provider.getSigner(0));
export const providerConnection = provider;
