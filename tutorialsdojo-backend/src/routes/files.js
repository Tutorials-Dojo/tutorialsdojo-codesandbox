const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const fileController = require('../controllers/fileController');

const router = express.Router();

// Validation rules
const createFileValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be 1-255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('File name contains invalid characters'),
  body('type')
    .optional()
    .isIn(['file', 'directory'])
    .withMessage('Type must be file or directory'),
  body('path')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Path must be less than 500 characters')
];

const updateFileValidation = [
  body('content')
    .optional()
    .isLength({ max: 1000000 }) // 1MB limit
    .withMessage('File content too large'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be 1-255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('File name contains invalid characters')
];

const renameFileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be 1-255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('File name contains invalid characters'),
  body('path')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Path must be less than 500 characters')
];

const createDirectoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Directory name must be 1-255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Directory name contains invalid characters'),
  body('path')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Path must be less than 500 characters')
];

// Routes
router.post('/projects/:projectId/files', auth, createFileValidation, fileController.createFile);
router.get('/projects/:projectId/files', auth, fileController.getProjectFiles);
router.get('/projects/:projectId/files/:fileId', auth, fileController.getFile);
router.put('/projects/:projectId/files/:fileId', auth, updateFileValidation, fileController.updateFile);
router.delete('/projects/:projectId/files/:fileId', auth, fileController.deleteFile);
router.patch('/projects/:projectId/files/:fileId/rename', auth, renameFileValidation, fileController.renameFile);
router.post('/projects/:projectId/directories', auth, createDirectoryValidation, fileController.createDirectory);

module.exports = router;