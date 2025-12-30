/**
 * LAYOUT COMPONENT
 * 
 * Layout principale con Navbar
 */

import { Link, useLocation } from 'react-router-dom';
import {
    Home, Building2, Sprout, Users, ClipboardCheck,
    Search, Menu, X, Wallet, LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import Button from './common/Button';

export default function Layout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { account, isConnected, isAuthority, isInspector, connectWallet, disconnectWallet } = useWeb3();
    const location = useLocation();

    // Navigation items
    const navItems = [
        { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
        { path: '/verify', label: 'Verifica', icon: <Search className="w-4 h-4" /> },
        ...(isAuthority ? [{ path: '/authority', label: 'Authority', icon: <Building2 className="w-4 h-4" /> }] : []),
        ...(isConnected ? [
            { path: '/breeder', label: 'Breeder', icon: <Sprout className="w-4 h-4" /> },
            { path: '/licensee', label: 'Licensee', icon: <Users className="w-4 h-4" /> }
        ] : []),
        ...(isInspector ? [{ path: '/inspector', label: 'Inspector', icon: <ClipboardCheck className="w-4 h-4" /> }] : [])
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
            {/* NAVBAR */}
            <nav className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <Sprout className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                Variety Registry
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                    px-4 py-2 rounded-lg flex items-center gap-2 transition-all
                    ${isActive(item.path)
                                            ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Wallet Button */}
                        <div className="hidden md:flex items-center gap-3">
                            {!isConnected ? (
                                <Button onClick={connectWallet} size="sm" icon={<Wallet className="w-4 h-4" />}>
                                    Connetti Wallet
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1.5 bg-green-100 rounded-lg">
                                        <p className="text-sm font-mono text-green-800">
                                            {account.slice(0, 6)}...{account.slice(-4)}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={disconnectWallet}
                                        variant="ghost"
                                        size="sm"
                                        icon={<LogOut className="w-4 h-4" />}
                                    />
                                </div>
                            )}

                            {/* Role badges */}
                            {isAuthority && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                    Authority
                                </span>
                            )}
                            {isInspector && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                    Inspector
                                </span>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-4 py-2 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`
                    block px-4 py-3 rounded-lg flex items-center gap-2
                    ${isActive(item.path)
                                            ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}

                            <div className="pt-2 border-t border-gray-200">
                                {!isConnected ? (
                                    <Button
                                        onClick={connectWallet}
                                        className="w-full"
                                        icon={<Wallet className="w-4 h-4" />}
                                    >
                                        Connetti Wallet
                                    </Button>
                                ) : (
                                    <>
                                        <div className="px-4 py-2 bg-green-50 rounded-lg mb-2">
                                            <p className="text-sm text-gray-600">Connesso</p>
                                            <p className="text-sm font-mono text-green-800">
                                                {account.slice(0, 10)}...{account.slice(-8)}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={disconnectWallet}
                                            variant="ghost"
                                            className="w-full"
                                            icon={<LogOut className="w-4 h-4" />}
                                        >
                                            Disconnetti
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* MAIN CONTENT */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* FOOTER */}
            <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3">Variety Registry</h3>
                            <p className="text-sm text-gray-600">
                                Sistema blockchain per la tracciabilità di varietà vegetali protette
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 mb-3">Links</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><Link to="/" className="hover:text-green-600">Home</Link></li>
                                <li><Link to="/verify" className="hover:text-green-600">Verifica Batch</Link></li>
                                <li><a href="#" className="hover:text-green-600">Documentazione</a></li>
                                <li><a href="#" className="hover:text-green-600">GitHub</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 mb-3">Contatti</h3>
                            <p className="text-sm text-gray-600">
                                Email: info@varietyregistry.com
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                Supporto: support@varietyregistry.com
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
                        <p>© 2024 Variety Registry. Made with ❤️ for transparent food supply chain.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}