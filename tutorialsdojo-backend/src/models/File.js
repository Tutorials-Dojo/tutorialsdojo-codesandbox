const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const File = sequelize.define('File', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '/'
  },
  type: {
    type: DataTypes.ENUM('file', 'directory'),
    allowNull: false,
    defaultValue: 'file'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  size: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Projects',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['projectId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['path']
    },
    {
      unique: true,
      fields: ['projectId', 'name', 'path']
    }
  ],
  hooks: {
    beforeSave: (file) => {
      if (file.content && file.type === 'file') {
        file.size = Buffer.byteLength(file.content, 'utf8');
      }
    }
  }
});

module.exports = File;