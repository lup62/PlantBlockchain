import { useState } from 'react';
import { uploadFileToPinata } from './utils/pinata';
import { ethers } from 'ethers';
import VarietyABI from './contracts/VarietyLicenseRegistry.json';

function App() {
  const [walletAddress, setWalletAddress] = useState('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error('Errore durante la connessione al wallet:', error);
      }
    } else {
      console.error('Wallet non trovato');
    }
  };


  return (
    <div style={{ marginBottom: '20px', textAlign: 'right' }}>
      {!walletAddress ? (
        <button onClick={connectWallet}>Connetti Wallet 🦊</button>
      ) : (
        <p>Wallet: <strong>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</strong></p>
      )}
    </div>
  );
}

export default App;