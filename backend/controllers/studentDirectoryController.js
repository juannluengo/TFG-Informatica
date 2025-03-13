// Purpose: Contains the logic that processes requests for the StudentDirectory routes

import StudentDirectoryService from '../services/studentDirectoryService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the StudentDirectory service
const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
const studentDirectoryAddress = process.env.STUDENT_DIRECTORY_ADDRESS;

// Create an instance of the StudentDirectoryService
const studentDirectoryService = new StudentDirectoryService(rpcUrl, studentDirectoryAddress);

// Register a new student
export const registerStudent = async (req, res) => {
    try {
        const { studentAddress, name, surname, secondSurname, studies, privateKey } = req.body;
        
        console.log('Received registration request:', {
            studentAddress,
            name,
            surname,
            secondSurname,
            studies,
            privateKeyProvided: !!privateKey
        });
        
        // Validate required fields
        if (!studentAddress || !name || !surname || !studies || !privateKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: studentAddress, name, surname, studies, and privateKey are required'
            });
        }
        
        // Initialize with signer
        const initialized = await studentDirectoryService.initWithSigner(privateKey);
        if (!initialized) {
            return res.status(500).json({
                success: false,
                message: 'Failed to initialize with signer'
            });
        }
        
        console.log('Signer initialized successfully');
        
        // Register the student
        const result = await studentDirectoryService.registerStudent(
            studentAddress,
            name,
            surname,
            secondSurname || '',
            studies
        );
        
        console.log('Registration result:', result);
        
        if (result.success) {
            return res.status(201).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in registerStudent controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update an existing student
export const updateStudent = async (req, res) => {
    try {
        const { studentAddress, name, surname, secondSurname, studies, privateKey } = req.body;
        
        // Validate required fields
        if (!studentAddress || !name || !surname || !studies || !privateKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: studentAddress, name, surname, studies, and privateKey are required'
            });
        }
        
        // Initialize with signer
        const initialized = await studentDirectoryService.initWithSigner(privateKey);
        if (!initialized) {
            return res.status(500).json({
                success: false,
                message: 'Failed to initialize with signer'
            });
        }
        
        // Update the student
        const result = await studentDirectoryService.updateStudent(
            studentAddress,
            name,
            surname,
            secondSurname || '',
            studies
        );
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in updateStudent controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Deactivate a student
export const deactivateStudent = async (req, res) => {
    try {
        const { studentAddress, privateKey } = req.body;
        
        // Validate required fields
        if (!studentAddress || !privateKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: studentAddress and privateKey are required'
            });
        }
        
        // Initialize with signer
        const initialized = await studentDirectoryService.initWithSigner(privateKey);
        if (!initialized) {
            return res.status(500).json({
                success: false,
                message: 'Failed to initialize with signer'
            });
        }
        
        // Deactivate the student
        const result = await studentDirectoryService.deactivateStudent(studentAddress);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in deactivateStudent controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Reactivate a student
export const reactivateStudent = async (req, res) => {
    try {
        const { studentAddress, privateKey } = req.body;
        
        // Validate required fields
        if (!studentAddress || !privateKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: studentAddress and privateKey are required'
            });
        }
        
        // Initialize with signer
        const initialized = await studentDirectoryService.initWithSigner(privateKey);
        if (!initialized) {
            return res.status(500).json({
                success: false,
                message: 'Failed to initialize with signer'
            });
        }
        
        // Reactivate the student
        const result = await studentDirectoryService.reactivateStudent(studentAddress);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in reactivateStudent controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get student information
export const getStudent = async (req, res) => {
    try {
        const { studentAddress } = req.params;
        
        // Validate required fields
        if (!studentAddress) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: studentAddress'
            });
        }
        
        // Get the student information
        const result = await studentDirectoryService.getStudent(studentAddress);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json(result);
        }
    } catch (error) {
        console.error('Error in getStudent controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Check if a student is registered
export const isStudentRegistered = async (req, res) => {
    try {
        const { studentAddress } = req.params;
        
        // Validate required fields
        if (!studentAddress) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: studentAddress'
            });
        }
        
        // Check if the student is registered
        const result = await studentDirectoryService.isStudentRegistered(studentAddress);
        
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in isStudentRegistered controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all students (paginated)
export const getAllStudents = async (req, res) => {
    try {
        console.log('Received getAllStudents request:', {
            method: req.method,
            url: req.url,
            query: req.query,
            path: req.path,
            headers: req.headers
        });
        
        const startIndex = parseInt(req.query.startIndex) || 0;
        const count = parseInt(req.query.count) || 10;
        
        // Input validation
        if (startIndex < 0) {
            console.log('Invalid startIndex:', startIndex);
            return res.status(400).json({
                success: false,
                message: 'startIndex must be non-negative'
            });
        }
        
        if (count < 1 || count > 100) {
            console.log('Invalid count:', count);
            return res.status(400).json({
                success: false,
                message: 'count must be between 1 and 100'
            });
        }
        
        console.log('Fetching students with params:', { startIndex, count });
        
        // Verify service is initialized
        if (!studentDirectoryService) {
            console.error('StudentDirectoryService is not initialized');
            return res.status(500).json({
                success: false,
                message: 'Student directory service not initialized',
                students: [],
                totalCount: 0
            });
        }
        
        // Get students from service
        const result = await studentDirectoryService.getAllStudents(startIndex, count);
        console.log('Service result:', result);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(500).json({
                success: false,
                message: result.error || 'Failed to fetch students',
                students: [],
                totalCount: 0
            });
        }
    } catch (error) {
        console.error('Error in getAllStudents controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            students: [],
            totalCount: 0
        });
    }
}; 