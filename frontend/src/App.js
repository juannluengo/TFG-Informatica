// Purpose: The main React component that defines the overall structure of your application.

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Alert } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Navigation from './components/Navigation';
import Home from './components/Home';
import IssueCredential from './components/IssueCredential';
import VerifyCredential from './components/VerifyCredential';
import ViewCredentials from './components/ViewCredentials';
import ViewCredential from './components/ViewCredential';
import StudentDirectory from './components/StudentDirectory';
import DiagnosticTool from './components/DiagnosticTool';
import Web3Provider, { useWeb3 } from './contexts/Web3Context';

// Create a more vibrant and modern theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5', // Indigo
      light: '#757de8',
      dark: '#002984',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057', // Pink
      light: '#ff5983',
      dark: '#bb002f',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function AppContent() {
  const { networkError } = useWeb3();
  
  return (
    <>
      {networkError && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 9999,
            borderRadius: 0
          }}
        >
          {networkError}
        </Alert>
      )}
      <Navigation />
      <Box sx={{ 
        pt: `${networkError ? 'calc(64px + 40px)' : '64px'}`,
        transition: 'padding-top 0.3s ease-in-out',
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'background.default',
      }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/issue" element={<IssueCredential />} />
          <Route path="/verify" element={<VerifyCredential />} />
          <Route path="/view" element={<ViewCredentials />} />
          <Route path="/view/:address/:index" element={<ViewCredential />} />
          <Route path="/directory" element={<StudentDirectory />} />
          <Route path="/diagnostics" element={<DiagnosticTool />} />
          {/* Redirect /add to /issue to avoid confusion */}
          <Route path="/add" element={<Navigate to="/issue" replace />} />
        </Routes>
      </Box>
    </>
  );
}

function App() {
  return (
    <Web3Provider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </Web3Provider>
  );
}

export default App;