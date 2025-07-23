const dockerService = require('../services/dockerService');
const File = require('../models/File');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

class ExecutionController {
  // Start project execution
  async startExecution(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const userId = req.user.id;

      // Get project and files
      const project = await Project.findOne({
        where: { id: projectId },
        include: [{ model: File }]
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check permissions
      if (project.userId !== userId && !project.isPublic) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Create sandbox
      const sandbox = await dockerService.createSandbox(projectId, project.files);

      // Update project with execution info
      await project.update({
        executionUrl: sandbox.url,
        executionStatus: 'running',
        sandboxId: sandbox.sandboxId
      });

      res.json({
        success: true,
        execution: {
          sandboxId: sandbox.sandboxId,
          url: sandbox.url,
          port: sandbox.port,
          status: 'running'
        }
      });
    } catch (error) {
      console.error('Start execution error:', error);
      res.status(500).json({ error: 'Failed to start execution' });
    }
  }

  // Stop project execution
  async stopExecution(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (!project.sandboxId) {
        return res.status(400).json({ error: 'No active execution found' });
      }

      // Stop sandbox
      await dockerService.stopSandbox(project.sandboxId);

      // Update project
      await project.update({
        executionUrl: null,
        executionStatus: 'stopped',
        sandboxId: null
      });

      res.json({
        success: true,
        message: 'Execution stopped successfully'
      });
    } catch (error) {
      console.error('Stop execution error:', error);
      res.status(500).json({ error: 'Failed to stop execution' });
    }
  }

  // Get execution status
  async getExecutionStatus(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const project = await Project.findOne({
        where: { id: projectId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check permissions
      if (project.userId !== userId && !project.isPublic) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        execution: {
          status: project.executionStatus || 'stopped',
          url: project.executionUrl,
          sandboxId: project.sandboxId
        }
      });
    } catch (error) {
      console.error('Get execution status error:', error);
      res.status(500).json({ error: 'Failed to get execution status' });
    }
  }

  // Update and restart execution
  async updateExecution(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const project = await Project.findOne({
        where: { id: projectId, userId },
        include: [{ model: File }]
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (!project.sandboxId) {
        return res.status(400).json({ error: 'No active execution found' });
      }

      // Update sandbox with latest files
      await dockerService.updateSandboxFiles(project.sandboxId, project.files);

      res.json({
        success: true,
        message: 'Execution updated successfully'
      });
    } catch (error) {
      console.error('Update execution error:', error);
      res.status(500).json({ error: 'Failed to update execution' });
    }
  }

  // List all active executions (admin)
  async listActiveExecutions(req, res) {
    try {
      const sandboxes = await dockerService.listActiveSandboxes();
      
      res.json({
        success: true,
        activeSandboxes: sandboxes
      });
    } catch (error) {
      console.error('List executions error:', error);
      res.status(500).json({ error: 'Failed to list executions' });
    }
  }
}

module.exports = new ExecutionController();