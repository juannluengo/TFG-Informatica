import React, { useState } from 'react';
import { Container, Typography, Paper, TextField, Button, Alert, Box, CircularProgress } from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

function VerifyCredential() {
  const { contract } = useWeb3();
  const [formData, setFormData] = useState({
    studentAddress: '',
    credentialIndex: '',
    recordData: ''
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
      if (!ethers.isAddress(formData.studentAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const recordHash = ethers.keccak256(ethers.toUtf8Bytes(formData.recordData));
      const isValid = await contract.verifyCredential(
        formData.studentAddress,
        formData.credentialIndex,
        recordHash
      );

      setStatus({
        type: isValid ? 'success' : 'error',
        message: isValid ? 'Credential verified successfully!' : 'Invalid credential'
      });
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
          />
          
          <TextField
            fullWidth
            label="Academic Record Data to Verify"
            name="recordData"
            value={formData.recordData}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={4}
            sx={{ mb: 3 }}
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
      </Paper>
    </Container>
  );
}

export default VerifyCredential;