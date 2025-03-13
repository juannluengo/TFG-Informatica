import express from 'express';
import DiagnosticService from '../services/diagnosticService.js';

const router = express.Router();
const diagnosticService = new DiagnosticService();

/**
 * @route   GET /api/diagnostics/health
 * @desc    Check basic API health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route   GET /api/diagnostics/provider
 * @desc    Check blockchain provider connection
 * @access  Public
 */
router.get('/provider', async (req, res) => {
  try {
    const result = await diagnosticService.checkProvider();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/diagnostics/contract
 * @desc    Check contract connection and status
 * @access  Public
 */
router.get('/contract', async (req, res) => {
  try {
    const result = await diagnosticService.checkContract();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/diagnostics/full
 * @desc    Run a full diagnostic check on the system
 * @access  Public
 */
router.get('/full', async (req, res) => {
  try {
    const result = await diagnosticService.runFullDiagnostics();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 