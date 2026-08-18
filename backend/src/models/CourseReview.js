import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CourseReview = sequelize.define('CourseReview', {
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
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Rating from 1 to 5 stars'
  },
  reviewText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether student has completed the course'
  },
  helpful: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of users who found this helpful'
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
  tableName: 'course_reviews',
  indexes: [
    { fields: ['courseId'] },
    { fields: ['studentId'] },
    { unique: true, fields: ['courseId', 'studentId'] }
  ]
});

export default CourseReview;
