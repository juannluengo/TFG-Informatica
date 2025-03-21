import React, { useState } from 'react';
import { Container, Typography, Paper, TextField, Button, Alert, Box, CircularProgress } from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

// Add API URL constant
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

function AddCredential() {
  const { contract } = useWeb3();
  const [formData, setFormData] = useState({
    recipientAddress: '',
    recordData: '',
    credentialName: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

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

    try {
      if (!ethers.isAddress(formData.recipientAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      // Structure the credential data
      const credentialData = {
        name: formData.credentialName,
        data: formData.recordData,
        metadata: {
          timestamp: new Date().toISOString(),
          type: "Added Credential"
        }
      };

      // First upload the data to IPFS through our backend
      const uploadResponse = await fetch(`${API_URL}/ipfs/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentialData)
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Failed to upload to IPFS: ${errorData.error || uploadResponse.statusText}`);
      }

      const ipfsData = await uploadResponse.json();
      const ipfsHash = ipfsData.hash;
      
      console.log('Data uploaded to IPFS with hash:', ipfsHash);

      // Create record hash from the data field only
      const recordHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData.data));
      
      // Add credential with the real IPFS hash
      const tx = await contract.issueCredential(
        formData.recipientAddress,
        recordHash,
        ipfsHash
      );

      setStatus({
        type: 'info',
        message: 'Transaction sent. Waiting for confirmation...'
      });

      await tx.wait();

      setStatus({
        type: 'success',
        message: `Credential added successfully! IPFS Hash: ${ipfsHash}`
      });

      // Clear form
      setFormData({
        recipientAddress: '',
        recordData: '',
        credentialName: ''
      });
    } catch (error) {
      console.error('Error adding credential:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to add credential'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Add Credential to Address
        </Typography>
        {status.message && (
          <Alert severity={status.type} sx={{ mb: 2 }}>
            {status.message}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Recipient Address"
            name="recipientAddress"
            value={formData.recipientAddress}
            onChange={handleChange}
            margin="normal"
            required
            helperText="Enter the Ethereum address of the recipient"
          />
          <TextField
            fullWidth
            label="Credential Name"
            name="credentialName"
            value={formData.credentialName}
            onChange={handleChange}
            margin="normal"
            required
            helperText="Enter a name for this credential"
          />
          <TextField
            fullWidth
            label="Record Data"
            name="recordData"
            value={formData.recordData}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={4}
            helperText="Enter the credential details"
          />
          <Box sx={{ mt: 2, position: 'relative' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
            >
              Add Credential
            </Button>
            {loading && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px'
                }}
              />
            )}
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default AddCredential;