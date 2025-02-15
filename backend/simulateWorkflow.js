const { issueCredential } = require('./credentialManager');
const { ethers } = require('ethers');
const { keccak256, toUtf8Bytes } = ethers.utils;

async function simulateWorkflow() {
    // Sample academic record data
    const recordData = "This is a test academic record for the simulation.";
    const recordHash = keccak256(toUtf8Bytes(recordData));
    
    // Replace with a valid student address from your local network or testnet
    const studentAddress = "0xYourTestStudentAddressHere"; 

    try {
        console.log("Uploading record to IPFS and issuing credential...");
        const tx = await issueCredential(studentAddress, recordData, recordHash);
        await tx.wait();
        console.log("Transaction completed.", tx);

        // Retrieve the transaction receipt and filter CredentialIssued events
        const receipt = await tx.wait();
        const events = receipt.events.filter(event => event.event === "CredentialIssued");

        if (events.length) {
            const eventArgs = events[0].args;
            console.log("CredentialIssued event found:");
            console.log("Student:", eventArgs.student);
            console.log("Index:", eventArgs.index.toString());
            console.log("Issuer:", eventArgs.issuer);
            console.log("RecordHash:", eventArgs.recordHash);
            console.log("IPFS Hash (CID):", eventArgs.ipfsHash);
            console.log("Timestamp:", eventArgs.timestamp.toString());
        } else {
            console.log("CredentialIssued event not found in logs.");
        }
    } catch (error) {
        console.error("Simulation failed:", error);
    }
}

simulateWorkflow();
