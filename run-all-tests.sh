#!/bin/bash

# Set the base directory
BASE_DIR="/Users/juanluengo/Desktop/TFG-Informatica"

# Run smart contract tests using Hardhat
echo "Running smart contract tests..."
cd "$BASE_DIR" || exit
npx hardhat test || { echo "Smart contract tests failed"; exit 1; }

# Run backend tests
echo "Running backend tests..."
cd "$BASE_DIR/backend" || exit
npm test || { echo "Backend tests failed"; exit 1; }

# Run frontend tests
echo "Running frontend tests..."
cd "$BASE_DIR/frontend" || exit
CI=true npm test || { echo "Frontend tests failed"; exit 1; }

# End of test script
