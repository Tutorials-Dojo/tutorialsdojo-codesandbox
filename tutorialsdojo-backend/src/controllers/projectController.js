const Project = require('../models/Project');
const File = require('../models/File');
const { validationResult } = require('express-validator');

class ProjectController {
  // Create new project
  async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, isPublic = false, template = 'vanilla' } = req.body;
      const userId = req.user.id;

      // Create project
      const project = await Project.create({
        name,
        description,
        userId,
        isPublic,
        template
      });

      // Create default files based on template
      const defaultFiles = this.getDefaultFiles(template);
      
      for (const file of defaultFiles) {
        await File.create({
          ...file,
          projectId: project.id
        });
      }

      res.status(201).json({
        success: true,
        project: await this.getProjectWithFiles(project.id)
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }

  // Get user's projects
  async getUserProjects(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, search } = req.query;
      
      const offset = (page - 1) * limit;
      let whereClause = { userId };
      
      if (search) {
        whereClause.name = { [Op.iLike]: `%${search}%` };
      }

      const projects = await Project.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['updatedAt', 'DESC']],
        include: [{
          model: File,
          attributes: ['id', 'name', 'type']
        }]
      });

      res.json({
        success: true,
        projects: projects.rows,
        pagination: {
          total: projects.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(projects.count / limit)
        }
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }

  // Get single project
  async getProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await this.getProjectWithFiles(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check permissions
      if (project.userId !== userId && !project.isPublic) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        project
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  }

  // Update project
  async updateProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user.id;
      const { name, description, isPublic } = req.body;

      const project = await Project.findOne({
        where: { id, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await project.update({
        name: name || project.name,
        description: description || project.description,
        isPublic: isPublic !== undefined ? isPublic : project.isPublic
      });

      res.json({
        success: true,
        project: await this.getProjectWithFiles(project.id)
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }

  // Delete project
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await Project.findOne({
        where: { id, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Delete associated files first
      await File.destroy({ where: { projectId: id } });
      
      // Delete project
      await project.destroy();

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  // Fork/Clone project
  async forkProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name } = req.body;

      const originalProject = await this.getProjectWithFiles(id);
      
      if (!originalProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (!originalProject.isPublic && originalProject.userId !== userId) {
        return res.status(403).json({ error: 'Cannot fork private project' });
      }

      // Create new project
      const forkedProject = await Project.create({
        name: name || `${originalProject.name} (Fork)`,
        description: originalProject.description,
        userId,
        isPublic: false,
        template: originalProject.template,
        forkedFrom: originalProject.id
      });

      // Copy all files
      for (const file of originalProject.files) {
        await File.create({
          name: file.name,
          content: file.content,
          type: file.type,
          path: file.path,
          projectId: forkedProject.id
        });
      }

      res.status(201).json({
        success: true,
        project: await this.getProjectWithFiles(forkedProject.id)
      });
    } catch (error) {
      console.error('Fork project error:', error);
      res.status(500).json({ error: 'Failed to fork project' });
    }
  }

  // Helper methods
  async getProjectWithFiles(projectId) {
    return await Project.findByPk(projectId, {
      include: [{
        model: File,
        order: [['path', 'ASC'], ['name', 'ASC']]
      }]
    });
  }

  getDefaultFiles(template) {
    const templates = {
      vanilla: [
        {
          name: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app">
        <h1>Hello World!</h1>
        <p>Start building your project here.</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
          type: 'file',
          path: '/index.html'
        },
        {
          name: 'styles.css',
          content: `/* Add your styles here */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

#app {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    text-align: center;
}`,
          type: 'file',
          path: '/styles.css'
        },
        {
          name: 'script.js',
          content: `// Add your JavaScript here
console.log('Hello from Tutorials Dojo!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
});`,
          type: 'file',
          path: '/script.js'
        }
      ],
      react: [
        {
          name: 'App.js',
          content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>React Project</h1>
        <p>Start building your React app here!</p>
      </header>
    </div>
  );
}

export default App;`,
          type: 'file',
          path: '/src/App.js'
        },
        {
          name: 'App.css',
          content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}`,
          type: 'file',
          path: '/src/App.css'
        },
        {
          name: 'index.js',
          content: `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));`,
          type: 'file',
          path: '/src/index.js'
        }
      ]
    };

    return templates[template] || templates.vanilla;
  }
}

module.exports = new ProjectController();