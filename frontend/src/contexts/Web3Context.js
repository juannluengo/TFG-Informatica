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

  const initializeContract = async (signer) => {
    try {
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      console.log('Contract address being used:', contractAddress);
      
      if (!AcademicRecordsArtifact.abi) {
        throw new Error('Contract ABI not found');
      }

      const contract = new ethers.Contract(
        contractAddress,
        AcademicRecordsArtifact.abi,
        signer
      );

      // Test if we can actually call contract methods
      try {
        const count = await contract.getCredentialCount(await signer.getAddress());
        console.log('Successfully tested contract with getCredentialCount:', count.toString());
        return contract;
      } catch (error) {
        console.error('Failed to test contract method:', error);
        throw new Error('Contract method test failed - check if contract is deployed correctly');
      }
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      throw error;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          console.log('Connected account:', account);
          setAccount(account);

          // Create provider first
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          
          // Get network information
          const network = await provider.getNetwork();
          const chainId = network.chainId;
          console.log('Current chain ID:', chainId);
          
          if (chainId !== 31337n) {
            setNetworkError('Please connect to Hardhat Local network (Chain ID: 31337)');
            setLoading(false);
            return;
          }
          setNetworkError(null);
          
          // Get signer and initialize contract
          const signer = await provider.getSigner();
          const contract = await initializeContract(signer);
          setContract(contract);

          // Event listeners for network and account changes
          window.ethereum.on('chainChanged', (chainId) => {
            const chainIdNum = BigInt(chainId);
            if (chainIdNum !== 31337n) {
              setNetworkError('Please connect to Hardhat Local network (Chain ID: 31337)');
            } else {
              setNetworkError(null);
            }
            window.location.reload();
          });

          window.ethereum.on('accountsChanged', (accounts) => {
            window.location.reload();
          });

        } else {
          throw new Error('MetaMask not installed');
        }
      } catch (error) {
        console.error('Failed to initialize Web3:', error);
        setNetworkError(error.message);
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
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