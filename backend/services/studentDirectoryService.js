// Purpose: Service for interacting with the StudentDirectory smart contract

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
        throw error;
    }
};

class StudentDirectoryService {
    constructor(rpcUrl, contractAddress) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.contractABI = loadContractABI();
        this.contractAddress = contractAddress;
        this.contract = new ethers.Contract(contractAddress, this.contractABI, this.provider);
    }

    // Initialize with a signer for transactions that modify state
    async initWithSigner(privateKey) {
        try {
            const wallet = new ethers.Wallet(privateKey, this.provider);
            this.contractWithSigner = this.contract.connect(wallet);
            return true;
        } catch (error) {
            console.error('Error initializing with signer:', error);
            return false;
        }
    }

    // Register a new student
    async registerStudent(studentAddress, name, surname, secondSurname, studies) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Contract not initialized with signer');
            }
            
            // Ensure the address is a valid Ethereum address
            if (!ethers.isAddress(studentAddress)) {
                throw new Error('Invalid Ethereum address format');
            }
            
            // Convert to checksum address to ensure proper format
            const checksumAddress = ethers.getAddress(studentAddress);
            
            console.log('Registering student with parameters:', {
                studentAddress: checksumAddress,
                name,
                surname,
                secondSurname: secondSurname || '',
                studies
            });
            
            const tx = await this.contractWithSigner.registerStudent(
                checksumAddress,
                name,
                surname,
                secondSurname || '', // Handle empty second surname
                studies
            );
            
            console.log('Transaction sent:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Transaction confirmed in block:', receipt.blockNumber);
            
            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error registering student:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update an existing student's information
    async updateStudent(studentAddress, name, surname, secondSurname, studies) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Contract not initialized with signer');
            }
            
            // Ensure the address is a valid Ethereum address
            if (!ethers.isAddress(studentAddress)) {
                throw new Error('Invalid Ethereum address format');
            }
            
            // Convert to checksum address to ensure proper format
            const checksumAddress = ethers.getAddress(studentAddress);
            
            const tx = await this.contractWithSigner.updateStudent(
                checksumAddress,
                name,
                surname,
                secondSurname || '', // Handle empty second surname
                studies
            );
            
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error updating student:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Deactivate a student
    async deactivateStudent(studentAddress) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Contract not initialized with signer');
            }
            
            // Ensure the address is a valid Ethereum address
            if (!ethers.isAddress(studentAddress)) {
                throw new Error('Invalid Ethereum address format');
            }
            
            // Convert to checksum address to ensure proper format
            const checksumAddress = ethers.getAddress(studentAddress);
            
            const tx = await this.contractWithSigner.deactivateStudent(checksumAddress);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error deactivating student:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Reactivate a student
    async reactivateStudent(studentAddress) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Contract not initialized with signer');
            }
            
            // Ensure the address is a valid Ethereum address
            if (!ethers.isAddress(studentAddress)) {
                throw new Error('Invalid Ethereum address format');
            }
            
            // Convert to checksum address to ensure proper format
            const checksumAddress = ethers.getAddress(studentAddress);
            
            const tx = await this.contractWithSigner.reactivateStudent(checksumAddress);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error reactivating student:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get student information
    async getStudent(studentAddress) {
        try {
            // Ensure the address is a valid Ethereum address
            if (!ethers.isAddress(studentAddress)) {
                throw new Error('Invalid Ethereum address format');
            }
            
            // Convert to checksum address to ensure proper format
            const checksumAddress = ethers.getAddress(studentAddress);
            
            const student = await this.contract.getStudent(checksumAddress);
            return {
                success: true,
                student: {
                    name: student.name,
                    surname: student.surname,
                    secondSurname: student.secondSurname,
                    studies: student.studies,
                    active: student.active
                }
            };
        } catch (error) {
            console.error('Error getting student:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Check if a student is registered
    async isStudentRegistered(studentAddress) {
        try {
            // Ensure the address is a valid Ethereum address
            if (!ethers.isAddress(studentAddress)) {
                throw new Error('Invalid Ethereum address format');
            }
            
            // Convert to checksum address to ensure proper format
            const checksumAddress = ethers.getAddress(studentAddress);
            
            const isRegistered = await this.contract.isStudentRegistered(checksumAddress);
            return {
                success: true,
                isRegistered
            };
        } catch (error) {
            console.error('Error checking if student is registered:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get total number of students
    async getStudentCount() {
        try {
            const count = await this.contract.getStudentCount();
            return {
                success: true,
                count: Number(count)
            };
        } catch (error) {
            console.error('Error getting student count:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get student address by index
    async getStudentAddressByIndex(index) {
        try {
            const address = await this.contract.getStudentAddressByIndex(index);
            // Convert to checksum address to ensure proper format
            const checksumAddress = ethers.getAddress(address);
            return {
                success: true,
                address: checksumAddress
            };
        } catch (error) {
            console.error('Error getting student address by index:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get a batch of student addresses for pagination
    async getStudentAddressesBatch(startIndex, count) {
        try {
            const addresses = await this.contract.getStudentAddressesBatch(startIndex, count);
            // Convert all addresses to checksum format
            const checksumAddresses = addresses.map(addr => ethers.getAddress(addr));
            return {
                success: true,
                addresses: checksumAddresses
            };
        } catch (error) {
            console.error('Error getting student addresses batch:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all students with their information (paginated)
    async getAllStudents(startIndex, count) {
        try {
            // Get total count of students
            const countResult = await this.getStudentCount();
            if (!countResult.success) {
                throw new Error(countResult.error);
            }
            
            const totalCount = countResult.count;
            
            // Adjust count if it would exceed the total
            if (startIndex >= totalCount) {
                return {
                    success: true,
                    students: [],
                    totalCount
                };
            }
            
            // Get batch of addresses
            const addressesResult = await this.getStudentAddressesBatch(startIndex, count);
            if (!addressesResult.success) {
                throw new Error(addressesResult.error);
            }
            
            // Get information for each student
            const students = [];
            for (const address of addressesResult.addresses) {
                const studentResult = await this.getStudent(address);
                if (studentResult.success) {
                    students.push({
                        address,
                        ...studentResult.student
                    });
                }
            }
            
            return {
                success: true,
                students,
                totalCount
            };
        } catch (error) {
            console.error('Error getting all students:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default StudentDirectoryService; 