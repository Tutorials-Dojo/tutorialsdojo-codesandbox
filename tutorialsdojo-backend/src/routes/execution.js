const express = require('express');
const { body, param } = require('express-validator');
const executionController = require('../controllers/executionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Start project execution
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
  authenticateToken,
  param('projectId').isUUID().withMessage('Invalid project ID'),
  executionController.getExecutionStatus
);

// Update and restart execution
router.put('/:projectId/update',
  authenticateToken,
  param('projectId').isUUID().withMessage('Invalid project ID'),
  executionController.updateExecution
);

// List active executions (admin only)
router.get('/active',
  authenticateToken,
  // Add admin check middleware here if needed
  executionController.listActiveExecutions
);

module.exports = router;