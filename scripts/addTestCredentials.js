const { ethers } = require("hardhat");

async function main() {
  const studentAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  // Get the contract
  const AcademicRecords = await ethers.getContractFactory("AcademicRecords");
  const contract = await AcademicRecords.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Sample credentials
  const credentials = [
    {
      data: "Bachelor's Degree in Computer Science - GPA 3.8 - Graduated 2023",
      ipfsHash: "QmSampleHash1" // This would be a real IPFS hash in production
    },
    {
      data: "Master's Degree in Artificial Intelligence - GPA 3.9 - Graduated 2024",
      ipfsHash: "QmSampleHash2"
    },
    {
      data: "Blockchain Development Certification - Advanced Level - 2024",
      ipfsHash: "QmSampleHash3"
    }
  ];

  console.log("Adding test credentials to address:", studentAddress);

  for (const cred of credentials) {
    // Create hash of the credential data
    const recordHash = ethers.keccak256(ethers.toUtf8Bytes(cred.data));
    
    try {
      // Issue the credential
      const tx = await contract.issueCredential(studentAddress, recordHash, cred.ipfsHash);
      await tx.wait();
      
      console.log(`✓ Credential issued successfully: ${cred.data}`);
      console.log(`  Transaction hash: ${tx.hash}`);
    } catch (error) {
      console.error(`✗ Failed to issue credential: ${cred.data}`);
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log("\nAll test credentials have been processed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });