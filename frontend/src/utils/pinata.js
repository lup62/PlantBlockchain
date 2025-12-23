import axios from 'axios';
import CryptoJS from 'crypto-js';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_API_SECRET;

// Pinata endpoints
const PINATA_PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_PIN_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
// Recupera il gateway dal .env o usa quello pubblico come fallback
const rawGateway = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
// Assicurati che finisca con una barra
const PINATA_GATEWAY = rawGateway.endsWith('/') ? rawGateway : `${rawGateway}/`;

/**
 * Calcola hash SHA-256 di un file
 * @param {File} file - File da hashare
 * @returns {Promise<string>} - Hash esadecimale
 */
export async function calculateFileHash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
            const hash = CryptoJS.SHA256(wordArray).toString();
            resolve(hash);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Upload file su Pinata IPFS
 * @param {File} file - File da uploadare
 * @param {object} metadata - Metadati opzionali
 * @returns {Promise<object>} - { ipfsHash, pinataUrl, fileHash }
 */
export async function uploadFileToPinata(file, metadata = {}) {
    try {
        // 1. Calcola hash del file
        const fileHash = await calculateFileHash(file);

        // 2. Prepara FormData
        const formData = new FormData();
        formData.append('file', file);

        // 3. Aggiungi metadata Pinata
        const pinataMetadata = {
            name: metadata.fileName || file.name,
            keyvalues: {
                varietyId: metadata.varietyId?.toString() || '',
                denomination: metadata.denomination || '',
                registrationNumber: metadata.registrationNumber || '',
                uploadDate: new Date().toISOString(),
                fileHash: fileHash
            }
        };
        formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

        // 4. Upload su Pinata
        const response = await axios.post(PINATA_PIN_FILE_URL, formData, {
            headers: {
                // Axios calcolerà automaticamente il Content-Type corretto con il boundary
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            },
            maxBodyLength: Infinity // Necessario per file grandi
        });

        const ipfsHash = response.data.IpfsHash;
        const finalGateway = PINATA_GATEWAY.includes('/ipfs/') ? PINATA_GATEWAY : `${PINATA_GATEWAY}ipfs/`;

        return {
            ipfsHash,
            pinataUrl: `${finalGateway}${ipfsHash}`,
            fileHash,
            timestamp: response.data.Timestamp
        };

    } catch (error) {
        console.error('Errore upload Pinata:', error);
        throw new Error(`Upload fallito: ${error.message}`);
    }
}

/**
 * Upload JSON metadata su Pinata
 * @param {object} jsonData - Dati JSON da salvare
 * @param {string} name - Nome del file JSON
 * @returns {Promise<object>} - { ipfsHash, pinataUrl }
 */
export async function uploadJSONToPinata(jsonData, name = 'metadata.json') {
    try {
        const data = {
            pinataContent: jsonData,
            pinataMetadata: {
                name: name
            }
        };

        const response = await axios.post(PINATA_PIN_JSON_URL, data, {
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }
        });

        const ipfsHash = response.data.IpfsHash;
        const finalGateway = PINATA_GATEWAY.includes('/ipfs/') ? PINATA_GATEWAY : `${PINATA_GATEWAY}ipfs/`;

        return {
            ipfsHash: ipfsHash,
            pinataUrl: `${finalGateway}${ipfsHash}`
        };

    } catch (error) {
        console.error('Errore upload JSON Pinata:', error);
        throw new Error(`Upload JSON fallito: ${error.message}`);
    }
}

/**
 * Recupera URL IPFS da hash
 * @param {string} ipfsHash - Hash IPFS (CID)
 * @returns {string} - URL pubblico del file
 */
export function getIPFSUrl(ipfsHash) {
    if (!ipfsHash) return '';
    // Rimuovi eventuale prefisso ipfs://
    const cleanHash = ipfsHash.replace('ipfs://', '');
    const finalGateway = PINATA_GATEWAY.includes('/ipfs/') ? PINATA_GATEWAY : `${PINATA_GATEWAY}ipfs/`;
    return `${finalGateway}${cleanHash}`;
}

/**
 * Verifica che l'hash di un file corrisponda a quello atteso
 * @param {File} file - File da verificare
 * @param {string} expectedHash - Hash atteso
 * @returns {Promise<boolean>} - True se corrisponde
 */
export async function verifyFileHash(file, expectedHash) {
    const calculatedHash = await calculateFileHash(file);
    return calculatedHash === expectedHash;
}
