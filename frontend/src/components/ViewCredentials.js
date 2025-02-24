import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Box
} from '@mui/material';
import { useWeb3 } from '../contexts/Web3Context';

function ViewCredentials() {
  const { contract, account, loading: web3Loading, networkError } = useWeb3();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressToView, setAddressToView] = useState('');

  const loadCredentials = async (address) => {
    if (!contract) {
      console.log('Contract not initialized yet');
      setError('Web3 connection not initialized yet. Please wait...');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const targetAddress = address || account;
      console.log('Loading credentials for address:', targetAddress);
      
      if (!targetAddress) {
        throw new Error('No address provided and no account connected');
      }

      console.log('Getting credential count...');
      const count = await contract.getCredentialCount(targetAddress);
      const countNum = Number(count);
      console.log('Credential count:', countNum);
      
      if (countNum === 0) {
        console.log('No credentials found for address');
        setCredentials([]);
        setLoading(false);
        return;
      }
      
      const credentialPromises = [];
      for (let i = 0; i < countNum; i++) {
        console.log(`Fetching credential at index ${i}`);
        credentialPromises.push(
          contract.getCredential(targetAddress, i)
            .then(cred => ({
              index: i,
              recordHash: cred.recordHash,
              ipfsHash: cred.ipfsHash,
              issuer: cred.issuer,
              timestamp: new Date(Number(cred.timestamp) * 1000).toLocaleString(),
              valid: cred.valid
            }))
            .catch(error => {
              console.error(`Error fetching credential at index ${i}:`, error);
              return null;
            })
        );
      }

      const results = await Promise.all(credentialPromises);
      const formattedCredentials = results.filter(cred => cred !== null);
      console.log('Formatted credentials:', formattedCredentials);
      setCredentials(formattedCredentials);
    } catch (error) {
      console.error('Error loading credentials:', error);
      setError(error.message || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  // Load credentials when contract and account are ready
  useEffect(() => {
    const initializeAndLoad = async () => {
      if (web3Loading) {
        console.log('Web3 still loading...');
        return;
      }
      
      if (!contract) {
        console.log('Contract not ready...');
        return;
      }
      
      if (!account) {
        console.log('Account not ready...');
        return;
      }
      
      console.log('Web3 initialized, loading credentials...');
      await loadCredentials(addressToView || account);
    };

    initializeAndLoad();
  }, [contract, account, web3Loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (web3Loading) {
      setError('Please wait for Web3 to initialize...');
      return;
    }
    if (!contract) {
      setError('Please wait for contract to initialize...');
      return;
    }
    await loadCredentials(addressToView);
  };

  const buttonDisabled = loading || web3Loading || !contract || networkError;
  const getButtonTooltip = () => {
    if (loading) return 'Loading credentials...';
    if (web3Loading) return 'Initializing Web3...';
    if (!contract) return 'Waiting for contract connection...';
    if (networkError) return networkError;
    return '';
  };

  if (web3Loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Initializing Web3...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          View Academic Credentials
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Enter Ethereum Address (optional)"
            value={addressToView}
            onChange={(e) => setAddressToView(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              type="submit" 
              variant="contained"
              disabled={buttonDisabled}
              title={getButtonTooltip()}
            >
              {loading ? 'Loading...' : 'View Credentials'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setAddressToView('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
                loadCredentials('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
              }}
              disabled={buttonDisabled}
            >
              Load Test Account
            </Button>
          </Box>
        </Box>

        {networkError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {networkError}
          </Alert>
        )}
        
        {error && !networkError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', m: 3 }}>
            <CircularProgress />
          </Box>
        ) : credentials.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Index</TableCell>
                  <TableCell>Record Hash</TableCell>
                  <TableCell>IPFS Hash</TableCell>
                  <TableCell>Issuer</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {credentials.map((cred) => (
                  <TableRow key={cred.index}>
                    <TableCell>{cred.index}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {cred.recordHash}
                      </Typography>
                    </TableCell>
                    <TableCell>{cred.ipfsHash}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {cred.issuer}
                      </Typography>
                    </TableCell>
                    <TableCell>{cred.timestamp}</TableCell>
                    <TableCell>
                      {cred.valid ? (
                        <Typography color="success.main">Valid</Typography>
                      ) : (
                        <Typography color="error">Revoked</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', my: 3 }}>
            No credentials found
          </Typography>
        )}
      </Paper>
    </Container>
  );
}

export default ViewCredentials;