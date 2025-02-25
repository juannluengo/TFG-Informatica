import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Alert, 
  Box, 
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel,
  useTheme
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Add API URL constant
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function IssueCredential() {
  const { contract, account } = useWeb3();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    studentAddress: '',
    recordData: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Enter Credential Details', 'Submit to Blockchain'];

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

      // Structure the credential data
      const credentialData = {
        data: formData.recordData,
        metadata: {
          timestamp: new Date().toISOString(),
          type: "Academic Credential",
          issuer: account
        }
      };

      setActiveStep(1);
      setStatus({
        type: 'info',
        message: 'Uploading credential data to IPFS...'
      });

      // First upload the data to IPFS through our backend
      const uploadResponse = await fetch(`${API_URL}/api/ipfs/upload`, {
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

      setStatus({
        type: 'info',
        message: `Data uploaded to IPFS. Now issuing credential on blockchain...`
      });

      // Create record hash from the data field only
      const recordHash = ethers.keccak256(ethers.toUtf8Bytes(formData.recordData));
      
      // Issue credential with the real IPFS hash
      const tx = await contract.issueCredential(
        formData.studentAddress,
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
        message: `Credential issued successfully! IPFS Hash: ${ipfsHash}`
      });

      // Clear form
      setFormData({
        studentAddress: '',
        recordData: ''
      });
      
      // Reset stepper after success
      setTimeout(() => {
        setActiveStep(0);
      }, 3000);
      
    } catch (error) {
      console.error('Error issuing credential:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to issue credential'
      });
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to issue credentials.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Issue Academic Credential
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Issue a new academic credential to a student or professional by providing their Ethereum address and credential details.
        </Typography>
      </Box>

      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              pt: 4, 
              px: { xs: 2, sm: 4 },
              pb: 3,
              backgroundColor: theme.palette.primary.main + '08' // Very light primary color
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Divider />

          <Box sx={{ p: { xs: 2, sm: 4 } }}>
            {status.message && (
              <Alert 
                severity={status.type} 
                sx={{ mb: 3 }}
                icon={status.type === 'success' ? <CheckCircleOutlineIcon /> : undefined}
              >
                {status.message}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Recipient Ethereum Address"
                    name="studentAddress"
                    value={formData.studentAddress}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    placeholder="0x..."
                    helperText="Enter the Ethereum address of the credential recipient"
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Credential Details"
                    name="recordData"
                    value={formData.recordData}
                    onChange={handleChange}
                    required
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Bachelor's Degree in Computer Science - GPA 3.8 - Graduated 2023"
                    helperText="Enter the academic credential details (degree, grade, year, etc.)"
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ position: 'relative', textAlign: 'center', mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      size="large"
                      startIcon={<AddCircleOutlineIcon />}
                      sx={{ px: 4, py: 1.2 }}
                    >
                      Issue Credential
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
                </Grid>
              </Grid>
            </form>
          </Box>
        </CardContent>
      </Card>

      <Paper elevation={1} sx={{ p: 3, backgroundColor: theme.palette.grey[50] }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Important Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • All credentials are stored permanently on the Ethereum blockchain<br />
          • The credential data is stored on IPFS for decentralized access<br />
          • Make sure the recipient address is correct before submitting<br />
          • Once issued, credentials cannot be modified or deleted
        </Typography>
      </Paper>
    </Container>
  );
}

export default IssueCredential;