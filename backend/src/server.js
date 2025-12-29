/**
 * IPFS SERVICE
 * 
 * Gestisce tutte le interazioni con Pinata/IPFS
 * Le API key sono SICURE qui, non esposte al frontend
 */

const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');

// Inizializza Pinata SDK
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

/**
 * Testa la connessione a Pinata
 */
async function testConnection() {
  try {
    const result = await pinata.testAuthentication();
    console.log('✅ Pinata connection successful:', result);
    return { success: true, message: 'Connected to Pinata' };
  } catch (error) {
    console.error('❌ Pinata connection failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Carica un file su IPFS
 * 
 * @param {string} filePath - Percorso del file locale
 * @param {object} options - Opzioni (name, metadata)
 * @returns {object} - { hash, url, size }
 */
async function uploadFile(filePath, options = {}) {
  try {
    // Verifica che il file esista
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found: ' + filePath);
    }

    // Crea readable stream
    const readableStream = fs.createReadStream(filePath);
    
    // Opzioni per Pinata
    const pinataOptions = {
      pinataMetadata: {
        name: options.name || path.basename(filePath),
        keyvalues: options.metadata || {}
      }
    };

    // Upload a Pinata
    console.log('📤 Uploading file to IPFS...');
    const result = await pinata.pinFileToIPFS(readableStream, pinataOptions);
    
    // Ottieni info file
    const fileStats = fs.statSync(filePath);
    
    console.log('✅ File uploaded successfully:', result.IpfsHash);

    return {
      hash: result.IpfsHash,
      url: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${process.env.IPFS_GATEWAY}/ipfs/${result.IpfsHash}`,
      size: fileStats.size,
      timestamp: result.Timestamp
    };

  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw new Error('Failed to upload file to IPFS: ' + error.message);
  }
}

/**
 * Carica JSON metadata su IPFS
 * 
 * @param {object} jsonData - Dati JSON da caricare
 * @param {object} options - Opzioni (name)
 * @returns {object} - { hash, url }
 */
async function uploadJSON(jsonData, options = {}) {
  try {
    // Valida che sia un oggetto
    if (typeof jsonData !== 'object') {
      throw new Error('jsonData must be an object');
    }

    // Opzioni per Pinata
    const pinataOptions = {
      pinataMetadata: {
        name: options.name || `metadata-${Date.now()}.json`,
        keyvalues: {
          type: 'metadata',
          createdAt: new Date().toISOString(),
          ...options.metadata
        }
      }
    };

    console.log('📤 Uploading JSON to IPFS...');
    const result = await pinata.pinJSONToIPFS(jsonData, pinataOptions);
    
    console.log('✅ JSON uploaded successfully:', result.IpfsHash);

    return {
      hash: result.IpfsHash,
      url: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${process.env.IPFS_GATEWAY}/ipfs/${result.IpfsHash}`,
      timestamp: result.Timestamp
    };

  } catch (error) {
    console.error('❌ Error uploading JSON:', error);
    throw new Error('Failed to upload JSON to IPFS: ' + error.message);
  }
}

/**
 * Ottieni info su un file pinnato
 * 
 * @param {string} hash - IPFS hash
 * @returns {object} - File info
 */
async function getFileInfo(hash) {
  try {
    const filters = {
      hashContains: hash
    };

    const result = await pinata.pinList(filters);
    
    if (result.rows.length === 0) {
      throw new Error('File not found on IPFS');
    }

    const fileInfo = result.rows[0];

    return {
      hash: fileInfo.ipfs_pin_hash,
      size: fileInfo.size,
      timestamp: fileInfo.date_pinned,
      name: fileInfo.metadata?.name,
      url: `ipfs://${fileInfo.ipfs_pin_hash}`,
      gatewayUrl: `${process.env.IPFS_GATEWAY}/ipfs/${fileInfo.ipfs_pin_hash}`
    };

  } catch (error) {
    console.error('❌ Error getting file info:', error);
    throw new Error('Failed to get file info: ' + error.message);
  }
}

/**
 * Unpinna un file da IPFS (rimuove)
 * 
 * @param {string} hash - IPFS hash
 * @returns {boolean} - Success
 */
async function unpinFile(hash) {
  try {
    await pinata.unpin(hash);
    console.log('✅ File unpinned:', hash);
    return true;
  } catch (error) {
    console.error('❌ Error unpinning file:', error);
    throw new Error('Failed to unpin file: ' + error.message);
  }
}

/**
 * Lista tutti i file pinnati (con filtri opzionali)
 * 
 * @param {object} filters - Filtri Pinata
 * @returns {array} - Lista file
 */
async function listFiles(filters = {}) {
  try {
    const result = await pinata.pinList(filters);
    
    return result.rows.map(file => ({
      hash: file.ipfs_pin_hash,
      size: file.size,
      timestamp: file.date_pinned,
      name: file.metadata?.name,
      url: `ipfs://${file.ipfs_pin_hash}`,
      gatewayUrl: `${process.env.IPFS_GATEWAY}/ipfs/${file.ipfs_pin_hash}`
    }));

  } catch (error) {
    console.error('❌ Error listing files:', error);
    throw new Error('Failed to list files: ' + error.message);
  }
}

// Export tutte le funzioni
module.exports = {
  testConnection,
  uploadFile,
  uploadJSON,
  getFileInfo,
  unpinFile,
  listFiles
};