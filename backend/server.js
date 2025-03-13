// Purpose: The main entry point for your backend application. Sets up the Express server, middleware, and route mounting.

import express from 'express';
import cors from 'cors';
import ipfsRoutes from './routes/ipfsRoutes.js';
import studentDirectoryRoutes from './routes/studentDirectoryRoutes.js';
import diagnosticRoutes from './routes/diagnosticRoutes.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import StudentDirectoryService from './services/studentDirectoryService.js';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'], // Frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/students', studentDirectoryRoutes);
app.use('/api/diagnostics', diagnosticRoutes);

// Add a simple diagnostic endpoint (legacy - will be deprecated)
app.get('/api/diagnose', async (req, res) => {
    try {
        // Initialize service for testing
        const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
        const studentDirectoryAddress = process.env.STUDENT_DIRECTORY_ADDRESS;
        const service = new StudentDirectoryService(rpcUrl, studentDirectoryAddress);
        
        // Check connection
        const isConnected = await service.verifyContractConnection();
        
        // Try to get student count
        const countResult = await service.getStudentCount();
        
        // Return diagnostic info
        res.json({
            success: true,
            contractAddress: studentDirectoryAddress,
            rpcUrl,
            isConnected,
            studentCount: countResult.success ? countResult.count : null,
            errors: isConnected ? [] : ['Contract connection failed'],
            note: 'This endpoint is deprecated, please use /api/diagnostics/full for more detailed diagnostics'
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            errors: ['Diagnostic error: ' + error.message]
        });
    }
});

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        error: err.message || 'Internal Server Error'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Enhanced diagnostics available at http://localhost:${PORT}/api/diagnostics/full`);
});