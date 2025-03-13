const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting contract deployment...");
  
  // Get the signers
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  
  try {
    // Deploy AcademicRecords contract
    console.log("Deploying AcademicRecords contract...");
    const AcademicRecords = await ethers.getContractFactory("AcademicRecords");
    const academicRecords = await AcademicRecords.deploy();
    await academicRecords.waitForDeployment();
    const academicRecordsAddress = await academicRecords.getAddress();
    
    console.log(`AcademicRecords deployed to: ${academicRecordsAddress}`);
    
    // Deploy StudentDirectory contract
    console.log("Deploying StudentDirectory contract...");
    const StudentDirectory = await ethers.getContractFactory("StudentDirectory");
    const studentDirectory = await StudentDirectory.deploy();
    await studentDirectory.waitForDeployment();
    const studentDirectoryAddress = await studentDirectory.getAddress();
    
    console.log(`StudentDirectory deployed to: ${studentDirectoryAddress}`);
    
    // Update Backend .env file
    console.log("\nUpdating backend .env file...");
    const backendEnvPath = path.join(__dirname, "..", "backend", ".env");
    if (fs.existsSync(backendEnvPath)) {
      let backendEnvContent = fs.readFileSync(backendEnvPath, "utf8");
      
      // Update CONTRACT_ADDRESS
      backendEnvContent = backendEnvContent.replace(
        /^CONTRACT_ADDRESS=.*/m,
        `CONTRACT_ADDRESS=${academicRecordsAddress}`
      );
      
      // Update STUDENT_DIRECTORY_ADDRESS
      backendEnvContent = backendEnvContent.replace(
        /^STUDENT_DIRECTORY_ADDRESS=.*/m,
        `STUDENT_DIRECTORY_ADDRESS=${studentDirectoryAddress}`
      );
      
      // Update ACADEMIC_RECORDS_ADDRESS
      backendEnvContent = backendEnvContent.replace(
        /^ACADEMIC_RECORDS_ADDRESS=.*/m,
        `ACADEMIC_RECORDS_ADDRESS=${academicRecordsAddress}`
      );
      
      fs.writeFileSync(backendEnvPath, backendEnvContent);
      console.log("Backend .env updated successfully!");
    } else {
      console.error("Backend .env file not found!");
    }
    
    // Update Frontend .env file
    console.log("\nUpdating frontend .env file...");
    const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env");
    if (fs.existsSync(frontendEnvPath)) {
      let frontendEnvContent = fs.readFileSync(frontendEnvPath, "utf8");
      
      // Update REACT_APP_CONTRACT_ADDRESS
      frontendEnvContent = frontendEnvContent.replace(
        /^REACT_APP_CONTRACT_ADDRESS=.*/m,
        `REACT_APP_CONTRACT_ADDRESS=${academicRecordsAddress}`
      );
      
      // Update REACT_APP_STUDENT_DIRECTORY_ADDRESS
      frontendEnvContent = frontendEnvContent.replace(
        /^REACT_APP_STUDENT_DIRECTORY_ADDRESS=.*/m,
        `REACT_APP_STUDENT_DIRECTORY_ADDRESS=${studentDirectoryAddress}`
      );
      
      fs.writeFileSync(frontendEnvPath, frontendEnvContent);
      console.log("Frontend .env updated successfully!");
    } else {
      console.error("Frontend .env file not found!");
    }
    
    console.log("\n--- DEPLOYMENT SUMMARY ---");
    console.log(`AcademicRecords: ${academicRecordsAddress}`);
    console.log(`StudentDirectory: ${studentDirectoryAddress}`);
    console.log("Environment files updated successfully.");
    console.log("\nNext steps:");
    console.log("1. Restart backend: cd backend && npm start");
    console.log("2. Restart frontend: cd frontend && npm start");
    console.log("3. (Optional) Register test students: npx hardhat run scripts/registerTestStudent.js --network localhost");
  } catch (error) {
    console.error("Deployment error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 