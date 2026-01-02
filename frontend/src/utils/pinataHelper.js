import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const API_SECRET_TOKEN = import.meta.env.VITE_API_SECRET_TOKEN;

/**
 * Carica un file su IPFS tramite il proxy del backend
 * @param {File} file - Il file da caricare
 */
export async function uploadToPinata(file) {
    if (!API_SECRET_TOKEN) {
        console.warn("Backend API Secret Token not found. Simulating upload.");
        return {
            success: true,
            pinataUrl: "https://gateway.pinata.cloud/ipfs/QmSimulatedHash123",
            ipfsHash: "QmSimulatedHash123",
            simulated: true
        };
    }

    const formData = new FormData();
    formData.append('file', file);

    // Metadata opzionali
    formData.append('metadata', JSON.stringify({
        project: "PlantBlockchain",
        uploadDate: new Date().toISOString()
    }));

    try {
        const res = await axios.post(`${BACKEND_URL}/api/ipfs/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-API-KEY': API_SECRET_TOKEN
            }
        });

        if (res.data.success) {
            return {
                success: true,
                pinataUrl: res.data.data.gatewayUrl || `https://gateway.pinata.cloud/ipfs/${res.data.data.hash}`,
                ipfsHash: res.data.data.hash,
                simulated: false
            };
        } else {
            throw new Error(res.data.message || "Upload failed");
        }
    } catch (error) {
        console.error("Error uploading to IPFS via Backend:", error);
        return {
            success: false,
            message: error.response?.data?.message || error.message
        };
    }
}
