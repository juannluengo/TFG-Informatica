// Purpose: A deployment script using Hardhat (or another deployment framework) to compile and deploy your smart contracts onto a local blockchain 
// or a testnet (e.g., Goerli or Sepolia).
// Contents: Script logic to fetch contract factories, deploy contracts, and log deployment addresses.

const { ethers } = require("hardhat");

async function main() {
  // Get the contract factories
  const AcademicRecords = await ethers.getContractFactory("AcademicRecords");
  const StudentDirectory = await ethers.getContractFactory("StudentDirectory");
  
  // Deploy the AcademicRecords contract
  console.log("Deploying AcademicRecords contract...");
  const academicRecordsContract = await AcademicRecords.deploy();
  await academicRecordsContract.waitForDeployment();
  
  const academicRecordsAddress = await academicRecordsContract.getAddress();
  console.log("AcademicRecords deployed to:", academicRecordsAddress);
  
  // Deploy the StudentDirectory contract
  console.log("Deploying StudentDirectory contract...");
  const studentDirectoryContract = await StudentDirectory.deploy();
  await studentDirectoryContract.waitForDeployment();
  
  const studentDirectoryAddress = await studentDirectoryContract.getAddress();
  console.log("StudentDirectory deployed to:", studentDirectoryAddress);
  
  console.log("Deployment complete!");
  console.log("AcademicRecords:", academicRecordsAddress);
  console.log("StudentDirectory:", studentDirectoryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });