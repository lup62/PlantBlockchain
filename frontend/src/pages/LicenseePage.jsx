/**
 * LICENSEE PAGE - ORGANIC TECH STYLE
 * Polished Look & Bug Fixes
 */

import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { LayoutDashboard, Package, Clock, ShieldAlert, CheckCircle2, FileText } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function LicenseePage() {
    const { account, contract, isConnected } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [licenses, setLicenses] = useState([]);
    const [myBatches, setMyBatches] = useState([]);
    const [fetchingBatches, setFetchingBatches] = useState(false);

    // Form state
    const [licenseId, setLicenseId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [metadata, setMetadata] = useState('');

    useEffect(() => {
        if (isConnected && contract) {
            loadInitialData();
        }
    }, [contract, account, isConnected]);

    async function loadInitialData() {
        setLoading(true);
        await Promise.all([loadLicenses(), loadMyBatches()]);
        setLoading(false);
    }

    async function loadLicenses() {
        try {
            const data = await contract.getLicensesByLicensee();
            // Enrich with variety info
            const enriched = await Promise.all(data.map(async (lic) => {
                try {
                    const v = await contract.getVariety(lic.varietyID);
                    return {
                        licenseID: lic.licenseID,
                        varietyID: lic.varietyID,
                        licensee: lic.licensee,
                        expiryDate: lic.expiryDate,
                        status: lic.status,
                        varietyName: v.denomination,
                        docUrl: v.pinataUrl || (v.docHash ? `https://gateway.pinata.cloud/ipfs/${v.docHash}` : null)
                    };
                } catch (e) {
                    return {
                        licenseID: lic.licenseID,
                        varietyID: lic.varietyID,
                        licensee: lic.licensee,
                        expiryDate: lic.expiryDate,
                        status: lic.status
                    };
                }
            }));
            setLicenses(enriched);
        } catch (err) {
            console.error('Error loading licenses:', err);
        }
    }

    async function loadMyBatches() {
        try {
            setFetchingBatches(true);
            const counts = await contract.getCounters();
            const total = Number(counts.batchesCounter);

            // Get user's license IDs for filtering
            const myLicData = await contract.getLicensesByLicensee();
            const myLicIds = myLicData.map(l => l.licenseID?.toString() || '');

            const loaded = [];
            // Scan backwards
            for (let i = total; i >= 1; i--) {
                try {
                    const b = await contract.getBatch(i);
                    if (myLicIds.includes(b.licenseID?.toString())) {
                        loaded.push(b);
                    }
                } catch (e) { break; }
                if (loaded.length >= 30) break; // Limit
            }
            setMyBatches(loaded);
        } catch (err) {
            console.error('Error loading batches:', err);
        } finally {
            setFetchingBatches(false);
        }
    }

    async function handleCreateBatch(e) {
        e.preventDefault();
        try {
            setLoading(true);
            setStatus(null);

            if (!licenseId || !quantity) {
                setStatus({ type: 'error', message: 'Please specify License ID and Quantity.' });
                return;
            }

            const tx = await contract.createBatch(licenseId, quantity, metadata);
            await tx.wait();

            setStatus({ type: 'success', message: 'Batch Created Successfully on Blockchain.' });

            // Reset form & Refresh
            setQuantity('');
            setMetadata('');
            await loadMyBatches();
        } catch (err) {
            console.error('Error:', err);
            setStatus({ type: 'error', message: err.reason || err.message || 'Batch Creation Failed' });
        } finally {
            setLoading(false);
        }
    }

    if (!isConnected) return <div className="text-center py-20 text-gray-500">Connect Wallet to Access Licensee Dashboard</div>;

    return (
        <div className="max-w-6xl mx-auto py-12">

            <header className="flex items-center gap-6 mb-12">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                    <LayoutDashboard className="w-10 h-10 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Licensee Portal</h1>
                    <p className="text-gray-400">Manage Production & Batches</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Center Column: Batch Creation */}
                <div className="lg:col-span-2 space-y-8">
                    {status && (
                        <div className={`p-4 rounded-xl border ${status.type === 'success' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'} text-sm text-white`}>
                            {status.message}
                        </div>
                    )}

                    <Card title="Register Production Batch" icon={<Package className="text-blue-400" />}>
                        <form onSubmit={handleCreateBatch} className="space-y-6 mt-4">

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 ml-1">Select Active License</label>
                                {licenses.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {licenses.map((lic) => {
                                            const lID = lic.licenseID?.toString() || '??';
                                            const isActive = Number(lic.status) === 0; // 0 = ACTIVE
                                            const expiry = new Date(Number(lic.expiryDate) * 1000);
                                            const isExpired = Date.now() > expiry.getTime();

                                            // Only clickable if valid
                                            const canSelect = isActive && !isExpired;

                                            return (
                                                <div
                                                    key={lID}
                                                    onClick={() => canSelect && setLicenseId(lID)}
                                                    className={`
                                                        relative p-4 rounded-xl border transition-all 
                                                        ${canSelect ? 'cursor-pointer hover:border-blue-400/50' : 'opacity-50 cursor-not-allowed border-red-500/30 bg-red-500/5'}
                                                        ${licenseId === lID ? 'bg-blue-500/20 border-blue-500 ring-1 ring-blue-500' : 'bg-[#050a05] border-white/10'}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-mono text-white font-bold">LIC #{lID}</span>
                                                        {canSelect ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                        ) : (
                                                            <ShieldAlert className="w-4 h-4 text-red-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-200 font-bold mb-1 truncate">
                                                        {lic.varietyName || (lic.varietyID ? `Variety ID: ${lic.varietyID.toString()}` : "Unknown Variety")}
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div className="text-xs text-gray-500">
                                                            Expires: {expiry.toLocaleDateString()}
                                                        </div>
                                                        {lic.docUrl && (
                                                            <a
                                                                href={lic.docUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm"
                                                                title="View Variety Document"
                                                            >
                                                                <FileText className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center border border-white/10 rounded-xl bg-white/5 text-gray-500 text-sm">
                                        No licenses found. You need a license from a verified Breeder to create batches.
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Quantity</label>
                                    <input
                                        type="text"
                                        required
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full bg-[#050a05] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 transition-all outline-none"
                                        placeholder="e.g. 500 kg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Metadata / Notes</label>
                                    <input
                                        type="text"
                                        value={metadata}
                                        onChange={(e) => setMetadata(e.target.value)}
                                        className="w-full bg-[#050a05] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 transition-all outline-none"
                                        placeholder="Harvest location, quality notes..."
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                loading={loading}
                                size="lg"
                                className="w-full"
                                disabled={!licenseId}
                            >
                                Register Batch On-Chain
                            </Button>
                        </form>
                    </Card>

                    {/* MY BATCHES LIST */}
                    <Card title="My Production History" icon={<Clock className="text-indigo-400" />}>
                        {fetchingBatches ? (
                            <div className="py-12 text-center text-gray-500">Loading production history...</div>
                        ) : myBatches.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 italic">No batches registered yet.</div>
                        ) : (
                            <div className="space-y-4 mt-4">
                                {myBatches.map((batch, idx) => (
                                    <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-mono text-gray-300">Batch #{batch.batchID?.toString()}</span>
                                                <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-mono text-gray-300">Lic #{batch.licenseID?.toString()}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm text-gray-400">Qty: <span className="text-white font-bold">{batch.quantity}</span> | Date: <span className="text-white">{new Date(Number(batch.productionDate) * 1000).toLocaleString()}</span></p>
                                                {batch.metadata && <p className="text-xs text-gray-500 italic">"{batch.metadata}"</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Inspection Status</p>
                                                {Number(batch.inspectionStatus) === 0 ? (
                                                    <span className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs border border-yellow-500/20">PENDING</span>
                                                ) : Number(batch.inspectionStatus) === 1 ? (
                                                    <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs border border-green-500/20">APPROVED</span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20">REJECTED</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column: Stats & Info */}
                <div className="space-y-6">
                    <Card className="bg-indigo-500/5 border-indigo-500/20">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs uppercase text-indigo-400 font-bold">Active Licenses</span>
                            <span className="text-3xl font-bold text-white">
                                {licenses.filter(l => Number(l.status) === 0).length}
                            </span>
                        </div>
                    </Card>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                                <h4 className="text-white font-bold text-sm mb-1">Production Timeline</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Batches are timestamped immediately upon creation. This cryptographic proof cannot be altered later. Ensure all metadata is correct before submission.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
