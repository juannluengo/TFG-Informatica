import React, { useState } from 'react';
import { Container, Typography, Paper, TextField, Button, Alert, Box, CircularProgress } from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

// Add API URL constant
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function VerifyCredential() {
  const { contract } = useWeb3();
  const [formData, setFormData] = useState({
    studentAddress: '',
    credentialIndex: '',
    recordHash: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    setVerifiedData(null);

    try {
      if (!ethers.isAddress(formData.studentAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const credentialIndex = parseInt(formData.credentialIndex, 10);
      
      try {
        const credential = await contract.getCredential(formData.studentAddress, credentialIndex);
        console.log('Credential found:', credential);
        
        if (!credential.valid) {
          throw new Error('This credential has been revoked');
        }

        // Ensure recordHash is a proper 0x-prefixed 32-byte hex string
        let recordHash = formData.recordHash;
        if (!recordHash.startsWith('0x') || recordHash.length !== 66) {
          recordHash = ethers.keccak256(ethers.toUtf8Bytes(formData.recordHash));
        }

        console.log('Comparing hashes:', {
          provided: recordHash,
          stored: credential.recordHash
        });

        if (recordHash !== credential.recordHash) {
          throw new Error('Record hash does not match the stored credential');
        }

        // If we get here, we know the credential exists and the hash matches
        const ipfsHash = credential.ipfsHash;
        console.log('Fetching from IPFS hash:', ipfsHash);

        try {
          const response = await fetch(`${API_URL}/api/ipfs/${ipfsHash}`);
          console.log('IPFS response:', {
            status: response.status,
            ok: response.ok
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('IPFS error details:', errorData);
            throw new Error(errorData.error || 'Failed to fetch data from IPFS');
          }
          
          let data = await response.text();
          
          // Try to parse as JSON if possible
          try {
            const jsonData = JSON.parse(data);
            data = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
          } catch (e) {
            // If it's not JSON, use the raw text
            console.log('Data is not JSON, using raw text');
          }
          
          console.log('IPFS data received:', data);
          
          setVerifiedData(data);
          setStatus({
            type: 'success',
            message: 'Credential verified successfully!'
          });
        } catch (ipfsError) {
          console.error('IPFS fetch error:', ipfsError);
          setStatus({
            type: 'error',
            message: ipfsError.message || 'Failed to fetch credential data'
          });
        }
      } catch (error) {
        if (error.message.includes("Invalid credential index")) {
          throw new Error('No credential exists at this index for the given address');
        }
        throw error;
      }
    } catch (error) {
      console.error('Error verifying credential:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to verify credential'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Verify Academic Credential
        </Typography>
        {status.message && (
          <Alert severity={status.type} sx={{ mb: 2 }}>
            {status.message}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Student Ethereum Address"
            name="studentAddress"
            value={formData.studentAddress}
            onChange={handleChange}
            margin="normal"
            required
            sx={{ mb: 2 }}
            placeholder="0x..."
          />
          <TextField
            fullWidth
            label="Credential Index"
            name="credentialIndex"
            type="number"
            value={formData.credentialIndex}
            onChange={handleChange}
            margin="normal"
            required
            sx={{ mb: 2 }}
            inputProps={{ min: "0" }}
          />
          <TextField
            fullWidth
            label="Record Hash"
            name="recordHash"
            value={formData.recordHash}
            onChange={handleChange}
            margin="normal"
            required
            sx={{ mb: 3 }}
            placeholder="0x..."
            helperText="Enter the keccak256 hash of the academic record"
          />
          <Box sx={{ position: 'relative' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
            >
              Verify Credential
            </Button>
            {loading && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
        </form>

        {verifiedData && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Verified Academic Record Data:
            </Typography>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace'
              }}
            >
              <Typography variant="body1">
                {verifiedData}
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default VerifyCredential;