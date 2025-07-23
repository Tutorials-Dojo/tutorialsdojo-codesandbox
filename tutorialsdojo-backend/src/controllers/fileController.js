const File = require('../models/File');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');
const path = require('path');

class FileController {
  // Create new file
  async createFile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { name, content = '', type = 'file', path: filePath = '/' } = req.body;
      const userId = req.user.id;

      // Verify project ownership
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if file already exists
      const existingFile = await File.findOne({
        where: { 
          projectId, 
          name, 
          path: filePath 
        }
      });

      if (existingFile) {
        return res.status(409).json({ error: 'File already exists' });
      }

      const file = await File.create({
        name,
        content,
        type,
        path: filePath,
        projectId
      });

      // Update project's updatedAt
      await project.update({ updatedAt: new Date() });

      res.status(201).json({
        success: true,
        file
      });
    } catch (error) {
      console.error('Create file error:', error);
      res.status(500).json({ error: 'Failed to create file' });
    }
  }

  // Get project files
  async getProjectFiles(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Verify project access
      const project = await Project.findByPk(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId && !project.isPublic) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const files = await File.findAll({
        where: { projectId },
        order: [['path', 'ASC'], ['name', 'ASC']]
      });

      res.json({
        success: true,
        files
      });
    } catch (error) {
      console.error('Get files error:', error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  }

  // Get single file
  async getFile(req, res) {
    try {
      const { projectId, fileId } = req.params;
      const userId = req.user.id;

      // Verify project access
      const project = await Project.findByPk(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId && !project.isPublic) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const file = await File.findOne({
        where: { id: fileId, projectId }
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json({
        success: true,
        file
      });
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({ error: 'Failed to fetch file' });
    }
  }

  // Update file content
  async updateFile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, fileId } = req.params;
      const { content, name } = req.body;
      const userId = req.user.id;

      // Verify project ownership
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }

      const file = await File.findOne({
        where: { id: fileId, projectId }
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Update file
      await file.update({
        content: content !== undefined ? content : file.content,
        name: name || file.name
      });

      // Update project's updatedAt
      await project.update({ updatedAt: new Date() });

      res.json({
        success: true,
        file
      });
    } catch (error) {
      console.error('Update file error:', error);
      res.status(500).json({ error: 'Failed to update file' });
    }
  }

  // Delete file
  async deleteFile(req, res) {
    try {
      const { projectId, fileId } = req.params;
      const userId = req.user.id;

      // Verify project ownership
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }

      const file = await File.findOne({
        where: { id: fileId, projectId }
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      await file.destroy();

      // Update project's updatedAt
      await project.update({ updatedAt: new Date() });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }

  // Rename file
  async renameFile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, fileId } = req.params;
      const { name, path: newPath } = req.body;
      const userId = req.user.id;

      // Verify project ownership
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }

      const file = await File.findOne({
        where: { id: fileId, projectId }
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check if new name/path combination already exists
      if (name !== file.name || newPath !== file.path) {
        const existingFile = await File.findOne({
          where: { 
            projectId, 
            name: name || file.name, 
            path: newPath || file.path,
            id: { [Op.ne]: fileId }
          }
        });

        if (existingFile) {
          return res.status(409).json({ error: 'File with this name already exists' });
        }
      }

      await file.update({
        name: name || file.name,
        path: newPath || file.path
      });

      // Update project's updatedAt
      await project.update({ updatedAt: new Date() });

      res.json({
        success: true,
        file
      });
    } catch (error) {
      console.error('Rename file error:', error);
      res.status(500).json({ error: 'Failed to rename file' });
    }
  }

  // Create directory
  async createDirectory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { name, path: dirPath = '/' } = req.body;
      const userId = req.user.id;

      // Verify project ownership
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const directory = await File.create({
        name,
        content: null,
        type: 'directory',
        path: dirPath,
        projectId
      });

      // Update project's updatedAt
      await project.update({ updatedAt: new Date() });

      res.status(201).json({
        success: true,
        directory
      });
    } catch (error) {
      console.error('Create directory error:', error);
      res.status(500).json({ error: 'Failed to create directory' });
    }
  }
}

module.exports = new FileController();