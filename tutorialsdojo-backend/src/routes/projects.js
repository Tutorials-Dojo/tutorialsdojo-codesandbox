const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');

const router = express.Router();

// Validation rules
const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be 1-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('template')
    .optional()
    .isIn(['vanilla', 'react', 'vue', 'angular'])
    .withMessage('Invalid template type')
];

const updateProjectValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be 1-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

const forkProjectValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be 1-100 characters')
];

// Routes
router.post('/', auth, createProjectValidation, projectController.createProject);
router.get('/', auth, projectController.getUserProjects);
router.get('/:id', auth, projectController.getProject);
router.put('/:id', auth, updateProjectValidation, projectController.updateProject);
router.delete('/:id', auth, projectController.deleteProject);
router.post('/:id/fork', auth, forkProjectValidation, projectController.forkProject);

module.exports = router;