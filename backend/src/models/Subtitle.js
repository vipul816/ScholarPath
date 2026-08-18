import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Subtitle = sequelize.define('Subtitle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  videoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Materials',
      key: 'id'
    }
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Language code: en, es, fr, etc.'
  },
  languageName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Human readable language: English, Spanish, French'
  },
  fileUrl: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'URL to the subtitle file'
  },
  format: {
    type: DataTypes.ENUM('srt', 'vtt', 'json'),
    defaultValue: 'vtt',
    comment: 'Subtitle file format (SRT, VTT, or custom JSON)'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'subtitles',
  indexes: [
    { unique: true, fields: ['videoId', 'language'] }
  ]
});

export default Subtitle;
