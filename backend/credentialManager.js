const { ethers } = require('ethers');
const { uploadToIpfs } = require('./ipfs');

// Import contract ABI (update the path if necessary)
const contractAbi = require('../artifacts/AcademicRecords.json').abi;

// Update with the deployed contract address
const contractAddress = 'DEPLOYED_CONTRACT_ADDRESS';

// Example function to issue a credential
async function issueCredential(studentAddress, recordData, recordHash) {
    // Upload academic record content to IPFS
    const ipfsHash = await uploadToIpfs(recordData);
    
    // Initialize provider and wallet (update RPC endpoint and PRIVATE_KEY)
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    const wallet = new ethers.Wallet('PRIVATE_KEY', provider);

    // Connect to the contract
    const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

    // Issue credential on-chain, passing the IPFS hash as pointer
    const tx = await contract.issueCredential(studentAddress, recordHash, ipfsHash);
    await tx.wait();
    return tx;
}

module.exports = { issueCredential };
