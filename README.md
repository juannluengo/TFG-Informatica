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

# Project Setup and Testing

## Prerequisites
- [Node.js](https://nodejs.org/en/) installed

## Setup
- From the project root, install dependencies:
  ```bash
  npm install
  ```

## Hardhat Toolbox Dependencies
To enable all features of @nomicfoundation/hardhat-toolbox, install the following dependencies:
```bash
npm install --save-dev "@nomicfoundation/hardhat-chai-matchers@^2.0.0" "@nomicfoundation/hardhat-ethers@^3.0.0" "@nomicfoundation/hardhat-ignition-ethers@^0.15.0" "@nomicfoundation/hardhat-network-helpers@^1.0.0" "@nomicfoundation/hardhat-verify@^2.0.0" "@typechain/ethers-v6@^0.5.0" "@typechain/hardhat@^9.0.0" "@types/chai@^4.2.0" "@types/mocha@>=9.1.0" "hardhat-gas-reporter@^1.0.8" "solidity-coverage@^0.8.1" "ts-node@>=8.0.0" "typechain@^8.3.0" "typescript@>=4.5.0"
```

## Installing Hardhat Toolbox Dependencies
If you encounter dependency conflicts during installation, try:
```bash
npm install --save-dev "@nomicfoundation/hardhat-chai-matchers@^2.0.0" "@nomicfoundation/hardhat-ethers@^3.0.0" "@nomicfoundation/hardhat-ignition-ethers@^0.15.0" "@nomicfoundation/hardhat-network-helpers@^1.0.0" "@nomicfoundation/hardhat-verify@^2.0.0" "@typechain/ethers-v6@^0.5.0" "@typechain/hardhat@^9.0.0" "@types/chai@^4.2.0" "@types/mocha@>=9.1.0" "hardhat-gas-reporter@^1.0.8" "solidity-coverage@^0.8.1" "ts-node@>=8.0.0" "typechain@^8.3.0" "typescript@>=4.5.0" --legacy-peer-deps
```

Alternatively, update your project's Chai version to one compatible with these dependencies (Chai ^4.2.0).

## Installing Ignition Dependencies
If you encounter an error related to @nomicfoundation/hardhat-ignition-ethers, install the following:
```bash
npm install --save-dev "@nomicfoundation/ignition-core@^0.15.9" "@nomicfoundation/hardhat-ignition@^0.15.9" --legacy-peer-deps
```
Or without the flag if no conflicts arise.

## Running Tests
- To run the tests, execute:
  ```bash
  npx hardhat test
  ```
- This command deploys the contract to a local Hardhat network and executes the test suite in the `/test` directory.

# Complete Setup and Running Guide

## Prerequisites
- Node.js (v16 or higher)
- Git
- MetaMask wallet (for testing)

## Project Structure
```
├── artifacts/          # Compiled contract artifacts
├── backend/           # Node.js backend server
├── contracts/         # Solidity smart contracts
├── frontend/          # React frontend application
├── scripts/          # Deployment and migration scripts
└── test/             # Contract test files
```

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd TFG-Informatica
```

2. Install root project dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

## Configuration

1. Create a .env file in the project root:
```bash
# Local Hardhat Network
HARDHAT_NETWORK=localhost
PRIVATE_KEY=your_private_key_here  # Your Ethereum wallet private key
```

2. Update backend/config/default.json with your network configuration:
```json
{
    "blockchain": {
        "rpcUrl": "http://127.0.0.1:8545",
        "contractAddress": "your_deployed_contract_address"
    }
}
```

## Running the Project

1. Start a local Hardhat node:
```bash
npx hardhat node
```

2. Deploy the smart contracts (in a new terminal):
```bash
npx hardhat run scripts/deploy.js --network localhost
```
- Copy the deployed contract address and update it in backend/config/default.json

3. Run the backend server:
```bash
cd backend
npm start
```

4. Start the frontend application:
```bash
cd frontend
npm start
```

## Running the Frontend Application

### Prerequisites
- MetaMask wallet installed in your browser
- Local Hardhat node running
- Smart contracts deployed
- Node.js and npm installed

### Steps to Run the Frontend

1. Make sure you have MetaMask installed and connected to your local Hardhat network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import a test account to MetaMask:
   - Use one of the private keys provided by Hardhat when you start the local node
   - These accounts come pre-loaded with test ETH

3. Navigate to the frontend directory:
```bash
cd frontend
```

4. Install dependencies (if not done already):
```bash
npm install
```

5. Start the development server:
```bash
npm start
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

7. Connect your MetaMask wallet when prompted by the application

### Using the Application

1. **View Credentials:**
   - Navigate to the "View Credentials" page
   - Enter an Ethereum address or leave blank to view your own credentials
   - Click "View Credentials" to see all academic records

2. **Verify Credentials:**
   - Go to the "Verify Credentials" page
   - Enter the student's address and credential index
   - Input the academic record data
   - Click "Verify" to check the credential's authenticity

3. **Issue Credentials (Admin Only):**
   - Connect with an admin account
   - Navigate to "Issue Credential"
   - Fill in the student's address and credential details
   - Submit to issue the credential

### Troubleshooting Frontend Issues

- If the app can't connect to the blockchain:
  - Ensure your local Hardhat node is running
  - Verify MetaMask is connected to the correct network
  - Check if the contract address in the frontend matches your deployed contract

- If transactions fail:
  - Make sure you have enough test ETH in your account
  - Verify you're using the correct account (admin for restricted functions)
  - Check the browser console for detailed error messages

## Testing

1. Run smart contract tests:
```bash
npx hardhat test
```

2. Run backend tests:
```bash
cd backend
npm test
```

3. Run frontend tests:
```bash
cd frontend
npm test
```

## Workflow Simulation

To test the complete workflow:

1. Ensure the local Hardhat node is running
2. Export your private key (from MetaMask or Hardhat account):
```bash
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

3. Run the simulation:
```bash
cd backend
node simulateWorkflow.js
```

## Common Issues and Solutions

### Contract Deployment Fails
- Ensure you have sufficient ETH in your account
- Check that the network RPC URL is correct
- Verify Hardhat network is running

### Transaction Errors
- Check that you're using the correct contract address
- Ensure your wallet has the ADMIN_ROLE for restricted functions
- Verify gas settings in hardhat.config.js

### IPFS Connection Issues
- Ensure IPFS daemon is running locally or use a public gateway
- Check IPFS configuration in backend/config/default.json

## Working with the Smart Contract

### Key Functions

1. Issuing Credentials:
```javascript
const tx = await contract.issueCredential(
    studentAddress,
    recordHash,
    ipfsHash
);
```

2. Verifying Credentials:
```javascript
const isValid = await contract.verifyCredential(
    studentAddress,
    credentialIndex,
    recordHash
);
```

3. Revoking Credentials:
```javascript
const tx = await contract.revokeCredential(
    studentAddress,
    credentialIndex
);
```

### Events to Monitor

- CredentialIssued: Emitted when a new credential is issued
- CredentialRevoked: Emitted when a credential is revoked
- CredentialUpdated: Emitted when a credential is updated

## Deploying to Other Networks

1. Update hardhat.config.js with your network configuration:
```javascript
networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY]
    }
}
```

2. Deploy to the selected network:
```bash
npx hardhat run scripts/deploy.js --network goerli
```

3. Update the contract address in your configuration files

## Security Considerations

- Never commit private keys or sensitive configuration
- Use .env files for sensitive data
- Implement rate limiting for API endpoints
- Follow Role-Based Access Control (RBAC) best practices
- Regularly update dependencies for security patches

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request