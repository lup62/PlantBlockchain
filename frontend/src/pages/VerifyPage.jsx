/**
 * VERIFY PAGE - ORGANIC TECH STYLE
 * Updated to use smart contract verifyBatch() logic
 */

import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Search, ShieldCheck, AlertTriangle, CheckCircle, XCircle, FileText, Calendar } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function VerifyPage() {
    const { contract } = useWeb3(); // No need for account connection to verify
    const [batchId, setBatchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!batchId) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Call the smart contract verification logic
            // struct VerificationResult { bool isValid; string message; Variety variety; License license; Batch batch; address breeder; bool licenseRevokedAfterProduction; TrustLevel trustLevel; }
            const data = await contract.verifyBatch(batchId);

            // Map TrustLevel enum (0=INVALID, 1=LOW, 2=MEDIUM, 3=HIGH)
            const trustLevels = ['INVALID', 'LOW', 'MEDIUM', 'HIGH'];
            const trustStr = trustLevels[Number(data.trustLevel)] || 'UNKNOWN';

            setResult({
                isValid: data.isValid,
                message: data.message,
                trustLevel: trustStr,
                variety: {
                    name: data.variety.denomination,
                    regNum: data.variety.registrationNumber,
                    breeder: data.breeder,
                    status: Number(data.variety.status), // 0=ACTIVE, 1=REVOKED
                    docUrl: data.variety.pinataUrl || (data.variety.docHash ? `https://gateway.pinata.cloud/ipfs/${data.variety.docHash}` : null)
                },
                batch: {
                    id: data.batch.batchID.toString(),
                    quantity: data.batch.quantity,
                    productionDate: new Date(Number(data.batch.productionDate) * 1000).toLocaleDateString(),
                    inspector: data.batch.inspector,
                    metadata: data.batch.metadata
                },
                license: {
                    licensee: data.license.licensee,
                    expiry: new Date(Number(data.license.expiryDate) * 1000).toLocaleDateString()
                }
            });

        } catch (err) {
            console.error(err);
            // Check for specific revert reasons usually found in err.reason or err.message
            if (err.message.includes('Invalid batch ID')) {
                setError('Batch ID not found on blockchain.');
            } else {
                setError('Verification Failed. Please check the Batch ID and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12">

            <header className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4 font-display tracking-tight">
                    Verify Product
                </h1>
                <p className="text-gray-400 max-w-lg mx-auto">
                    Enter the Batch ID to retrieve immutable blockchain records and verify authenticity, origin, and safety compliance.
                </p>
            </header>

            {/* Search Box */}
            <div className="relative max-w-xl mx-auto mb-16">
                <div className="absolute inset-0 bg-green-500/20 blur-3xl opacity-20 rounded-full pointer-events-none"></div>
                <form onSubmit={handleVerify} className="relative flex items-center p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl focus-within:border-green-500/50 focus-within:ring-2 ring-green-500/20 transition-all shadow-2xl">
                    <Search className="ml-4 w-6 h-6 text-gray-500" />
                    <input
                        type="number"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        placeholder="Enter Batch ID (e.g. 101)"
                        className="w-full bg-transparent border-none text-white text-lg px-4 py-3 focus:ring-0 placeholder-gray-600 font-mono"
                    />
                    <Button
                        type="submit"
                        loading={loading}
                        className="px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20"
                    >
                        VERIFY
                    </Button>
                </form>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center animate-in fade-in zoom-in duration-300">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-1">Verification Error</h3>
                    <p className="text-gray-400">{error}</p>
                </div>
            )}

            {/* Result State */}
            {result && (
                <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-6">

                    {/* Main Status Header */}
                    <div className={`
                        p-8 rounded-3xl border text-center relative overflow-hidden
                        ${result.isValid
                            ? 'bg-green-500/5 border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)]'
                            : 'bg-red-500/5 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]'
                        }
                    `}>
                        {result.isValid ? (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/40">
                                    <CheckCircle className="w-10 h-10 text-black" />
                                </div>
                                <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">VALID BATCH</h2>
                                <p className="text-green-400 font-mono text-sm uppercase tracking-widest border border-green-500/30 px-3 py-1 rounded-full bg-green-500/10">
                                    Trust Level: {result.trustLevel}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/40">
                                    <XCircle className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">INVALID BATCH</h2>
                                <p className="text-red-400 font-mono text-sm uppercase tracking-widest border border-red-500/30 px-3 py-1 rounded-full bg-red-500/10">
                                    Trust Level: {result.trustLevel}
                                </p>
                            </div>
                        )}
                        <p className="mt-6 text-gray-400 italic max-w-lg mx-auto">"{result.message}"</p>
                    </div>

                    {/* Bento Grid Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card title="Product Info" icon={<FileText className="text-blue-400" />} className="h-full">
                            <div className="space-y-4 mt-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Variety Name</p>
                                        <p className="text-xl text-white font-serif">{result.variety.name}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${result.variety.status === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {result.variety.status === 0 ? 'Certified' : 'Revoked'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Registration Number</p>
                                    <p className="text-gray-300 font-mono">{result.variety.regNum}</p>
                                </div>

                                {result.variety.docUrl && (
                                    <a
                                        href={result.variety.docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-blue-400 hover:bg-blue-500/10 transition-all text-sm font-bold"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Original Registration Document
                                    </a>
                                )}

                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Metadata / Notes</p>
                                    <p className="text-gray-400 italic text-sm mt-1">{result.batch.metadata || "No metadata available"}</p>
                                </div>
                            </div>
                        </Card>

                        <div className="flex flex-col gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <Calendar className="w-5 h-5 text-orange-400" />
                                    <h3 className="text-white font-bold">Timeline</h3>
                                </div>
                                <div className="space-y-3 pl-2 border-l-2 border-white/10 ml-2">
                                    <div className="relative pl-6">
                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="block text-xs text-gray-500">Produced On</span>
                                        <span className="text-white font-mono text-sm">{result.batch.productionDate}</span>
                                    </div>
                                    <div className="relative pl-6">
                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="block text-xs text-gray-500">License Expiry</span>
                                        <span className="text-white font-mono text-sm">{result.license.expiry}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-white font-bold">Chain of Custody</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="block text-xs text-gray-500">Producer (Licensee)</span>
                                        <span className="font-mono text-purple-200 text-xs truncate block">{result.license.licensee}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500">Breeder (Owner)</span>
                                        <span className="font-mono text-purple-200 text-xs truncate block">{result.variety.breeder}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
