/**
 * HEALTH ROUTES
 * 
 * Endpoint per verificare lo stato del server
 */

const express = require('express');
const router = express.Router();
const ipfsService = require('../services/ipfs.service');

/**
 * GET /api/health
 * Health check base
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

/**
 * GET /api/health/ipfs
 * Verifica connessione IPFS/Pinata
 */
router.get('/ipfs', async (req, res) => {
  try {
    const result = await ipfsService.testConnection();
    
    if (result.success) {
      res.json({
        status: 'ok',
        service: 'ipfs',
        message: 'IPFS connection successful',
        details: result
      });
    } else {
      res.status(503).json({
        status: 'error',
        service: 'ipfs',
        message: 'IPFS connection failed',
        error: result.error
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'ipfs',
      message: 'IPFS connection failed',
      error: error.message
    });
  }
});

/**
 * GET /api/health/full
 * Health check completo
 */
router.get('/full', async (req, res) => {
  const checks = {
    server: { status: 'ok' },
    ipfs: { status: 'checking...' },
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };

  try {
    // Test IPFS
    const ipfsTest = await ipfsService.testConnection();
    checks.ipfs = {
      status: ipfsTest.success ? 'ok' : 'error',
      details: ipfsTest
    };

    const allOk = checks.ipfs.status === 'ok';

    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'healthy' : 'degraded',
      checks: checks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    checks.ipfs = {
      status: 'error',
      error: error.message
    };

    res.status(503).json({
      status: 'unhealthy',
      checks: checks,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;