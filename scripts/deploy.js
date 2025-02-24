// Purpose: A deployment script using Hardhat (or another deployment framework) to compile and deploy your smart contracts onto a local blockchain 
// or a testnet (e.g., Goerli or Sepolia).
// Contents: Script logic to fetch contract factories, deploy contracts, and log deployment addresses.

const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  const AcademicRecords = await ethers.getContractFactory("AcademicRecords");
  
  // Deploy the contract
  console.log("Deploying AcademicRecords contract...");
  const contract = await AcademicRecords.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("AcademicRecords deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });