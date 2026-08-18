import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Certificate = sequelize.define('Certificate', {
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
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id'
    }
  },
  certificateNumber: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    comment: 'Unique certificate identifier'
  },
  issuedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  pdfUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  completionPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  gradesAcquired: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Average grade obtained'
  },
  certificateStatus: {
    type: DataTypes.ENUM('active', 'revoked'),
    defaultValue: 'active'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata like completion time, etc.'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'certificates'
});

export default Certificate;
