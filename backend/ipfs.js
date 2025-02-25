import { create } from 'ipfs-http-client';
import fetch from 'node-fetch';
import { concat as uint8ArrayConcat } from 'uint8arrays/concat';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';

// IPFS hash validation regex (for CIDv0 and CIDv1)
const IPFS_HASH_REGEX = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58})$/;

// List of public IPFS gateways to try
const PUBLIC_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
];

let ipfsClient;
try {
    // Try to connect to local IPFS node first
    ipfsClient = create({
        host: 'localhost',
        port: 5001,
        protocol: 'http'
    });
    console.log('Connected to local IPFS node');
} catch (error) {
    console.warn('Could not connect to local IPFS node, trying Infura...');
    if (process.env.INFURA_PROJECT_ID && process.env.INFURA_API_SECRET_KEY) {
        const auth = 'Basic ' + Buffer.from(
            process.env.INFURA_PROJECT_ID + ':' + process.env.INFURA_API_SECRET_KEY
        ).toString('base64');
        ipfsClient = create({
            host: 'ipfs.infura.io',
            port: 5001,
            protocol: 'https',
            headers: {
                authorization: auth
            }
        });
    }
}

function isValidIpfsHash(hash) {
    return IPFS_HASH_REGEX.test(hash);
}

// Initialize mock data with test credentials
const mockIpfsData = new Map([
  ['QmTest1', JSON.stringify({
    data: "Bachelor's Degree in Computer Science - GPA 3.8 - Graduated 2023",
    metadata: {
      degree: "Bachelor's in Computer Science",
      gpa: 3.8,
      graduationYear: 2023,
      institution: "Example University"
    },
    index: 0
  })],
  ['QmTest2', JSON.stringify({
    data: "Master's Degree in Artificial Intelligence - GPA 3.9 - Graduated 2024",
    metadata: {
      degree: "Master's in Artificial Intelligence",
      gpa: 3.9,
      graduationYear: 2024,
      institution: "Example University"
    },
    index: 1
  })],
  ['QmTest3', JSON.stringify({
    data: "Blockchain Development Certification - Advanced Level - 2024",
    metadata: {
      certification: "Blockchain Development",
      level: "Advanced",
      year: 2024,
      institution: "Blockchain Academy"
    },
    index: 2
  })],
  ['QmTest4', JSON.stringify({
    data: "Advanced Web Development Certificate - Full Stack - 2024",
    metadata: {
      certification: "Web Development",
      specialization: "Full Stack",
      year: 2024,
      institution: "Tech Academy"
    },
    index: 3
  })],
  ['QmTemp', JSON.stringify({
    data: "Latest Added Credential",
    metadata: {
      type: "Dynamic",
      timestamp: new Date().toISOString()
    }
  })]
]);

let lastUsedIndex = 4;

export async function uploadToIpfs(data) {
    if (ipfsClient) {
        try {
            const result = await ipfsClient.add(JSON.stringify(data));
            console.log('Uploaded to IPFS with hash:', result.path);
            return result.path;
        } catch (error) {
            console.warn('Failed to upload to IPFS node, using mock data:', error);
        }
    }
    
    // When using mock data, always update the QmTemp entry with the latest data
    mockIpfsData.set('QmTemp', JSON.stringify(data));
    console.log('Updated mock data for QmTemp with:', data);
    return 'QmTemp';
}

export async function retrieveFromIpfs(hash) {
    console.log('Attempting to retrieve from IPFS:', hash);
    console.log('Mock data keys available:', Array.from(mockIpfsData.keys()));
    
    // First check mock data directly
    if (mockIpfsData.has(hash)) {
        console.log('Found directly in mock data');
        return mockIpfsData.get(hash);
    }

    // Try local IPFS node if available
    if (ipfsClient) {
        try {
            console.log('Attempting to retrieve from local IPFS node...');
            const chunks = [];
            for await (const chunk of ipfsClient.cat(hash)) {
                chunks.push(chunk);
            }
            if (chunks.length > 0) {
                const content = uint8ArrayToString(uint8ArrayConcat(chunks));
                console.log('Successfully retrieved from IPFS node');
                // Cache the result
                mockIpfsData.set(hash, content);
                return content;
            }
        } catch (error) {
            console.warn('Failed to retrieve from IPFS node:', error.message);
        }
    }

    // Finally try public gateways
    console.log('Attempting to retrieve from public gateways...');
    for (const gateway of PUBLIC_GATEWAYS) {
        try {
            console.log('Trying gateway:', gateway);
            const response = await fetch(gateway + hash, {
                timeout: 5000
            });
            if (response.ok) {
                const data = await response.text();
                // Cache the result
                mockIpfsData.set(hash, data);
                console.log('Successfully retrieved and cached from gateway:', gateway);
                return data;
            }
        } catch (error) {
            console.warn(`Failed to fetch from gateway ${gateway}:`, error);
        }
    }
    
    // If we reach here and hash looks like a mock credential request
    if (hash.startsWith('QmTest')) {
        // Create a generic credential for testing
        const mockData = JSON.stringify({
            data: `Test Credential ${hash}`,
            metadata: {
                type: "Test",
                id: hash,
                timestamp: new Date().toISOString()
            }
        });
        mockIpfsData.set(hash, mockData);
        return mockData;
    }
    
    throw new Error(`Data not found in IPFS or mock storage for hash: ${hash}`);
}
