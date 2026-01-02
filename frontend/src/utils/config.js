/**
 * CONFIGURAZIONE APPLICAZIONE
 */

// Indirizzo del contratto deployato (da aggiornare dopo il deploy)
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Chain ID della rete (31337 = Hardhat locale, 1 = Ethereum mainnet)
export const DEFAULT_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '31337');

// RPC URL
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';

// Backend API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// IPFS Gateway
export const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

// Network names
export const NETWORK_NAMES = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    31337: 'Hardhat Local'
};
