import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  CircularProgress, 
  Alert, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Divider,
  Chip,
  useTheme,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import { useWeb3 } from '../contexts/Web3Context';
import { useNavigate } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedIcon from '@mui/icons-material/Verified';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Add API URL constant
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

function ViewCredentials() {
  const { contract, account } = useWeb3();
  const theme = useTheme();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        alert('Copied to clipboard!');
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  const viewCredential = (address, index) => {
    navigate(`/view/${address}/${index}`);
  };

  const loadCredentials = useCallback(async () => {
    if (!contract || !account) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get the count of credentials for the current account
      const count = await contract.getCredentialCount(account);
      // Convert to number safely - in ethers v6, this might already be a number
      const credentialCount = Number(count);
      
      if (credentialCount === 0) {
        setCredentials([]);
        setLoading(false);
        return;
      }
      
      const credentialsArray = [];
      
      // Fetch each credential
      for (let i = 0; i < credentialCount; i++) {
        try {
          const credential = await contract.getCredential(account, i);
          
          // Format the credential data
          const formattedCredential = {
            index: i,
            recordHash: credential.recordHash,
            ipfsHash: credential.ipfsHash,
            timestamp: new Date(Number(credential.timestamp) * 1000).toLocaleString(),
            issuer: credential.issuer,
            valid: credential.valid,
            data: null,
            pdfDocument: null
          };
          
          // Try to fetch the IPFS data
          try {
            const ipfsResponse = await fetch(`${API_URL}/ipfs/retrieve/${credential.ipfsHash}`);
            
            if (ipfsResponse.ok) {
              const ipfsData = await ipfsResponse.json();
              formattedCredential.data = ipfsData.data;
              
              // Check if there's a PDF document attached
              if (ipfsData.data.pdfDocument && ipfsData.data.pdfDocument.ipfsHash) {
                formattedCredential.pdfDocument = {
                  ipfsHash: ipfsData.data.pdfDocument.ipfsHash,
                  filename: ipfsData.data.pdfDocument.filename || 'document.pdf',
                  filesize: ipfsData.data.pdfDocument.filesize
                };
              }
            }
          } catch (ipfsError) {
            console.warn(`Failed to fetch IPFS data for credential ${i}:`, ipfsError);
            // We still keep the credential even if IPFS data is not available
          }
          
          credentialsArray.push(formattedCredential);
        } catch (credError) {
          console.error(`Error fetching credential ${i}:`, credError);
        }
      }
      
      setCredentials(credentialsArray);
    } catch (error) {
      console.error('Error loading credentials:', error);
      setError('Failed to load credentials: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [contract, account]);
  
  useEffect(() => {
    if (contract && account) {
      loadCredentials();
    }
  }, [contract, account, loadCredentials]);

  if (!account) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to view your credentials.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Your Academic Credentials
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View all your academic credentials stored on the blockchain
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      ) : credentials.length === 0 ? (
        <Card elevation={2} sx={{ p: 4, textAlign: 'center', mb: 4 }}>
          <SchoolIcon sx={{ fontSize: 60, color: theme.palette.grey[300], mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Credentials Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have any academic credentials stored on the blockchain yet.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {credentials.map((credential, index) => (
            <Grid item xs={12} key={index}>
              <Card 
                elevation={2} 
                sx={{ 
                  borderLeft: credential.valid 
                    ? `4px solid ${theme.palette.success.main}` 
                    : `4px solid ${theme.palette.error.main}`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SchoolIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="h6" component="h2">
                          {credential.data?.data || `Credential #${credential.index}`}
                        </Typography>
                        {credential.valid ? (
                          <Chip 
                            label="Valid" 
                            size="small" 
                            color="success" 
                            icon={<VerifiedIcon />}
                            sx={{ ml: 2 }}
                          />
                        ) : (
                          <Chip 
                            label="Revoked" 
                            size="small" 
                            color="error"
                            sx={{ ml: 2 }}
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.text.secondary }} />
                          <Typography variant="body2" color="text.secondary">
                            {credential.timestamp}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.text.secondary }} />
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Issuer: {credential.issuer.slice(0, 6)}...{credential.issuer.slice(-4)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Copy Record Hash">
                          <Chip
                            label={`Record Hash: ${credential.recordHash.slice(0, 10)}...${credential.recordHash.slice(-6)}`}
                            size="small"
                            variant="outlined"
                            onClick={() => copyToClipboard(credential.recordHash)}
                            icon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Tooltip>
                        
                        <Tooltip title="Copy IPFS Hash">
                          <Chip
                            label={`IPFS: ${credential.ipfsHash.slice(0, 6)}...${credential.ipfsHash.slice(-4)}`}
                            size="small"
                            variant="outlined"
                            onClick={() => copyToClipboard(credential.ipfsHash)}
                            icon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => toggleExpand(index)}
                        endIcon={expandedId === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ mr: 1 }}
                      >
                        {expandedId === index ? 'Hide Details' : 'View Details'}
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => viewCredential(account, credential.index)}
                      >
                        View Full
                      </Button>
                    </Grid>
                  </Grid>
                  
                  <Collapse in={expandedId === index}>
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Credential Details
                    </Typography>
                    
                    {credential.data ? (
                      <Box sx={{ mt: 2 }}>
                        {credential.data.data && (
                          <Typography variant="body1" paragraph>
                            <strong>Data:</strong> {credential.data.data}
                          </Typography>
                        )}
                        
                        {credential.data.metadata && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Metadata:
                            </Typography>
                            <Grid container spacing={1}>
                              {Object.entries(credential.data.metadata).map(([key, value]) => (
                                <Grid item xs={12} sm={6} md={4} key={key}>
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
                        No additional data available for this credential.
                      </Typography>
                    )}
                    
                    {credential.pdfDocument && (
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
                              {credential.pdfDocument.filename}
                            </Typography>
                            {credential.pdfDocument.filesize && (
                              <Typography variant="body2" color="text.secondary">
                                {(credential.pdfDocument.filesize / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            )}
                          </Box>
                          
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<OpenInNewIcon />}
                            component="a"
                            href={`${API_URL}/ipfs/file/${credential.pdfDocument.ipfsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Document
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={loadCredentials} 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          Refresh Credentials
        </Button>
      </Box>
    </Container>
  );
}

export default ViewCredentials;