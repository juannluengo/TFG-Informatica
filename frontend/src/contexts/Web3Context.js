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

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          setAccount(account);

          // Create provider and contract instances
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);

          const signer = await provider.getSigner();
          const contract = new ethers.Contract(
            process.env.REACT_APP_CONTRACT_ADDRESS,
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
        }
      } catch (error) {
        console.error('Failed to initialize Web3:', error);
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
    loading
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}