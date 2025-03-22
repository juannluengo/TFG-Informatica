#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}UPM Decentralized Academic Management System${NC}"
echo -e "${BLUE}=========================================${NC}"

# Function to create root .env file
create_root_env() {
    echo -e "\n${GREEN}Creating root .env file...${NC}"
    cat > .env << EOL
# Hardhat Network Private Key (this is the default hardhat test account #0 private key)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Optional: Infura Project ID (only needed if deploying to testnet/mainnet)
INFURA_PROJECT_ID=

# RPC URL (local hardhat network)
RPC_URL=http://127.0.0.1:8545
EOL
    echo -e "${GREEN}Root .env file created successfully!${NC}"
}

# Function to create backend .env file
create_backend_env() {
    echo -e "\n${GREEN}Creating backend .env file...${NC}"
    cat > backend/.env << EOL
# Network Configuration
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337

# Contract Addresses (these will be updated by deploy-and-update-envs.js)
CONTRACT_ADDRESS=
STUDENT_DIRECTORY_ADDRESS=
ACADEMIC_RECORDS_ADDRESS=

# Admin Private Key (this is the default hardhat test account #0 private key)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# IPFS Configuration
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080

# Server Configuration
PORT=3001
NODE_ENV=development

IPFS_UPLOAD_FOLDER=uploads
UPLOAD_DIR=uploads
ADMIN_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
ADMIN_WALLET=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ISSUER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
UPLOAD_DIRECTORY=uploads
EOL
    echo -e "${GREEN}Backend .env file created successfully!${NC}"
}

# Function to create frontend .env file
create_frontend_env() {
    echo -e "\n${GREEN}Creating frontend .env file...${NC}"
    cat > frontend/.env << EOL
# Contract Addresses (these will be updated by deploy-and-update-envs.js)
REACT_APP_CONTRACT_ADDRESS=
REACT_APP_STUDENT_DIRECTORY_ADDRESS=

# Network Configuration
REACT_APP_CHAIN_ID=31337
REACT_APP_NETWORK_NAME="Hardhat Local"
REACT_APP_RPC_URL=http://127.0.0.1:8545

# IPFS Configuration
REACT_APP_IPFS_GATEWAY=http://127.0.0.1:8080
EOL
    echo -e "${GREEN}Frontend .env file created successfully!${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "\n${GREEN}Installing root dependencies...${NC}"
    npm install

    echo -e "\n${GREEN}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..

    echo -e "\n${GREEN}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
}

# Function to create necessary directories
create_directories() {
    echo -e "\n${GREEN}Creating necessary directories...${NC}"
    mkdir -p backend/uploads
    mkdir -p frontend/public/uploads
    mkdir -p config
}

# Check if IPFS is installed
check_ipfs() {
    if ! command -v ipfs &> /dev/null; then
        echo -e "${RED}IPFS is not installed. Please install IPFS first:${NC}"
        echo -e "${BLUE}Visit: https://docs.ipfs.tech/install/command-line/#official-distributions${NC}"
        exit 1
    fi
}

# Main setup process
echo -e "\n${GREEN}Step 1: Checking prerequisites...${NC}"
check_ipfs

echo -e "\n${GREEN}Step 2: Creating environment files...${NC}"
create_root_env
create_backend_env
create_frontend_env

echo -e "\n${GREEN}Step 3: Creating necessary directories...${NC}"
create_directories

echo -e "\n${GREEN}Step 4: Installing dependencies...${NC}"
install_dependencies

# Start local Hardhat node in the background
echo -e "\n${GREEN}Step 5: Starting local Hardhat node...${NC}"
npx hardhat node > hardhat.log 2>&1 &
HARDHAT_PID=$!

# Wait for Hardhat node to start and show the accounts
echo -e "${YELLOW}Waiting for Hardhat node to start...${NC}"
sleep 5

# Display the Hardhat accounts and private keys
echo -e "${GREEN}Available Hardhat Accounts:${NC}"
echo -e "${YELLOW}Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266${NC}"
echo -e "${BLUE}Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80${NC}"
echo -e "\n${YELLOW}Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8${NC}"
echo -e "${BLUE}Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d${NC}"
echo -e "\n${YELLOW}Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC${NC}"
echo -e "${BLUE}Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a${NC}"
echo -e "\n${YELLOW}Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906${NC}"
echo -e "${BLUE}Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6${NC}"
echo -e "\n${YELLOW}Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65${NC}"
echo -e "${BLUE}Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a${NC}"

