const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  const StudentDirectory = await ethers.getContractFactory("StudentDirectory");
  
  // Get the deployed contract
  const studentDirectoryAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
  const studentDirectory = await StudentDirectory.attach(studentDirectoryAddress);
  
  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using signer address:", signer.address);
  
  // Register a test student
  const testStudentAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Third account in Hardhat
  const name = "Jane";
  const surname = "Smith";
  const secondSurname = "Johnson";
  const studies = "Data Science";
  
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
    console.error("Error registering student:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 