import React, { useState, useEffect } from 'react';
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
  useTheme,
  Chip,
  Link,
  IconButton
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Add API URL constant
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

function VerifyCredential() {
  const { contract } = useWeb3();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    recipientAddress: '',
    recordHash: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [credentialCount, setCredentialCount] = useState(null);
  const [checkingCredentials, setCheckingCredentials] = useState(false);
  const [pdfDocument, setPdfDocument] = useState(null);

  // Check credential count when address changes
  useEffect(() => {
    const checkCredentialCount = async () => {
      if (!formData.recipientAddress || !ethers.isAddress(formData.recipientAddress)) {
        setCredentialCount(null);
        return;
      }

      try {
        setCheckingCredentials(true);
        const count = await contract.getCredentialCount(formData.recipientAddress);
        // In ethers v6, count is already a number
        setCredentialCount(Number(count));
      } catch (error) {
        console.error('Error checking credential count:', error);
        setCredentialCount(0);
      } finally {
        setCheckingCredentials(false);
      }
    };

    if (contract) {
      checkCredentialCount();
    }
  }, [formData.recipientAddress, contract]);

  const handleChange = (e) => {
    setError('');
    setVerificationResult(null);
    setPdfDocument(null);

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerificationResult(null);
    setPdfDocument(null);

    try {
      if (!ethers.isAddress(formData.recipientAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      // Get the current credential count directly from the contract
      const currentCount = await contract.getCredentialCount(formData.recipientAddress);
      const credentialCount = Number(currentCount);

      // Check if the address has any credentials
      if (credentialCount === 0) {
        throw new Error('No credentials found for this address');
      }

      const searchTerm = formData.recordHash.trim();
      // If the search term starts with 0x, treat it as a hash, otherwise as a credential name
      const isSearchingByHash = searchTerm.startsWith('0x');

      console.log(`Found ${credentialCount} credentials for address ${formData.recipientAddress}`);
      
      // Log all available credentials for debugging
      if (isSearchingByHash) {
        console.log('Listing all available credentials:');
        for (let i = 0; i < credentialCount; i++) {
          const cred = await contract.getCredential(formData.recipientAddress, i);
          console.log(`Credential #${i}:`, {
            recordHash: cred.recordHash,
            ipfsHash: cred.ipfsHash,
            timestamp: new Date(Number(cred.timestamp) * 1000).toLocaleString(),
            issuer: cred.issuer,
            valid: cred.valid
          });
        }
        
        console.log('Search Details:');
        console.log('Address:', formData.recipientAddress);
        console.log('Searching for hash:', searchTerm);
        console.log('Total credentials found:', credentialCount);
      }

      // Search for the credential with the matching record hash or name
      let foundIndex = -1;
      let foundCredential = null;
      
      if (isSearchingByHash) {
        // Validate hash format
        if (!/^0x[0-9a-fA-F]{64}$/.test(searchTerm)) {
          throw new Error('Invalid hash format. Hash should be 32 bytes (64 characters) plus 0x prefix');
        }
        console.log('Valid hash format detected:', searchTerm);
      }
      
      for (let i = 0; i < credentialCount; i++) {
        const credential = await contract.getCredential(formData.recipientAddress, i);
        
        if (isSearchingByHash) {
          // Add debug logging for hash comparison
          console.log('-------------------');
          console.log(`Checking credential #${i}:`);
          console.log('Search term:', searchTerm);
          console.log('Search term length:', searchTerm.length);
          console.log('Credential hash:', credential.recordHash);
          console.log('Credential hash length:', credential.recordHash.length);
          
          // Normalize both hashes to lowercase for comparison
          const normalizedSearchTerm = searchTerm.toLowerCase();
          const normalizedCredentialHash = credential.recordHash.toLowerCase();
          
          console.log('Normalized search term:', normalizedSearchTerm);
          console.log('Normalized credential hash:', normalizedCredentialHash);
          console.log('Are they equal (case-sensitive)?', credential.recordHash === searchTerm);
          console.log('Are they equal (case-insensitive)?', normalizedSearchTerm === normalizedCredentialHash);
          
          // Compare both the original and normalized versions
          if (credential.recordHash === searchTerm || normalizedSearchTerm === normalizedCredentialHash) {
            console.log('Found matching credential!');
            foundIndex = i;
            foundCredential = credential;
            break;
          }
        } else {
          // Need to fetch the IPFS data to check the credential name
          try {
            const ipfsResponse = await fetch(`${API_URL}/ipfs/retrieve/${credential.ipfsHash}`);
            
            if (ipfsResponse.ok) {
              const ipfsData = await ipfsResponse.json();
              const credentialData = ipfsData.data;
              
              // Check if the credential name or data contains the search term
              if (
                (credentialData.data && credentialData.data.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (credentialData.metadata && credentialData.metadata.type && 
                 credentialData.metadata.type.toLowerCase().includes(searchTerm.toLowerCase()))
              ) {
                foundIndex = i;
                foundCredential = credential;
                break;
              }
            }
          } catch (ipfsError) {
            console.error('Error fetching IPFS data for credential search:', ipfsError);
          }
        }
      }

      if (foundIndex === -1) {
        throw new Error('No matching credential found for this address and search term');
      }

      // Fetch the IPFS data for the found credential
      try {
        const ipfsHash = foundCredential.ipfsHash;
        console.log('Full IPFS hash:', ipfsHash);
        console.log('IPFS hash length:', ipfsHash.length);
        
        // Check if it's a valid IPFS hash format (CIDv0 or CIDv1)
        const isValidIPFSHash = (hash) => {
          return (
            // CIDv0 format (starts with "Qm" and is 46 characters)
            (hash.startsWith('Qm') && hash.length === 46) ||
            // CIDv1 format (base32 encoding)
            /^b[a-z2-7]{58}$/i.test(hash)
          );
        };

        if (!ipfsHash || !isValidIPFSHash(ipfsHash)) {
          console.error('Invalid IPFS hash format detected');
          setVerificationResult({
            verified: true,
            credentialId: foundIndex,
            recipientAddress: formData.recipientAddress,
            recordHash: foundCredential.recordHash,
            ipfsHash: foundCredential.ipfsHash,
            issuerAddress: foundCredential.issuer,
            timestamp: new Date(Number(foundCredential.timestamp) * 1000).toLocaleString(),
            credentialName: `Credential #${foundIndex}`,
            data: `Credential verified successfully on the blockchain.\n\n` +
                  `Record Hash: ${foundCredential.recordHash}\n` +
                  `IPFS Hash: ${foundCredential.ipfsHash}\n` +
                  `Issuer: ${foundCredential.issuer}\n` +
                  `Issued On: ${new Date(Number(foundCredential.timestamp) * 1000).toLocaleString()}\n\n` +
                  `Note: The IPFS hash stored for this credential appears to be invalid or malformed.\n` +
                  `This might have happened during the credential issuance process.\n\n` +
                  `Technical Details:\n` +
                  `- Expected format: Qm... (46 characters for CIDv0)\n` +
                  `- Actual hash: ${ipfsHash}\n` +
                  `- Length: ${ipfsHash.length} characters\n\n` +
                  `Please try re-issuing the credential with a valid IPFS hash.`
          });
          return;
        }

        const ipfsUrl = `${API_URL}/ipfs/retrieve/${ipfsHash}`;
        console.log('Attempting to fetch IPFS data from:', ipfsUrl);
        
        const ipfsResponse = await fetch(ipfsUrl);
        console.log('IPFS response:', {
          status: ipfsResponse.status,
          statusText: ipfsResponse.statusText,
          headers: Object.fromEntries(ipfsResponse.headers.entries())
        });
        
        if (ipfsResponse.ok) {
          console.log('IPFS response OK, parsing data');
          const responseText = await ipfsResponse.text();
          console.log('Raw response text:', responseText.substring(0, 200) + '...');
          
          let ipfsData;
          try {
            ipfsData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Error parsing IPFS response:', parseError);
            throw new Error('Invalid JSON response from IPFS');
          }
          
          console.log('Parsed IPFS data:', ipfsData);
          const credentialData = ipfsData.data;
          console.log('Credential data:', credentialData);
          
          // Check if there's a PDF document attached
          if (credentialData.pdfDocument && credentialData.pdfDocument.ipfsHash) {
            console.log('PDF document found:', credentialData.pdfDocument);
            setPdfDocument({
              ipfsHash: credentialData.pdfDocument.ipfsHash,
              filename: credentialData.pdfDocument.filename || 'document.pdf',
              filesize: credentialData.pdfDocument.filesize
            });
          } else {
            console.log('No PDF document attached to this credential');
          }
          
          // Determine credential name from the data
          let credentialName = credentialData.data;
          if (credentialData.metadata && credentialData.metadata.type) {
            credentialName = credentialData.metadata.type;
          }
          
          setVerificationResult({
            verified: true,
            credentialId: foundIndex,
            recipientAddress: formData.recipientAddress,
            recordHash: foundCredential.recordHash,
            ipfsHash: foundCredential.ipfsHash,
            issuerAddress: foundCredential.issuer,
            timestamp: new Date(Number(foundCredential.timestamp) * 1000).toLocaleString(),
            credentialName: credentialName,
            data: credentialData.data,
            metadata: credentialData.metadata
          });
        } else {
          // Handle non-OK response (including 404 and 500)
          console.log('IPFS data not found or error:', ipfsResponse.status);
          let errorDetails = '';
          try {
            const errorText = await ipfsResponse.text();
            console.log('Error response body:', errorText);
            errorDetails = `: ${errorText}`;
          } catch (e) {
            console.log('Could not read error response:', e);
          }
          
          const credentialName = isSearchingByHash ? `Credential #${foundIndex}` : searchTerm;
          
          setVerificationResult({
            verified: true,
            credentialId: foundIndex,
            recipientAddress: formData.recipientAddress,
            recordHash: foundCredential.recordHash,
            ipfsHash: foundCredential.ipfsHash,
            issuerAddress: foundCredential.issuer,
            timestamp: new Date(Number(foundCredential.timestamp) * 1000).toLocaleString(),
            credentialName: credentialName,
            data: `Credential verified successfully on the blockchain.\n\n` +
                 `Record Hash: ${foundCredential.recordHash}\n` +
                 `IPFS Hash: ${foundCredential.ipfsHash}\n` +
                 `Issuer: ${foundCredential.issuer}\n` +
                 `Issued On: ${new Date(Number(foundCredential.timestamp) * 1000).toLocaleString()}\n\n` +
                 `Note: Additional credential details are currently unavailable.\n` +
                 `Error: Server returned ${ipfsResponse.status}${errorDetails}\n\n` +
                 `Please ensure:\n` +
                 `1. The IPFS daemon is running (run 'ipfs daemon' in terminal)\n` +
                 `2. The backend server is running (run 'npm start' in backend directory)\n` +
                 `3. The IPFS hash is valid: ${foundCredential.ipfsHash}`
          });
        }
      } catch (ipfsError) {
        console.error('Error fetching IPFS data:', ipfsError);
        
        // Still show verification result even if IPFS data retrieval fails
        setVerificationResult({
          verified: true,
          credentialId: foundIndex,
          recipientAddress: formData.recipientAddress,
          recordHash: foundCredential.recordHash,
          ipfsHash: foundCredential.ipfsHash,
          issuerAddress: foundCredential.issuer,
          timestamp: new Date(Number(foundCredential.timestamp) * 1000).toLocaleString(),
          credentialName: `Credential #${foundIndex}`,
          data: `Credential verified successfully on the blockchain.\n\n` +
                `Record Hash: ${foundCredential.recordHash}\n` +
                `IPFS Hash: ${foundCredential.ipfsHash}\n` +
                `Issuer: ${foundCredential.issuer}\n` +
                `Issued On: ${new Date(Number(foundCredential.timestamp) * 1000).toLocaleString()}\n\n` +
                `Note: Additional credential details are currently unavailable. ` +
                `Please ensure the IPFS daemon is running and try again.`
        });
      }
    } catch (error) {
      console.error('Error verifying credential:', error);
      setError(error.message || 'Failed to verify credential');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Verify Academic Credential
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Verify the authenticity of an academic credential by providing the recipient's address and either the record hash or credential name.
        </Typography>
      </Box>

      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              icon={<ErrorOutlineIcon />}
            >
              {error}
            </Alert>
          )}

          {verificationResult && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              icon={<VerifiedIcon />}
            >
              Credential verified successfully!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipient Ethereum Address"
                  name="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  placeholder="0x..."
                  helperText={
                    checkingCredentials 
                      ? "Checking credentials..." 
                      : credentialCount !== null 
                        ? `${credentialCount} credential(s) found for this address` 
                        : "Enter the Ethereum address of the credential recipient"
                  }
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Record Hash or Credential Name"
                  name="recordHash"
                  value={formData.recordHash}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  placeholder="0x... or 'Bachelor of Science'"
                  helperText="Enter either the record hash (starting with 0x) or search by credential name"
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
                    startIcon={<VerifiedIcon />}
                    sx={{ px: 4, py: 1.2 }}
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
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {verificationResult && (
        <Card elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            backgroundColor: theme.palette.success.main, 
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center'
          }}>
            <VerifiedIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Credential Verified
            </Typography>
          </Box>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom>
                  {verificationResult.credentialName}
                </Typography>
                <Chip 
                  label={`Credential ID: ${verificationResult.credentialId}`} 
                  size="small" 
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Recipient
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {verificationResult.recipientAddress}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Issuer
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {verificationResult.issuerAddress}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Issued On
                </Typography>
                <Typography variant="body2">
                  {verificationResult.timestamp}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Record Hash
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {verificationResult.recordHash}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Credential Details
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {verificationResult.data}
                </Typography>
              </Grid>

              {pdfDocument && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    backgroundColor: theme.palette.grey[50]
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PictureAsPdfIcon color="error" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">
                        Official Document
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2">
                          {pdfDocument.filename}
                        </Typography>
                        {pdfDocument.filesize && (
                          <Typography variant="body2" color="text.secondary">
                            {(pdfDocument.filesize / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        )}
                      </Box>
                      
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        component="a"
                        href={`${API_URL}/ipfs/file/${pdfDocument.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Document
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Blockchain Verification
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    icon={<VerifiedIcon />} 
                    label="Blockchain Verified" 
                    color="success" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`IPFS: ${verificationResult.ipfsHash.substring(0, 8)}...`} 
                    variant="outlined" 
                    component="a"
                    href={`https://ipfs.io/ipfs/${verificationResult.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Paper elevation={1} sx={{ p: 3, backgroundColor: theme.palette.grey[50] }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          How to Verify a Credential
        </Typography>
        <Typography variant="body2" color="text.secondary">
          1. Enter the Ethereum address of the credential recipient<br />
          2. Enter either the record hash (starting with 0x) or search by credential name<br />
          3. Click "Verify Credential" to check if the credential exists and is valid<br />
          4. If a PDF document is attached, you can view it by clicking "View Document"
        </Typography>
      </Paper>
    </Container>
  );
}

export default VerifyCredential;