import { create } from 'ipfs-http-client';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { Buffer } from 'buffer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// IPFS hash validation regex
const ipfsHashRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;

// List of public IPFS gateways to try
const publicGateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
];

// Simple cache to avoid repeated IPFS retrievals
const ipfsCache = new Map();
const CACHE_MAX_SIZE = 100;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Create IPFS client if IPFS_API_URL is provided
let ipfsClient = null;
try {
    if (process.env.IPFS_API_URL) {
        ipfsClient = create({ url: process.env.IPFS_API_URL });
        console.log('IPFS client initialized with API URL:', process.env.IPFS_API_URL);
    } else {
        console.log('No IPFS_API_URL provided, will use fallback hash generation');
    }
} catch (error) {
    console.error('Failed to initialize IPFS client:', error);
}

// Create storage directory if it doesn't exist
const STORAGE_DIR = path.join(process.cwd(), 'storage');
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Upload data to IPFS
 * @param {Object|Buffer} data - Data to upload (JSON object or binary Buffer)
 * @param {boolean} isBinary - Whether the data is binary
 * @returns {Promise<string>} - IPFS hash
 */
export const uploadToIpfs = async (data, isBinary = false) => {
    try {
        let content;
        
        if (isBinary) {
            // For binary data (like PDFs), ensure it's a Buffer
            if (!data) {
                throw new Error('No data provided for upload');
            }
            
            content = Buffer.isBuffer(data) ? data : Buffer.from(data);
            
            // Validate that we have actual binary data
            if (content.length === 0) {
                throw new Error('Empty binary data provided');
            }
        } else {
            // For JSON data, stringify and convert to Buffer
            try {
                content = Buffer.from(JSON.stringify(data));
            } catch (jsonError) {
                throw new Error(`Failed to stringify JSON data: ${jsonError.message}`);
            }
        }

        // Try to use IPFS client if available
        if (ipfsClient) {
            try {
                const result = await ipfsClient.add(content);
                console.log('Successfully uploaded to IPFS node:', result.path);
                return result.path;
            } catch (ipfsError) {
                console.error('Error uploading to IPFS node, falling back to deterministic hash:', ipfsError);
            }
        }

        // Fallback: Generate a deterministic hash if IPFS client is not available or fails
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        
        // Convert to base58 format and ensure proper length for IPFS CIDv0
        const base58Hash = Buffer.from(hash, 'hex').toString('base64')
            .replace(/[+/]/g, '') // Remove invalid characters
            .replace(/=+$/, ''); // Remove padding
        
        // Ensure exactly 44 characters after 'Qm'
        const truncatedHash = base58Hash.substring(0, 44);
        const ipfsStyleHash = `Qm${truncatedHash}`;
        
        // Double-check the final hash format
        if (!ipfsHashRegex.test(ipfsStyleHash)) {
            console.error('Generated hash validation failed:', ipfsStyleHash);
            throw new Error('Failed to generate valid IPFS-style hash');
        }
        
        // Store in both cache and file system
        ipfsCache.set(ipfsStyleHash, {
            data: isBinary ? content : data,
            timestamp: Date.now(),
            isBinary
        });

        // Also save to file system for persistence
        const filePath = path.join(STORAGE_DIR, ipfsStyleHash);
        try {
            if (isBinary) {
                fs.writeFileSync(filePath, content);
            } else {
                fs.writeFileSync(filePath, JSON.stringify(data));
            }
            console.log('Saved content to local storage:', filePath);
        } catch (fsError) {
            console.error('Failed to save to local storage:', fsError);
            // Don't throw - we still have the cache
        }
        
        // Manage cache size
        if (ipfsCache.size > CACHE_MAX_SIZE) {
            const oldestKey = [...ipfsCache.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            ipfsCache.delete(oldestKey);
        }
        
        console.log('Generated valid IPFS-style hash:', ipfsStyleHash);
        return ipfsStyleHash;
    } catch (error) {
        console.error('Error in uploadToIpfs:', error);
        throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
};

/**
 * Retrieve data from IPFS
 * @param {string} hash - IPFS hash
 * @param {boolean} isBinary - Whether to return binary data
 * @returns {Promise<Object|Buffer|null>} - Retrieved data
 */
export const retrieveFromIpfs = async (hash, isBinary = false) => {
    try {
        // Validate hash format
        if (!ipfsHashRegex.test(hash)) {
            throw new Error('Invalid IPFS hash format');
        }

        // Check cache first
        if (ipfsCache.has(hash)) {
            const cached = ipfsCache.get(hash);
            
            // Check if cache entry is still valid
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('Retrieved from cache:', hash);
                return cached.data;
            } else {
                // Remove expired cache entry
                ipfsCache.delete(hash);
            }
        }

        // Try IPFS client if available
        if (ipfsClient) {
            try {
                const chunks = [];
                for await (const chunk of ipfsClient.cat(hash)) {
                    chunks.push(chunk);
                }
                const content = Buffer.concat(chunks);
                
                let result = isBinary ? content : JSON.parse(content.toString());
                
                // Update cache
                ipfsCache.set(hash, {
                    data: result,
                    timestamp: Date.now(),
                    isBinary
                });
                
                return result;
            } catch (ipfsError) {
                console.error('Error retrieving from IPFS node:', ipfsError);
            }
        }

        // Check local storage before trying public gateways
        const filePath = path.join(STORAGE_DIR, hash);
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath);
                const result = isBinary ? content : JSON.parse(content.toString());
                
                // Update cache
                ipfsCache.set(hash, {
                    data: result,
                    timestamp: Date.now(),
                    isBinary
                });
                
                console.log('Retrieved from local storage:', hash);
                return result;
            } catch (fsError) {
                console.error('Error reading from local storage:', fsError);
            }
        }

        // Try public gateways if IPFS client is not available or fails
        for (const gateway of publicGateways) {
            try {
                const response = await fetch(`${gateway}${hash}`);
                
                if (response.ok) {
                    if (isBinary) {
                        // For binary data, return the buffer
                        const buffer = await response.buffer();
                        
                        // Cache the result
                        ipfsCache.set(hash, {
                            data: buffer,
                            timestamp: Date.now(),
                            isBinary: true
                        });
                        
                        return buffer;
                    } else {
                        // For JSON data, parse the response
                        const data = await response.json();
                        
                        // Cache the result
                        ipfsCache.set(hash, {
                            data,
                            timestamp: Date.now(),
                            isBinary: false
                        });
                        
                        return data;
                    }
                }
            } catch (gatewayError) {
                console.error(`Error retrieving from gateway ${gateway}:`, gatewayError);
            }
        }

        // If we reach here, we couldn't retrieve the data
        console.error('Failed to retrieve from all IPFS sources');
        return null;
    } catch (error) {
        console.error('Error in retrieveFromIpfs:', error);
        throw new Error(`Failed to retrieve from IPFS: ${error.message}`);
    }
};
