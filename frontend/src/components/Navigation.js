import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';

function Navigation() {
  const { account, isAdmin } = useWeb3();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          UPM Academic Records
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          {isAdmin && (
            <Button color="inherit" component={RouterLink} to="/issue">
              Issue Credential
            </Button>
          )}
          <Button color="inherit" component={RouterLink} to="/verify">
            Verify Credential
          </Button>
          <Button color="inherit" component={RouterLink} to="/view">
            View Credentials
          </Button>
          <Typography variant="body2" sx={{ alignSelf: 'center', ml: 2 }}>
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not Connected'}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;