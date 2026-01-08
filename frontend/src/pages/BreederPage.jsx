/**
 * BREEDER PAGE - ORGANIC TECH STYLE
 * FULLY IMPLEMENTED: Issue License, Revoke License, Renew/Update License
 */

import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Sprout, Share2, RefreshCw, Clock, Ban, FileText, Users } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { IPFS_GATEWAY } from '../utils/config';
import { MaxUint256 } from 'ethers';

const NORMALIZED_IPFS_GATEWAY = IPFS_GATEWAY.endsWith('/') ? IPFS_GATEWAY : `${IPFS_GATEWAY}/`;

function formatExpiryDate(ts) {
    if (ts === undefined || ts === null) return 'N/A';
    try {
        const big = typeof ts === 'bigint' ? ts : BigInt(ts);
        if (big === MaxUint256) return 'Never';
        if (big === 0n) return 'N/A';
        const ms = Number(big) * 1000;
        if (!Number.isFinite(ms)) return 'N/A';
        const date = new Date(ms);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    } catch (e) {
        return 'N/A';
    }
}

export default function BreederPage() {
    const { account, contract, isConnected } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('issue');

    // Data state
    const [myVarieties, setMyVarieties] = useState([]);
    const [fetchingVarieties, setFetchingVarieties] = useState(false);
    const [fetchingLicenses, setFetchingLicenses] = useState(false);

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
                    if (v.breeder.toLowerCase() === account.toLowerCase()) {
                        const docHash = v.documentHash || v.docHash;
                        const docUri = v.documentURI || v.docUri || v.pinataUrl;
                        const docUrl = docUri || (docHash ? `${NORMALIZED_IPFS_GATEWAY}${docHash}` : null);

                        loaded.push({
                            id: v.varietyID.toString(),
                            name: v.denomination,
                            regNum: v.registrationNumber,
                            docUrl,
                            status: Number(v.status),
                            licenses: []
                        });
                    }
                } catch (e) { console.error(e); }
            }
            setMyVarieties(loaded);
            await loadVarietyLicenses(loaded);
        } catch (err) { console.error("Error loading varieties", err); } finally { setFetchingVarieties(false); }
    }

    async function loadVarietyLicenses(varieties) {
        if (!varieties || varieties.length === 0) {
            return;
        }

        try {
            setFetchingLicenses(true);
            const enriched = await Promise.all(varieties.map(async (v) => {
                try {
                    const rawLicenses = await contract.getLicensesByVariety(v.id);
                    const licenses = rawLicenses.map((lic) => ({
                        licenseID: lic.licenseID?.toString?.() ?? String(lic.licenseID),
                        licensee: lic.licensee,
                        expiryLabel: formatExpiryDate(lic.expiryDate),
                        status: Number(lic.status)
                    }));

                    return { ...v, licenses };
                } catch (err) {
                    console.error(`Error loading licenses for variety ${v.id}`, err);
                    return { ...v, licenses: [] };
                }
            }));

            setMyVarieties(enriched);
        } catch (err) {
            console.error('Error loading licenses by variety', err);
        } finally {
            setFetchingLicenses(false);
        }
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
            await loadMyVarieties();
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
            await loadMyVarieties();
        } catch (err) { setStatus({ type: 'error', message: err.message || 'Revocation Failed' }); } finally { setLoading(false); }
    }

    async function handleUpdateExpiration(e) {
        e.preventDefault();
        try {
            setLoading(true); setStatus(null);
            if (!newExpiryDate) {
                setStatus({ type: 'error', message: 'Please select a new expiration date.' });
                return;
            }
            const timestamp = Math.floor(new Date(newExpiryDate).getTime() / 1000);
            const tx = await contract.updateLicenseExpiration(targetLicenseId, timestamp);
            await tx.wait();
            setStatus({ type: 'success', message: 'License Expiration Updated Successfully.' });
            setTargetLicenseId(''); setNewExpiryDate('');
            await loadMyVarieties();
        } catch (err) { setStatus({ type: 'error', message: err.message || 'Update Failed' }); } finally { setLoading(false); }
    }

    async function handleMakePermanent(e) {
        e.preventDefault();
        try {
            setLoading(true); setStatus(null);
            if (!targetLicenseId) {
                setStatus({ type: 'error', message: 'License ID is required.' });
                return;
            }
            const tx = await contract.makeLicensePermanent(targetLicenseId);
            await tx.wait();
            setStatus({ type: 'success', message: 'License set to permanent.' });
            setTargetLicenseId(''); setNewExpiryDate('');
            await loadMyVarieties();
        } catch (err) { setStatus({ type: 'error', message: err.message || 'Update Failed' }); } finally { setLoading(false); }
    }

    if (!isConnected) return <div className="text-center py-20 text-gray-500">Connect Wallet to Access Breeder Dashboard</div>;

    const activeVarieties = myVarieties.filter(v => Number(v.status) === 0);

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
                    {activeVarieties.length > 0 ? activeVarieties.map(v => (
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
                    )) : <div className="text-gray-500 italic">No active varieties found.</div>}
                </div>
            </div>

            {/* Varieties & Licensees */}
            <div className="mb-12">
                <Card title="Varieties & Licensees" icon={<Users className="text-green-400" />}>
                    {fetchingVarieties || fetchingLicenses ? (
                        <div className="py-8 text-center text-gray-500">Loading varieties and licenses...</div>
                    ) : myVarieties.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 italic">No varieties found.</div>
                    ) : (
                        <div className="space-y-6">
                            {myVarieties.map((v) => (
                                <div key={v.id} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                        <div>
                                            <div className="text-lg font-bold text-white">{v.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">ID: {v.id} | {v.regNum}</div>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${Number(v.status) === 0 ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                            {Number(v.status) === 0 ? 'Active' : 'Revoked'}
                                        </span>
                                    </div>

                                    {v.licenses && v.licenses.length > 0 ? (
                                        <div className="space-y-2">
                                            {v.licenses.map((lic) => (
                                                <div key={`${v.id}-${lic.licenseID}`} className="grid grid-cols-1 md:grid-cols-[140px_1fr_160px] gap-3 items-center p-3 rounded-xl bg-black/30 border border-white/5">
                                                    <div className="text-xs uppercase text-gray-400 font-bold">Lic #{lic.licenseID}</div>
                                                    <div className="text-xs text-gray-300 font-mono break-all">{lic.licensee}</div>
                                                    <div className="text-xs text-gray-400">Expiry: <span className="text-white">{lic.expiryLabel}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 italic">No licenses issued for this variety.</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
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
                                        {activeVarieties.map(v => <option key={v.id} value={v.id}>{v.name} (ID: {v.id})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="label">Licensee Address</label>
                                        <input type="text" value={licenseeAddress} onChange={(e) => setLicenseeAddress(e.target.value)} className="input-field" placeholder="0x..." />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="label">Duration (Days)</label>
                                            <button
                                                type="button"
                                                onClick={() => setExpiryDays('0')}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${expiryDays === '0' ? 'bg-green-500/20 border border-green-500/40 text-green-200' : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-green-400/50'}`}
                                            >
                                                Permanent
                                            </button>
                                        </div>
                                        <input type="number" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className="input-field" placeholder="365" />
                                        <p className="text-[10px] text-gray-500 ml-1">Click Permanent for a no-expiry license.</p>
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
                                    <p className="text-[10px] text-gray-500 ml-1">Use Make Permanent to remove expiry.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Button type="submit" loading={loading} variant="primary" className="w-full">Update Expiration</Button>
                                    <Button type="button" loading={loading} variant="secondary" className="w-full" onClick={handleMakePermanent}>Make Permanent</Button>
                                </div>
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
