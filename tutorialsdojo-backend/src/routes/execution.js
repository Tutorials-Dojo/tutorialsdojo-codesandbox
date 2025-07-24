const express = require('express');
const { body, param, query } = require('express-validator');
const executionController = require('../controllers/executionController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const executeCodeValidation = [
  body('files')
    .isArray({ min: 1 })
    .withMessage('Files array is required and must not be empty'),
  body('files.*.name')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name is required and must be 1-255 characters'),
  body('files.*.content')
    .optional()
    .isString()
    .isLength({ max: 1000000 })
    .withMessage('File content must be less than 1MB'),
  body('language')
    .optional()
    .isIn(['javascript', 'typescript', 'python', 'html', 'css'])
    .withMessage('Invalid language'),
  body('timeout')
    .optional()
    .isInt({ min: 1000, max: 300000 })
    .withMessage('Timeout must be between 1-300 seconds')
];

// Execute code snippet (temporary execution)
router.post('/execute',
  authenticateToken,
  executeCodeValidation,
  executionController.executeCode
);

// Start project execution in persistent sandbox
router.post('/:projectId/start',
  authenticateToken,
  param('projectId').isUUID().withMessage('Invalid project ID'),
  executionController.startExecution
);

// Stop project execution
router.post('/:projectId/stop',
  authenticateToken,
  param('projectId').isUUID().withMessage('Invalid project ID'),
  executionController.stopExecution
);

// Get execution status
router.get('/:projectId/status',
  optionalAuth, // Allow public projects to be checked
  param('projectId').isUUID().withMessage('Invalid project ID'),
  executionController.getExecutionStatus
);

// Update and restart execution
router.put('/:projectId/update',
  authenticateToken,
  param('projectId').isUUID().withMessage('Invalid project ID'),
  executionController.updateExecution
);

// Get execution logs
router.get('/:projectId/logs',
  optionalAuth,
  param('projectId').isUUID().withMessage('Invalid project ID'),
  query('lines')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Lines must be between 1-1000'),
  executionController.getExecutionLogs
);

// List active executions (admin/monitoring)
router.get('/active',
  authenticateToken,
  // TODO: Add admin check middleware here if needed
  executionController.listActiveExecutions
);

// Health check for Firecracker service
router.get('/health',
  executionController.getServiceHealth
);

module.exports = router;