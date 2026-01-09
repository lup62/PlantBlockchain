/**
 * AUTHORITY PAGE
 * FULLY IMPLEMENTED: Register, Revoke, Add Inspector, Remove Inspector
 */

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ShieldCheck, Plus, UserPlus, Upload, FileText, Trash2, Ban } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { uploadToPinata, unpinFromPinata } from '../utils/pinataHelper';
import { CONTRACT_ADDRESS, IPFS_GATEWAY } from '../utils/config';

const NORMALIZED_IPFS_GATEWAY = IPFS_GATEWAY.endsWith('/') ? IPFS_GATEWAY : `${IPFS_GATEWAY}/`;

export default function AuthorityPage() {
    const { contract, isAuthority, isConnected, account, authorityAddress, chainId, provider } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('register');
    const [pendingAuthAddr, setPendingAuthAddr] = useState(null);

    // Register Variety State
    const [varietyName, setVarietyName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [breederAddress, setBreederAddress] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Revoke Variety State
    const [revokeVarietyId, setRevokeVarietyId] = useState('');
    const [revokeReason, setRevokeReason] = useState('');

    // Inspector State
    const [inspectorAddress, setInspectorAddress] = useState('');
    const [removeInspectorAddress, setRemoveInspectorAddress] = useState('');

    // Migration State
    const [newAuthorityInput, setNewAuthorityInput] = useState('');

    // Registry State
    const [allVarieties, setAllVarieties] = useState([]);
    const [fetchingRegistry, setFetchingRegistry] = useState(false);

    // Global Management State
    const [targetLicenseId, setTargetLicenseId] = useState('');
    const [globalRevokeReason, setGlobalRevokeReason] = useState('');

    /* --- HANDLERS --- */

    useEffect(() => {
        if (contract) {
            checkPendingAuthority();
            if (activeTab === 'register') loadAllVarieties();
        }
    }, [contract, account, activeTab]);

    async function loadAllVarieties() {
        try {
            setFetchingRegistry(true);
            const counts = await contract.getCounters();
            const total = Number(counts.varietiesCounter);
            const loaded = [];
            for (let i = total; i >= 1; i--) {
                try {
                    const v = await contract.getVariety(i);
                    loaded.push(v);
                } catch (e) { break; }
                if (loaded.length >= 50) break;
            }
            setAllVarieties(loaded);
        } catch (err) { console.error(err); } finally { setFetchingRegistry(false); }
    }

    async function checkPendingAuthority() {
        try {
            const pa = await contract.getPendingAuthority();
            setPendingAuthAddr(pa);
        } catch (e) { console.error(e); }
    }

    async function handleGlobalRevokeLicense(e) {
        e.preventDefault();
        try {
            setLoading(true);
            const tx = await contract.revokeLicenseByAuthority(targetLicenseId, globalRevokeReason);
            await tx.wait();
            setStatus({ type: 'success', message: 'License Revoked by Authority (Global Action).' });
            setTargetLicenseId(''); setGlobalRevokeReason('');
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Global Revocation Failed' });
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        if (!varietyName || !registrationNumber || !breederAddress || !selectedFile) {
            setStatus({ type: 'error', message: 'Please fill all fields and select a document.' });
            return;
        }
        let uploadResult = null;
        try {
            setLoading(true);
            setStatus({ type: 'info', message: 'Uploading document to IPFS...' });
            uploadResult = await uploadToPinata(selectedFile);
            if (!uploadResult.success) throw new Error("IPFS Upload Failed: " + uploadResult.message);

            const { ipfsHash, pinataUrl } = uploadResult;

            setStatus({ type: 'info', message: 'Submitting transaction...' });
            const tx = await contract.registerVariety(varietyName, registrationNumber, breederAddress, ipfsHash, pinataUrl);
            await tx.wait();

            setStatus({ type: 'success', message: 'Variety Registered Successfully!' });
            setVarietyName(''); setRegistrationNumber(''); setBreederAddress(''); setSelectedFile(null);
        } catch (err) {
            if (uploadResult?.success && uploadResult?.ipfsHash && !uploadResult?.simulated) {
                const cleanup = await unpinFromPinata(uploadResult.ipfsHash);
                if (!cleanup.success) {
                    console.warn('Failed to unpin IPFS file:', cleanup.message);
                }
            }
            setStatus({ type: 'error', message: err.message || 'Registration Failed' });
        } finally {
            setLoading(false);
        }
    }

    async function handleBeginTransfer(e) {
        e.preventDefault();
        try {
            setLoading(true);
            const tx = await contract.beginAuthorityTransfer(newAuthorityInput);
            await tx.wait();
            setStatus({ type: 'success', message: 'Transfer Initiated. The new address must now claim authority.' });
            setNewAuthorityInput('');
            checkPendingAuthority();
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Transfer Failed' });
        } finally {
            setLoading(false);
        }
    }

    async function handleAcceptAuthority() {
        try {
            setLoading(true);
            const tx = await contract.acceptAuthority();
            await tx.wait();
            setStatus({ type: 'success', message: 'Authority Successfully Claimed!' });
            window.location.reload();
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Claim Failed' });
        } finally {
            setLoading(false);
        }
    }

    async function handleRevokeVariety(e) {
        e.preventDefault();
        try {
            setLoading(true);
            setStatus({ type: 'info', message: 'Revoking variety...' });
            const tx = await contract.revokeVariety(revokeVarietyId, revokeReason);
            await tx.wait();
            setStatus({ type: 'success', message: 'Variety Revoked Successfully.' });
            setRevokeVarietyId(''); setRevokeReason('');
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Revocation Failed' });
        } finally {
            setLoading(false);
        }
    }

    async function handleAddInspector(e) {
        e.preventDefault();
        try {
            setLoading(true);
            const tx = await contract.addInspector(inspectorAddress);
            await tx.wait();
            setStatus({ type: 'success', message: 'Inspector Access Granted.' });
            setInspectorAddress('');
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Failed to add inspector' });
        } finally {
            setLoading(false);
        }
    }

    async function handleRemoveInspector(e) {
        e.preventDefault();
        try {
            setLoading(true);
            const tx = await contract.removeInspector(removeInspectorAddress);
            await tx.wait();
            setStatus({ type: 'success', message: 'Inspector Access Revoked.' });
            setRemoveInspectorAddress('');
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Failed to remove inspector' });
        } finally {
            setLoading(false);
        }
    }

    /* --- UI --- */

    if (!isConnected) return <div className="text-center py-20 text-gray-400">Connect Wallet to Access Authority Dashboard</div>;

    // IF NOT AUTHORITY BUT PENDING -> Show Claim UI
    const isPending = pendingAuthAddr && account && pendingAuthAddr.toLowerCase() === account.toLowerCase();

    if (!isAuthority && !isPending) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6">
                <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/50 text-center space-y-4">
                    <ShieldCheck className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="text-3xl font-bold text-white">Access Denied</h2>
                    <p className="text-red-300">Only the designated Authority can access this page.</p>

                    <div className="bg-black/40 p-4 rounded-lg text-left inline-block mt-4 space-y-2 border border-red-500/20">
                        <p className="text-sm text-gray-400">Your Wallet: <span className="font-mono text-white block">{account}</span></p>
                        <div className="h-px bg-white/10 my-2"></div>
                        <p className="text-sm text-gray-400">Required Authority: <span className="font-mono text-green-400 block">{authorityAddress || 'Loading...'}</span></p>
                    </div>

                    <p className="text-sm text-gray-500 mt-4">👉 Please switch your MetaMask account to match the Required Authority.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <header className="flex items-center gap-6 mb-12">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/30">
                    <ShieldCheck className="w-10 h-10 text-green-400" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{isPending ? "Authority Transition" : "Authority Command"}</h1>
                    <p className="text-gray-400">{isPending ? "You have been nominated as the new Authority" : "Registry Management & Access Control"}</p>
                </div>
            </header>

            {/* CLAIM PANEL FOR PENDING AUTHORITY */}
            {isPending && (
                <div className="mb-12 p-8 rounded-2xl bg-blue-500/10 border border-blue-500/50 text-center space-y-6">
                    <div className="inline-flex p-4 rounded-full bg-blue-500/20">
                        <Plus className="w-10 h-10 text-blue-400 rotate-45" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Claim Authority Control</h2>
                        <p className="text-blue-200/70 max-w-md mx-auto">The previous authority has initiated a transfer to your address. Click below to finalize the process and take control of the registry.</p>
                    </div>
                    <Button onClick={handleAcceptAuthority} loading={loading} size="lg" className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20">
                        ACCEPT & CLAIM AUTHORITY
                    </Button>
                </div>
            )}

            {/* Tabs (Hidden if ONLY pending and not yet authority) */}
            {isAuthority && (
                <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-1">
                    {['register', 'registry', 'inspectors', 'migration', 'revoke', 'global'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-bold tracking-wide transition-all border-b-2 uppercase ${activeTab === tab ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            {tab === 'register' ? 'Registration' : tab === 'registry' ? 'All Varieties' : tab === 'inspectors' ? 'Inspectors' : tab === 'migration' ? 'Migration' : tab === 'revoke' ? 'Revoke Variety' : 'Global Admin'}
                        </button>
                    ))}
                </div>
            )}

            {status && (
                <div className={`mb-8 p-4 rounded-xl border ${status.type === 'success' ? 'bg-green-500/10 border-green-500' : status.type === 'error' ? 'bg-red-500/10 border-red-500' : 'bg-blue-500/10 border-blue-500'} text-sm text-white flex items-center gap-3`}>
                    {status.message}
                </div>
            )}

            {isAuthority && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">

                        {/* 1. REGISTER TAB */}
                        {activeTab === 'register' && (
                            <Card title="Register New Variety" icon={<Plus className="text-green-400" />}>
                                <form onSubmit={handleRegister} className="space-y-6 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="label">Variety Name</label>
                                            <input type="text" value={varietyName} onChange={(e) => setVarietyName(e.target.value)} className="input-field" placeholder="e.g. Royal Gala" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label">Registration #</label>
                                            <input type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className="input-field" placeholder="e.g. EU-2025-X99" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label">Breeder Address</label>
                                        <input type="text" value={breederAddress} onChange={(e) => setBreederAddress(e.target.value)} className="input-field font-mono" placeholder="0x..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label">Document</label>
                                        <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${selectedFile ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-white/20'}`}>
                                            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                {selectedFile ? <><FileText className="w-6 h-6 text-green-400" /><span className="text-green-400 text-sm">{selectedFile.name}</span></> : <><Upload className="w-6 h-6 text-gray-500" /><span className="text-gray-400 text-sm">Upload PDF/Image</span></>}
                                            </div>
                                        </div>
                                    </div>
                                    <Button type="submit" loading={loading} size="lg" className="w-full">Register Variety</Button>
                                </form>
                            </Card>
                        )}

                        {/* 2. REGISTRY OVERVIEW TAB */}
                        {activeTab === 'registry' && (
                            <Card title="Certified Varieties Registry" icon={<FileText className="text-blue-400" />}>
                                {fetchingRegistry ? (
                                    <div className="py-12 text-center text-gray-500 font-mono animate-pulse">Syncing Registry...</div>
                                ) : allVarieties.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 italic">No varieties registered in the system.</div>
                                ) : (
                                    <div className="space-y-4 mt-4">
                                        {allVarieties.map((v, idx) => {
                                            const vID = v.varietyID.toString();
                                            const isRevoked = Number(v.status) === 1;
                                            const docHash = v.documentHash || v.docHash;
                                            const docUri = v.documentURI || v.pinataUrl;
                                            const docUrl = docUri || (docHash ? `${NORMALIZED_IPFS_GATEWAY}${docHash}` : null);

                                            return (
                                                <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-[10px] text-green-400 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20">ID #{vID}</span>
                                                            <h4 className="text-white font-bold">{v.denomination}</h4>
                                                            {isRevoked && <span className="bg-red-500/20 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/30">REVOKED</span>}
                                                        </div>
                                                        <p className="text-xs text-gray-500">{v.registrationNumber}</p>
                                                        <p className="text-[10px] text-gray-600 font-mono truncate max-w-[200px]">Breeder: {v.breeder}</p>
                                                    </div>
                                                    <div className="flex gap-2 w-full md:w-auto">
                                                        {docUrl && (
                                                            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-xs font-bold">
                                                                <FileText className="w-3.5 h-3.5" />
                                                                DOC
                                                            </a>
                                                        )}
                                                        {!isRevoked && (
                                                            <button
                                                                onClick={() => { setActiveTab('revoke'); setRevokeVarietyId(vID); }}
                                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold"
                                                            >
                                                                REVOKE
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* 3. REVOKE TAB */}
                        {activeTab === 'revoke' && (
                            <Card title="Revoke Variety Registration" icon={<Ban className="text-red-400" />}>
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 text-red-200 text-sm">
                                    Warning: Revoking a variety is permanent. It invalidates all future batches and licenses associated with it.
                                </div>
                                <form onSubmit={handleRevokeVariety} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="label">Variety ID to Revoke</label>
                                        <input type="number" value={revokeVarietyId} onChange={(e) => setRevokeVarietyId(e.target.value)} className="input-field" placeholder="e.g. 1" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label">Reason for Revocation</label>
                                        <textarea value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={3} className="input-field" placeholder="e.g. Intellectual property dispute..." />
                                    </div>
                                    <Button type="submit" loading={loading} variant="danger" className="w-full">Confirm Revocation</Button>
                                </form>
                            </Card>
                        )}

                        {/* 4. INSPECTORS TAB */}
                        {activeTab === 'inspectors' && (
                            <div className="space-y-6">
                                <Card title="Grant Access" icon={<UserPlus className="text-blue-400" />}>
                                    <form onSubmit={handleAddInspector} className="space-y-4 pt-4">
                                        <input type="text" value={inspectorAddress} onChange={(e) => setInspectorAddress(e.target.value)} className="input-field font-mono" placeholder="Inspector Address (0x...)" />
                                        <Button type="submit" loading={loading} variant="outline" className="w-full">Add Inspector</Button>
                                    </form>
                                </Card>
                                <Card title="Revoke Access" icon={<Trash2 className="text-red-400" />}>
                                    <form onSubmit={handleRemoveInspector} className="space-y-4 pt-4">
                                        <input type="text" value={removeInspectorAddress} onChange={(e) => setRemoveInspectorAddress(e.target.value)} className="input-field font-mono" placeholder="Inspector Address (0x...)" />
                                        <Button type="submit" loading={loading} variant="danger" className="w-full">Remove Inspector</Button>
                                    </form>
                                </Card>
                            </div>
                        )}

                        {/* 5. MIGRATION TAB */}
                        {activeTab === 'migration' && (
                            <Card title="Initiate Authority Transfer" icon={<ShieldCheck className="text-orange-400" />}>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-6 text-orange-200 text-sm">
                                    Transferring authority is a two-step process. You initiate, then the successor must claim it from this dashboard.
                                </div>
                                <form onSubmit={handleBeginTransfer} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="label">Successor Wallet Address</label>
                                        <input type="text" value={newAuthorityInput} onChange={(e) => setNewAuthorityInput(e.target.value)} className="input-field font-mono" placeholder="0x..." />
                                    </div>
                                    <Button type="submit" loading={loading} className="w-full bg-orange-600 hover:bg-orange-500">Initiate Transfer</Button>
                                </form>

                                {pendingAuthAddr && pendingAuthAddr !== "0x0000000000000000000000000000000000000000" && (
                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Pending Succession</h4>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/10 font-mono text-xs text-white">
                                            {pendingAuthAddr}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* 6. GLOBAL ADMIN TAB */}
                        {activeTab === 'global' && (
                            <Card title="Emergency Global Management" icon={<ShieldCheck className="text-red-500" />}>
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 text-red-200 text-sm">
                                    Authority Emergency Control: You can revoke ANY license issued in the system regardless of variety or breeder. Use with caution.
                                </div>
                                <form onSubmit={handleGlobalRevokeLicense} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="label">License ID to Revoke</label>
                                        <input type="number" value={targetLicenseId} onChange={(e) => setTargetLicenseId(e.target.value)} className="input-field" placeholder="e.g. 10" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label">Revocation Reason</label>
                                        <textarea value={globalRevokeReason} onChange={(e) => setGlobalRevokeReason(e.target.value)} rows={3} className="input-field" placeholder="Legal non-compliance, breeder fraud, etc..." />
                                    </div>
                                    <Button type="submit" loading={loading} variant="danger" className="w-full">Revoke License (Authority Action)</Button>
                                </form>
                            </Card>
                        )}

                    </div>

                    <div className="space-y-6">
                        <Card className="bg-green-500/5 border-green-500/20">
                            <h3 className="text-lg font-bold text-white mb-2">Authority Status</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-green-400 text-sm font-mono">ONLINE</span>
                            </div>
                            <p className="text-xs text-gray-500">Full administrative control active.</p>
                        </Card>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                            <h4 className="text-white font-bold text-sm mb-3">Recent Activity</h4>
                            <div className="space-y-4">
                                <div className="flex gap-3 text-xs">
                                    <div className="w-1 bg-green-500 rounded-full"></div>
                                    <div>
                                        <p className="text-white">Registry Synced</p>
                                        <p className="text-gray-500">Connected to local node</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .input-field {
                    width: 100%;
                    background-color: #050a05;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.75rem;
                    padding: 1rem;
                    color: white;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: #22c55e;
                }
            `}</style>
        </div>
    );
}
