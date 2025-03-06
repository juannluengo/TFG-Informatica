import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  useTheme,
  Chip,
  Button,
  Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Add API URL constant
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function ViewCredential() {
  const { address, index } = useParams();
  const { contract } = useWeb3();
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState('');
  const [pdfDocument, setPdfDocument] = useState(null);

  useEffect(() => {
    const fetchCredential = async () => {
      try {
        setLoading(true);
        
        // Get the credential from the blockchain
        const credentialData = await contract.getCredential(address, index);
        
        // Fetch the IPFS data
        try {
          const ipfsResponse = await fetch(`${API_URL}/api/ipfs/retrieve/${credentialData.ipfsHash}`);
          
          if (ipfsResponse.ok) {
            const ipfsData = await ipfsResponse.json();
            const data = ipfsData.data;
            
            // Check if there's a PDF document attached
            if (data.pdfDocument && data.pdfDocument.ipfsHash) {
              setPdfDocument({
                ipfsHash: data.pdfDocument.ipfsHash,
                filename: data.pdfDocument.filename || 'document.pdf',
                filesize: data.pdfDocument.filesize
              });
            }
            
            // Determine credential name
            let credentialName = data.data;
            if (data.metadata && data.metadata.type) {
              credentialName = data.metadata.type;
            }
            
            setCredential({
              id: index,
              address: address,
              issuer: credentialData.issuer,
              recordHash: credentialData.recordHash,
              ipfsHash: credentialData.ipfsHash,
              timestamp: new Date(credentialData.timestamp.toNumber() * 1000).toLocaleString(),
              valid: credentialData.valid,
              name: credentialName,
              data: data.data,
              metadata: data.metadata
            });
          } else if (ipfsResponse.status === 404) {
            // IPFS data not found, but we can still show blockchain data
            setCredential({
              id: index,
              address: address,
              issuer: credentialData.issuer,
              recordHash: credentialData.recordHash,
              ipfsHash: credentialData.ipfsHash,
              timestamp: new Date(credentialData.timestamp.toNumber() * 1000).toLocaleString(),
              valid: credentialData.valid,
              name: `Credential #${index}`,
              data: "IPFS data not available"
            });
          } else {
            throw new Error(`Failed to retrieve IPFS data: ${ipfsResponse.statusText}`);
          }
        } catch (ipfsError) {
          console.error('Error fetching IPFS data:', ipfsError);
          
          // Still show credential even if IPFS data retrieval fails
          setCredential({
            id: index,
            address: address,
            issuer: credentialData.issuer,
            recordHash: credentialData.recordHash,
            ipfsHash: credentialData.ipfsHash,
            timestamp: new Date(credentialData.timestamp.toNumber() * 1000).toLocaleString(),
            valid: credentialData.valid,
            name: `Credential #${index}`,
            data: "Error retrieving IPFS data"
          });
        }
      } catch (error) {
        console.error('Error fetching credential:', error);
        setError('Failed to load credential. It may not exist or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    if (contract && address && index) {
      fetchCredential();
    }
  }, [contract, address, index]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading credential...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          variant="outlined"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  if (!credential) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Credential not found
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          variant="outlined"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          variant="outlined"
        >
          Back
        </Button>
      </Box>

      <Card elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
        <Box sx={{ 
          backgroundColor: credential.valid ? theme.palette.success.main : theme.palette.error.main, 
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center'
        }}>
          <VerifiedIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            {credential.valid ? 'Valid Credential' : 'Revoked Credential'}
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                {credential.name}
              </Typography>
              <Chip 
                label={`Credential ID: ${credential.id}`} 
                size="small" 
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Recipient
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {credential.address}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Issuer
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {credential.issuer}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Issued On
              </Typography>
              <Typography variant="body2">
                {credential.timestamp}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Record Hash
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {credential.recordHash}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Credential Details
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {credential.data}
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
                      href={`${API_URL}/api/ipfs/file/${pdfDocument.ipfsHash}`}
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
                  label={credential.valid ? "Valid" : "Revoked"} 
                  color={credential.valid ? "success" : "error"} 
                  variant="outlined" 
                />
                <Chip 
                  label={`IPFS: ${credential.ipfsHash.substring(0, 8)}...`} 
                  variant="outlined" 
                  component="a"
                  href={`https://ipfs.io/ipfs/${credential.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ViewCredential; 