# Deploy contracts and update environment files
echo -e "\n${GREEN}Step 6: Deploying contracts and updating environment files...${NC}"
npx hardhat run scripts/deploy-and-update-envs.js --network localhost

# Check if deployment was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Contract deployment failed. Aborting.${NC}"
  kill $HARDHAT_PID
  exit 1
fi

# Update config/default.json with contract addresses
echo -e "\n${GREEN}Updating config/default.json with contract addresses...${NC}"
CONTRACT_ADDRESS=$(grep "CONTRACT_ADDRESS=" backend/.env | cut -d'=' -f2)
STUDENT_DIRECTORY_ADDRESS=$(grep "STUDENT_DIRECTORY_ADDRESS=" backend/.env | cut -d'=' -f2)

cat > config/default.json << EOL
{
    "blockchain": {
        "rpcUrl": "http://127.0.0.1:8545",
        "chainId": 31337,
        "contractAddress": "${CONTRACT_ADDRESS}",
        "studentDirectoryAddress": "${STUDENT_DIRECTORY_ADDRESS}"
    }
}
EOL

# Ask if user wants to register test students
echo -e "\n${YELLOW}Do you want to register test students? (y/n): ${NC}"
read register_students

if [[ "$register_students" == "y" || "$register_students" == "Y" ]]; then
  echo -e "\n${GREEN}Step 7: Registering test students...${NC}"
  echo -e "${BLUE}Registering Pedro Picapiedra...${NC}"
  npx hardhat run scripts/registerTestStudent.js --network localhost
  
  echo -e "${BLUE}Registering Jane Smith...${NC}"
  npx hardhat run scripts/registerTestStudent2.js --network localhost
fi

# Start IPFS daemon if not running
echo -e "\n${GREEN}Step 8: Checking IPFS daemon...${NC}"
if ! curl -s -X POST "http://127.0.0.1:5001/api/v0/version" > /dev/null; then
    echo -e "${YELLOW}Starting IPFS daemon...${NC}"
    ipfs daemon > ipfs.log 2>&1 &
    IPFS_PID=$!
    sleep 5
else
    echo -e "${GREEN}IPFS daemon is already running.${NC}"
fi

# Start backend server
echo -e "\n${GREEN}Step 9: Starting backend server...${NC}"
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend server to start...${NC}"
sleep 5

# Start frontend server
echo -e "\n${GREEN}Step 10: Starting frontend server...${NC}"
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Run simulation script
echo -e "\n${GREEN}Step 11: Running workflow simulation...${NC}"
cd backend
node simulateWorkflow.js > ../simulation.log 2>&1
cd ..

echo -e "\n${GREEN}===================================${NC}"
echo -e "${GREEN}Setup completed!${NC}"
echo -e "${GREEN}===================================${NC}"
echo -e "${YELLOW}Services running:${NC}"
echo -e "1. Hardhat Node (PID: $HARDHAT_PID)"
echo -e "2. Backend Server (PID: $BACKEND_PID)"
echo -e "3. Frontend Server (PID: $FRONTEND_PID)"
if [ ! -z "$IPFS_PID" ]; then
    echo -e "4. IPFS Daemon (PID: $IPFS_PID)"
fi
echo -e "\n${YELLOW}Log files:${NC}"
echo -e "- Hardhat: hardhat.log"
echo -e "- Backend: backend.log"
echo -e "- Frontend: frontend.log"
echo -e "- IPFS: ipfs.log (if started by this script)"
echo -e "- Simulation: simulation.log"
echo -e "\n${YELLOW}To stop all services, run:${NC}"
echo -e "kill $HARDHAT_PID $BACKEND_PID $FRONTEND_PID $([ ! -z "$IPFS_PID" ] && echo "$IPFS_PID")"
echo -e "${GREEN}===================================${NC}"

# Create a cleanup script
cat > cleanup.sh << EOL
#!/bin/bash
kill $HARDHAT_PID $BACKEND_PID $FRONTEND_PID $([ ! -z "$IPFS_PID" ] && echo "$IPFS_PID")
rm hardhat.log backend.log frontend.log ipfs.log simulation.log
rm cleanup.sh
EOL
chmod +x cleanup.sh

echo -e "${YELLOW}A cleanup script has been created. To stop all services and clean up logs, run:${NC}"
echo -e "${BLUE}./cleanup.sh${NC}" 