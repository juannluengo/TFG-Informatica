import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { useWeb3 } from '../contexts/Web3Context';

function Home() {
  const { account, isAdmin, loading } = useWeb3();

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" align="center">Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to UPM Academic Records
        </Typography>
        <Typography variant="body1" paragraph>
          This decentralized application allows secure management and verification of academic credentials on the Ethereum blockchain.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          {!account ? (
            <Box>
              <Typography variant="body1" paragraph color="error">
                Please connect your wallet to continue.
              </Typography>
              <Button variant="contained" onClick={connectWallet}>
                Connect Wallet
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" paragraph color="success.main">
                Connected: {account}
              </Typography>
              <Typography variant="body1" paragraph>
                Role: {isAdmin ? 'Administrator' : 'User'}
              </Typography>
              <Typography variant="body1" paragraph>
                You can:
              </Typography>
              <ul>
                {isAdmin && (
                  <li>
                    <Typography>Issue new academic credentials</Typography>
                  </li>
                )}
                <li>
                  <Typography>View existing credentials</Typography>
                </li>
                <li>
                  <Typography>Verify academic records</Typography>
                </li>
              </ul>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default Home;