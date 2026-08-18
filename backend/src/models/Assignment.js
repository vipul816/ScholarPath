import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  maxScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  rubric: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Grading rubric as JSON: { criteria: [{ name, weight, maxPoints }] }'
  },
  submissionType: {
    type: DataTypes.ENUM('file', 'text', 'url'),
    defaultValue: 'file'
  },
  allowLateSubmission: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'assignments'
});

export default Assignment;
