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
        console.log('Credential found:', {
          recordHash: credential.recordHash,
          ipfsHash: credential.ipfsHash,
          timestamp: credential.timestamp.toString(),
          issuer: credential.issuer,
          valid: credential.valid
        });
        
        if (!credential.valid) {
          throw new Error('This credential has been revoked');
        }

        // Compare the provided hash directly with the stored hash
        const providedHash = formData.recordHash.toLowerCase();
        const storedHash = credential.recordHash.toLowerCase();

        console.log('Comparing hashes:', {
          provided: providedHash,
          stored: storedHash
        });

        if (providedHash !== storedHash) {
          throw new Error('Provided hash does not match the stored credential');
        }

        // If hashes match, fetch the data from IPFS
        const ipfsHash = credential.ipfsHash;
        console.log('Fetching from IPFS hash:', ipfsHash);

        const response = await fetch(`${API_URL}/api/ipfs/${ipfsHash}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data from IPFS');
        }

        let data = await response.text();
        try {
          const jsonData = JSON.parse(data);
          data = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
        } catch (e) {
          // If it's not JSON, use the raw text
          console.log('Data is not JSON, using raw text');
        }

        setVerifiedData(data);
        setStatus({
          type: 'success',
          message: 'Credential verified successfully!'
        });

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
            helperText="Enter the exact keccak256 hash stored on the blockchain"
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