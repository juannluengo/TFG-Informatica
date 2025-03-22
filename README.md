# UPM Decentralized Academic Management System

This project implements a decentralized system on the Ethereum blockchain for managing and verifying academic records at the Polytechnic University of Madrid (UPM).

## Overview

The system allows:
- Students to have digital wallets linked to their academic identity
- University administrators to issue and update academic records
- Employers and third parties to verify the authenticity of academic records
- Secure storage of academic records using blockchain and IPFS

## Prerequisites

Before starting, make sure you have installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [IPFS](https://docs.ipfs.tech/install/command-line/) (for decentralized storage)
- [MetaMask](https://metamask.io/) (browser extension)

## Quick Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/TFG-Informatica.git
cd TFG-Informatica
```

2. Make the setup script executable:
```bash
chmod +x start-all.sh
```

3. Run the setup script:
```bash
./start-all.sh
```

The script will automatically:
- Create all necessary environment files
- Install dependencies for all components
- Start a local Hardhat node
- Deploy smart contracts
- Update environment configurations
- Optionally register test students
- Start IPFS daemon (if not running)
- Launch backend and frontend servers

4. Configure MetaMask:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
   - Import the default test account:
     ```
     Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
     ```

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

## Monitoring and Cleanup

- Check service status in the terminal where you ran `start-all.sh`
- View logs in the generated log files:
  - `hardhat.log`: Blockchain node logs
  - `backend.log`: Backend server logs
  - `frontend.log`: Frontend server logs
  - `ipfs.log`: IPFS daemon logs

To stop all services and clean up:
```bash
./cleanup.sh
```

## Project Structure

- `/contracts`: Solidity smart contracts
- `/frontend`: React application
- `/backend`: Node.js server
- `/scripts`: Deployment and utility scripts
- `/test`: Test suite

## Technologies

- **Blockchain**: Ethereum, Solidity, Hardhat
- **Storage**: IPFS
- **Frontend**: React, Ethers.js
- **Backend**: Node.js
- **Security**: OpenZeppelin contracts