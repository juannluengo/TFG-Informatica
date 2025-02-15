import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import AcademicRecordsArtifact from '../contracts/AcademicRecords.json';

const Web3Context = createContext();

export function useWeb3() {
  return useContext(Web3Context);
}

export default function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          setAccount(account);

          // Check if we're on the correct network (Hardhat local network)
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          if (chainId !== '0x7A69') { // 31337 in hex
            setNetworkError('Please connect to Hardhat Local network (Chain ID: 31337)');
            return;
          }

          // Create provider and contract instances
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          
          const signer = await provider.getSigner();
          const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
          
          if (!contractAddress) {
            throw new Error('Contract address not configured');
          }

          const contract = new ethers.Contract(
            contractAddress,
            AcademicRecordsArtifact.abi,
            signer
          );

          setContract(contract);

          // Check if user is admin
          const adminRole = await contract.ADMIN_ROLE();
          const isAdmin = await contract.hasRole(adminRole, account);
          setIsAdmin(isAdmin);

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
          });

          // Listen for chain changes
          window.ethereum.on('chainChanged', (chainId) => {
            if (chainId !== '0x7A69') { // 31337 in hex
              setNetworkError('Please connect to Hardhat Local network (Chain ID: 31337)');
            } else {
              setNetworkError(null);
            }
            window.location.reload();
          });

        }
      } catch (error) {
        console.error('Failed to initialize Web3:', error);
        setNetworkError(error.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const value = {
    account,
    provider,
    contract,
    isAdmin,
    loading,
    networkError
  };

  return (
    <Web3Context.Provider value={value}>
      {networkError ? (
        <div style={{ 
          position: 'fixed', 
          top: '0', 
          left: '0', 
          right: '0',
          padding: '0.5rem',
          background: '#ff6b6b',
          color: 'white',
          textAlign: 'center',
          zIndex: 1000,
          height: '40px',
          lineHeight: '24px'
        }}>
          {networkError}
        </div>
      ) : null}
      <div style={{ 
        marginTop: networkError ? '40px' : '0',
        minHeight: 'calc(100vh - 40px)',
        transition: 'margin-top 0.3s ease-in-out'
      }}>
        {children}
      </div>
    </Web3Context.Provider>
  );
}