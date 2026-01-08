/**
 * INSPECTOR PAGE - ORGANIC TECH STYLE
 */

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ClipboardCheck, CheckCircle, XCircle, Search, AlertCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function InspectorPage() {
    const { account, contract, isInspector, isConnected } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');

    // Data lists
    const [pendingBatches, setPendingBatches] = useState([]);
    const [historyBatches, setHistoryBatches] = useState([]);
    const [fetchingHistory, setFetchingHistory] = useState(false);

    // Load data
    useEffect(() => {
        if (contract && account) {
            loadPendingBatches();
            if (activeTab === 'history') loadHistoryBatches();
        }
    }, [contract, account, activeTab]);

    async function loadPendingBatches() {
        try {
            const batches = await contract.getPendingBatches();
            setPendingBatches(batches);
        } catch (err) { console.error('Error loading pending:', err); }
    }

    async function loadHistoryBatches() {
        try {
            setFetchingHistory(true);
            const counts = await contract.getCounters();
            const total = Number(counts.batchesCounter);

            const loaded = [];
            // Scan backwards for recent history first
            for (let i = total; i >= 1; i--) {
                try {
                    const b = await contract.getBatch(i);
                    // If it was inspected by someone (not necessarily current inspector, or just NOT pending)
                    if (Number(b.inspectionStatus) !== 0) { // 0 = NOT_INSPECTED
                        loaded.push(b);
                    }
                } catch (e) { break; } // Handle potential out of bounds or errors
                if (loaded.length >= 20) break; // Limit to last 20 for performance
            }
            setHistoryBatches(loaded);
        } catch (err) { console.error('Error loading history:', err); } finally { setFetchingHistory(false); }
    }

    // Inspect batch
    async function handleInspect(batchId, approve) {
        try {
            setLoading(true);
            setStatus(null);

            const tx = await contract.inspectBatch(batchId, approve);
            await tx.wait();

            setStatus({
                type: 'success',
                message: `Batch ${batchId.toString()} ${approve ? 'APPROVED' : 'REJECTED'} Successfully.`
            });

            // Reload data
            await loadPendingBatches();
            if (activeTab === 'history') await loadHistoryBatches();
        } catch (err) {
            console.error('Error:', err);
            setStatus({ type: 'error', message: err.message || 'Inspection Transaction Failed' });
        } finally {
            setLoading(false);
        }
    }

    if (!isConnected) return <div className="text-center py-20 text-gray-500">Connect Wallet to Access Inspector Dashboard</div>;

    if (!isInspector) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6">
                <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/50 text-center space-y-4">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="text-3xl font-bold text-white">Access Denied</h2>
                    <p className="text-red-300">Your address is not authorized as an Inspector.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">

            <header className="flex items-center gap-6 mb-12">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <ClipboardCheck className="w-10 h-10 text-yellow-400" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Quality Control</h1>
                    <p className="text-gray-400">Inspector Dashboard & Batch Certification</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-1">
                {['pending', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-bold tracking-wide transition-all border-b-2 uppercase ${activeTab === tab ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-gray-500 hover:text-white'}`}
                    >
                        {tab === 'pending' ? 'Pending Inspections' : 'Inspection History'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Main List Area */}
                <div className="lg:col-span-2 space-y-8">
                    {status && (
                        <div className={`p-4 rounded-xl border ${status.type === 'success' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'} text-sm text-white`}>
                            {status.message}
                        </div>
                    )}

                    {activeTab === 'pending' && (
                        <Card title="Batches Awaiting Verification" icon={<Search className="text-yellow-400" />}>
                            {pendingBatches.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <p className="text-gray-400">All caught up! No batches pending inspection.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 mt-4">
                                    {pendingBatches.map((batch, idx) => (
                                        <BatchItem key={idx} batch={batch} onInspect={handleInspect} loading={loading} />
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {activeTab === 'history' && (
                        <Card title="Recently Processed Batches" icon={<ClipboardCheck className="text-blue-400" />}>
                            {fetchingHistory ? (
                                <div className="py-12 text-center text-gray-500">Scanning blockchain for history...</div>
                            ) : historyBatches.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 italic">No inspection history found.</div>
                            ) : (
                                <div className="space-y-4 mt-4">
                                    {historyBatches.map((batch, idx) => (
                                        <BatchItem key={idx} batch={batch} onInspect={handleInspect} loading={loading} isHistory />
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-yellow-500/5 border-yellow-500/20">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs uppercase text-yellow-400 font-bold">Pending Tasks</span>
                            <span className="text-3xl font-bold text-white">{pendingBatches.length}</span>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-bold text-white mb-4">Inspection Protocol</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex gap-2">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                <span>Verify physical sample matches metadata.</span>
                            </li>
                            <li className="flex gap-2">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                <span>You can re-inspect batches in the History tab.</span>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Sub-component for Cleaner Code
function BatchItem({ batch, onInspect, loading, isHistory }) {
    const status = Number(batch.inspectionStatus);
    const isApproved = status === 1; // 1 = APPROVED, 2 = REJECTED

    return (
        <div className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between ${isHistory ? 'bg-white/5 border-white/10' : 'bg-[#0a0f0a] border-white/10 hover:border-yellow-500/30'}`}>
            <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-mono text-gray-300">Batch #{batch.batchID.toString()}</span>
                    {isHistory && (
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isApproved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {isApproved ? 'Approved' : 'Rejected'}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">Variety ID: <span className="text-white font-bold">{batch.varietyID.toString()}</span> | Qty: <span className="text-white">{batch.quantity}</span></span>
                    <span className="text-sm text-gray-400 text-xs font-mono">{new Date(Number(batch.productionDate) * 1000).toLocaleString()}</span>
                </div>
                {batch.metadata && <p className="text-sm text-gray-400 italic">"{batch.metadata}"</p>}
            </div>

            <div className="flex gap-3">
                <Button
                    onClick={() => onInspect(batch.batchID, true)}
                    disabled={loading || (isHistory && isApproved)}
                    size="sm"
                    className={`${isApproved ? 'opacity-50' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50'}`}
                >
                    Approve
                </Button>
                <Button
                    onClick={() => onInspect(batch.batchID, false)}
                    disabled={loading || (isHistory && !isApproved)}
                    size="sm"
                    className={`${!isApproved && isHistory ? 'opacity-50' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50'}`}
                >
                    Reject
                </Button>
            </div>
        </div>
    );
}
