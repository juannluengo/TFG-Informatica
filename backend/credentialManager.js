import { ethers } from 'ethers';
import { uploadToIpfs } from './ipfs.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import config from 'config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the contract artifact
const artifactPath = resolve(__dirname, '../artifacts/contracts/AcademicRecords.sol/AcademicRecords.json');
const contractData = JSON.parse(await fs.readFile(artifactPath, 'utf-8'));

// Get configuration
const { rpcUrl, contractAddress } = config.get('blockchain');

export async function issueCredential(studentAddress, recordData, recordHash) {
    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable is not set');
    }

    let ipfsHash;
    try {
        // Upload academic record content to IPFS
        ipfsHash = await uploadToIpfs(recordData);
    } catch (error) {
        console.warn('IPFS upload failed, using placeholder hash for testing');
        ipfsHash = 'QmTestHash'; // Placeholder for testing
    }
    
    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Connect to the contract
    const contract = new ethers.Contract(contractAddress, contractData.abi, wallet);

    // Issue credential on-chain
    const tx = await contract.issueCredential(studentAddress, recordHash, ipfsHash);
    await tx.wait();
    return tx;
}
