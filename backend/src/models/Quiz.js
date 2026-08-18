import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Quiz = sequelize.define('Quiz', {
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
  autoGrade: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether to auto-grade the quiz'
  },
  passingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 70,
    comment: 'Minimum score to pass (percentage)'
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Time limit in minutes'
  },
  shuffleQuestions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  showAnswers: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Show correct answers after submission'
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Number of attempts allowed'
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
  tableName: 'quizzes'
});

export default Quiz;
