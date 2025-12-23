import { useState } from 'react';
import { uploadFileToPinata } from './utils/pinata';
import { ethers } from 'ethers';
import VarietyABI from './contracts/VarietyLicenseRegistry.json';

function App() {
  // --- STATI PER IPFS E BLOCKCHAIN ---
  const [nomePianta, setNomePianta] = useState('');
  const [numeroReg, setNumeroReg] = useState('');
  const [breederAddress, setBreederAddress] = useState(''); // Nuovo campo!
  const [file, setFile] = useState(null);
  const [caricando, setCaricando] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // --- INDIRIZZO CONTRATTO (dal tuo .env) ---
  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error('Errore durante la connessione al wallet:', error);
      }
    } else {
      alert('Wallet non trovato! Installa MetaMask.');
    }
  };

  const handleRegistra = async () => {
    if (!file || !nomePianta || !numeroReg || !breederAddress || !walletAddress) {
      alert("Assicurati di aver compilato tutto (incluso l'indirizzo del Breeder) e connesso il Wallet!");
      return;
    }

    try {
      setCaricando(true);

      // 1. CARICAMENTO SU IPFS (Off-chain)
      const metadata = {
        fileName: `Certificato_${nomePianta}`,
        denomination: nomePianta,
        registrationNumber: numeroReg,
        breeder: breederAddress
      };
      const ipfsResult = await uploadFileToPinata(file, metadata);
      console.log("IPFS Done:", ipfsResult.ipfsHash);

      // 2. REGISTRAZIONE SU BLOCKCHAIN (On-chain)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Creiamo l'oggetto Contratto
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);

      console.log("Inviando transazione alla Blockchain...");

      // La funzione registerVariety richiede 5 parametri:
      // 1. Denominazione
      // 2. Numero Registrazione
      // 3. Indirizzo Breeder
      // 4. Hash del file (SHA-256)
      // 5. IPFS CID (indirizzo del file)
      const tx = await contract.registerVariety(
        nomePianta,
        numeroReg,
        breederAddress,
        ipfsResult.fileHash,
        ipfsResult.ipfsHash
      );

      await tx.wait(); // Aspettiamo che il blocco venga minato

      alert("🎉 REGISTRAZIONE COMPLETATA! Varietà salvata su IPFS e Blockchain.");
      console.log("Transaction Hash:", tx.hash);

    } catch (error) {
      console.error("Errore totale:", error);
      alert("Errore: " + error.message);
    } finally {
      setCaricando(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🌱 PlantBlockchain System</h1>

      {/* Sezione Wallet */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        {!walletAddress ? (
          <button onClick={connectWallet}>Connetti Wallet 🦊</button>
        ) : (
          <p>Connesso come Authority: <strong>{walletAddress}</strong></p>
        )}
      </div>

      {/* Form di Registrazione */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
        <input
          placeholder="Nome Varietà"
          value={nomePianta}
          onChange={(e) => setNomePianta(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Numero Registrazione"
          value={numeroReg}
          onChange={(e) => setNumeroReg(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Indirizzo Wallet Breeder (0x...)"
          value={breederAddress}
          onChange={(e) => setBreederAddress(e.target.value)}
          style={inputStyle}
        />

        <div style={{ padding: '10px', border: '1px dashed #ccc' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Documento ufficiale:</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        </div>

        <button
          onClick={handleRegistra}
          disabled={caricando || !walletAddress}
          style={{
            padding: '15px',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {caricando ? '⏳ Elaborazione transazione...' : 'CERTIFICA VARIETÀ 🚀'}
        </button>
      </div>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #ddd' };

export default App;