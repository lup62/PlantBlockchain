import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

/**
 * Hook personalizzato per gestire la connessione a MetaMask
 * 
 * COSA FA:
 * - Connette/disconnette MetaMask
 * - Tiene traccia dell'indirizzo connesso
 * - Fornisce un "signer" per firmare transazioni
 */
export function useMetaMask() {
    // STATE = Variabili che "ricordano" le informazioni

    // Indirizzo del wallet connesso (es: "0x123...")
    const [account, setAccount] = useState(null);

    // Provider = Connessione alla blockchain
    const [provider, setProvider] = useState(null);

    // Signer = Chi firma le transazioni (tu!)
    const [signer, setSigner] = useState(null);

    // Stato di caricamento
    const [isConnecting, setIsConnecting] = useState(false);

    // Stato di errore
    const [error, setError] = useState(null);

    /**
     * Funzione per CONNETTERE MetaMask
     */
    async function connect() {
        // Controlla se MetaMask è installato
        if (!window.ethereum) {
            setError('MetaMask non è installato! Scaricalo da metamask.io');
            alert('Per favore installa MetaMask!');
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);

            // Chiedi a MetaMask di connettersi
            // Questo apre il popup di MetaMask
            await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Crea un provider (connessione alla blockchain)
            const newProvider = new ethers.BrowserProvider(window.ethereum);

            // Ottieni il signer (chi firma le transazioni)
            const newSigner = await newProvider.getSigner();

            // Ottieni l'indirizzo del wallet
            const address = await newSigner.getAddress();

            // Salva tutto nello state
            setProvider(newProvider);
            setSigner(newSigner);
            setAccount(address);

            console.log('✅ Connesso:', address);
        } catch (err) {
            console.error('❌ Errore connessione:', err);
            setError('Connessione fallita: ' + err.message);
        } finally {
            setIsConnecting(false);
        }
    }

    /**
     * Funzione per DISCONNETTERE
     */
    function disconnect() {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setError(null);
        console.log('🔌 Disconnesso');
    }

    /**
     * Ascolta i cambiamenti di account in MetaMask
     * (quando l'utente cambia wallet)
     */
    useEffect(() => {
        if (!window.ethereum) return;

        // Funzione chiamata quando cambia l'account
        function handleAccountsChanged(accounts) {
            if (accounts.length === 0) {
                // L'utente ha disconnesso
                disconnect();
            } else if (accounts[0] !== account) {
                // L'utente ha cambiato account
                console.log('🔄 Account cambiato:', accounts[0]);
                connect(); // Riconnetti con il nuovo account
            }
        }

        // Funzione chiamata quando cambia la rete
        function handleChainChanged() {
            console.log('🔄 Rete cambiata, ricarico...');
            window.location.reload();
        }

        // Ascolta gli eventi di MetaMask
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        // Cleanup: rimuovi gli ascoltatori quando il componente viene smontato
        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, [account]);

    /**
     * Auto-connessione se già autorizzato
     * (quando riapri l'app e MetaMask è già connesso)
     */
    useEffect(() => {
        async function checkConnection() {
            if (!window.ethereum) return;

            try {
                // Controlla se ci sono account già autorizzati
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });

                if (accounts.length > 0) {
                    // C'è già un account connesso, riconnetti automaticamente
                    connect();
                }
            } catch (err) {
                console.error('Errore check connessione:', err);
            }
        }

        checkConnection();
    }, []); // [] = esegui solo una volta all'avvio

    // RETURN = Cosa questo hook restituisce a chi lo usa
    return {
        // Dati
        account,        // Indirizzo del wallet (es: "0x123...")
        provider,       // Provider per leggere dalla blockchain
        signer,         // Signer per firmare transazioni
        error,          // Messaggio di errore (se c'è)

        // Stati
        isConnecting,   // true se sta connettendo
        isConnected: !!account, // true se connesso

        // Funzioni
        connect,        // Funzione per connettere
        disconnect      // Funzione per disconnettere
    };
}