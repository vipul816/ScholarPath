import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  assignmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'assignments',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'For text submissions'
  },
  fileUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'For file submissions'
  },
  submissionDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isLate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  grade: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Score out of maxScore'
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Instructor feedback'
  },
  rubricScores: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Scores for each rubric criterion'
  },
  gradedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  gradedAt: {
    type: DataTypes.DATE,
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
  tableName: 'submissions'
});

export default Submission;
