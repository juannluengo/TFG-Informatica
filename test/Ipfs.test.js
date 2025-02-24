const { expect } = require('chai');
const { create } = require('ipfs-http-client');
const { concat: uint8ArrayConcat } = require('uint8arrays/concat');
const { fromString: uint8ArrayFromString } = require('uint8arrays/from-string');
const { toString: uint8ArrayToString } = require('uint8arrays/to-string');

describe('IPFS System', function() {
  this.timeout(10000);
  let ipfs;

  before(async function() {
    try {
      // Try to connect to local IPFS node
      ipfs = create({
        host: 'localhost',
        port: 5001,
        protocol: 'http'
      });
    } catch (error) {
      console.warn('Could not connect to local IPFS node. Please ensure IPFS daemon is running.');
      this.skip();
    }
  });

  it('should add and retrieve a file correctly', async function() {
    const content = 'Hello, IPFS!';
    const fileToAdd = uint8ArrayFromString(content);
    const { cid } = await ipfs.add(fileToAdd);
    
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    
    const retrievedContent = uint8ArrayToString(uint8ArrayConcat(chunks));
    expect(retrievedContent).to.equal(content);
  });
});
