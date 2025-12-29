import { useState, useEffect } from 'react';
import { uploadFileToPinata } from './utils/pinata';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import VarietyABI from './contracts/VarietyLicenseRegistry.json';
import './App.css';

function App() {
  // --- NAVIGATION & UI STATE ---
  const [actorHub, setActorHub] = useState('viewer'); // authority, breeder, licensee, inspector, viewer
  const [authoritySubTab, setAuthoritySubTab] = useState('staff');
  const [breederSubTab, setBreederSubTab] = useState('portfolio');
  const [walletAddress, setWalletAddress] = useState('');
  const [isAuthority, setIsAuthority] = useState(false);
  const [isInspector, setIsInspector] = useState(false);
  const [caricando, setCaricando] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [counters, setCounters] = useState({ varieties: 0, batches: 0, licenses: 0 });

  // --- VARIETY STATE ---
  const [nomePianta, setNomePianta] = useState('');
  const [numeroReg, setNumeroReg] = useState('');
  const [breederAddress, setBreederAddress] = useState('');
  const [file, setFile] = useState(null);

  // --- LICENSE STATE ---
  const [varietyIdForLicense, setVarietyIdForLicense] = useState('');
  const [licenseeAddress, setLicenseeAddress] = useState('');
  const [expirationDays, setExpirationDays] = useState('365');
  const [revokeLicenseId, setRevokeLicenseId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  // --- BATCH STATE ---
  const [licenseIdForBatch, setLicenseIdForBatch] = useState('');
  const [batchQuantity, setBatchQuantity] = useState('');
  const [batchMetadata, setBatchMetadata] = useState('');
  const [lastCreatedBatchId, setLastCreatedBatchId] = useState(null);

  // --- GLOBAL VIEWER (VERIFY) STATE ---
  const [searchBatchId, setSearchBatchId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  // --- AUTHORITY & INSPECTOR STATE ---
  const [newInspectorAddress, setNewInspectorAddress] = useState('');
  const [pendingBatches, setPendingBatches] = useState([]);

  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

  // Auto-notification cleanup
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ type: '', message: '' }), 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch counters & Roles
  const fetchCounters = async () => {
    try {
      // Use JsonRpcProvider for public data to avoid network mismatches with wallet (MetaMask)
      const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
      const publicProvider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, publicProvider);

      // counters fetch with fallback
      try {
        const [v, b, l] = await contract.getCounters();
        setCounters({ varieties: Number(v), batches: Number(b), licenses: Number(l) });
      } catch (cErr) {
        console.warn("Failed to fetch counters:", cErr.message);
      }

      if (walletAddress) {
        try {
          const auth = await contract.getAuthority();
          setIsAuthority(auth.toLowerCase() === walletAddress.toLowerCase());
          setIsInspector(await contract.isInspectorAuthorized(walletAddress));
        } catch (rErr) {
          console.error("Error detecting roles:", rErr.message);
        }
      }
    } catch (error) {
      console.error("Critical provider/contract setup error:", error);
    }
  };

  useEffect(() => {
    fetchCounters();
    if (actorHub === 'inspector') fetchPendingBatches();
  }, [walletAddress, actorHub]);

  // QR Scanner Effect
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      scanner.render((decodedText) => {
        setSearchBatchId(decodedText);
        handleVerifyBatch(decodedText);
        setShowScanner(false);
        scanner.clear();
      }, (error) => { });
      return () => { try { scanner.clear(); } catch (e) { } };
    }
  }, [showScanner, walletAddress]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setNotification({ type: 'success', message: 'Wallet Connected' });
      } catch (error) {
        setNotification({ type: 'error', message: 'Connection Error' });
      }
    } else {
      setNotification({ type: 'error', message: 'MetaMask not found' });
    }
  };

  // --- ACTIONS ---

  const handleVerifyBatch = async (idToVerify) => {
    const id = idToVerify || searchBatchId;
    if (!id) return;
    try {
      setCaricando(true);
      const provider = window.ethereum
        ? new ethers.BrowserProvider(window.ethereum)
        : new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL || "https://rpc.ankr.com/eth");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, provider);
      setVerificationResult(await contract.verifyBatch(id));
      setNotification({ type: 'success', message: 'Verification Result Loaded' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Verify Failed: ID not found' });
      setVerificationResult(null);
    } finally { setCaricando(false); }
  };

  const handleRegistraVarieta = async () => {
    if (!file || !nomePianta || !numeroReg || !breederAddress || !walletAddress) return;
    try {
      setCaricando(true);
      const metadata = { fileName: nomePianta, denomination: nomePianta, registrationNumber: numeroReg, breeder: breederAddress };
      const ipfsResult = await uploadFileToPinata(file, metadata);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const tx = await contract.registerVariety(nomePianta, numeroReg, breederAddress, ipfsResult.fileHash, ipfsResult.ipfsHash);
      setNotification({ type: 'success', message: 'Registering Variety...' });
      await tx.wait();
      setNotification({ type: 'success', message: 'Variety Registered' });
      fetchCounters();
    } catch (error) {
      setNotification({ type: 'error', message: error.reason || error.message });
    } finally { setCaricando(false); }
  };

  const handleEmettiLicenza = async () => {
    if (!varietyIdForLicense || !licenseeAddress || !walletAddress) return;
    try {
      setCaricando(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const expirationTimestamp = Math.floor(Date.now() / 1000) + (parseInt(expirationDays) * 24 * 60 * 60);
      const tx = await contract.issueLicense(varietyIdForLicense, licenseeAddress, expirationTimestamp);
      setNotification({ type: 'success', message: 'Issuing License...' });
      await tx.wait();
      setNotification({ type: 'success', message: 'License Issued' });
      fetchCounters();
    } catch (error) {
      setNotification({ type: 'error', message: error.reason || error.message });
    } finally { setCaricando(false); }
  };

  const handleRevokeVariety = async (vId) => {
    if (!vId || !walletAddress) return;
    try {
      setCaricando(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const tx = await contract.revokeVariety(vId, "Revoked by Authority via UI");
      setNotification({ type: 'warning', message: 'Revoking Variety...' });
      await tx.wait();
      setNotification({ type: 'success', message: 'Variety Revoked' });
      fetchCounters();
    } catch (error) { setNotification({ type: 'error', message: error.reason || error.message }); }
    finally { setCaricando(false); }
  };

  const handleRevokeLicense = async (lId) => {
    if (!lId || !walletAddress) return;
    try {
      setCaricando(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const tx = await contract.revokeLicense(lId, "Revoked by Breeder via UI");
      setNotification({ type: 'warning', message: 'Revoking License...' });
      await tx.wait();
      setNotification({ type: 'success', message: 'License Revoked' });
      fetchCounters();
    } catch (error) { setNotification({ type: 'error', message: error.reason || error.message }); }
    finally { setCaricando(false); }
  };

  const handleUpdateLicense = async (lId, days) => {
    if (!lId || !days || !walletAddress) return;
    try {
      setCaricando(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const newExpiration = Math.floor(Date.now() / 1000) + (parseInt(days) * 24 * 60 * 60);
      const tx = await contract.updateLicenseExpiration(lId, newExpiration);
      setNotification({ type: 'success', message: 'Updating Expiration...' });
      await tx.wait();
      setNotification({ type: 'success', message: 'License Updated' });
    } catch (error) { setNotification({ type: 'error', message: error.reason || error.message }); }
    finally { setCaricando(false); }
  };

  const handleRevokeByAuthority = async () => {
    if (!revokeLicenseId || !revokeReason || !walletAddress) return;
    try {
      setCaricando(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const tx = await contract.revokeLicenseByAuthority(revokeLicenseId, revokeReason);
      setNotification({ type: 'warning', message: 'Revoking License (EMERGENCY)...' });
      await tx.wait();
      setNotification({ type: 'success', message: 'License Revoked by Authority' });
      fetchCounters();
    } catch (error) { setNotification({ type: 'error', message: error.reason || error.message }); }
    finally { setCaricando(false); }
  };

  const handleMakeLicensePermanent = async (lId) => {
    if (!lId || !walletAddress) return;
    try {
      setCaricando(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const tx = await contract.makeLicensePermanent(lId);
      setNotification({ type: 'success', message: 'Making License Permanent...' });
      await tx.wait();
      setNotification({ type: 'success', message: 'License is now Permanent' });
    } catch (error) { setNotification({ type: 'error', message: error.reason || error.message }); }
    finally { setCaricando(false); }
  };
  const handleCreaLotto = async () => {
    if (!licenseIdForBatch || !batchQuantity || !walletAddress) return;
    try {
      setCaricando(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const tx = await contract.createBatch(licenseIdForBatch, batchQuantity, batchMetadata || "N/A");
      setNotification({ type: 'success', message: 'Creating Batch...' });
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try { return contract.interface.parseLog(log).name === 'BatchCreated'; } catch (e) { return false; }
      });
      if (event) setLastCreatedBatchId(contract.interface.parseLog(event).args.batchID.toString());
      setNotification({ type: 'success', message: 'Batch Created' });
      fetchCounters();
    } catch (error) {
      setNotification({ type: 'error', message: error.reason || error.message });
    } finally { setCaricando(false); }
  };

  const handleManageInspector = async (action) => {
    if (!newInspectorAddress || !walletAddress) return;
    try {
      setCaricando(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const tx = action === 'add' ? await contract.addInspector(newInspectorAddress) : await contract.removeInspector(newInspectorAddress);
      setNotification({ type: 'success', message: `${action === 'add' ? 'Adding' : 'Removing'} Inspector...` });
      await tx.wait();
      setNotification({ type: 'success', message: `Inspector ${action === 'add' ? 'Added' : 'Removed'}` });
      setNewInspectorAddress('');
    } catch (error) {
      setNotification({ type: 'error', message: error.reason || error.message });
    } finally { setCaricando(false); }
  };

  const fetchPendingBatches = async () => {
    if (!walletAddress) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, provider);
      setPendingBatches(await contract.getPendingBatches());
    } catch (error) { console.error("Fetch Pending error:", error); }
  };

  const handleInspectBatch = async (batchId, approve) => {
    try {
      setCaricando(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VarietyABI.abi, signer);
      const tx = await contract.inspectBatch(batchId, approve);
      setNotification({ type: 'success', message: `Submitting Inspection...` });
      await tx.wait();
      setNotification({ type: 'success', message: `Batch ${approve ? 'Approved' : 'Rejected'}` });
      fetchPendingBatches();
      fetchCounters();
    } catch (error) {
      setNotification({ type: 'error', message: error.reason || error.message });
    } finally { setCaricando(false); }
  };

  return (
    <div className="app-container">
      {/* GLOBAL HEADER (VIEWER HUB) */}
      <header className="header">
        <div className="header-brand">
          <h1>PLANT BLOCKCHAIN</h1>
          <p>Verified Agricultural Lifecycle</p>
        </div>

        <div className="global-verify-bar">
          <input
            placeholder="Search Batch ID..."
            value={searchBatchId}
            onChange={e => setSearchBatchId(e.target.value)}
          />
          <button onClick={() => handleVerifyBatch()} className="btn-icon">VERIFY</button>
          <button onClick={() => setShowScanner(!showScanner)} className="btn-icon">SCAN</button>
        </div>
      </header>

      {/* SEARCH / SCAN RESULTS (MODAL-LIKE) */}
      {(verificationResult || showScanner) && (
        <div className="main-panel" style={{ marginBottom: '40px', border: '2px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <label>Global Verification Result</label>
            <button className="sub-tab-button" onClick={() => { setVerificationResult(null); setShowScanner(false); }}>CLOSE</button>
          </div>
          {showScanner && <div id="reader" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-emerald)', background: '#000' }}></div>}
          {verificationResult && (
            <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '12px', borderLeft: `5px solid ${verificationResult.isValid ? '#2ecc71' : '#ff4d4d'}` }}>
              <h3 style={{ color: verificationResult.isValid ? '#2ecc71' : '#ff4d4d', margin: '0 0 10px 0' }}>{verificationResult.message}</h3>
              {verificationResult.isValid && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', fontSize: '0.85rem' }}>
                  <div>
                    <h5 style={{ color: 'var(--accent-emerald)', margin: '0 0 5px 0' }}>PLANT VARIETY</h5>
                    <p>Name: {verificationResult.variety.denomination}</p>
                    <p>Reg: {verificationResult.variety.registrationNumber}</p>
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--accent-emerald)', margin: '0 0 5px 0' }}>PRODUCTION</h5>
                    <p>Batch ID: {verificationResult.batch.batchID.toString()}</p>
                    <p>Qty: {verificationResult.batch.quantity}</p>
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--accent-emerald)', margin: '0 0 5px 0' }}>COMPLIANCE</h5>
                    <p>Status: {verificationResult.batch.inspectionStatus === 2 ? 'CERTIFIED' : 'PENDING'}</p>
                    <p>Breeder: {verificationResult.breeder.slice(0, 10)}...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* WALLET & NOTIFICATIONS */}
      <div className={`wallet-card ${walletAddress ? 'connected' : ''}`}>
        <div className="status-indicator">
          <div className={`dot ${walletAddress ? 'active' : ''}`}></div>
          <span style={{ fontSize: '0.7rem' }}>{walletAddress ? walletAddress : 'WALLET CONNECT REQUIRED'}</span>
        </div>
        {!walletAddress && <button onClick={connectWallet} className="btn-secondary">CONNECT</button>}
      </div>

      {notification.message && <div className={`notification ${notification.type}`}>{notification.message}</div>}

      {/* ACTOR RADAR (ADAPTIVE HUBS) */}
      <div className="tabs-container">
        {isAuthority && (
          <button className={`tab-button ${actorHub === 'authority' ? 'active' : ''}`} onClick={() => setActorHub('authority')}>AUTHORITY</button>
        )}
        <button className={`tab-button ${actorHub === 'breeder' ? 'active' : ''}`} onClick={() => setActorHub('breeder')}>BREEDER</button>
        <button className={`tab-button ${actorHub === 'licensee' ? 'active' : ''}`} onClick={() => setActorHub('licensee')}>LICENSEE</button>
        {isInspector && (
          <button className={`tab-button ${actorHub === 'inspector' ? 'active' : ''}`} onClick={() => setActorHub('inspector')}>INSPECTOR</button>
        )}
      </div>

      {/* MAIN HUB PANEL */}
      <div className="main-panel">
        {/* AUTHORITY HUB */}
        {actorHub === 'authority' && (
          <div className="hub-content">
            <div className="sub-tabs">
              <button className={`sub-tab-button ${authoritySubTab === 'staff' ? 'active' : ''}`} onClick={() => setAuthoritySubTab('staff')}>STAFF MANAGEMENT</button>
              <button className={`sub-tab-button ${authoritySubTab === 'registry' ? 'active' : ''}`} onClick={() => setAuthoritySubTab('registry')}>VARIETY REGISTRY</button>
              <button className={`sub-tab-button ${authoritySubTab === 'emergency' ? 'active' : ''}`} onClick={() => setAuthoritySubTab('emergency')}>EMERGENCY (REVOKE)</button>
            </div>

            {authoritySubTab === 'staff' && (
              <div className="form-group slide-in">
                <label>Technical Staff Administration</label>
                <input placeholder="Inspector Wallet Address (0x...)" value={newInspectorAddress} onChange={e => setNewInspectorAddress(e.target.value)} />
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => handleManageInspector('add')} className="btn-primary" style={{ flex: 1 }}>AUTHORIZE</button>
                  <button onClick={() => handleManageInspector('remove')} className="btn-primary" style={{ flex: 1, background: '#ff4d4d' }}>REVOKE</button>
                </div>
              </div>
            )}

            {authoritySubTab === 'registry' && (
              <div className="form-group slide-in">
                <label>Variety Certification & Governance</label>
                <div className="input-row">
                  <input placeholder="Denomination" value={nomePianta} onChange={e => setNomePianta(e.target.value)} />
                  <input placeholder="Reg. Number" value={numeroReg} onChange={e => setNumeroReg(e.target.value)} />
                </div>
                <input placeholder="Breeder Wallet Address" value={breederAddress} onChange={e => setBreederAddress(e.target.value)} />
                <div className="file-upload-zone">
                  <input type="file" onChange={e => setFile(e.target.files[0])} />
                </div>
                <button onClick={handleRegistraVarieta} className="btn-primary" style={{ marginBottom: '20px' }}>CERTIFY VARIETY</button>

                <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Governance: De-list Variety</label>
                <div className="input-row">
                  <input placeholder="Variety ID to revoke" onChange={e => setRevokeLicenseId(e.target.value)} />
                  <button onClick={() => handleRevokeVariety(revokeLicenseId)} className="btn-primary" style={{ background: '#e67e22', width: 'auto' }}>REVOKE</button>
                </div>
              </div>
            )}

            {authoritySubTab === 'emergency' && (
              <div className="form-group slide-in">
                <label style={{ color: '#ff4d4d' }}>Emergency License Revocation</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>Direct authority override to terminate active licenses for non-compliance.</p>
                <input placeholder="License ID" value={revokeLicenseId} onChange={e => setRevokeLicenseId(e.target.value)} />
                <input placeholder="Reason for revocation" value={revokeReason} onChange={e => setRevokeReason(e.target.value)} />
                <button onClick={handleRevokeByAuthority} className="btn-primary" style={{ background: '#ff4d4d' }}>REVOKE PERMANENTLY</button>
              </div>
            )}
          </div>
        )}

        {/* BREEDER HUB */}
        {actorHub === 'breeder' && (
          <div className="hub-content">
            <div className="sub-tabs">
              <button className={`sub-tab-button ${breederSubTab === 'portfolio' ? 'active' : ''}`} onClick={() => setBreederSubTab('portfolio')}>MY PORTFOLIO</button>
              <button className={`sub-tab-button ${breederSubTab === 'licensing' ? 'active' : ''}`} onClick={() => setBreederSubTab('licensing')}>ISSUE LICENSES</button>
            </div>

            {breederSubTab === 'portfolio' && (
              <div className="form-group slide-in">
                <label>Registered Varieties</label>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '15px' }}>Official varieties registered. You can manage them here.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="stat-item" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>VARIETY PORTFOLIO</span>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total: {counters.varieties}</p>
                    </div>
                  </div>
                  {/* Additional logic to fetch individual varieties can be added later if needed */}
                </div>
              </div>
            )}

            {breederSubTab === 'licensing' && (
              <div className="form-group slide-in">
                <label>License Granting & Lifecycle</label>
                <div className="input-row">
                  <input placeholder="Variety ID" value={varietyIdForLicense} onChange={e => setVarietyIdForLicense(e.target.value)} />
                  <input placeholder="Duration (Days)" value={expirationDays} onChange={e => setExpirationDays(e.target.value)} type="number" />
                </div>
                <input placeholder="Licensee Wallet Address" value={licenseeAddress} onChange={e => setLicenseeAddress(e.target.value)} />
                <button onClick={handleEmettiLicenza} className="btn-primary" style={{ background: '#3498db', marginBottom: '20px' }}>EMIT LICENSE</button>

                <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Manage Existing Licenses</label>
                <div className="input-row">
                  <input placeholder="License ID" onChange={e => setRevokeLicenseId(e.target.value)} />
                  <button onClick={() => handleUpdateLicense(revokeLicenseId, expirationDays)} className="btn-icon" style={{ borderColor: '#3498db', color: '#3498db' }}>EXTEND</button>
                  <button onClick={() => handleMakeLicensePermanent(revokeLicenseId)} className="btn-icon" style={{ borderColor: '#f1c40f', color: '#f1c40f' }}>PERMANENT</button>
                  <button onClick={() => handleRevokeLicense(revokeLicenseId)} className="btn-icon" style={{ borderColor: '#e67e22', color: '#e67e22' }}>REVOKE</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LICENSEE HUB */}
        {actorHub === 'licensee' && (
          <div className="hub-content">
            <div className="form-group">
              <label>Active License Portfolio</label>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '15px' }}>Licenses granted to your address for production.</p>
              <div className="stat-item" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                <span>Official Licenses Found</span>
                <span className="stat-value">{counters.licenses}</span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Production Hub</label>
              <div className="input-row">
                <input placeholder="License ID" value={licenseIdForBatch} onChange={e => setLicenseIdForBatch(e.target.value)} />
                <input placeholder="Quantity" value={batchQuantity} onChange={e => setBatchQuantity(e.target.value)} />
              </div>
              <input placeholder="Production History / Field Data" value={batchMetadata} onChange={e => setBatchMetadata(e.target.value)} style={{ marginBottom: '20px' }} />
              <button onClick={handleCreaLotto} className="btn-primary" style={{ background: '#f39c12' }}>OPERATIONALIZE BATCH</button>

              {lastCreatedBatchId && (
                <div style={{ marginTop: '25px', padding: '20px', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--border-emerald)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginBottom: '15px' }}>BATCH CREATED: ID {lastCreatedBatchId}</p>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                    <QRCodeSVG value={lastCreatedBatchId} size={120} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INSPECTOR HUB */}
        {actorHub === 'inspector' && (
          <div className="form-group">
            <label>Inspection Queue</label>
            {pendingBatches.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>All production batches have been processed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pendingBatches.map((b) => (
                  <div key={b.batchID} className="stat-item" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>BATCH #{b.batchID.toString()}</span>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '5px 0' }}>Quantity: {b.quantity} | {new Date(Number(b.productionDate) * 1000).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleInspectBatch(b.batchID, true)} className="btn-icon" style={{ color: '#2ecc71', borderColor: '#2ecc71' }}>APPROVE</button>
                      <button onClick={() => handleInspectBatch(b.batchID, false)} className="btn-icon" style={{ color: '#ff4d4d', borderColor: '#ff4d4d' }}>REJECT</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SYSTEM STATUS */}
        <div className="stats-grid">
          <div className="stat-item"><span className="stat-value">{counters.varieties}</span><span className="stat-label">Varieties</span></div>
          <div className="stat-item"><span className="stat-value">{counters.licenses}</span><span className="stat-label">Licenses</span></div>
          <div className="stat-item"><span className="stat-value">{counters.batches}</span><span className="stat-label">Batches</span></div>
        </div>
      </div>
    </div>
  );
}

export default App;