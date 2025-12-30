/**
 * SERVER.JS - Backend Entry Point
 * 
 * Questo file avvia il server Express e configura middleware
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const ipfsRoutes = require('./routes/ipfs.routes');
const healthRoutes = require('./routes/health.routes');

// Inizializza Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ===================================
// MIDDLEWARE
// ===================================

// CORS - Permetti richieste dal frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (semplice)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files (se necessario)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===================================
// ROUTES
// ===================================

// Health check
app.use('/api/health', healthRoutes);

// IPFS operations
app.use('/api/ipfs', ipfsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🌱 Variety License Registry - Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      ipfs: '/api/ipfs',
      docs: '/api/docs'
    }
  });
});

// ===================================
// ERROR HANDLING
// ===================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.path} not found`,
    availableRoutes: [
      '/api/health',
      '/api/ipfs/upload',
      '/api/ipfs/metadata'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===================================
// START SERVER
// ===================================

app.listen(PORT, () => {
  console.log('\n✅ Backend server started successfully!');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🚀 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📦 IPFS Gateway: ${process.env.IPFS_GATEWAY}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log('Available endpoints:');
  console.log(`  GET  /api/health          - Health check`);
  console.log(`  POST /api/ipfs/upload     - Upload file to IPFS`);
  console.log(`  POST /api/ipfs/metadata   - Upload JSON metadata to IPFS`);
  console.log(`  GET  /api/ipfs/:hash      - Get file info from IPFS`);
  console.log('');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;