const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Create a simple PDF-like file for testing
const createTestFile = () => {
  const testDir = path.join(__dirname, 'test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testFilePath = path.join(testDir, 'test.pdf');
  
  // Create a simple PDF-like file (not a real PDF, just for testing)
  const content = Buffer.from('%PDF-1.5\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
  fs.writeFileSync(testFilePath, content);
  
  console.log('Created test file at:', testFilePath);
  return testFilePath;
};

// Test uploading a file to IPFS
const testFileUpload = async (filePath) => {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
    console.log('Uploading file to IPFS...');
    const response = await fetch('http://localhost:3001/api/ipfs/upload-file', {
      method: 'POST',
      body: form,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error uploading file:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('File uploaded successfully!');
    console.log('IPFS hash:', result.hash);
    console.log('File details:', {
      filename: result.filename,
      size: result.size,
      mimetype: result.mimetype
    });
    
    return result.hash;
  } catch (error) {
    console.error('Error in file upload test:', error);
  }
};

// Test retrieving a file from IPFS
const testFileRetrieval = async (hash) => {
  try {
    console.log('Retrieving file from IPFS...');
    const response = await fetch(`http://localhost:3001/api/ipfs/file/${hash}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error retrieving file:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return;
    }
    
    const buffer = await response.buffer();
    console.log('File retrieved successfully!');
    console.log('File size:', buffer.length);
    
    return buffer;
  } catch (error) {
    console.error('Error in file retrieval test:', error);
  }
};

// Run the tests
const runTests = async () => {
  try {
    // First, test the API endpoint
    console.log('Testing IPFS API endpoint...');
    const apiResponse = await fetch('http://localhost:3001/api/ipfs/test-api');
    const apiResult = await apiResponse.json();
    console.log('API test result:', apiResult);
    
    // Create and upload a test file
    const testFilePath = createTestFile();
    const hash = await testFileUpload(testFilePath);
    
    if (hash) {
      // Retrieve the file
      await testFileRetrieval(hash);
    }
    
    console.log('Tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
};

runTests(); 