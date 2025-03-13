const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load the backend .env file to get the contract address
const backendEnvPath = path.join(__dirname, "..", "backend", ".env");
dotenv.config({ path: backendEnvPath });

async function main() {
  try {
    // Get the contract factory
    const StudentDirectory = await ethers.getContractFactory("StudentDirectory");
    
    // Get the deployed contract address from .env
    const studentDirectoryAddress = process.env.STUDENT_DIRECTORY_ADDRESS;
    
    if (!studentDirectoryAddress) {
      console.error("ERROR: Student Directory contract address not found in backend/.env file.");
      console.error("Run 'npx hardhat run scripts/deploy-and-update-envs.js --network localhost' first.");
      process.exit(1);
    }

    console.log("Using StudentDirectory contract at:", studentDirectoryAddress);
    const studentDirectory = await StudentDirectory.attach(studentDirectoryAddress);
    
    // Verify contract is accessible
    try {
      await studentDirectory.getStudentCount();
    } catch (error) {
      console.error("Error verifying contract access:", error.message);
      console.log("Please verify the contract address and deployment");
      process.exit(1);
    }
    
    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log("Using signer address:", signer.address);
    
    // Register a test student
    const testStudentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Second account in Hardhat
    const name = "Pedro";
    const surname = "Picapiedra";
    const secondSurname = "";
    const studies = "Computer Science";
    
    console.log("Registering student with address:", testStudentAddress);
    
    try {
      const tx = await studentDirectory.registerStudent(
        testStudentAddress,
        name,
        surname,
        secondSurname,
        studies
      );
      
      console.log("Transaction hash:", tx.hash);
      await tx.wait();
      console.log("Student registered successfully!");
      
      // Get student count
      const count = await studentDirectory.getStudentCount();
      console.log("Total students:", count.toString());
      
      // Get student info
      const student = await studentDirectory.getStudent(testStudentAddress);
      console.log("Student info:", {
        name: student.name,
        surname: student.surname,
        secondSurname: student.secondSurname,
        studies: student.studies,
        active: student.active
      });
      
    } catch (error) {
      console.error("Error in contract interaction:", error.message);
      if (error.message.includes("execution reverted")) {
        console.log("This might be due to:");
        console.log("1. The student is already registered");
        console.log("2. The signer doesn't have the ADMIN_ROLE");
        console.log("3. The contract address is incorrect");
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 