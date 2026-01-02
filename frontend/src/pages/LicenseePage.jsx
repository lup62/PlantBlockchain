/**
 * LICENSEE PAGE - ORGANIC TECH STYLE
 * Polished Look & Document Visibility
 */

import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { LayoutDashboard, Package, Clock, ShieldAlert, CheckCircle2, FileText, Download, X } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { QRCodeSVG } from 'qrcode.react';
import { IPFS_GATEWAY } from '../utils/config';
import { MaxUint256 } from 'ethers';

function formatTimestamp(ts) {
    if (ts === undefined || ts === null) return 'N/A';
    try {
        const big = typeof ts === 'bigint' ? ts : BigInt(ts);
        if (big === 0n) return 'N/A';
        const ms = Number(big) * 1000;
        if (!Number.isFinite(ms)) return 'N/A';
        const date = new Date(ms);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
    } catch (e) {
        return 'N/A';
    }
}

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
    const [latestBatch, setLatestBatch] = useState(null); // To show QR code modal

    useEffect(() => {
        if (isConnected && contract) {
            loadInitialData();
        }
    }, [contract, account, isConnected]);

    async function loadInitialData() {
        setLoading(true);
        try {
            const myLicData = await loadLicenses();
            await loadMyBatches(myLicData);
        } catch (err) {
            console.error('Error loading initial data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadLicenses() {
        try {
            const normalizedGateway = IPFS_GATEWAY.endsWith('/') ? IPFS_GATEWAY : `${IPFS_GATEWAY}/`;
            const data = await contract.getLicensesByLicensee();
            // Enrich with variety info
            const enriched = await Promise.all(data.map(async (lic) => {
                try {
                    const v = await contract.getVariety(lic.varietyID);
                    const docHash = v.documentHash || v.docHash;
                    const docUri = v.documentURI || v.docUri;
                    const expiryRaw = lic.expiryDate;
                    const expiryBigInt = typeof expiryRaw === 'bigint' ? expiryRaw : BigInt(expiryRaw);
                    const expiryLabel = expiryBigInt === MaxUint256 ? 'Never' : new Date(Number(expiryBigInt) * 1000).toLocaleDateString();

                    return {
                        ...lic,
                        licenseID: lic.licenseID,
                        varietyID: lic.varietyID,
                        licensee: lic.licensee,
                        expiryRaw: expiryBigInt,
                        expiryLabel,
                        status: lic.status,
                        varietyName: v.denomination,
                        docUrl: docUri || (docHash ? `${normalizedGateway}${docHash}` : null)
                    };
                } catch (e) {
                    const expiryRaw = lic.expiryDate;
                    const expiryBigInt = typeof expiryRaw === 'bigint' ? expiryRaw : BigInt(expiryRaw);
                    const expiryLabel = expiryBigInt === MaxUint256 ? 'Never' : new Date(Number(expiryBigInt) * 1000).toLocaleDateString();
                    return {
                        ...lic,
                        licenseID: lic.licenseID,
                        varietyID: lic.varietyID,
                        licensee: lic.licensee,
                        expiryRaw: expiryBigInt,
                        expiryLabel,
                        status: lic.status,
                        varietyName: `Variety ID: ${lic.varietyID.toString()}`,
                        docUrl: null
                    };
                }
            }));
            setLicenses(enriched);
            return enriched;
        } catch (err) {
            console.error('Error loading licenses:', err);
            return [];
        }
    }

    async function loadMyBatches(currentLicenses = licenses) {
        if (!account) {
            setMyBatches([]);
            return;
        }

        try {
            setFetchingBatches(true);

            const filter = contract.filters.BatchCreated(null, null, account);
            const events = await contract.queryFilter(filter, 0, "latest");
            const ids = [...new Set(events.map(e => e.args?.batchID?.toString()).filter(Boolean))];

            // Limit to most recent 50 to avoid long loops
            const recentIds = ids.slice(-50).reverse();
            const loaded = [];

            for (const id of recentIds) {
                try {
                    const b = await contract.getBatch(id);
                    const bLicIdStr = b.licenseID?.toString();
                    const localLic = currentLicenses.find(l => l.licenseID?.toString() === bLicIdStr);
                    const productionDateLabel = formatTimestamp(b.productionDate);
                    const inspectionStatusNum = Number(b.inspectionStatus ?? b[7] ?? 0);

                    loaded.push({
                        ...b,
                        productionDateLabel,
                        inspectionStatusNum,
                        varietyName: localLic?.varietyName || 'Unknown',
                        docUrl: localLic?.docUrl || null
                    });
                } catch (e) {
                    console.warn(`Unable to load batch ${id}:`, e?.message || e);
                }
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

            // Capture latest batch info for QR code
            const counts = await contract.getCounters();
            const newID = counts.batchesCounter.toString();
            const selectedLic = licenses.find(l => l.licenseID.toString() === licenseId);

            setLatestBatch({
                id: newID,
                variety: selectedLic?.varietyName || 'Unknown',
                date: new Date().toLocaleString()
            });

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
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

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
                        <div className={`p-4 rounded-xl border ${status.type === 'success' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'} text-sm text-white transition-all`}>
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
                                            const expiry = lic.expiryRaw === MaxUint256 ? null : new Date(Number(lic.expiryRaw) * 1000);
                                            const isExpired = expiry ? Date.now() > expiry.getTime() : false;

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
                                                        {lic.varietyName}
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div className="text-xs text-gray-500">
                                                            Expires: {expiry ? expiry.toLocaleDateString() : 'Never'}
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
                                    <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-mono text-gray-300">Batch #{batch.batchID?.toString()}</span>
                                                <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-mono text-gray-300">Lic #{batch.licenseID?.toString()}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm text-gray-200 font-bold">{batch.varietyName}</p>
                                                <p className="text-sm text-gray-400">Qty: <span className="text-white font-bold">{batch.quantity}</span> | Date: <span className="text-white">{batch.productionDateLabel || formatTimestamp(batch.productionDate)}</span></p>
                                                {batch.metadata && <p className="text-xs text-gray-500 italic">"{batch.metadata}"</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {batch.docUrl && (
                                                <a
                                                    href={batch.docUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                                                    title="View Variety Certificate"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => setLatestBatch({
                                                    id: batch.batchID.toString(),
                                                    variety: batch.varietyName,
                                                    date: batch.productionDateLabel || formatTimestamp(batch.productionDate)
                                                })}
                                                className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                                                title="Show QR Code"
                                            >
                                                <Package className="w-4 h-4" />
                                            </button>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Status</p>
                                                 {batch.inspectionStatusNum === 0 ? (
                                                     <span className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs border border-yellow-500/20 font-bold">PENDING</span>
                                                 ) : batch.inspectionStatusNum === 1 ? (
                                                     <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs border border-green-500/20 font-bold">APPROVED</span>
                                                 ) : (
                                                     <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20 font-bold">REJECTED</span>
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

            {/* QR CODE MODAL */}
            {latestBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative bg-[#0a0f0a] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl scale-in-center">
                        <button
                            onClick={() => setLatestBatch(null)}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mb-6 inline-flex p-4 rounded-3xl bg-white">
                            <QRCodeSVG
                                id="batch-qrcode"
                                value={`${window.location.origin}/verify?id=${latestBatch.id}`}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-1">Batch QR Code</h3>
                        <p className="text-green-400 font-mono text-sm mb-4">ID: #{latestBatch.id}</p>

                        <div className="text-left bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Variety</div>
                            <div className="text-white text-sm truncate mb-3">{latestBatch.variety}</div>
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Created On</div>
                            <div className="text-white text-sm">{latestBatch.date}</div>
                        </div>

                        <Button
                            className="w-full flex items-center justify-center gap-2 py-4"
                            onClick={() => {
                                const svg = document.getElementById('batch-qrcode');
                                const svgData = new XMLSerializer().serializeToString(svg);
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                const img = new Image();
                                img.onload = () => {
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    ctx.drawImage(img, 0, 0);
                                    const pngFile = canvas.toDataURL('image/png');
                                    const downloadLink = document.createElement('a');
                                    downloadLink.download = `batch-${latestBatch.id}-qrcode.png`;
                                    downloadLink.href = pngFile;
                                    downloadLink.click();
                                };
                                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                            }}
                        >
                            <Download className="w-5 h-5" />
                            Scarica QR Code
                        </Button>

                        <p className="mt-4 text-[10px] text-gray-500 uppercase tracking-tighter">
                            Stampalo e applicalo sul lotto per la tracciabilità
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
