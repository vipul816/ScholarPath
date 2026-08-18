import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const VideoMetadata = sequelize.define('VideoMetadata', {
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
    },
    unique: true
  },
  originalFileName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  originalFileSize: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Size in bytes'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds'
  },
  hlsPlaylistUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'URL to the .m3u8 HLS playlist'
  },
  thumbnailUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Video thumbnail/preview image'
  },
  subtitlesAvailable: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of available subtitle languages: ["en", "es", "fr"]'
  },
  qualityOptions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Available quality levels: ["360p", "480p", "720p", "1080p"]'
  },
  transcodeStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  transcodeProgress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Percentage complete (0-100)'
  },
  transcodeError: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'video_metadata'
});

export default VideoMetadata;
