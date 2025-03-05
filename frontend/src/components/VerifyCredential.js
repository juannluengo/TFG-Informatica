import React, { useState, useCallback, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Box, 
  CircularProgress, 
  Alert, 
  Card, 
  CardContent, 
  Grid, 
  Divider,
  useTheme,
  Chip,
  Fade
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SearchIcon from '@mui/icons-material/Search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Add API URL constant
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function VerifyCredential() {
  const { contract } = useWeb3();
  const theme = useTheme();
  const [studentAddress, setStudentAddress] = useState('');
  const [credentialIndex, setCredentialIndex] = useState('');
  const [recordHash, setRecordHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [credentialCount, setCredentialCount] = useState(null);
  const [checkingCredentials, setCheckingCredentials] = useState(false);

  // Check credential count when address changes
  useEffect(() => {
    const checkCredentialCount = async () => {
      if (!studentAddress || !ethers.isAddress(studentAddress) || !contract) {
        setCredentialCount(null);
        return;
      }

      try {
        setCheckingCredentials(true);
        const count = await contract.getCredentialCount(studentAddress);
        console.log(`Address ${studentAddress} has ${count} credentials`);
        setCredentialCount(Number(count));
        setCheckingCredentials(false);
      } catch (error) {
        console.error('Error checking credential count:', error);
        setCredentialCount(null);
        setCheckingCredentials(false);
      }
    };

    checkCredentialCount();
  }, [studentAddress, contract]);

  const handleVerify = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      // Validate inputs
      if (!studentAddress || !ethers.isAddress(studentAddress)) {
        throw new Error('Please enter a valid Ethereum address');
      }

      if (!credentialIndex || isNaN(parseInt(credentialIndex))) {
        throw new Error('Please enter a valid credential index (number)');
      }

      const indexNum = parseInt(credentialIndex);
      
      // Check if index is valid based on credential count
      if (credentialCount !== null && indexNum >= credentialCount) {
        throw new Error(`Invalid credential index. This address only has ${credentialCount} credentials (indices 0 to ${credentialCount - 1 >= 0 ? credentialCount - 1 : 0})`);
      }

      if (!recordHash || recordHash.trim() === '') {
        throw new Error('Please enter a record hash');
      }

      // Get the credential to verify
      try {
        console.log(`Verifying credential for ${studentAddress} at index ${indexNum} with hash ${recordHash}`);
        const credential = await contract.getCredential(studentAddress, indexNum);
        console.log('Retrieved credential:', credential);
        
        // Compare the hashes - we need to handle different formats
        let isValid = false;
        let originalText = recordHash; // Store the original input text
        let credentialName = ""; // Initialize credential name variable
        
        // First, normalize the input hash
        let inputHash = recordHash.trim();
        
        // Log the credential's record hash for debugging
        console.log('Credential record hash from blockchain:', credential.recordHash);
        console.log('Input hash:', inputHash);
        
        // Direct comparison first (if both are hex strings)
        if (inputHash === credential.recordHash) {
          console.log('Direct hash match');
          isValid = true;
        } 
        // If input doesn't have 0x prefix but credential hash does, add it and compare
        else if (!inputHash.startsWith('0x') && credential.recordHash.startsWith('0x') && 
                 ('0x' + inputHash) === credential.recordHash) {
          console.log('Match after adding 0x prefix');
          isValid = true;
        }
        // Try verifying through the contract
        else {
          try {
            // If the input is not a hex string, hash it first
            if (!inputHash.startsWith('0x')) {
              // Store the original text before hashing
              originalText = inputHash;
              inputHash = ethers.keccak256(ethers.toUtf8Bytes(inputHash));
              console.log('Hashed input:', inputHash);
            }
            
            // Use the contract's verify function
            isValid = await contract.verifyCredential(
              studentAddress, 
              indexNum, 
              inputHash
            );
            console.log('Contract verification result:', isValid);
          } catch (verifyError) {
            console.error('Error during contract verification:', verifyError);
            // Continue with isValid = false
          }
        }
        
        if (isValid) {
          // If valid, fetch the credential data from IPFS
          try {
            // First, try to get the credential name from the IPFS hash
            try {
              // For real IPFS hashes, fetch the data
              const ipfsResponse = await fetch(`${API_URL}/api/ipfs/${credential.ipfsHash}`);
              
              if (ipfsResponse.ok) {
                const ipfsData = await ipfsResponse.json();
                // If we have data.data, use it as the credential name
                if (ipfsData && ipfsData.data) {
                  credentialName = ipfsData.data;
                }
              }
            } catch (ipfsNameError) {
              console.warn('Could not fetch credential name from IPFS:', ipfsNameError);
              // We'll fall back to other methods
            }
            
            // If we couldn't get the name from IPFS, try other methods
            if (!credentialName) {
              // If the original input wasn't a hash, it might be the credential name
              if (originalText && !originalText.startsWith('0x')) {
                credentialName = originalText;
              } else {
                // Last resort: use a generic name
                credentialName = `Credential #${indexNum}`;
              }
            }
            
            // Check if the IPFS hash is the placeholder "QmTemp"
            if (credential.ipfsHash === "QmTemp" || credential.ipfsHash === "QmTestHash") {
              // For QmTemp, we'll create a simple data object with the record data
              // This is a fallback for test credentials that don't have real IPFS data
              console.log('Using placeholder data for QmTemp IPFS hash');
              
              // Create a more structured data object that mimics what would come from IPFS
              let structuredData = {
                data: credentialName,
                metadata: {
                  timestamp: new Date(Number(credential.timestamp) * 1000).toISOString(),
                  issuer: credential.issuer,
                  recipient: studentAddress
                }
              };
              
              setVerificationResult({
                isValid: true,
                issuer: credential.issuer,
                recipient: studentAddress,
                timestamp: new Date(Number(credential.timestamp) * 1000).toLocaleString(),
                ipfsHash: credential.ipfsHash,
                recordHash: credential.recordHash,
                data: structuredData
              });
            } else {
              // For real IPFS hashes, fetch the data
              const ipfsResponse = await fetch(`${API_URL}/api/ipfs/${credential.ipfsHash}`);
              
              if (!ipfsResponse.ok) {
                // Special handling for 404 Not Found errors
                if (ipfsResponse.status === 404) {
                  console.log('IPFS hash not found on server, using credential data from blockchain');
                  
                  setVerificationResult({
                    isValid: true,
                    issuer: credential.issuer,
                    recipient: studentAddress,
                    timestamp: new Date(Number(credential.timestamp) * 1000).toLocaleString(),
                    ipfsHash: credential.ipfsHash,
                    recordHash: credential.recordHash,
                    data: {
                      data: credentialName,
                      metadata: {
                        timestamp: new Date(Number(credential.timestamp) * 1000).toISOString()
                      }
                    }
                  });
                }
                
                throw new Error(`Failed to fetch IPFS data: ${ipfsResponse.statusText}`);
              }
              
              const ipfsData = await ipfsResponse.json();
              
              // If ipfsData doesn't have a data field, add the credential name we determined
              if (!ipfsData.data) {
                ipfsData.data = credentialName;
              }
              
              setVerificationResult({
                isValid: true,
                issuer: credential.issuer,
                recipient: studentAddress,
                timestamp: new Date(Number(credential.timestamp) * 1000).toLocaleString(),
                ipfsHash: credential.ipfsHash,
                recordHash: credential.recordHash,
                data: ipfsData
              });
            }
          } catch (ipfsError) {
            console.error('Error fetching IPFS data:', ipfsError);
            
            // Use a more reliable fallback approach without showing an error to the user
            // Create a more structured data object that mimics what would come from IPFS
            let structuredData = {
              data: credentialName,
              metadata: {
                timestamp: new Date(Number(credential.timestamp) * 1000).toISOString(),
                issuer: credential.issuer,
                recipient: studentAddress
              }
            };
            
            // Show the verification result without error messages
            setVerificationResult({
              isValid: true,
              issuer: credential.issuer,
              recipient: studentAddress,
              timestamp: new Date(Number(credential.timestamp) * 1000).toLocaleString(),
              ipfsHash: credential.ipfsHash,
              recordHash: credential.recordHash,
              data: structuredData
              // No ipfsError property, so no warning will be shown
            });
          }
        } else {
          setVerificationResult({
            isValid: false,
            message: "The credential exists but the record hash doesn't match or the credential has been revoked."
          });
        }
      } catch (error) {
        console.error('Error getting credential:', error);
        setVerificationResult({
          isValid: false,
          message: "Credential not found or invalid parameters."
        });
      }
    } catch (error) {
      console.error('Error verifying credential:', error);
      setError(error.message || 'Failed to verify credential');
    } finally {
      setLoading(false);
    }
  }, [contract, studentAddress, credentialIndex, recordHash, credentialCount]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          <VerifiedUserIcon sx={{ fontSize: 32, verticalAlign: 'middle', mr: 1 }} />
          Verify Academic Credential
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Verify the authenticity of an academic credential by entering the recipient's address, credential index, and record hash.
        </Typography>
      </Box>

      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <form onSubmit={handleVerify}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipient Address"
                  value={studentAddress}
                  onChange={(e) => setStudentAddress(e.target.value)}
                  placeholder="0x..."
                  variant="outlined"
                  required
                  disabled={loading}
                  helperText={
                    checkingCredentials 
                      ? "Checking credentials..." 
                      : credentialCount !== null 
                        ? `This address has ${credentialCount} credential${credentialCount !== 1 ? 's' : ''} (indices 0 to ${credentialCount - 1 >= 0 ? credentialCount - 1 : 0})` 
                        : "The Ethereum address of the credential recipient"
                  }
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Credential Index"
                  value={credentialIndex}
                  onChange={(e) => setCredentialIndex(e.target.value)}
                  placeholder="0"
                  variant="outlined"
                  type="number"
                  required
                  disabled={loading}
                  error={credentialCount !== null && parseInt(credentialIndex) >= credentialCount}
                  helperText={
                    credentialCount !== null && parseInt(credentialIndex) >= credentialCount
                      ? `Index too high. Max index is ${credentialCount - 1 >= 0 ? credentialCount - 1 : 0}`
                      : "The index of the credential (usually 0 for the first credential, 1 for the second, etc.)"
                  }
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Record Hash"
                  value={recordHash}
                  onChange={(e) => setRecordHash(e.target.value)}
                  placeholder="0x..."
                  variant="outlined"
                  required
                  disabled={loading}
                  helperText="The hash of the credential record"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || (credentialCount !== null && parseInt(credentialIndex) >= credentialCount)}
                  startIcon={<SearchIcon />}
                  sx={{ 
                    height: '56px',
                    mt: 2
                  }}
                >
                  Verify Credential
                </Button>
              </Grid>
            </Grid>
          </form>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 3 }} icon={<ErrorOutlineIcon />}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {verificationResult && (
        <Fade in={!!verificationResult}>
          <Card 
            elevation={3} 
            sx={{ 
              borderLeft: `4px solid ${verificationResult.isValid ? theme.palette.success.main : theme.palette.error.main}`,
              mb: 4
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {verificationResult.isValid ? (
                  <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                ) : (
                  <CancelIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                )}
                <Typography variant="h5" component="h2">
                  {verificationResult.isValid ? 'Credential Verified' : 'Invalid Credential'}
                </Typography>
              </Box>

              {verificationResult.isValid ? (
                <>
                  {verificationResult.data && verificationResult.data.data && (
                    <Box sx={{ 
                      p: 3, 
                      mb: 3, 
                      backgroundColor: theme.palette.success.light + '20',
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.success.light}`,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" gutterBottom color="success.dark" sx={{ fontWeight: 'bold' }}>
                        {verificationResult.data.data}
                      </Typography>
                      <Typography variant="subtitle1" color="success.main">
                        Verified Academic Credential
                      </Typography>
                    </Box>
                  )}
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Issuer
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {verificationResult.issuer}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Recipient
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {verificationResult.recipient}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Issued On
                      </Typography>
                      <Typography variant="body2">
                        {verificationResult.timestamp}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        IPFS Hash
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {verificationResult.ipfsHash}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Credential Details
                  </Typography>

                  {verificationResult.ipfsError ? (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      {verificationResult.ipfsError}
                    </Alert>
                  ) : verificationResult.data ? (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                      {verificationResult.data.data && (
                        <Typography variant="body1" paragraph>
                          <strong>Data:</strong> {verificationResult.data.data}
                        </Typography>
                      )}
                      
                      {verificationResult.data.metadata && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Metadata:
                          </Typography>
                          <Grid container spacing={1}>
                            {Object.entries(verificationResult.data.metadata).map(([key, value]) => (
                              <Grid item xs={12} sm={6} key={key}>
                                <Chip 
                                  label={`${key}: ${value}`} 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: '4px',
                                    fontWeight: 400,
                                    height: 'auto',
                                    py: 0.5,
                                    px: 1
                                  }} 
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No additional data available
                    </Typography>
                  )}
                </>
              ) : (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {verificationResult.message || "This credential does not exist or has been revoked."}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}

      <Paper elevation={1} sx={{ p: 3, backgroundColor: theme.palette.grey[50] }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          How to Verify a Credential
        </Typography>
        <Typography variant="body2" color="text.secondary">
          1. Enter the recipient's Ethereum address<br />
          2. Enter the credential index (usually 0 for the first credential, 1 for the second, etc.)<br />
          3. Enter the record hash of the credential<br />
          4. Click "Verify Credential" to check its authenticity<br />
          5. If valid, you'll see the credential details and verification status
        </Typography>
      </Paper>
    </Container>
  );
}

export default VerifyCredential;