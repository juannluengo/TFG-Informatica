const { ethers } = require("hardhat");
const { uploadToIpfs } = require("../backend/ipfs.js");

async function main() {
  const studentAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  // Get the contract
  const AcademicRecords = await ethers.getContractFactory("AcademicRecords");
  const contract = await AcademicRecords.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Sample credentials
  const credentials = [
    {
      data: "Bachelor's Degree in Computer Science - GPA 3.8 - Graduated 2023",
      metadata: {
        degree: "Bachelor's in Computer Science",
        gpa: 3.8,
        graduationYear: 2023,
        institution: "Example University"
      }
    },
    {
      data: "Master's Degree in Artificial Intelligence - GPA 3.9 - Graduated 2024",
      metadata: {
        degree: "Master's in Artificial Intelligence",
        gpa: 3.9,
        graduationYear: 2024,
        institution: "Example University"
      }
    },
    {
      data: "Blockchain Development Certification - Advanced Level - 2024",
      metadata: {
        certification: "Blockchain Development",
        level: "Advanced",
        year: 2024,
        institution: "Blockchain Academy"
      }
    }
  ];

  console.log("Adding test credentials to address:", studentAddress);

  for (const cred of credentials) {
    try {
      // First upload the full credential data to IPFS
      const ipfsHash = await uploadToIpfs(cred);
      console.log(`✓ Uploaded to IPFS with hash: ${ipfsHash}`);

      // Create hash of the credential data
      const recordHash = ethers.keccak256(ethers.toUtf8Bytes(cred.data));
      
      // Issue the credential with the real IPFS hash
      const tx = await contract.issueCredential(studentAddress, recordHash, ipfsHash);
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