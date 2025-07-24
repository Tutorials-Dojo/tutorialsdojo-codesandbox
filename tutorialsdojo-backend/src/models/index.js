const User = require('./User');
const Project = require('./Project');
const File = require('./File');

// Define associations
User.hasMany(Project, {
  foreignKey: 'userId',
  as: 'projects'
});

Project.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner'
});

Project.hasMany(File, {
  foreignKey: 'projectId',
  as: 'files'
});

File.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

// Self-referential association for forked projects
Project.belongsTo(Project, {
  foreignKey: 'forkedFromId',
  as: 'forkedFrom'
});

Project.hasMany(Project, {
  foreignKey: 'forkedFromId',
  as: 'forks'
});

module.exports = {
  User,
  Project,
  File
};