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

# Deploy contracts and update environment files
echo -e "\n${GREEN}Step 1: Deploying contracts and updating environment files...${NC}"
npx hardhat run scripts/deploy-and-update-envs.js --network localhost

# Check if deployment was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Contract deployment failed. Aborting.${NC}"
  exit 1
fi

# Ask if user wants to register test students
echo -e "\n${YELLOW}Do you want to register test students? (y/n): ${NC}"
read register_students

if [[ "$register_students" == "y" || "$register_students" == "Y" ]]; then
  echo -e "\n${GREEN}Step 2: Registering test students...${NC}"
  echo -e "${BLUE}Registering Pedro Picapiedra...${NC}"
  npx hardhat run scripts/registerTestStudent.js --network localhost
  
  echo -e "${BLUE}Registering Jane Smith...${NC}"
  npx hardhat run scripts/registerTestStudent2.js --network localhost
fi

# Start backend server in a new terminal
echo -e "\n${GREEN}Step 3: Starting backend server...${NC}"
echo -e "${YELLOW}Please open a new terminal and run:${NC}"
echo -e "${BLUE}cd backend && npm start${NC}"

# Start frontend server in a new terminal
echo -e "\n${GREEN}Step 4: Starting frontend server...${NC}"
echo -e "${YELLOW}Please open a new terminal and run:${NC}"
echo -e "${BLUE}cd frontend && npm start${NC}"

# Check if IPFS is running
echo -e "\n${YELLOW}Checking if IPFS daemon is running...${NC}"
curl -s -X POST "http://127.0.0.1:5001/api/v0/version" > /dev/null

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}IPFS daemon is not running. Please start it in a new terminal:${NC}"
  echo -e "${BLUE}ipfs daemon${NC}"
else
  echo -e "${GREEN}IPFS daemon is already running.${NC}"
fi

echo -e "\n${GREEN}===================================${NC}"
echo -e "${GREEN}Setup completed!${NC}"
echo -e "${GREEN}===================================${NC}"
echo -e "${YELLOW}Remember to start:${NC}"
echo -e "1. Backend: ${BLUE}cd backend && npm start${NC}"
echo -e "2. Frontend: ${BLUE}cd frontend && npm start${NC}"
echo -e "3. IPFS (if not running): ${BLUE}ipfs daemon${NC}"
echo -e "${GREEN}===================================${NC}" 