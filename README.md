# UPM Decentralized Academic Management System

This project implements a decentralized system on the Ethereum blockchain for managing and verifying academic records at the Polytechnic University of Madrid (UPM).

## Overview

The system allows:
- Students to have digital wallets linked to their academic identity
- University administrators to issue and update academic records
- Employers and third parties to verify the authenticity of academic records
- Secure storage of academic records using blockchain and IPFS

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [IPFS](https://docs.ipfs.tech/install/command-line/) (for decentralized storage)
- [MetaMask](https://metamask.io/) (browser extension)

## Quick Setup

Follow these steps to get the system up and running:

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/TFG-Informatica.git
cd TFG-Informatica

# Install dependencies
./install-dependencies.sh
# Or manually:
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 2. Start the Local Blockchain

Open a terminal and run:

```bash
npx hardhat node
```

Keep this terminal open throughout your session.

### 3. Deploy Smart Contracts and Configure Environment

In a new terminal, run:

```bash
./start-all.sh
```

This script will:
- Deploy all necessary smart contracts
- Update environment files with contract addresses
- Optionally register test students when prompted
- Provide instructions for the next steps

### 4. Start IPFS Daemon

Open a new terminal and run:

```bash
ipfs daemon
```

Keep this terminal open throughout your session.

### 5. Start Backend and Frontend

As instructed by the setup script, in separate terminals run:

```bash
# Terminal 1 - Start backend
cd backend && npm start

# Terminal 2 - Start frontend
cd frontend && npm start
```

### 6. Configure MetaMask

1. Add Hardhat Network to MetaMask:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import a test account:
   - Copy a private key from the Hardhat node terminal
   - In MetaMask: Click 'Import Account' and paste the private key

## Using the Application

1. **View Academic Records**
   - Navigate to "View Credentials" 
   - Enter an Ethereum address or leave blank to view your own records

2. **Verify Credentials**
   - Go to "Verify Credentials"
   - Enter the student's address and credential index
   - Input the academic record data for verification

3. **Issue Credentials (Admin Only)**
   - Connect with an admin account
   - Navigate to "Issue Credential"
   - Fill in the student's address and credential details

## Testing

Run the test suite with:

```bash
./run-all-tests.sh
```

Or run specific tests:

```bash
# Smart contract tests
npx hardhat test test/AcademicRecords.test.js

# IPFS integration tests
npx hardhat test test/Ipfs.test.js
```

## Troubleshooting

- **Contract Deployment Fails**
  - Ensure Hardhat node is running
  - Check you have sufficient test ETH
  - Try restarting the Hardhat node

- **IPFS Connection Issues**
  - Verify IPFS daemon is running
  - Check IPFS endpoint: http://localhost:5001

- **Frontend Can't Connect**
  - Verify contract addresses in .env files are correct
  - Ensure MetaMask is connected to Hardhat network
  - Check console for specific errors

## Project Structure

- `/contracts`: Solidity smart contracts
- `/frontend`: React application
- `/backend`: Node.js server
- `/scripts`: Deployment and utility scripts
- `/test`: Test suite

## Technologies Used

- **Blockchain**: Ethereum, Solidity, Hardhat
- **Storage**: IPFS
- **Frontend**: React, Ethers.js
- **Backend**: Node.js
- **Security**: OpenZeppelin contracts