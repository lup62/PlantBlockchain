/**
 * HOME PAGE
 * 
 * Landing page principale
 */

import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import {
    Sprout, Shield, CheckCircle, Search,
    Users, Building2, ClipboardCheck, ArrowRight,
    FileCheck, TrendingUp, Lock
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function HomePage() {
    const { isConnected, counters } = useWeb3();

    return (
        <div className="space-y-16">

            {/* HERO SECTION */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 opacity-50 blur-3xl" />

                <div className="relative text-center py-20">
                    <div className="inline-block mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                            <Sprout className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Variety License Registry
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
                        Sistema blockchain per la <span className="font-bold text-green-600">tracciabilità</span> e{' '}
                        <span className="font-bold text-blue-600">certificazione</span> di varietà vegetali protette
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/verify">
                            <Button size="lg" icon={<Search className="w-5 h-5" />}>
                                Verifica Batch
                            </Button>
                        </Link>

                        {!isConnected && (
                            <Button variant="outline" size="lg">
                                Scopri di più
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {/* STATISTICS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="glass" hover className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                        {counters.varieties.toLocaleString()}
                    </div>
                    <p className="text-gray-600 font-medium">Varietà Registrate</p>
                </Card>

                <Card variant="glass" hover className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                        {counters.licenses.toLocaleString()}
                    </div>
                    <p className="text-gray-600 font-medium">Licenze Emesse</p>
                </Card>

                <Card variant="glass" hover className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                        {counters.batches.toLocaleString()}
                    </div>
                    <p className="text-gray-600 font-medium">Batch Tracciati</p>
                </Card>
            </section>

            {/* FEATURES */}
            <section>
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Come Funziona
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Un sistema completo per garantire autenticità e tracciabilità
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Feature 1 */}
                    <Card variant="glass" hover>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <FileCheck className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Registrazione Varietà
                            </h3>
                            <p className="text-gray-600">
                                L'Authority registra varietà protette su blockchain con documenti immutabili su IPFS
                            </p>
                        </div>
                    </Card>

                    {/* Feature 2 */}
                    <Card variant="glass" hover>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Emissione Licenze
                            </h3>
                            <p className="text-gray-600">
                                I breeder autorizzano produttori con licenze smart contract verificabili
                            </p>
                        </div>
                    </Card>

                    {/* Feature 3 */}
                    <Card variant="glass" hover>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Tracciabilità Batch
                            </h3>
                            <p className="text-gray-600">
                                Ogni lotto di produzione è tracciato con metadata completi e timestamp immutabile
                            </p>
                        </div>
                    </Card>

                    {/* Feature 4 */}
                    <Card variant="glass" hover>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <ClipboardCheck className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Certificazione Qualità
                            </h3>
                            <p className="text-gray-600">
                                Ispettori autorizzati certificano qualità e conformità on-chain
                            </p>
                        </div>
                    </Card>

                    {/* Feature 5 */}
                    <Card variant="glass" hover>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Search className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Verifica Pubblica
                            </h3>
                            <p className="text-gray-600">
                                Consumatori verificano autenticità tramite QR code con trust level
                            </p>
                        </div>
                    </Card>

                    {/* Feature 6 */}
                    <Card variant="glass" hover>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Sicurezza Blockchain
                            </h3>
                            <p className="text-gray-600">
                                Dati immutabili, trasparenti e verificabili da chiunque
                            </p>
                        </div>
                    </Card>
                </div>
            </section>

            {/* ROLES SECTION */}
            <section>
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Per Chi È Pensato
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Una piattaforma per tutti gli attori della filiera
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Authority */}
                    <Card variant="gradient" hover>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <Building2 className="w-12 h-12 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Authority</h3>
                                <p className="text-gray-700 mb-4">
                                    Enti governativi che registrano varietà protette e gestiscono ispettori
                                </p>
                                {isConnected && (
                                    <Link to="/authority">
                                        <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                                            Vai al Dashboard
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Breeder */}
                    <Card variant="gradient" hover>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <Sprout className="w-12 h-12 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Breeder</h3>
                                <p className="text-gray-700 mb-4">
                                    Creatori di varietà che emettono licenze a produttori autorizzati
                                </p>
                                {isConnected && (
                                    <Link to="/breeder">
                                        <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                                            Vai al Dashboard
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Licensee */}
                    <Card variant="gradient" hover>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <Users className="w-12 h-12 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Licensee</h3>
                                <p className="text-gray-700 mb-4">
                                    Produttori autorizzati che creano lotti tracciabili
                                </p>
                                {isConnected && (
                                    <Link to="/licensee">
                                        <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                                            Vai al Dashboard
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Inspector */}
                    <Card variant="gradient" hover>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <ClipboardCheck className="w-12 h-12 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Inspector</h3>
                                <p className="text-gray-700 mb-4">
                                    Professionisti che certificano qualità e conformità dei batch
                                </p>
                                {isConnected && (
                                    <Link to="/inspector">
                                        <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                                            Vai al Dashboard
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="relative">
                <Card variant="glass" className="text-center p-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Pronto a Iniziare?
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Connetti il tuo wallet MetaMask per accedere alle funzionalità della piattaforma
                    </p>

                    {!isConnected ? (
                        <Button size="lg" icon={<Shield className="w-5 h-5" />}>
                            Connetti Wallet
                        </Button>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link to="/breeder">
                                <Button size="lg" variant="primary">
                                    Dashboard Breeder
                                </Button>
                            </Link>
                            <Link to="/licensee">
                                <Button size="lg" variant="outline">
                                    Dashboard Licensee
                                </Button>
                            </Link>
                        </div>
                    )}
                </Card>
            </section>

        </div>
    );
}