import { useState } from 'react';
import axios from 'axios';
import {
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  Paper, 
  Alert, 
  AlertTitle, 
  List, 
  ListItem, 
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';

const DiagnosticTool = () => {
  const [loading, setLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [error, setError] = useState(null);
  
  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:3001/api/diagnostics/full');
      setDiagnosticResults(response.data);
    } catch (error) {
      console.error('Diagnostic error:', error);
      setError(error.message || 'Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };
  
  // Format a boolean value as a status chip
  const StatusChip = ({ value }) => {
    if (value === true) {
      return <Chip 
        icon={<CheckCircleIcon />} 
        label="Success" 
        color="success" 
        size="small" 
        variant="outlined" 
      />;
    } else if (value === false) {
      return <Chip 
        icon={<ErrorIcon />} 
        label="Failed" 
        color="error" 
        size="small" 
        variant="outlined" 
      />;
    } else {
      return <Chip 
        icon={<HelpIcon />} 
        label="Unknown" 
        color="default" 
        size="small" 
        variant="outlined" 
      />;
    }
  };
  
  // Render the provider connection section
  const renderProviderSection = () => {
    const provider = diagnosticResults?.provider;
    
    if (!provider) return null;
    
    return (
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Provider Connection
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>Connection Status:</Typography>
            <StatusChip value={provider.connected} />
          </Box>
          
          {provider.connected ? (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>RPC URL:</strong> {provider.rpcUrl}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Network:</strong> {provider.networkInfo?.name || 'Unknown'} 
                (ChainID: {provider.networkInfo?.chainId || 'Unknown'})
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Current Block:</strong> {provider.blockNumber}
              </Typography>
            </>
          ) : (
            <Alert severity="error">
              <AlertTitle>Connection Failed</AlertTitle>
              {provider.error || 'Cannot connect to the blockchain network. Please check your RPC endpoint.'}
            </Alert>
          )}
        </Paper>
      </Box>
    );
  };
  
  // Render the contract section
  const renderContractSection = () => {
    const contracts = diagnosticResults?.contracts;
    
    if (!contracts) return null;
    
    return (
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Contract Status
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2 }}>
          {contracts.studentDirectory ? (
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                Student Directory Contract
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Address:</strong> {contracts.studentDirectory.address}
              </Typography>
              
              <Box display="flex" alignItems="center" my={1}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  <strong>Contract Exists:</strong>
                </Typography>
                <StatusChip value={contracts.studentDirectory.hasCode} />
              </Box>
              
              {contracts.studentDirectory.hasCode && (
                <Box display="flex" alignItems="center" my={1}>
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    <strong>ABI Compatible:</strong>
                  </Typography>
                  <StatusChip value={contracts.studentDirectory.isABICompatible} />
                </Box>
              )}
              
              {contracts.studentDirectory.methodError && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <AlertTitle>Method Error</AlertTitle>
                  {contracts.studentDirectory.methodError}
                </Alert>
              )}
            </Box>
          ) : (
            <Alert severity="warning">
              No Student Directory contract information available
            </Alert>
          )}
          
          {contracts.contract && contracts.contract !== contracts.studentDirectory && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Secondary Contract
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Address:</strong> {contracts.contract.address}
                </Typography>
                
                <Box display="flex" alignItems="center" my={1}>
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    <strong>Contract Exists:</strong>
                  </Typography>
                  <StatusChip value={contracts.contract.hasCode} />
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    );
  };
  
  // Render environment info
  const renderEnvInfo = () => {
    if (!diagnosticResults?.environment) return null;
    
    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Environment Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2">
            <strong>Node Version:</strong> {diagnosticResults.environment.nodeVersion}
          </Typography>
          <Typography variant="body2">
            <strong>Platform:</strong> {diagnosticResults.environment.platform}
          </Typography>
          <Typography variant="body2">
            <strong>Architecture:</strong> {diagnosticResults.environment.arch}
          </Typography>
          <Typography variant="body2">
            <strong>Time:</strong> {diagnosticResults.timestamp}
          </Typography>
        </AccordionDetails>
      </Accordion>
    );
  };
  
  // Render contract ABI info
  const renderAbiInfo = () => {
    if (!diagnosticResults?.contractABI) return null;
    
    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Contract ABI Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              <strong>ABI Loaded:</strong>
            </Typography>
            <StatusChip value={diagnosticResults.contractABI.loaded} />
          </Box>
          
          {diagnosticResults.contractABI.loaded && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Available Functions:
              </Typography>
              <List dense>
                {diagnosticResults.contractABI.functions.map((func, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={func} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };
  
  // Render recommendations
  const renderRecommendations = () => {
    if (!diagnosticResults?.recommendations || diagnosticResults.recommendations.length === 0) {
      return null;
    }
    
    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Recommendations
        </Typography>
        
        <Alert severity="info">
          <AlertTitle>How to Fix Issues</AlertTitle>
          <List dense>
            {diagnosticResults.recommendations.map((rec, index) => (
              <ListItem key={index}>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>
        </Alert>
      </Box>
    );
  };
  
  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ flexGrow: 1 }}>
          Smart Contract Diagnostic Tool
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
          onClick={runDiagnostics}
          disabled={loading}
        >
          {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {!diagnosticResults && !loading && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Click the "Run Diagnostics" button to check your contract configuration.
        </Alert>
      )}
      
      {diagnosticResults && (
        <Box>
          {renderProviderSection()}
          {renderContractSection()}
          {renderRecommendations()}
          {renderAbiInfo()}
          {renderEnvInfo()}
        </Box>
      )}
    </Box>
  );
};

export default DiagnosticTool; 