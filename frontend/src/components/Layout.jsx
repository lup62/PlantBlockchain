/**
 * TOTAL LAYOUT REWRITE: Floating Dock Design
 */
import { Link, useLocation } from 'react-router-dom';
import {
    Home, Search, ShieldCheck, Sprout, ClipboardCheck,
    Hexagon, Users, Wallet, LogOut, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import Button from './common/Button';

export default function Layout({ children }) {
    const { isConnected, account, connectWallet, disconnectWallet } = useWeb3();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Scroll effect for navbar background
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { path: '/', label: 'Home', icon: <Home size={18} /> },
        { path: '/verify', label: 'Verify', icon: <Search size={18} /> },
        { path: '/authority', label: 'Authority', icon: <ShieldCheck size={18} /> },
        { path: '/breeder', label: 'Breeder', icon: <Sprout size={18} /> },
        { path: '/licensee', label: 'Licensee', icon: <Users size={18} /> },
        { path: '/inspector', label: 'Inspector', icon: <ClipboardCheck size={18} /> },
    ];

    return (
        <div className="min-h-screen flex flex-col relative selection:bg-green-500/30 selection:text-green-200">

            {/* FLOATING NAVBAR */}
            <header className={`
                fixed top-0 left-0 right-0 z-50 transition-all duration-300
                flex justify-center pt-6 px-4
            `}>
                <div className={`
                    w-full max-w-5xl rounded-2xl flex items-center justify-between px-6 py-3
                    transition-all duration-500 border
                    ${scrolled
                        ? 'bg-[#020402]/80 backdrop-blur-xl border-white/10 shadow-2xl'
                        : 'bg-transparent border-transparent'
                    }
                `}>
                    {/* Logo Area */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="relative w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 group-hover:border-green-400/50 transition-all">
                            <Hexagon className="w-5 h-5 text-green-400 animate-pulse-slow" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-green-400 transition-colors">
                            Plant<span className="font-light text-gray-400">Chain</span>
                        </span>
                    </Link>

                    {/* Desktop Nav - Centered Pills */}
                    <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-md">
                        {navLinks.map(link => {
                            const active = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`
                                        px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
                                        ${active
                                            ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Wallet Action */}
                    <div className="hidden md:flex items-center gap-3">
                        {!isConnected ? (
                            <Button onClick={connectWallet} variant="primary" size="sm" icon={<Wallet size={16} />}>
                                Connect
                            </Button>
                        ) : (
                            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                                <div className="text-right hidden lg:block">
                                    <div className="text-[10px] text-green-400 font-mono tracking-wider">ONLINE</div>
                                    <div className="text-xs font-mono text-gray-400">{account.slice(0, 6)}...{account.slice(-4)}</div>
                                </div>
                                <button
                                    onClick={disconnectWallet}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-24 px-6 md:hidden">
                    <div className="flex flex-col gap-4">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileOpen(false)}
                                className="text-2xl font-display font-bold text-white py-4 border-b border-white/10"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className="flex-grow pt-32 px-4 md:px-6 relative z-10 w-full max-w-7xl mx-auto">
                {children}
            </main>

        </div>
    );
}
