import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OAuthToken = sequelize.define('OAuthToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  provider: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'OAuth provider: google, github, etc.'
  },
  providerUserId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'User ID from the OAuth provider'
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'OAuth access token'
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional refresh token'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Token expiration time'
  },
  scope: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'OAuth scopes granted'
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
  tableName: 'oauth_tokens',
  indexes: [
    { unique: true, fields: ['userId', 'provider'] }
  ]
});

export default OAuthToken;
