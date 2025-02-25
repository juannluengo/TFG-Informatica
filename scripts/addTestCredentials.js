const { ethers } = require("hardhat");
const { uploadToIpfs } = require("../backend/ipfs.js");
const fs = require("fs");
const path = require("path");

async function main() {
  const studentAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  // Read contract address from backend config
  let contractAddress;
  try {
    const configPath = path.join(__dirname, "../backend/config/default.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    contractAddress = config.blockchain.contractAddress;
    console.log("Using contract address from config:", contractAddress);
  } catch (error) {
    console.warn("Failed to read contract address from config:", error.message);
    contractAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"; // Fallback to the last known address
    console.log("Using fallback contract address:", contractAddress);
  }
  
  // Get the contract
  const AcademicRecords = await ethers.getContractFactory("AcademicRecords");
  const contract = await AcademicRecords.attach(contractAddress);

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

  for (let i = 0; i < credentials.length; i++) {
    const cred = credentials[i];
    try {
      // Add index to make each credential unique
      const uniqueData = { ...cred, index: i };
      
      // First upload the full credential data to IPFS
      const ipfsHash = await uploadToIpfs(uniqueData);
      console.log(`✓ Uploaded to IPFS with hash: ${ipfsHash}`);

      // Create hash of the credential data string only, not the entire object
      // This ensures we can verify using the plain text later
      const recordHash = ethers.keccak256(ethers.toUtf8Bytes(cred.data));
      console.log(`✓ Created record hash: ${recordHash} from data: "${cred.data}"`);
      
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