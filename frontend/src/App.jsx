/**
 * APP.JSX - Entry Point Applicazione
 * 
 * Router principale e provider globali
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Layout from './components/Layout';

// Pages
import HomePage from './pages/HomePage';
import VerifyPage from './pages/VerifyPage';
import AuthorityPage from './pages/AuthorityPage';
import BreederPage from './pages/BreederPage';
import LicenseePage from './pages/LicenseePage';
import InspectorPage from './pages/InspectorPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
    return (
        <BrowserRouter>
            <Web3Provider>
                <Layout>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/verify" element={<VerifyPage />} />
                        <Route path="/verify/:batchId" element={<VerifyPage />} />
                        <Route path="/authority" element={<AuthorityPage />} />
                        <Route path="/breeder" element={<BreederPage />} />
                        <Route path="/licensee" element={<LicenseePage />} />
                        <Route path="/inspector" element={<InspectorPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Layout>
            </Web3Provider>
        </BrowserRouter>
    );
}

export default App;