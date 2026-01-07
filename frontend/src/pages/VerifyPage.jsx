/**
 * VERIFY PRODUCT PAGE
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { IPFS_GATEWAY } from '../utils/config';
import { Search, ShieldCheck, AlertTriangle, CheckCircle, XCircle, FileText, Calendar, QrCode, Camera, RefreshCw, X, Image } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Html5Qrcode } from 'html5-qrcode';
import { MaxUint256 } from 'ethers';

export default function VerifyPage() {
    const { contract } = useWeb3();
    const [searchParams, setSearchParams] = useSearchParams();
    const [batchId, setBatchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [scannerError, setScannerError] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [activeCameraId, setActiveCameraId] = useState(null);
    const scannerRef = useRef(null);

    // Auto-verify if ID is in URL
    useEffect(() => {
        const id = searchParams.get('id');
        if (id && contract) {
            setBatchId(id);
            performVerification(id);
        }
    }, [searchParams, contract]);

    const handleVerify = (e) => {
        e.preventDefault();
        if (!batchId) return;
        performVerification(batchId);
    };

    const performVerification = async (id) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await contract.verifyBatch(id);
            const trustLevels = ['INVALID', 'LOW', 'MEDIUM', 'HIGH'];
            const trustStr = trustLevels[Number(data.trustLevel)] || 'UNKNOWN';
            const docHash = data.variety.documentHash || data.variety.docHash;
            const docUri = data.variety.documentURI || data.variety.docUri;
            const normalizedGateway = IPFS_GATEWAY.endsWith('/') ? IPFS_GATEWAY : `${IPFS_GATEWAY}/`;
            const expiryRaw = data.license.expiryDate;
            const expiryBigInt = typeof expiryRaw === 'bigint' ? expiryRaw : BigInt(expiryRaw);
            const isPermanent = expiryBigInt === MaxUint256;

            setResult({
                isValid: data.isValid,
                message: data.message,
                trustLevel: trustStr,
                variety: {
                    name: data.variety.denomination,
                    regNum: data.variety.registrationNumber,
                    breeder: data.breeder,
                    status: Number(data.variety.status),
                    docUrl: docUri || (docHash ? `${normalizedGateway}${docHash}` : null)
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
                    expiry: isPermanent ? 'Never' : new Date(Number(expiryBigInt) * 1000).toLocaleDateString()
                }
            });

        } catch (err) {
            console.error(err);
            if (err.message.includes('Invalid batch ID')) {
                setError('Batch ID not found on blockchain.');
            } else {
                setError('Verification Failed. Please check the Batch ID and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- SCANNER LOGIC ---

    const startScanner = async () => {
        setIsScanning(true);
        setScannerError(null);

        try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
                setCameras(devices);
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
                const preferredId = backCamera ? backCamera.id : devices[0].id;
                setActiveCameraId(preferredId);
                await initScanner(preferredId);
            } else {
                throw new Error("No cameras found.");
            }
        } catch (err) {
            setScannerError(err.message || "Camera access denied");
            setIsScanning(false);
        }
    };

    const initScanner = async (cameraId) => {
        if (scannerRef.current) {
            await stopScanner();
        }

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        try {
            await html5QrCode.start(
                cameraId,
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                (text) => handleDecodedText(text),
                () => { } // silent
            );
        } catch (err) {
            setScannerError("Scanner initialization failed.");
        }
    };

    const handleDecodedText = (text) => {
        try {
            const url = new URL(text);
            const id = url.searchParams.get('id');
            if (id) finalizeScan(id);
        } catch (e) {
            if (!isNaN(text) && text.trim() !== '') {
                finalizeScan(text.trim());
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScannerError(null);
        const html5QrCode = new Html5Qrcode("reader-hidden");

        try {
            const decodedText = await html5QrCode.scanFile(file, true);
            handleDecodedText(decodedText);
        } catch (err) {
            setScannerError("No QR code found in internal image.");
        } finally {
            html5QrCode.clear();
        }
    };

    const finalizeScan = (id) => {
        setBatchId(id);
        setSearchParams({ id });
        stopScanner();
        setIsScanning(false);
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (e) {
                console.log("Scanner stop error", e);
            }
        }
    };

    const switchCamera = async () => {
        if (cameras.length < 2) return;
        const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
        const nextId = cameras[(currentIndex + 1) % cameras.length].id;
        setActiveCameraId(nextId);
        await initScanner(nextId);
    };

    useEffect(() => {
        return () => { stopScanner(); };
    }, []);

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div id="reader-hidden" style={{ display: 'none' }}></div>

            <header className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4 font-display tracking-tight">
                    Verify Product
                </h1>
                <p className="text-gray-400 max-w-lg mx-auto font-light">
                    Retrace the entire botanical lifespan of your product through immutable blockchain records.
                </p>
            </header>

            {/* Verification Controls */}
            <div className="max-w-xl mx-auto mb-16 space-y-4">

                {!isScanning && (
                    <div className="relative group">
                        <div className="absolute inset-0 bg-green-500/10 blur-3xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity pointer-events-none"></div>
                        <form onSubmit={handleVerify} className="relative flex items-center p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl focus-within:border-green-500/50 transition-all shadow-2xl">
                            <Search className="ml-4 w-6 h-6 text-gray-500" />
                            <input
                                type="number"
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                placeholder="Enter Batch ID"
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
                )}

                <div className="flex flex-col items-center gap-4">
                    {!isScanning ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <button
                                onClick={startScanner}
                                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-green-400 transition-all shadow-xl group"
                            >
                                <Camera className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                                LIVE SCAN
                            </button>

                            <label className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-blue-400 transition-all shadow-xl group cursor-pointer">
                                <Image className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                                UPLOAD IMAGE
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="w-full space-y-4 animate-in zoom-in-95 duration-500">
                            <div className="relative overflow-hidden rounded-3xl border-2 border-green-500/20 bg-black aspect-square max-w-sm mx-auto shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                                <div id="reader" className="w-full h-full"></div>

                                {/* Refined Scanner Overlay */}
                                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50">
                                    <div className="w-full h-full border border-green-500/40 relative">
                                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-green-400"></div>
                                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-green-400"></div>
                                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-green-400"></div>
                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-green-400"></div>
                                        {/* Scan Line */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan shadow-[0_0_15px_rgba(74,222,128,0.7)]"></div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {cameras.length > 1 && (
                                        <button onClick={switchCamera} className="p-3 rounded-xl bg-black/60 text-white hover:bg-green-500 transition-all backdrop-blur-lg border border-white/10">
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => { stopScanner(); setIsScanning(false); }} className="p-3 rounded-xl bg-black/60 text-white hover:bg-red-500 transition-all backdrop-blur-lg border border-white/10">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-center text-[10px] text-green-500 font-mono font-bold uppercase tracking-widest animate-pulse">Position QR code within frame</p>
                        </div>
                    )}

                    {scannerError && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center animate-in fade-in">
                            {scannerError}
                        </div>
                    )}
                </div>
            </div>

            {/* Results Display */}
            {result && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-8">

                    {/* Status Card */}
                    <div className={`
                        p-12 rounded-[40px] border-2 text-center relative overflow-hidden transition-all duration-700
                        ${result.isValid
                            ? 'bg-green-500/[0.03] border-green-500/20 shadow-[0_0_80px_rgba(34,197,94,0.05)]'
                            : 'bg-red-500/[0.03] border-red-500/20 shadow-[0_0_80px_rgba(239,68,68,0.05)]'
                        }
                    `}>
                        {result.isValid ? (
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)] animate-pulse-subtle">
                                    <CheckCircle className="w-12 h-12 text-black" />
                                </div>
                                <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">Authenticity Verified</h2>
                                <div className="inline-flex items-center px-4 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                                    Trust Level: {result.trustLevel}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                                    <XCircle className="w-12 h-12 text-white" />
                                </div>
                                <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">Invalid Batch</h2>
                                <div className="inline-flex items-center px-4 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                                    Unverified Status
                                </div>
                            </div>
                        )}
                        <p className="mt-8 text-gray-400 italic text-xl max-w-2xl mx-auto font-light leading-relaxed">
                            "{result.message}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card title="Product Dossier" icon={<FileText className="text-blue-400" />}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mt-4">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="spec-label">Variety Denomination</p>
                                            <p className="text-3xl text-white font-display font-bold tracking-tight">{result.variety.name}</p>
                                            <span className={`inline-flex mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${result.variety.status === 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {result.variety.status === 0 ? 'Active' : 'Suspended'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="spec-label">Official Registry ID</p>
                                            <p className="text-gray-300 font-mono text-sm tracking-tight">{result.variety.regNum}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="spec-label">Quantity Verified</p>
                                            <p className="text-3xl text-white font-bold tracking-tight">{result.batch.quantity} <span className="text-sm font-light text-gray-500 uppercase">Plants</span></p>
                                        </div>
                                        <div>
                                            <p className="spec-label">Blockchain Batch Reference</p>
                                            <p className="text-xl text-green-400 font-mono font-black"># {result.batch.id}</p>
                                        </div>
                                    </div>
                                </div>

                                {result.variety.docUrl && (
                                    <div className="mt-12 pt-8 border-t border-white/5">
                                        <a href={result.variety.docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/50 hover:bg-white/[0.05] transition-all group overflow-hidden relative">
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-100 uppercase tracking-tight">Registration Certificate</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">Immutable Document Stored on IPFS</p>
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <RefreshCw className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                        </a>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Side Details - Cleaned up rectangles */}
                        <div className="space-y-8 h-full">
                            <Card title="Activity Timeline" icon={<Calendar className="text-orange-400" />}>
                                <div className="space-y-10 mt-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                                    <div className="relative pl-10">
                                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-black border border-green-500/40 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                        </div>
                                        <p className="spec-label">Batch Creation</p>
                                        <p className="text-white font-mono font-bold text-lg">{result.batch.productionDate}</p>
                                    </div>
                                    <div className="relative pl-10">
                                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-black border border-orange-500/40 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-orange-400/60"></div>
                                        </div>
                                        <p className="spec-label">License Maturity</p>
                                        <p className="text-white font-mono font-bold text-lg">{result.license.expiry}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Chain of Custody - Visual Fix applied here */}
                            <Card title="Chain of Custody" icon={<ShieldCheck className="text-purple-400" />}>
                                <div className="space-y-6 mt-4">
                                    <div className="group/addr">
                                        <p className="spec-label text-[10px] mb-2 group-hover/addr:text-purple-400 transition-colors">Producer (Licensee)</p>
                                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl group-hover/addr:border-purple-500/20 transition-all">
                                            <p className="text-[10px] text-purple-300 font-mono break-all leading-tight tracking-tight">
                                                {result.license.licensee}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="group/addr">
                                        <p className="spec-label text-[10px] mb-2 group-hover/addr:text-purple-400 transition-colors">Origin (Breeder)</p>
                                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl group-hover/addr:border-purple-500/20 transition-all">
                                            <p className="text-[10px] text-purple-300 font-mono break-all leading-tight tracking-tight">
                                                {result.variety.breeder}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                .spec-label {
                    font-size: 10px;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.3);
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    margin-bottom: 0.25rem;
                }
                @keyframes scan {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(240px); }
                    100% { transform: translateY(0); }
                }
                .animate-scan {
                    animation: scan 4s infinite linear;
                }
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(34,197,94,0.3); }
                    50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(34,197,94,0.5); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 4s infinite ease-in-out;
                }
                `}
            </style>
        </div>
    );
}
