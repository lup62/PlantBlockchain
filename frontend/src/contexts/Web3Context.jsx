/**
 * WEB3 CONTEXT
 * Gestisce connessione wallet, contratto e stato globale
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../utils/config';
import { CONTRACT_ABI } from '../utils/contractABI';

const Web3Context = createContext();

export function Web3Provider({ children }) {
    // 1. All Hooks properly at the top
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);

    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // Permission States
    const [isAuthority, setIsAuthority] = useState(false);
    const [isInspector, setIsInspector] = useState(false);
    const [authorityAddress, setAuthorityAddress] = useState(null); // Added this

    const [counters, setCounters] = useState({ varieties: 0, batches: 0, licenses: 0 });

    /**
     * Connect Wallet Function
     */
    async function connectWallet() {
        if (!window.ethereum) {
            setError('MetaMask non installato! Scaricalo da metamask.io');
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            setProvider(provider);
            setSigner(signer);
            setAccount(address);
            setChainId(Number(network.chainId));
            setContract(contract);

            await loadUserInfo(contract, address);

            console.log('✅ Wallet connesso:', address);

        } catch (err) {
            console.error('Errore connessione:', err);
            setError(err.message || 'Connessione fallita');
        } finally {
            setIsConnecting(false);
        }
    }

    /**
     * Load User Info
     */
    async function loadUserInfo(contract, address) {
        try {
            // Get Authority
            const authority = await contract.getAuthority();
            setAuthorityAddress(authority);

            const isAuth = authority.toLowerCase() === address.toLowerCase();
            setIsAuthority(isAuth);

            // Get Inspector Status
            const inspector = await contract.isInspectorAuthorized(address);
            setIsInspector(inspector);

            // Get Counters
            const counts = await contract.getCounters();
            setCounters({
                varieties: Number(counts.varietiesCounter),
                batches: Number(counts.batchesCounter),
                licenses: Number(counts.licensesCounter)
            });

            console.log("--- AUTH CHECK ---");
            console.log("Me:", address);
            console.log("Auth:", authority);
            console.log("Match:", isAuth);

        } catch (err) {
            console.error('Errore caricamento info:', err);
            setAuthorityAddress('Error: ' + (err.reason || err.message) + ' (Target: ' + CONTRACT_ADDRESS + ')');
        }
    }

    /**
     * Disconnect
     */
    function disconnectWallet() {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
        setAuthorityAddress(null);
        setIsAuthority(false);
        setIsInspector(false);
        setError(null);
        console.log('🔌 Wallet disconnesso');
    }

    /**
     * Refresh
     */
    async function refreshData() {
        if (contract && account) {
            await loadUserInfo(contract, account);
        }
    }

    // Effect: Account Changed
    useEffect(() => {
        if (!window.ethereum) return;

        function handleAccountsChanged(accounts) {
            if (accounts.length === 0) {
                disconnectWallet();
            } else if (accounts[0] !== account) {
                // Auto-reconnect with new account
                window.location.reload();
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

    // Effect: Auto Connect
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

    const value = {
        account,
        chainId,
        provider,
        signer,
        contract,
        isConnected: !!account,
        isAuthority,
        authorityAddress, // EXPORTED
        isInspector,
        counters,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        refreshData
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 deve essere usato dentro Web3Provider');
    }
    return context;
}