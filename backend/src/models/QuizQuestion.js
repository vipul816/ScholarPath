import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuizQuestion = sequelize.define('QuizQuestion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quizId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'quizzes',
      key: 'id'
    }
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  questionType: {
    type: DataTypes.ENUM('mcq', 'short_answer', 'essay', 'true_false'),
    defaultValue: 'mcq',
    comment: 'Multiple choice, short answer, essay, true/false'
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of options for MCQ: ["opt1", "opt2", ...] or {a: "opt1", b: "opt2", ...}'
  },
  correctAnswer: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'For MCQ: index or letter; for short answer: exact answer or keyword list'
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Explanation shown after answer'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Question order in quiz'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  tableName: 'quiz_questions'
});

export default QuizQuestion;
