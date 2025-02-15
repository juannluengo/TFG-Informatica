const { create } = require('ipfs-http-client');

// Configure the IPFS client (example using Infura)
const ipfsClient = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
});

async function uploadToIpfs(fileContent) {
    const { cid } = await ipfsClient.add(fileContent);
    return cid.toString();
}

module.exports = { uploadToIpfs };
