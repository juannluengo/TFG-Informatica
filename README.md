# UPM Decentralized Academic Management System

This project is an experimental thesis for my Computer Science Engineering degree aimed at designing a decentralized system on the Ethereum blockchain for managing and verifying academic records at the Polytechnic University of Madrid (UPM). The system leverages blockchain technology to ensure data immutability, transparency, and secure sharing of academic credentials.

## Project Purpose

The objective of this project is to create a prototype decentralized application (DApp) that:
- Allows each student to have a digital wallet linked to their academic identity.
- Enables university administrators to issue and update academic records (e.g., subjects, grades, honors).
- Provides a mechanism for employers and other third parties to verify the authenticity of these records.
- Utilizes a hybrid storage approach where essential metadata and cryptographic hashes are stored on-chain, while detailed academic records are stored off-chain using IPFS.

## Technologies and Their Interactions

### Backend & Development
- **Node.js:**  
  Provides a robust backend environment to manage the application logic and integrate with the blockchain.
  
- **Hardhat:**  
  A development environment used for compiling, deploying, and testing Solidity smart contracts. Hardhat also enables local blockchain simulations to streamline development.

### Smart Contract Development
- **Solidity:**  
  The programming language for writing Ethereum smart contracts. These contracts manage student registration, record issuance, and verification.
  
- **OpenZeppelin:**  
  A library of secure and tested smart contract components used to implement role-based access control and other security features in our contracts.

### Off-Chain Storage
- **IPFS (InterPlanetary File System):**  
  Used to store large academic records (like full transcripts) off-chain. Only the cryptographic hashes and metadata (pointers to IPFS content) are stored on-chain, ensuring data integrity while reducing gas costs.

### Frontend
- **React:**  
  The framework used to build a user-friendly interface for students, administrators, and verifiers to interact with the system.
  
- **Ethers.js:**  
  A JavaScript library that facilitates communication between the React frontend and the Ethereum blockchain, making it easier to read from and write to smart contracts.

## How They Interact

1. **User Registration and Data Management:**
   - **Students** register and link their Ethereum wallet to their academic identity via the DApp.
   - **University Administrators** issue academic records by invoking smart contract functions.

2. **Smart Contract Functionality:**
   - **StudentRegistry.sol:**  
     Manages student registration, linking each student to their unique Ethereum address.
   - **AcademicRecord.sol:**  
     Handles the issuance of academic records by recording essential data (subjects, grades, timestamps) and storing corresponding IPFS hashes on-chain.
   - **Verifier.sol:**  
     Provides read-only functions that allow employers and third parties to verify academic credentials by retrieving the IPFS CID (Content Identifier) and comparing it against on-chain data.

3. **Hybrid Storage Model:**
   - **On-Chain:**  
     Only essential metadata, such as cryptographic hashes and pointers, are stored. This ensures the integrity and traceability of records without incurring high gas costs.
   - **Off-Chain (IPFS):**  
     Stores full academic records, ensuring that detailed data remains available and tamper-evident through the corresponding on-chain hash.

4. **Development and Testing:**
   - **Hardhat** is used to simulate blockchain interactions in a local environment, enabling thorough testing of smart contracts.
   - **React** and **Ethers.js** work together to provide a responsive and interactive user interface, bridging the gap between the blockchain and the end users.

## Project Roadmap

The project is structured into two main phases:

- **Phase 1: Problem Analysis and Architectural Design**
  - Define actors (students, administrators, verifiers).
  - Decide on data storage (on-chain vs. off-chain) and analyze similar systems.
  - Develop a high-level architecture and design document.

- **Phase 2: Smart Contract Development (Theoretical)**
  - **2.1 Define Smart Contract Requirements:**  
    Outline functions for student registration, academic record issuance, and record verification.
  - **2.2 Develop Smart Contracts:**  
    Create contracts (StudentRegistry.sol, AcademicRecord.sol, and Verifier.sol) using Solidity and test them with Hardhat.
  - **2.3 Testing & Security:**  
    Write unit tests to simulate real-world interactions and implement security measures like role-based permissions and EIP-712 signatures for off-chain verification.

