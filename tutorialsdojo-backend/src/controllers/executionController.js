const firecrackerService = require('../services/firecrackerService');
const File = require('../models/File');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

class ExecutionController {
  // Start project execution in Firecracker VM
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
        include: [{ model: File, as: 'files' }]
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check permissions
      if (project.userId !== userId && !project.isPublic) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Convert files to Firecracker format
      const vmFiles = project.files.map(file => ({
        name: file.path.startsWith('/') ? file.path.slice(1) : file.path,
        content: file.content || '',
        type: file.type
      }));

      // Create sandbox in Firecracker
      const sandbox = await firecrackerService.createSandbox(projectId, vmFiles);

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
          status: sandbox.status,
          vmType: 'firecracker'
        }
      });
    } catch (error) {
      console.error('Start execution error:', error);
      res.status(500).json({ 
        error: 'Failed to start execution',
        details: error.message 
      });
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

      // Stop Firecracker VM
      await firecrackerService.stopSandbox(project.sandboxId);

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
      res.status(500).json({ 
        error: 'Failed to stop execution',
        details: error.message 
      });
    }
  }

  // Execute code snippet (temporary execution)
  async executeCode(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { files, language = 'javascript', timeout = 30000 } = req.body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'Files array is required' });
      }

      // Execute code in temporary Firecracker VM
      const result = await firecrackerService.executeCode(files, {
        language,
        timeout
      });

      res.json({
        success: true,
        result: {
          output: result.output,
          error: result.error,
          executionTime: result.executionTime,
          vmId: result.vmId
        }
      });

    } catch (error) {
      console.error('Code execution error:', error);
      res.status(500).json({ 
        error: 'Code execution failed',
        details: error.message 
      });
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

      let vmStatus = 'stopped';
      if (project.sandboxId) {
        // Check if VM is still active
        const activeVMs = await firecrackerService.listActiveSandboxes();
        const vm = activeVMs.find(v => v.id === project.sandboxId);
        vmStatus = vm ? vm.status : 'stopped';
        
        // Update project if VM is no longer active
        if (!vm && project.executionStatus === 'running') {
          await project.update({
            executionUrl: null,
            executionStatus: 'stopped',
            sandboxId: null
          });
        }
      }

      res.json({
        success: true,
        execution: {
          status: vmStatus,
          url: project.executionUrl,
          sandboxId: project.sandboxId,
          vmType: 'firecracker'
        }
      });
    } catch (error) {
      console.error('Get execution status error:', error);
      res.status(500).json({ 
        error: 'Failed to get execution status',
        details: error.message 
      });
    }
  }

  // Update and restart execution
  async updateExecution(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const project = await Project.findOne({
        where: { id: projectId, userId },
        include: [{ model: File, as: 'files' }]
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (!project.sandboxId) {
        return res.status(400).json({ error: 'No active execution found' });
      }

      // Convert files to Firecracker format
      const vmFiles = project.files.map(file => ({
        name: file.path.startsWith('/') ? file.path.slice(1) : file.path,
        content: file.content || '',
        type: file.type
      }));

      // Update sandbox with latest files
      await firecrackerService.updateSandboxFiles(project.sandboxId, vmFiles);

      res.json({
        success: true,
        message: 'Execution updated successfully'
      });
    } catch (error) {
      console.error('Update execution error:', error);
      res.status(500).json({ 
        error: 'Failed to update execution',
        details: error.message 
      });
    }
  }

  // List all active executions (admin/monitoring)
  async listActiveExecutions(req, res) {
    try {
      const sandboxes = await firecrackerService.listActiveSandboxes();
      
      // Get project info for each sandbox
      const enrichedSandboxes = await Promise.all(
        sandboxes.map(async (sandbox) => {
          let projectInfo = null;
          
          if (sandbox.id.startsWith('sandbox-')) {
            const projectId = sandbox.id.split('-')[1];
            const project = await Project.findByPk(projectId, {
              attributes: ['id', 'name', 'userId'],
              include: [{
                model: User,
                as: 'owner',
                attributes: ['username']
              }]
            });
            
            if (project) {
              projectInfo = {
                id: project.id,
                name: project.name,
                owner: project.owner?.username
              };
            }
          }
          
          return {
            ...sandbox,
            project: projectInfo
          };
        })
      );
      
      res.json({
        success: true,
        activeSandboxes: enrichedSandboxes,
        total: enrichedSandboxes.length
      });
    } catch (error) {
      console.error('List executions error:', error);
      res.status(500).json({ 
        error: 'Failed to list executions',
        details: error.message 
      });
    }
  }

  // Get VM logs
  async getExecutionLogs(req, res) {
    try {
      const { projectId } = req.params;
      const { lines = 100 } = req.query;
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

      if (!project.sandboxId) {
        return res.status(400).json({ error: 'No active execution found' });
      }

      // Read VM logs
      const logPath = `/var/log/firecracker/${project.sandboxId}.log`;
      
      try {
        const { exec } = require('child_process');
        const logs = await new Promise((resolve, reject) => {
          exec(`tail -n ${lines} "${logPath}"`, (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });

        res.json({
          success: true,
          logs: logs.split('\n').filter(line => line.trim()),
          sandboxId: project.sandboxId
        });

      } catch (logError) {
        res.json({
          success: true,
          logs: ['No logs available'],
          sandboxId: project.sandboxId
        });
      }

    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({ 
        error: 'Failed to get execution logs',
        details: error.message 
      });
    }
  }

  // Health check for Firecracker service
  async getServiceHealth(req, res) {
    try {
      const activeVMs = await firecrackerService.listActiveSandboxes();
      
      // Check if Firecracker binary is available
      const { exec } = require('child_process');
      const firecrackerVersion = await new Promise((resolve) => {
        exec('firecracker --version', (error, stdout) => {
          if (error) {
            resolve('unavailable');
          } else {
            resolve(stdout.trim());
          }
        });
      });

      // Check system resources
      const memInfo = await new Promise((resolve) => {
        exec('free -m', (error, stdout) => {
          if (error) {
            resolve('unavailable');
          } else {
            const lines = stdout.split('\n');
            const memLine = lines[1].split(/\s+/);
            resolve({
              total: parseInt(memLine[1]),
              used: parseInt(memLine[2]),
              free: parseInt(memLine[3])
            });
          }
        });
      });

      res.json({
        success: true,
        health: {
          firecracker: {
            version: firecrackerVersion,
            status: firecrackerVersion !== 'unavailable' ? 'available' : 'unavailable'
          },
          vms: {
            active: activeVMs.length,
            list: activeVMs
          },
          system: {
            memory: memInfo
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ 
        error: 'Health check failed',
        details: error.message 
      });
    }
  }
}

module.exports = new ExecutionController();