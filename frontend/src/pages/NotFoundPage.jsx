/**
 * NOT FOUND PAGE
 * 
 * Pagina 404
 */

import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="text-center max-w-lg">
                <div className="text-9xl font-bold text-gray-200 mb-2">404</div>
                <img
                    src="/src/assets/404-plant.png"
                    alt="Pagina non trovata"
                    className="mx-auto max-w-[280px] h-auto mb-8 rounded-2xl shadow-xl border-4 border-white/10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />

                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Pagina Non Trovata
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    La pagina che stai cercando non esiste
                </p>

                <div className="flex justify-center gap-4">
                    <Link to="/">
                        <Button icon={<Home className="w-5 h-5" />}>
                            Torna alla Home
                        </Button>
                    </Link>
                    <Link to="/verify">
                        <Button variant="outline" icon={<Search className="w-5 h-5" />}>
                            Verifica Batch
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
