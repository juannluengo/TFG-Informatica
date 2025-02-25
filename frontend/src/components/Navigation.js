import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Typography, 
  Box, 
  Container,
  Chip,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SchoolIcon from '@mui/icons-material/School';

function Navigation() {
  const { account, isAdmin, networkError } = useWeb3();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', showAlways: true },
    { path: '/issue', label: 'Issue Credential', showAlways: true },
    { path: '/view', label: 'View Credentials', showAlways: true },
    { path: '/verify', label: 'Verify Credential', showAlways: true },
  ];

  const filteredItems = navItems.filter(item => 
    (item.showAlways || (item.showAdmin && isAdmin))
  );

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        top: networkError ? '40px' : 0, 
        transition: 'top 0.3s ease-in-out',
        backgroundColor: theme.palette.primary.main
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 600,
                display: { xs: isMobile ? 'none' : 'block', md: 'block' }
              }}
            >
              UPM Academic Records
            </Typography>
          </Box>

          {isMobile ? (
            <>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton
                color="inherit"
                aria-label="open menu"
                edge="end"
                onClick={handleMenuOpen}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                {filteredItems.map((item) => (
                  <MenuItem 
                    key={item.path} 
                    component={RouterLink} 
                    to={item.path}
                    onClick={handleMenuClose}
                    selected={isActive(item.path)}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, ml: 4 }}>
              {filteredItems.map((item) => (
                <Button 
                  key={item.path}
                  color="inherit" 
                  component={RouterLink} 
                  to={item.path}
                  sx={{ 
                    px: 2,
                    borderRadius: '4px',
                    backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Chip
            icon={<AccountBalanceWalletIcon />}
            label={account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not Connected'}
            variant="outlined"
            size="small"
            color={account ? "default" : "error"}
            sx={{ 
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              '& .MuiChip-icon': { color: 'white' },
              fontWeight: 500
            }}
          />
          
          {isAdmin && (
            <Chip
              label="Admin"
              size="small"
              color="secondary"
              sx={{ ml: 1, fontWeight: 500 }}
            />
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navigation;