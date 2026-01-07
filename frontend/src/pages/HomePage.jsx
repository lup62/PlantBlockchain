/**
 * HOME PAGE - ORGANIC TECH EDITION
 * Main entry point with stunning visuals
 */
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import {
    ArrowRight, Sprout, ShieldCheck, Database,
    Activity, Globe, Lock, Cpu
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function HomePage() {
    const { counters } = useWeb3();

    return (
        <div className="space-y-32 pb-20">

            {/* HERO SECTION */}
            <section className="text-center relative">
                {/* Background Glow Spot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/5 backdrop-blur-sm mb-8 animate-fade-in-up">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-medium text-green-400 tracking-wider">NETWORK V2.0 STABLE</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-none animate-fade-in">
                    The Future of <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-400">
                        Bio-Assets.
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
                    Decentralized, immutable traceability for the agricultural sector.
                    Secured by smart contracts, verified by authority.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                        <Link to="/verify" className="relative">
                            <Button size="lg" className="px-10 h-14 text-lg">
                                Launch Verifier
                            </Button>
                        </Link>
                    </div>
                    <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="lg" className="h-14 text-lg border border-white/10">
                            Read Whitepaper
                        </Button>
                    </a>
                </div>
            </section>

            {/* BENTO GRID STATS */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">

                    {/* Large Stat Card */}
                    <Card className="md:col-span-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-green-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="flex flex-col justify-between h-full relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <Database className="text-green-400" />
                                </div>
                                <span className="text-sm font-mono text-gray-400 uppercase tracking-widest">Total Varieties</span>
                            </div>
                            <div className="mt-auto">
                                <h3 className="text-7xl font-bold text-white font-display tracking-tight group-hover:text-green-400 transition-colors">
                                    {counters.varieties}
                                </h3>
                            </div>
                        </div>
                    </Card>

                    {/* Secondary Stat */}
                    <Card className="bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
                        <div className="flex flex-col justify-between h-full">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <Activity className="text-blue-400" />
                                </div>
                                <span className="text-sm font-mono text-gray-400 uppercase tracking-widest">Batches</span>
                            </div>
                            <h3 className="text-5xl font-bold text-white font-display">
                                {counters.batches}
                            </h3>
                            <div className="text-xs text-green-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Real-time updates
                            </div>
                        </div>
                    </Card>

                    {/* Third Stat */}
                    <Card className="md:col-span-3 h-[180px] flex items-center justify-between px-10">
                        <div className="max-w-md">
                            <h3 className="text-2xl font-bold text-white mb-2">Smart Licenses Issued</h3>
                            <p className="text-gray-400">Legally binding IP contracts deployed directly on-chain.</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 font-display">
                                {counters.licenses}
                            </h3>
                        </div>
                    </Card>
                </div>
            </section>

            {/* FEATURES MESH */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Immutable Registry", icon: <Lock className="w-6 h-6 text-green-400" />, desc: "Tamper-proof storage on Ethereum." },
                    { title: "Global Access", icon: <Globe className="w-6 h-6 text-blue-400" />, desc: "Accessible from any node worldwide." },
                    { title: "Automated Audits", icon: <Cpu className="w-6 h-6 text-purple-400" />, desc: "Smart contracts enforce compliance." },
                    { title: "Breeder Rights", icon: <Sprout className="w-6 h-6 text-yellow-400" />, desc: "Protects IP via cryptographic signatures." }
                ].map((f, i) => (
                    <div key={i} className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                        <div className="mb-4 bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center">{f.icon}</div>
                        <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </section>
        </div>
    );
}
