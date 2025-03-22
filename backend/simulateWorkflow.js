import { ethers } from 'ethers';
import { issueCredential } from './credentialManager.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { promises as fs } from 'fs';
import config from 'config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let academicRecordsContract;
let studentDirectoryContract;
let provider;
let wallet;

async function loadContractArtifact(contractName) {
    const artifactPath = resolve(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
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

async function initializeContracts() {
    const { rpcUrl, contractAddress } = config.get('blockchain');
    provider = new ethers.JsonRpcProvider(rpcUrl);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Load contract artifacts
    const academicRecordsArtifact = await loadContractArtifact('AcademicRecords');
    const studentDirectoryArtifact = await loadContractArtifact('StudentDirectory');

    // Initialize contracts with signer
    academicRecordsContract = new ethers.Contract(
        contractAddress,
        academicRecordsArtifact.abi,
        wallet
    );

    // Get StudentDirectory address from environment or config
    const studentDirectoryAddress = process.env.STUDENT_DIRECTORY_ADDRESS || config.get('blockchain.studentDirectoryAddress');
    if (!studentDirectoryAddress || !ethers.isAddress(studentDirectoryAddress)) {
        throw new Error('Invalid or missing StudentDirectory contract address');
    }

    studentDirectoryContract = new ethers.Contract(
        studentDirectoryAddress,
        studentDirectoryArtifact.abi,
        wallet
    );
}

// Helper functions for contract interactions
async function registerStudent(address, data) {
    const tx = await studentDirectoryContract.registerStudent(
        address,
        data.name,
        data.surname,
        data.secondSurname,
        data.studies
    );
    const receipt = await tx.wait();
    return receipt;
}

async function getStudent(address) {
    const student = await studentDirectoryContract.getStudent(address);
    return student;
}

async function deactivateStudent(address) {
    const tx = await studentDirectoryContract.deactivateStudent(address);
    const receipt = await tx.wait();
    return receipt;
}

async function reactivateStudent(address) {
    const tx = await studentDirectoryContract.reactivateStudent(address);
    const receipt = await tx.wait();
    return receipt;
}

async function verifyCredential(student, index, recordHash) {
    const isValid = await academicRecordsContract.verifyCredential(student, index, recordHash);
    return isValid;
}

async function updateCredential(student, index, newRecordHash) {
    const tx = await academicRecordsContract.updateCredential(student, index, newRecordHash, "QmUpdatedHash");
    const receipt = await tx.wait();
    return receipt;
}

async function revokeCredential(student, index) {
    const tx = await academicRecordsContract.revokeCredential(student, index);
    const receipt = await tx.wait();
    return receipt;
}

async function addAdmin(address) {
    const tx = await academicRecordsContract.addAdmin(address);
    const receipt = await tx.wait();
    return receipt;
}

async function simulateWorkflow() {
    try {
        console.log('Starting comprehensive simulation...');
        await validateEnvironment();
        console.log('Environment validated successfully');

        // Initialize provider first so we can list accounts
        const { rpcUrl } = config.get('blockchain');
        provider = new ethers.JsonRpcProvider(rpcUrl);

        // Hardhat's default private keys (these are always the same for local development)
        const defaultPrivateKeys = {
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            "0x90F79bf6EB2c4f870365E785982E1f101E93b906": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
            "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
            "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc": "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
            "0x976EA74026E726554dB657fA54763abd0C3a0aa9": "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
            "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955": "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
            "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f": "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
            "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720": "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
        };

        // Print available hardhat node accounts
        console.log('\nAvailable Hardhat Node Accounts:');
        const accounts = await provider.listAccounts();
        for (let i = 0; i < accounts.length; i++) {
            const balance = await provider.getBalance(accounts[i]);
            console.log(`Account ${i}:`);
            console.log(`  Address: ${accounts[i]}`);
            console.log(`  Private Key: ${defaultPrivateKeys[accounts[i]]}`);
            console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
            console.log('');
        }
        
        await initializeContracts();
        console.log('Contracts initialized successfully');

        // Test addresses
        const studentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
        const newAdminAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
        
        // Test data
        const studentData = {
            name: "John",
            surname: "Doe",
            secondSurname: "Smith",
            studies: "Computer Science"
        };
        
        const recordData = "Bachelor's Degree in Computer Science - Grade: A";
        const recordHash = ethers.keccak256(ethers.toUtf8Bytes(recordData));
        
        console.log('\n1. Testing StudentDirectory Contract Functions...');
        
        // Test student registration
        console.log("\nRegistering new student...");
        try {
            await registerStudent(studentAddress, studentData);
            console.log("✓ Student registration successful");
        } catch (error) {
            console.error("✗ Student registration failed:", error.message);
        }

        // Test getting student info
        console.log("\nRetrieving student information...");
        try {
            const student = await getStudent(studentAddress);
            console.log("✓ Student info retrieved:", student);
        } catch (error) {
            console.error("✗ Failed to get student info:", error.message);
        }

        // Test student deactivation
        console.log("\nDeactivating student...");
        try {
            await deactivateStudent(studentAddress);
            console.log("✓ Student deactivated successfully");
        } catch (error) {
            console.error("✗ Student deactivation failed:", error.message);
        }

        // Test student reactivation
        console.log("\nReactivating student...");
        try {
            await reactivateStudent(studentAddress);
            console.log("✓ Student reactivated successfully");
        } catch (error) {
            console.error("✗ Student reactivation failed:", error.message);
        }

        console.log('\n2. Testing AcademicRecords Contract Functions...');

        // Test credential issuance
        console.log("\nIssuing new credential...");
        try {
            const tx = await issueCredential(studentAddress, recordData, recordHash);
            const receipt = await tx.wait();
            console.log("✓ Credential issued successfully");
            console.log("Transaction hash:", receipt.hash);

            // Parse CredentialIssued event
            const events = receipt.logs.filter(log => {
                try {
                    return academicRecordsContract.interface.parseLog(log)?.name === "CredentialIssued";
                } catch (e) {
                    return false;
                }
            });

            if (events.length) {
                const event = academicRecordsContract.interface.parseLog(events[0]);
                console.log("\nCredential details:");
                console.log("Student:", event.args.student);
                console.log("Index:", event.args.index.toString());
                console.log("Issuer:", event.args.issuer);
                console.log("RecordHash:", event.args.recordHash);
                console.log("IPFS Hash:", event.args.ipfsHash);
                console.log("Timestamp:", new Date(Number(event.args.timestamp) * 1000).toLocaleString());

                // Store credential index for further tests
                const credentialIndex = event.args.index;

                // Test credential verification
                console.log("\nVerifying credential...");
                try {
                    const isValid = await verifyCredential(studentAddress, credentialIndex, recordHash);
                    console.log("✓ Credential verification:", isValid ? "Valid" : "Invalid");
                } catch (error) {
                    console.error("✗ Credential verification failed:", error.message);
                }

                // Test credential update
                console.log("\nUpdating credential...");
                const updatedRecordData = "Bachelor's Degree in Computer Science - Grade: A+ (Updated)";
                const updatedRecordHash = ethers.keccak256(ethers.toUtf8Bytes(updatedRecordData));
                try {
                    await updateCredential(studentAddress, credentialIndex, updatedRecordHash);
                    console.log("✓ Credential updated successfully");
                } catch (error) {
                    console.error("✗ Credential update failed:", error.message);
                }

                // Test credential revocation
                console.log("\nRevoking credential...");
                try {
                    await revokeCredential(studentAddress, credentialIndex);
                    console.log("✓ Credential revoked successfully");
                } catch (error) {
                    console.error("✗ Credential revocation failed:", error.message);
                }
            }
        } catch (error) {
            console.error("\nCredential issuance failed:");
            console.error("Error details:", error);
            if (error.data) {
                console.error("Contract error data:", error.data);
            }
        }

        // Test admin management
        console.log('\n3. Testing Admin Management...');
        
        console.log("\nAdding new admin...");
        try {
            await addAdmin(newAdminAddress);
            console.log("✓ New admin added successfully");
        } catch (error) {
            console.error("✗ Failed to add new admin:", error.message);
        }

        console.log('\nSimulation completed successfully!');

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
