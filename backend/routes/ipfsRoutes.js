// Purpose: Defines API endpoints for IPFS interactions (uploading files, retrieving file metadata, etc.).

import express from 'express';
import { uploadToIpfs, retrieveFromIpfs } from '../ipfs.js';

const router = express.Router();

router.post('/upload', async (req, res) => {
    try {
        const data = req.body;
        const hash = await uploadToIpfs(data);
        res.json({ success: true, hash });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Failed to upload to IPFS'
        });
    }
});

router.get('/:hash', async (req, res) => {
    try {
        console.log('Attempting to retrieve IPFS hash:', req.params.hash);
        const data = await retrieveFromIpfs(req.params.hash);
        
        if (!data) {
            throw new Error('No data returned from IPFS');
        }
        
        console.log('Successfully retrieved data from IPFS');
        res.send(data);
    } catch (error) {
        console.error('IPFS retrieval error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Failed to retrieve from IPFS',
            hash: req.params.hash
        });
    }
});

export { router as default };