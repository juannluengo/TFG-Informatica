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
  const { contract, account } = useWeb3();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressToView, setAddressToView] = useState('');

  const loadCredentials = async (address) => {
    setLoading(true);
    setError('');
    try {
      const targetAddress = address || account;
      const count = await contract.getCredentialCount(targetAddress);
      const credentialPromises = [];

      for (let i = 0; i < count; i++) {
        credentialPromises.push(contract.getCredential(targetAddress, i));
      }

      const results = await Promise.all(credentialPromises);
      const formattedCredentials = results.map((cred, index) => ({
        index,
        recordHash: cred.recordHash,
        ipfsHash: cred.ipfsHash,
        issuer: cred.issuer,
        timestamp: new Date(Number(cred.timestamp) * 1000).toLocaleString(),
        valid: cred.valid
      }));

      setCredentials(formattedCredentials);
    } catch (error) {
      console.error('Error loading credentials:', error);
      setError(error.message || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account) {
      loadCredentials();
    }
  }, [contract, account]);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (addressToView) {
      loadCredentials(addressToView);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          View Academic Credentials
        </Typography>

        <Box component="form" onSubmit={handleAddressSubmit} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Enter Ethereum Address (optional)"
            value={addressToView}
            onChange={(e) => setAddressToView(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained">
            View Credentials
          </Button>
        </Box>

        {error && (
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