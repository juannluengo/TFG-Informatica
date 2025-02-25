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
        const hash = req.params.hash;
        console.log('IPFS Route - Request received for hash:', hash);
        console.log('Request headers:', req.headers);
        
        const data = await retrieveFromIpfs(hash);
        
        if (!data) {
            console.error('No data returned for hash:', hash);
            throw new Error('No data returned from IPFS');
        }
        
        console.log('Successfully retrieved data from IPFS:', {
            hash: hash,
            dataType: typeof data,
            dataLength: data.length,
            preview: data.substring(0, 100) + '...'
        });
        
        res.send(data);
    } catch (error) {
        console.error('IPFS retrieval error:', {
            message: error.message,
            stack: error.stack,
            hash: req.params.hash,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Failed to retrieve from IPFS',
            hash: req.params.hash,
            timestamp: new Date().toISOString()
        });
    }
});

export { router as default };