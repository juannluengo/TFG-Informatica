// Purpose: The main entry point for your backend application. Sets up the Express server, middleware, and route mounting.

import express from 'express';
import cors from 'cors';
import ipfsRoutes from './routes/ipfsRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'], // Frontend URLs
    methods: ['GET', 'POST'],
    credentials: true
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/ipfs', ipfsRoutes);

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
});