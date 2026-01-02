/**
 * IPFS ROUTES
 * 
 * Definisce gli endpoint API per operazioni IPFS
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

// Import IPFS service
const ipfsService = require('../services/ipfs.service');

// ===================================
// MULTER CONFIGURATION (File Upload)
// ===================================

// Crea directory uploads se non esiste
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurazione storage per multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Nome file unico con timestamp
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Filtro per tipi di file accettati
const fileFilter = (req, file, cb) => {
  // Tipi permessi
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/json',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: images, PDF, JSON, text'), false);
  }
};

// Setup multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

// ===================================
// HELPER FUNCTIONS
// ===================================

// Cleanup: rimuovi file temporaneo
function cleanupTempFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('🗑️  Temp file deleted:', filePath);
  }
}

// ===================================
// AUTHENTICATION MIDDLEWARE
// ===================================
const authenticate = (req, res, next) => {
  const apiKey = req.header('X-API-KEY');
  const secretToken = process.env.API_SECRET_TOKEN;

  if (!secretToken || apiKey !== secretToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API Key'
    });
  }
  next();
};

// ===================================
// ROUTES
// ===================================

// Applica middleware di autenticazione a tutte le rotte seguenti
router.use(authenticate);

/**
 * POST /api/ipfs/upload
 * Upload un file su IPFS
 * 
 * Body: multipart/form-data
 * - file: File da caricare
 * - name: (opzionale) Nome custom
 * - metadata: (opzionale) Metadata JSON
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  let tempFilePath = null;

  try {
    // Verifica che il file sia stato caricato
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please provide a file in the "file" field'
      });
    }

    tempFilePath = req.file.path;

    console.log('📁 File received:', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Opzioni per IPFS
    const options = {
      name: req.body.name || req.file.originalname,
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {}
    };

    // Upload a IPFS
    const result = await ipfsService.uploadFile(tempFilePath, options);

    // Cleanup file temporaneo
    cleanupTempFile(tempFilePath);

    // Risposta
    res.json({
      success: true,
      message: 'File uploaded to IPFS successfully',
      data: {
        ...result,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Error in /upload:', error);

    // Cleanup in caso di errore
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }

    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ipfs/metadata
 * Upload JSON metadata su IPFS
 * 
 * Body: JSON
 * {
 *   "data": { ... },     // Dati da caricare
 *   "name": "..."        // Nome opzionale
 * }
 */
router.post('/metadata', [
  body('data').isObject().withMessage('data must be an object'),
  body('name').optional().isString()
], async (req, res) => {
  try {
    // Valida input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array()
      });
    }

    const { data, name, metadata } = req.body;

    console.log('📝 Uploading JSON metadata...');

    // Upload a IPFS
    const result = await ipfsService.uploadJSON(data, {
      name: name || `metadata-${Date.now()}.json`,
      metadata
    });

    // Risposta
    res.json({
      success: true,
      message: 'Metadata uploaded to IPFS successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in /metadata:', error);

    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * GET /api/ipfs/:hash
 * Ottieni info su un file IPFS
 * 
 * Params:
 * - hash: IPFS hash (es: QmXoypiz...)
 */
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash || hash.length < 10) {
      return res.status(400).json({
        error: 'Invalid hash',
        message: 'Please provide a valid IPFS hash'
      });
    }

    console.log('🔍 Getting info for hash:', hash);

    const info = await ipfsService.getFileInfo(hash);

    res.json({
      success: true,
      data: info
    });

  } catch (error) {
    console.error('Error in /get:', error);

    res.status(404).json({
      error: 'Not found',
      message: error.message
    });
  }
});

/**
 * DELETE /api/ipfs/:hash
 * Rimuovi (unpin) un file da IPFS
 * 
 * Params:
 * - hash: IPFS hash
 */
router.delete('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash || hash.length < 10) {
      return res.status(400).json({
        error: 'Invalid hash',
        message: 'Please provide a valid IPFS hash'
      });
    }

    console.log('🗑️  Unpinning file:', hash);

    await ipfsService.unpinFile(hash);

    res.json({
      success: true,
      message: 'File unpinned successfully',
      hash: hash
    });

  } catch (error) {
    console.error('Error in /delete:', error);

    res.status(500).json({
      error: 'Unpin failed',
      message: error.message
    });
  }
});

/**
 * GET /api/ipfs
 * Lista tutti i file pinnati
 * 
 * Query params (opzionali):
 * - limit: Numero max risultati
 * - offset: Offset per paginazione
 */
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const filters = {
      pageLimit: parseInt(limit) || 10,
      pageOffset: parseInt(offset) || 0
    };

    console.log('📋 Listing files with filters:', filters);

    const files = await ipfsService.listFiles(filters);

    res.json({
      success: true,
      count: files.length,
      data: files
    });

  } catch (error) {
    console.error('Error in /list:', error);

    res.status(500).json({
      error: 'List failed',
      message: error.message
    });
  }
});

module.exports = router;