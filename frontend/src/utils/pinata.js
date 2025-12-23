import axios from 'axios';
import CryptoJS from 'crypto-js';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_API_SECRET;

// Pinata endpoints
const PINATA_PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_PIN_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

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
                'Content-Type': 'multipart/form-data',
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            },
            maxBodyLength: Infinity
        });

        const ipfsHash = response.data.IpfsHash;

        return {
            ipfsHash,
            pinataUrl: `${PINATA_GATEWAY}${ipfsHash}`,
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

        return {
            ipfsHash: response.data.IpfsHash,
            pinataUrl: `${PINATA_GATEWAY}${response.data.IpfsHash}`
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
    return `${PINATA_GATEWAY}${cleanHash}`;
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
