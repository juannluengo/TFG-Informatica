// Purpose: Defines API endpoints for IPFS interactions (uploading files, retrieving file metadata, etc.).

import express from 'express';
import { uploadToIpfs } from '../ipfs.js';

const router = express.Router();

router.post('/upload', async (req, res) => {
    try {
        const data = req.body;
        const hash = await uploadToIpfs(data);
        res.json({ success: true, hash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export { router as default };