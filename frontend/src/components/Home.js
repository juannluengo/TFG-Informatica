import React from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Divider,
  Avatar,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleIcon from '@mui/icons-material/AddCircle';

function Home() {
  const { account, isAdmin, loading } = useWeb3();
  const navigate = useNavigate();
  const theme = useTheme();

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" align="center">Loading...</Typography>
      </Container>
    );
  }

  const features = [
    {
      title: "View Credentials",
      description: "Browse through all your academic credentials stored on the blockchain.",
      icon: <VisibilityIcon fontSize="large" color="primary" />,
      action: () => navigate('/view'),
      available: !!account
    },
    {
      title: "Verify Credentials",
      description: "Verify the authenticity of any academic credential using its unique hash.",
      icon: <VerifiedIcon fontSize="large" color="primary" />,
      action: () => navigate('/verify'),
      available: !!account
    },
    {
      title: "Issue Credentials",
      description: "Issue new academic credentials to students (administrators only).",
      icon: <AddCircleIcon fontSize="large" color="primary" />,
      action: () => navigate('/issue'),
      available: !!account && isAdmin
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ 
        textAlign: 'center', 
        py: 6,
        px: 2,
        mb: 6,
        borderRadius: 2,
        background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <Avatar 
          sx={{ 
            width: 80, 
            height: 80, 
            mx: 'auto', 
            mb: 3,
            backgroundColor: 'white',
            color: theme.palette.primary.main,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <SchoolIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          UPM Academic Records
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 800, mx: 'auto', mb: 4, opacity: 0.9 }}>
          A decentralized application for secure management and verification of academic credentials on the Ethereum blockchain
        </Typography>
        
        {!account && (
          <Button 
            variant="contained" 
            size="large"
            onClick={connectWallet}
            sx={{ 
              backgroundColor: 'white', 
              color: theme.palette.primary.main,
              px: 4,
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              }
            }}
          >
            Connect Wallet
          </Button>
        )}
      </Box>

      {account ? (
        <>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom color="primary.dark" fontWeight="medium">
              Welcome to the Academic Records Platform
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              You're connected with address <strong>{account}</strong>
              {isAdmin && " and have administrator privileges."}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.filter(f => f.available).map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={feature.action}
                    >
                      {feature.title}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Please connect your wallet to access the platform features
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            You need to connect your Ethereum wallet to interact with the blockchain and access your academic credentials.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default Home;