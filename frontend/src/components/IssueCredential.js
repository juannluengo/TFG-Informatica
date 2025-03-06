import React, { useState, useRef } from 'react';
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
  useTheme,
  IconButton,
  Input,
  FormHelperText
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';

// Add API URL constant
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function IssueCredential() {
  const { contract, account } = useWeb3();
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    studentAddress: '',
    recordData: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const steps = ['Enter Credential Details', 'Submit to Blockchain'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      // Create a URL for the file preview
      setFilePreview(URL.createObjectURL(file));
    } else {
      setStatus({
        type: 'error',
        message: 'Please select a valid PDF file'
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      if (!ethers.isAddress(formData.studentAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      if (!formData.recordData) {
        throw new Error('Please enter credential details');
      }

      setActiveStep(1);
      setStatus({
        type: 'info',
        message: 'Preparing credential data...'
      });

      // Structure the credential data
      const credentialData = {
        data: formData.recordData,
        metadata: {
          timestamp: new Date().toISOString(),
          type: "Academic Credential",
          issuer: account
        }
      };

      let ipfsHash;

      // If a PDF file is selected, upload it first
      if (selectedFile) {
        setStatus({
          type: 'info',
          message: 'Uploading PDF document to IPFS...'
        });

        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Upload the PDF file
        console.log('Attempting to upload PDF to:', `${API_URL}/api/ipfs/upload-file`);
        try {
          const fileUploadResponse = await fetch(`${API_URL}/api/ipfs/upload-file`, {
            method: 'POST',
            body: formData
          });

          console.log('File upload response status:', fileUploadResponse.status, fileUploadResponse.statusText);
          
          if (!fileUploadResponse.ok) {
            let errorMessage;
            try {
              // Try to parse the error as JSON
              const errorData = await fileUploadResponse.json();
              errorMessage = errorData.error || fileUploadResponse.statusText;
            } catch (parseError) {
              // If parsing fails, use the status text or a generic message
              console.error('Error parsing error response:', parseError);
              console.error('Response status:', fileUploadResponse.status, fileUploadResponse.statusText);
              
              // Try to get the raw text
              try {
                const rawText = await fileUploadResponse.text();
                console.error('Raw response text:', rawText);
              } catch (textError) {
                console.error('Could not get raw response text:', textError);
              }
              
              errorMessage = fileUploadResponse.statusText || 'Server returned an invalid response';
            }
            throw new Error(`Failed to upload PDF: ${errorMessage}`);
          }

          // Get the response text first to check if it's valid JSON
          const responseText = await fileUploadResponse.text();
          let fileIpfsData;
          try {
            fileIpfsData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            console.error('Response text:', responseText);
            throw new Error('Server returned an invalid JSON response. Please check the server logs.');
          }
          
          const fileIpfsHash = fileIpfsData.hash;
          
          console.log('PDF uploaded to IPFS with hash:', fileIpfsHash);

          // Add the PDF hash to the credential data
          credentialData.pdfDocument = {
            ipfsHash: fileIpfsHash,
            filename: selectedFile.name,
            filesize: selectedFile.size,
            mimeType: selectedFile.type
          };
        } catch (error) {
          console.error('Error uploading PDF:', error);
          throw error;
        }
      }

      setStatus({
        type: 'info',
        message: 'Uploading credential data to IPFS...'
      });

      // Upload the credential data to IPFS
      let uploadResponse;
      try {
        uploadResponse = await fetch(`${API_URL}/api/ipfs/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentialData)
        });
      } catch (fetchError) {
        console.error('Network error during IPFS upload:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }

      if (!uploadResponse.ok) {
        let errorMessage;
        try {
          // Try to parse the error as JSON
          const errorData = await uploadResponse.json();
          errorMessage = errorData.error || uploadResponse.statusText;
        } catch (parseError) {
          // If parsing fails, use the status text or a generic message
          console.error('Error parsing error response:', parseError);
          errorMessage = uploadResponse.statusText || 'Server returned an invalid response';
        }
        throw new Error(`Failed to upload to IPFS: ${errorMessage}`);
      }

      // Get the response text first to check if it's valid JSON
      const responseText = await uploadResponse.text();
      let ipfsData;
      try {
        ipfsData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Server returned an invalid JSON response. Please check the server logs.');
      }
      
      ipfsHash = ipfsData.hash;
      
      console.log('Credential data uploaded to IPFS with hash:', ipfsHash);

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
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
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
          Issue a new academic credential to a student or professional by providing their Ethereum address, credential details, and optional PDF document.
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
                  <Box sx={{ 
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: theme.palette.background.paper,
                    position: 'relative'
                  }}>
                    <input
                      ref={fileInputRef}
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      id="pdf-file-upload"
                      type="file"
                      onChange={handleFileSelect}
                      disabled={loading}
                    />
                    
                    {!selectedFile ? (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <UploadFileIcon color="primary" sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography variant="body1" gutterBottom>
                          Upload PDF Document (Optional)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Attach an official PDF document of the academic record
                        </Typography>
                        <label htmlFor="pdf-file-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<PictureAsPdfIcon />}
                            disabled={loading}
                          >
                            Select PDF File
                          </Button>
                        </label>
                      </>
                    ) : (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                          <PictureAsPdfIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {selectedFile.name}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={handleRemoveFile}
                            disabled={loading}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            component="a"
                            href={filePreview}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Preview PDF
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                  <FormHelperText>
                    The PDF document will be stored on IPFS and linked to this credential
                  </FormHelperText>
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
          • The credential data and PDF documents are stored on IPFS for decentralized access<br />
          • Make sure the recipient address is correct before submitting<br />
          • Once issued, credentials cannot be modified or deleted
        </Typography>
      </Paper>
    </Container>
  );
}

export default IssueCredential;