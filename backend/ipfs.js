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
} catch (error) {
    console.warn('Failed to initialize Infura IPFS client:', error);
}

function isValidIpfsHash(hash) {
    return IPFS_HASH_REGEX.test(hash);
}

// Mock IPFS implementation for testing
const mockIpfsData = new Map();

// Initialize with some test data
mockIpfsData.set('QmTest1', JSON.stringify({
  degree: "Bachelor's in Computer Science",
  gpa: 3.8,
  graduationYear: 2023,
  institution: "Example University"
}));

mockIpfsData.set('QmTest2', JSON.stringify({
  degree: "Master's in Artificial Intelligence",
  gpa: 3.9,
  graduationYear: 2024,
  institution: "Example University"
}));

mockIpfsData.set('QmTest3', JSON.stringify({
  certification: "Blockchain Development",
  level: "Advanced",
  year: 2024,
  institution: "Blockchain Academy"
}));

export async function uploadToIpfs(data) {
  const hash = `QmTest${mockIpfsData.size + 1}`;
  mockIpfsData.set(hash, JSON.stringify(data));
  return hash;
}

export async function retrieveFromIpfs(hash) {
  console.log('Retrieving from mock IPFS:', hash);
  const data = mockIpfsData.get(hash);
  if (!data) {
    throw new Error('Data not found in mock IPFS');
  }
  return data;
}

async function tryGateway(gateway, hash) {
    try {
        const response = await fetch(gateway + hash, {
            timeout: 5000 // 5 second timeout
        });
        if (response.ok) {
            return await response.text();
        }
        throw new Error(`Gateway ${gateway} returned status ${response.status}`);
    } catch (error) {
        console.warn(`Failed to fetch from gateway ${gateway}:`, error);
        return null;
    }
}
