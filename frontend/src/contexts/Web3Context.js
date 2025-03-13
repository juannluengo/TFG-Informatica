import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import AcademicRecordsArtifact from '../contracts/AcademicRecords.json';
import StudentDirectoryArtifact from '../contracts/StudentDirectory.json';

const Web3Context = createContext();

export function useWeb3() {
  return useContext(Web3Context);
}

export default function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [academicRecordsContract, setAcademicRecordsContract] = useState(null);
  const [studentDirectoryContract, setStudentDirectoryContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);

  const initializeContracts = async (signer) => {
    try {
      // Initialize Academic Records Contract
      const academicRecordsAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
      console.log('Academic Records contract address:', academicRecordsAddress);
      
      if (!AcademicRecordsArtifact.abi) {
        throw new Error('Academic Records ABI not found');
      }

      const academicRecords = new ethers.Contract(
        academicRecordsAddress,
        AcademicRecordsArtifact.abi,
        signer
      );

      // Initialize Student Directory Contract
      const studentDirectoryAddress = process.env.REACT_APP_STUDENT_DIRECTORY_ADDRESS;
      console.log('Student Directory contract address:', studentDirectoryAddress);
      
      if (!StudentDirectoryArtifact.abi) {
        throw new Error('Student Directory ABI not found');
      }

      const studentDirectory = new ethers.Contract(
        studentDirectoryAddress,
        StudentDirectoryArtifact.abi,
        signer
      );

      // Test Academic Records contract
      try {
        const count = await academicRecords.getCredentialCount(await signer.getAddress());
        console.log('Successfully tested Academic Records contract:', count.toString());
      } catch (error) {
        console.error('Failed to test Academic Records contract:', error);
        throw new Error('Academic Records contract test failed');
      }

      // Test Student Directory contract
      try {
        const count = await studentDirectory.getStudentCount();
        console.log('Successfully tested Student Directory contract:', count.toString());
      } catch (error) {
        console.error('Failed to test Student Directory contract:', error);
        throw new Error('Student Directory contract test failed');
      }

      return { academicRecords, studentDirectory };
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
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
          
          if (parseInt(chainId.toString()) !== 31337) {
            setNetworkError('Please connect to Hardhat Local network (Chain ID: 31337)');
            setLoading(false);
            return;
          }
          setNetworkError(null);
          
          // Get signer and initialize contracts
          const signer = await provider.getSigner();
          const { academicRecords, studentDirectory } = await initializeContracts(signer);
          setAcademicRecordsContract(academicRecords);
          setStudentDirectoryContract(studentDirectory);

          // Check if the user is an admin in either contract
          try {
            const ADMIN_ROLE = await academicRecords.DEFAULT_ADMIN_ROLE();
            const isUserAdmin = await academicRecords.hasRole(ADMIN_ROLE, account);
            setIsAdmin(isUserAdmin);
            console.log('User admin status:', isUserAdmin);
          } catch (error) {
            console.error('Failed to check admin role:', error);
          }

          // Event listeners for network and account changes
          window.ethereum.on('chainChanged', (chainId) => {
            const chainIdNum = parseInt(chainId, 16);
            if (chainIdNum !== 31337) {
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
    contract: academicRecordsContract, // Keep for backward compatibility
    academicRecordsContract,
    studentDirectoryContract,
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