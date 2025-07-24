const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  template: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'vanilla'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isForked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  forkedFromId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Projects',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  stars: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastAccessed: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['isPublic']
    },
    {
      fields: ['template']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Project;