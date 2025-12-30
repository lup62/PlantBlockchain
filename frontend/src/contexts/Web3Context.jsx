/**
 * WEB3 CONTEXT
 * 
 * Gestisce connessione wallet, contratto e stato globale
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, DEFAULT_CHAIN_ID } from '../utils/config';
import { CONTRACT_ABI } from '../utils/contractABI';

const Web3Context = createContext();

export function Web3Provider({ children }) {
    // Stato wallet
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);

    // Stato UI
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // Stato blockchain
    const [isAuthority, setIsAuthority] = useState(false);
    const [isInspector, setIsInspector] = useState(false);
    const [counters, setCounters] = useState({ varieties: 0, batches: 0, licenses: 0 });

    /**
     * Connetti MetaMask
     */
    async function connectWallet() {
        if (!window.ethereum) {
            setError('MetaMask non installato! Scaricalo da metamask.io');
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);

            // Richiedi account
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Setup provider e signer
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            // Setup contratto
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            // Aggiorna stato
            setProvider(provider);
            setSigner(signer);
            setAccount(address);
            setChainId(Number(network.chainId));
            setContract(contract);

            // Carica info utente
            await loadUserInfo(contract, address);

            console.log('✅ Wallet connesso:', address);
            console.log('📄 Contratto:', CONTRACT_ADDRESS);

        } catch (err) {
            console.error('Errore connessione:', err);
            setError(err.message || 'Connessione fallita');
        } finally {
            setIsConnecting(false);
        }
    }

    /**
     * Carica informazioni utente
     */
    async function loadUserInfo(contract, address) {
        try {
            // Verifica se è authority
            const authority = await contract.getAuthority();
            setIsAuthority(authority.toLowerCase() === address.toLowerCase());

            // Verifica se è inspector
            const inspector = await contract.isInspectorAuthorized(address);
            setIsInspector(inspector);

            // Carica contatori
            const counts = await contract.getCounters();
            setCounters({
                varieties: Number(counts.varietiesCounter),
                batches: Number(counts.batchesCounter),
                licenses: Number(counts.licensesCounter)
            });

        } catch (err) {
            console.error('Errore caricamento info:', err);
        }
    }

    /**
     * Disconnetti wallet
     */
    function disconnectWallet() {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
        setIsAuthority(false);
        setIsInspector(false);
        setError(null);
        console.log('🔌 Wallet disconnesso');
    }

    /**
     * Ricarica dati dal contratto
     */
    async function refreshData() {
        if (contract && account) {
            await loadUserInfo(contract, account);
        }
    }

    /**
     * Switch network
     */
    async function switchNetwork(targetChainId) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${targetChainId.toString(16)}` }],
            });
        } catch (err) {
            console.error('Errore switch network:', err);
            throw err;
        }
    }

    // Listener per cambio account
    useEffect(() => {
        if (!window.ethereum) return;

        function handleAccountsChanged(accounts) {
            if (accounts.length === 0) {
                disconnectWallet();
            } else if (accounts[0] !== account) {
                connectWallet();
            }
        }

        function handleChainChanged() {
            window.location.reload();
        }

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, [account]);

    // Auto-connect se già autorizzato
    useEffect(() => {
        async function checkConnection() {
            if (!window.ethereum) return;

            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });

                if (accounts.length > 0) {
                    await connectWallet();
                }
            } catch (err) {
                console.error('Errore auto-connect:', err);
            }
        }

        checkConnection();
    }, []);

    // Context value
    const value = {
        // Wallet
        account,
        chainId,
        provider,
        signer,
        contract,
        isConnected: !!account,

        // Ruoli
        isAuthority,
        isInspector,

        // Dati
        counters,

        // Stati
        isConnecting,
        error,

        // Funzioni
        connectWallet,
        disconnectWallet,
        refreshData,
        switchNetwork
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
}

// Hook per usare il context
export function useWeb3() {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 deve essere usato dentro Web3Provider');
    }
    return context;
}