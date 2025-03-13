// Purpose: Diagnostic tools to debug blockchain connection and contract issues

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract ABI
const loadContractABI = () => {
    try {
        const artifactPath = path.join(__dirname, '../../artifacts/contracts/StudentDirectory.sol/StudentDirectory.json');
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        return artifact.abi;
    } catch (error) {
        console.error('Error loading StudentDirectory ABI:', error);
        return null;
    }
};

class DiagnosticService {
    constructor() {
        dotenv.config();
        this.rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
        this.studentDirectoryAddress = process.env.STUDENT_DIRECTORY_ADDRESS;
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        
        this.contractABI = loadContractABI();
        this.provider = null;
        this.contract = null;
    }
    
    async initialize() {
        try {
            // Initialize provider
            this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
            
            // Test basic connection
            const networkInfo = await this.provider.getNetwork();
            console.log('Connected to network:', networkInfo);
            
            // Test if the node is synced
            const syncStatus = await this.provider.send('eth_syncing', []);
            console.log('Sync status:', syncStatus === false ? 'Fully synced' : syncStatus);
            
            // Initialize contract
            if (this.contractABI && this.studentDirectoryAddress) {
                this.contract = new ethers.Contract(this.studentDirectoryAddress, this.contractABI, this.provider);
            }
            
            return {
                success: true,
                networkInfo,
                syncStatus
            };
        } catch (error) {
            console.error('Initialization error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async checkProvider() {
        try {
            // Check if provider is connected
            if (!this.provider) {
                await this.initialize();
            }
            
            // Test the connection by getting network info
            const networkInfo = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            
            return {
                success: true,
                connected: true,
                networkInfo,
                blockNumber,
                rpcUrl: this.rpcUrl
            };
        } catch (error) {
            console.error('Provider check error:', error);
            return {
                success: false,
                connected: false,
                error: error.message,
                rpcUrl: this.rpcUrl
            };
        }
    }
    
    async checkContract() {
        try {
            // Check if provider is connected
            if (!this.provider) {
                await this.initialize();
            }
            
            // Get both contract addresses
            const addresses = {
                studentDirectory: this.studentDirectoryAddress,
                contract: this.contractAddress
            };
            
            const results = {};
            
            // Check StudentDirectory contract
            if (this.studentDirectoryAddress) {
                // Check if contract exists at address
                const code = await this.provider.getCode(this.studentDirectoryAddress);
                results.studentDirectory = {
                    address: this.studentDirectoryAddress,
                    hasCode: code !== '0x',
                    codeSize: code.length
                };
                
                // Try to call a contract method
                if (code !== '0x' && this.contract) {
                    try {
                        const isABICompatible = await this.testContractMethod();
                        results.studentDirectory.isABICompatible = isABICompatible;
                    } catch (methodError) {
                        results.studentDirectory.isABICompatible = false;
                        results.studentDirectory.methodError = methodError.message;
                    }
                }
            } else {
                results.studentDirectory = {
                    address: null,
                    hasCode: false,
                    error: 'Student directory address not configured'
                };
            }
            
            // Check main contract (if different)
            if (this.contractAddress && this.contractAddress !== this.studentDirectoryAddress) {
                const code = await this.provider.getCode(this.contractAddress);
                results.contract = {
                    address: this.contractAddress,
                    hasCode: code !== '0x',
                    codeSize: code.length
                };
            }
            
            return {
                success: true,
                ...results
            };
        } catch (error) {
            console.error('Contract check error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async testContractMethod() {
        try {
            // Try to call a view method on the contract
            try {
                // First try the getStudentCount method
                await this.contract.getStudentCount();
                return true;
            } catch (error) {
                console.log('getStudentCount failed, trying alternative methods...');
                
                // Try alternative method names that might exist
                try {
                    await this.contract.totalStudents();
                    return true;
                } catch (error2) {
                    try {
                        await this.contract.studentCount();
                        return true;
                    } catch (error3) {
                        // Try to call a different method that should exist
                        try {
                            await this.contract.isStudentRegistered('0x0000000000000000000000000000000000000000');
                            return true;
                        } catch (error4) {
                            // All methods failed, contract ABI is likely incompatible
                            return false;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error testing contract method:', error);
            return false;
        }
    }
    
    async runFullDiagnostics() {
        const results = {
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            },
            timestamp: new Date().toISOString(),
            configuredAddresses: {
                studentDirectory: this.studentDirectoryAddress,
                contract: this.contractAddress
            }
        };
        
        // Check if ABI loaded successfully
        results.contractABI = {
            loaded: !!this.contractABI,
            functions: this.contractABI ? this.contractABI.filter(item => item.type === 'function').map(f => f.name) : []
        };
        
        // Check provider connection
        const providerCheck = await this.checkProvider();
        results.provider = providerCheck;
        
        // If provider is connected, check contracts
        if (providerCheck.connected) {
            const contractCheck = await this.checkContract();
            results.contracts = contractCheck;
        }
        
        // Now print advice based on the results
        results.recommendations = this.generateRecommendations(results);
        
        return results;
    }
    
    generateRecommendations(diagnosticResults) {
        const recommendations = [];
        
        // Check provider connection
        if (!diagnosticResults.provider.connected) {
            recommendations.push(
                'RPC connection failed. Make sure your Ethereum node is running and accessible at ' + 
                this.rpcUrl + '. You may need to restart your node or check your firewall settings.'
            );
            return recommendations; // Can't check further without provider
        }
        
        // Check if contract addresses are configured
        if (!this.studentDirectoryAddress) {
            recommendations.push(
                'STUDENT_DIRECTORY_ADDRESS is not configured in your .env file. ' +
                'Add this value with the correct contract address.'
            );
        }
        
        // Check if the contracts exist
        const studentDirContract = diagnosticResults.contracts?.studentDirectory;
        if (studentDirContract && !studentDirContract.hasCode) {
            recommendations.push(
                `No contract code found at the configured STUDENT_DIRECTORY_ADDRESS (${this.studentDirectoryAddress}). ` +
                'This address may be incorrect, or the contract may not be deployed on this network.'
            );
        }
        
        // Check if ABI is compatible
        if (studentDirContract && studentDirContract.hasCode && studentDirContract.isABICompatible === false) {
            recommendations.push(
                'Contract exists but ABI is incompatible. This suggests you are using an incorrect ABI for this contract. ' +
                'Make sure you are using the correct ABI for the deployed contract.'
            );
        }
        
        // If everything seems good but there's still an issue
        if (studentDirContract && studentDirContract.hasCode && studentDirContract.isABICompatible === true && 
            diagnosticResults.provider.connected && recommendations.length === 0) {
            recommendations.push(
                'Contract appears to be properly configured but is still not working. ' +
                'Try redeploying the contract and updating the address in your .env file.'
            );
        }
        
        // If no specific issues were found
        if (recommendations.length === 0) {
            recommendations.push(
                'No specific issues detected with your contract configuration. ' +
                'Try examining your contract code for logic errors or permissions issues.'
            );
        }
        
        return recommendations;
    }
}

export default DiagnosticService; 