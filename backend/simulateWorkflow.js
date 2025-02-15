import { ethers } from 'ethers';
import { issueCredential } from './credentialManager.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { promises as fs } from 'fs';
import config from 'config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadContractArtifact() {
    const artifactPath = resolve(__dirname, '../artifacts/contracts/AcademicRecords.sol/AcademicRecords.json');
    const contractData = await fs.readFile(artifactPath, 'utf-8');
    return JSON.parse(contractData);
}

async function validateEnvironment() {
    if (!process.env.PRIVATE_KEY || !process.env.PRIVATE_KEY.match(/^0x[0-9a-fA-F]{64}$/)) {
        throw new Error('PRIVATE_KEY environment variable must be a 64-character hex string starting with 0x');
    }
    
    const { contractAddress } = config.get('blockchain');
    if (!ethers.isAddress(contractAddress)) {
        throw new Error('Invalid contract address in config/default.json');
    }
}

async function simulateWorkflow() {
    try {
        console.log('Starting simulation...');
        await validateEnvironment();
        console.log('Environment validated successfully');
        
        const contractArtifact = await loadContractArtifact();
        console.log('Contract artifact loaded');

        // Sample academic record data
        const recordData = "This is a test academic record for the simulation.";
        const recordHash = ethers.keccak256(ethers.toUtf8Bytes(recordData));
        
        // Example test address - replace with actual address when testing
        const studentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; 

        console.log("Uploading record to IPFS and issuing credential...");
        try {
            const tx = await issueCredential(studentAddress, recordData, recordHash);
            console.log("Transaction sent:", tx.hash);
            
            // Retrieve the transaction receipt and filter CredentialIssued events
            const receipt = await tx.wait();
            console.log("Transaction mined:", receipt.hash);
            
            const events = receipt.logs.filter(log => {
                try {
                    return contractArtifact.abi.parseLog(log)?.name === "CredentialIssued";
                } catch (e) {
                    return false;
                }
            });

            if (events.length) {
                const event = contractArtifact.abi.parseLog(events[0]);
                console.log("\nCredential issued successfully!");
                console.log("Student:", event.args.student);
                console.log("Index:", event.args.index.toString());
                console.log("Issuer:", event.args.issuer);
                console.log("RecordHash:", event.args.recordHash);
                console.log("IPFS Hash (CID):", event.args.ipfsHash);
                console.log("Timestamp:", new Date(Number(event.args.timestamp) * 1000).toLocaleString());
            }
        } catch (error) {
            console.error("\nTransaction failed:");
            console.error("Error details:", error);
            if (error.data) {
                console.error("Contract error data:", error.data);
            }
        }
    } catch (error) {
        console.error("\nSimulation failed:");
        console.error("Error details:", error);
        if (error.message.includes('PRIVATE_KEY')) {
            console.error("Please set a valid private key. Example format:");
            console.error("PRIVATE_KEY=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
        }
    }
}

simulateWorkflow();
