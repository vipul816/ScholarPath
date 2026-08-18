import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ForumReply = sequelize.define('ForumReply', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'forum_posts',
      key: 'id',
      onDelete: 'CASCADE'
    }
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isMarkedAsAnswer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Instructor can mark a reply as the correct answer'
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'forum_replies'
});

export default ForumReply;
