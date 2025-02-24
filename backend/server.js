// Purpose: The main entry point for your backend application. Sets up the Express server, middleware, and route mounting.

import express from 'express';
import cors from 'cors';
import ipfsRoutes from './routes/ipfsRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ipfs', ipfsRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});