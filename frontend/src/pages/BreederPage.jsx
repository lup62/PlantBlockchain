/**
 * BREEDER PAGE - ORGANIC TECH STYLE
 * FULLY IMPLEMENTED: Issue License, Revoke License, Renew/Update License
 */

import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Sprout, Share2, AlertTriangle, RefreshCw, Clock, Ban, FileText } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { IPFS_GATEWAY } from '../utils/config';

const NORMALIZED_IPFS_GATEWAY = IPFS_GATEWAY.endsWith('/') ? IPFS_GATEWAY : `${IPFS_GATEWAY}/`;

export default function BreederPage() {
    const { account, contract, isConnected } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('issue');

    // Data state
    const [myVarieties, setMyVarieties] = useState([]);
    const [fetchingVarieties, setFetchingVarieties] = useState(false);

    // Issue Form
    const [selectedVarietyId, setSelectedVarietyId] = useState('');
    const [licenseeAddress, setLicenseeAddress] = useState('');
    const [expiryDays, setExpiryDays] = useState('365');

    // Manage Form
    const [targetLicenseId, setTargetLicenseId] = useState('');
    const [revokeReason, setRevokeReason] = useState('');
    const [newExpiryDate, setNewExpiryDate] = useState(''); // Date string YYYY-MM-DD

    useEffect(() => {
        if (isConnected && contract && account) {
            loadMyVarieties();
        }
    }, [isConnected, contract, account]);

    async function loadMyVarieties() {
        try {
            setFetchingVarieties(true);
            const counts = await contract.getCounters();
            const totalVarieties = Number(counts.varietiesCounter);

            const loaded = [];
            for (let i = 1; i <= totalVarieties; i++) {
                try {
                    const v = await contract.getVariety(i);
                    // Check if current user is the breeder
                    if (v.breeder.toLowerCase() === account.toLowerCase() && Number(v.status) === 0) { // 0 = ACTIVE
                        const docHash = v.documentHash || v.docHash;
                        const docUri = v.documentURI || v.docUri || v.pinataUrl;
                        const docUrl = docUri || (docHash ? `${NORMALIZED_IPFS_GATEWAY}${docHash}` : null);

                        loaded.push({
                            id: v.varietyID.toString(),
                            name: v.denomination,
                            regNum: v.registrationNumber,
                            docUrl
                        });
                    }
                } catch (e) { console.error(e); }
            }
            setMyVarieties(loaded);
        } catch (err) { console.error("Error loading varieties", err); } finally { setFetchingVarieties(false); }
    }

    async function handleIssueLicense(e) {
        e.preventDefault();
        try {
            setLoading(true); setStatus(null);

            let expiryTimestamp = 0;
            if (expiryDays !== '0' && expiryDays !== '') {
                expiryTimestamp = Math.floor(Date.now() / 1000) + (parseInt(expiryDays) * 24 * 60 * 60);
            }

            const tx = await contract.issueLicense(selectedVarietyId, licenseeAddress, expiryTimestamp);
            await tx.wait();
            setStatus({ type: 'success', message: `License Issued Successfully. ${expiryTimestamp === 0 ? 'Permanent access granted.' : ''}` });
            setLicenseeAddress(''); setExpiryDays('365');
        } catch (err) { setStatus({ type: 'error', message: err.message || 'Transaction Failed' }); } finally { setLoading(false); }
    }

    async function handleRevokeLicense(e) {
        e.preventDefault();
        try {
            setLoading(true); setStatus(null);
            const tx = await contract.revokeLicense(targetLicenseId, revokeReason);
            await tx.wait();
            setStatus({ type: 'success', message: 'License Revoked Successfully.' });
            setTargetLicenseId(''); setRevokeReason('');
        } catch (err) { setStatus({ type: 'error', message: err.message || 'Revocation Failed' }); } finally { setLoading(false); }
    }

    async function handleUpdateExpiration(e) {
        e.preventDefault();
        try {
            setLoading(true); setStatus(null);
            const timestamp = Math.floor(new Date(newExpiryDate).getTime() / 1000);
            const tx = await contract.updateLicenseExpiration(targetLicenseId, timestamp);
            await tx.wait();
            setStatus({ type: 'success', message: 'License Expiration Updated Successfully.' });
            setTargetLicenseId(''); setNewExpiryDate('');
        } catch (err) { setStatus({ type: 'error', message: err.message || 'Update Failed' }); } finally { setLoading(false); }
    }

    if (!isConnected) return <div className="text-center py-20 text-gray-500">Connect Wallet to Access Breeder Dashboard</div>;

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <header className="flex items-center gap-6 mb-12">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30">
                    <Sprout className="w-10 h-10 text-green-400" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Breeder Dashboard</h1>
                    <p className="text-gray-400">Manage Varieties & Issue Smart Licenses</p>
                </div>
            </header>

            {/* Quick Stats: My Varieties */}
            <div className="mb-10">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-green-400" /> My Active Varieties</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {myVarieties.length > 0 ? myVarieties.map(v => (
                        <div key={v.id} className="min-w-[240px] p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-green-500/30 transition-all flex flex-col justify-between">
                            <div>
                                <div className="font-bold text-white text-lg">{v.name}</div>
                                <div className="text-xs text-green-400 font-mono mb-2">ID: {v.id}</div>
                                <div className="text-xs text-gray-500 mb-4">{v.regNum}</div>
                            </div>
                            {v.docUrl && (
                                <a
                                    href={v.docUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all mt-auto"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    VIEW DOC
                                </a>
                            )}
                        </div>
                    )) : <div className="text-gray-500 italic">No varieties found.</div>}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-1">
                {['issue', 'renew', 'revoke'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-bold tracking-wide transition-all border-b-2 uppercase ${activeTab === tab ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500 hover:text-white'}`}
                    >
                        {tab === 'issue' ? 'Issue License' : tab === 'renew' ? 'Update Expiry' : 'Revoke License'}
                    </button>
                ))}
            </div>

            {status && <div className={`mb-8 p-4 rounded-xl border ${status.type === 'success' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'} text-sm text-white`}>{status.message}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">

                    {/* ISSUE TAB */}
                    {activeTab === 'issue' && (
                        <Card title="Issue New License" icon={<Share2 className="text-blue-400" />}>
                            <form onSubmit={handleIssueLicense} className="space-y-6 mt-4">
                                <div className="space-y-2">
                                    <label className="label">Select Variety ID</label>
                                    <select
                                        value={selectedVarietyId}
                                        onChange={(e) => setSelectedVarietyId(e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="">-- Select Variety --</option>
                                        {myVarieties.map(v => <option key={v.id} value={v.id}>{v.name} (ID: {v.id})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="label">Licensee Address</label>
                                        <input type="text" value={licenseeAddress} onChange={(e) => setLicenseeAddress(e.target.value)} className="input-field" placeholder="0x..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label">Duration (Days)</label>
                                        <input type="number" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className="input-field" placeholder="365" />
                                        <p className="text-[10px] text-gray-500 ml-1">Set to <b>0</b> for a Permanent License (No Expiry)</p>
                                    </div>
                                </div>
                                <Button type="submit" loading={loading} size="lg" className="w-full" disabled={!selectedVarietyId}>Issue License</Button>
                            </form>
                        </Card>
                    )}

                    {/* RENEW TAB */}
                    {activeTab === 'renew' && (
                        <Card title="Extend / Update License" icon={<Clock className="text-orange-400" />}>
                            <form onSubmit={handleUpdateExpiration} className="space-y-6 mt-4">
                                <div className="space-y-2">
                                    <label className="label">Target License ID</label>
                                    <input type="number" value={targetLicenseId} onChange={(e) => setTargetLicenseId(e.target.value)} className="input-field" placeholder="e.g. 10" />
                                </div>
                                <div className="space-y-2">
                                    <label className="label">New Expiration Date</label>
                                    <input type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} className="input-field" />
                                </div>
                                <Button type="submit" loading={loading} variant="primary" className="w-full">Update Expiration</Button>
                            </form>
                        </Card>
                    )}

                    {/* REVOKE TAB */}
                    {activeTab === 'revoke' && (
                        <Card title="Revoke License" icon={<Ban className="text-red-400" />}>
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4 text-red-200 text-sm">
                                Revoking a license immediately stops the licensee from creating new batches.
                            </div>
                            <form onSubmit={handleRevokeLicense} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="label">License ID to Revoke</label>
                                    <input type="number" value={targetLicenseId} onChange={(e) => setTargetLicenseId(e.target.value)} className="input-field" placeholder="e.g. 10" />
                                </div>
                                <div className="space-y-2">
                                    <label className="label">Reason</label>
                                    <textarea value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={3} className="input-field" placeholder="e.g. Breach of contract..." />
                                </div>
                                <Button type="submit" loading={loading} variant="danger" className="w-full">Confirm Revocation</Button>
                            </form>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card><h3 className="font-bold text-white mb-2">Instructions</h3><p className="text-sm text-gray-400">Use the tabs to switch between issuing new licenses and managing existing ones (renewals/revocations).</p></Card>
                </div>
            </div>

            <style>{`.input-field { width: 100%; bg: #050a05; border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 1rem; color: white; outline: none; } .input-field:focus { border-color: #22c55e; } .label { font-size: 0.75rem; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-left: 0.25rem; }`}</style>
        </div>
    );
}
