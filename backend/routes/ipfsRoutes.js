// Purpose: Defines API endpoints for IPFS interactions (uploading files, retrieving file metadata, etc.).

import express from 'express';
import { uploadToIpfs, retrieveFromIpfs } from '../ipfs.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Create the uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            try {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('Created uploads directory at:', uploadDir);
            } catch (mkdirError) {
                console.error('Error creating uploads directory:', mkdirError);
                return cb(new Error(`Failed to create uploads directory: ${mkdirError.message}`));
            }
        }
        console.log('File will be uploaded to:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename with timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = uniqueSuffix + ext;
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
    console.log('Received file:', file.originalname, 'mimetype:', file.mimetype);
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

// Add a test endpoint to verify the server is working
router.get('/test-api', (req, res) => {
    console.log('Test endpoint called');
    return res.json({ status: 'ok', message: 'IPFS routes are working' });
});

// Upload JSON data to IPFS
router.post('/upload', async (req, res) => {
    try {
        const data = req.body;
        
        if (!data) {
            return res.status(400).json({ error: 'No data provided' });
        }
        
        let hash;
        try {
            hash = await uploadToIpfs(data);
        } catch (ipfsError) {
            console.error('Error uploading to IPFS:', ipfsError);
            return res.status(500).json({ error: `IPFS upload failed: ${ipfsError.message}` });
        }
        
        return res.json({ hash });
    } catch (error) {
        console.error('Error in JSON upload handler:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// New endpoint for uploading PDF files to IPFS
router.post('/upload-file', (req, res, next) => {
    console.log('Upload-file endpoint called');
    console.log('Request headers:', req.headers);
    
    // Use multer middleware
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: err.message });
        }
        
        // Continue to the actual handler
        next();
    });
}, async (req, res) => {
    console.log('Processing file upload after multer');
    try {
        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File uploaded successfully:', req.file.originalname, 'size:', req.file.size);
        
        // Read the file from disk
        const filePath = req.file.path;
        let fileData;
        
        try {
            fileData = fs.readFileSync(filePath);
            console.log('File read successfully, size:', fileData.length);
        } catch (readError) {
            console.error('Error reading uploaded file:', readError);
            return res.status(500).json({ 
                error: `Failed to read uploaded file: ${readError.message}` 
            });
        }

        // Upload the file to IPFS
        let hash;
        try {
            hash = await uploadToIpfs(fileData, true); // true flag indicates binary data
            console.log('File uploaded to IPFS with hash:', hash);
        } catch (ipfsError) {
            console.error('Error uploading to IPFS:', ipfsError);
            
            // Clean up the file if it exists
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            return res.status(500).json({ 
                error: `IPFS upload failed: ${ipfsError.message}` 
            });
        }

        // Delete the temporary file
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Temporary file deleted');
            }
        } catch (unlinkError) {
            console.error('Error deleting temporary file:', unlinkError);
            // Continue anyway since the upload was successful
        }

        // Return success response
        console.log('Sending successful response');
        return res.json({ 
            hash,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error('Error in file upload handler:', error);
        
        // Clean up the file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }
        }
        
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// New endpoint to retrieve and serve PDF files from IPFS
router.get('/file/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        console.log('PDF file retrieval request for hash:', hash);
        
        if (!hash || !hash.trim()) {
            console.error('Invalid IPFS hash for file retrieval');
            return res.status(400).json({ error: 'Invalid IPFS hash' });
        }
        
        let data;
        try {
            data = await retrieveFromIpfs(hash, true); // true flag indicates binary data
            console.log('File data retrieved from IPFS, size:', data ? data.length : 'null');
        } catch (ipfsError) {
            console.error('Error retrieving file from IPFS:', ipfsError);
            return res.status(500).json({ error: `IPFS retrieval failed: ${ipfsError.message}` });
        }
        
        if (!data) {
            console.error('File not found for hash:', hash);
            return res.status(404).json({ error: 'File not found on IPFS' });
        }
        
        // Ensure we have binary data
        if (!Buffer.isBuffer(data)) {
            console.log('Converting data to buffer');
            data = Buffer.from(data);
        }
        
        // Set appropriate headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="document-${hash}.pdf"`);
        res.setHeader('Content-Length', data.length);
        
        console.log('Sending PDF file, size:', data.length);
        // Send the binary data
        return res.send(data);
    } catch (error) {
        console.error('Error in file retrieval handler:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Retrieve data from IPFS with specific endpoint
router.get('/retrieve/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        console.log('IPFS retrieval request for hash:', hash);
        
        if (!hash || !hash.trim()) {
            console.error('Invalid IPFS hash provided');
            return res.status(400).json({ error: 'Invalid IPFS hash' });
        }
        
        let data;
        try {
            data = await retrieveFromIpfs(hash);
            console.log('Data retrieved from IPFS:', typeof data, 
                        data ? (typeof data === 'object' ? 'object with keys: ' + Object.keys(data).join(', ') : 'non-object data') : 'null');
        } catch (ipfsError) {
            console.error('Error retrieving from IPFS:', ipfsError);
            return res.status(500).json({ error: `IPFS retrieval failed: ${ipfsError.message}` });
        }
        
        if (!data) {
            console.error('No data found for hash:', hash);
            return res.status(404).json({ error: 'Data not found on IPFS' });
        }
        
        console.log('Successfully retrieved data, sending response');
        return res.json({ data });
    } catch (error) {
        console.error('Error in data retrieval handler:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Retrieve data from IPFS with default endpoint (must be last)
router.get('/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        console.log('IPFS retrieval request for hash:', hash);
        
        if (!hash || !hash.trim()) {
            console.error('Invalid IPFS hash provided');
            return res.status(400).json({ error: 'Invalid IPFS hash' });
        }
        
        let data;
        try {
            data = await retrieveFromIpfs(hash);
            console.log('Data retrieved from IPFS:', typeof data, 
                        data ? (typeof data === 'object' ? 'object with keys: ' + Object.keys(data).join(', ') : 'non-object data') : 'null');
        } catch (ipfsError) {
            console.error('Error retrieving from IPFS:', ipfsError);
            return res.status(500).json({ error: `IPFS retrieval failed: ${ipfsError.message}` });
        }
        
        if (!data) {
            console.error('No data found for hash:', hash);
            return res.status(404).json({ error: 'Data not found on IPFS' });
        }
        
        console.log('Successfully retrieved data, sending response');
        return res.json({ data });
    } catch (error) {
        console.error('Error in data retrieval handler:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export { router as default };