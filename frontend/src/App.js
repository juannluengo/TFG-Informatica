// Purpose: The main React component that defines the overall structure of your application.

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Navigation from './components/Navigation';
import Home from './components/Home';
import IssueCredential from './components/IssueCredential';
import VerifyCredential from './components/VerifyCredential';
import ViewCredentials from './components/ViewCredentials';
import Web3Provider from './contexts/Web3Context';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <Web3Provider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/issue" element={<IssueCredential />} />
            <Route path="/verify" element={<VerifyCredential />} />
            <Route path="/view" element={<ViewCredentials />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Web3Provider>
  );
}

export default App;