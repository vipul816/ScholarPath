import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Payment = sequelize.define('Payment', {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.CHAR(3),
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('stripe', 'paypal', 'credit_card'),
    allowNull: true
  },
  stripeSessionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  transactionId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  receiptUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'payments',
  indexes: [
    { fields: ['userId', 'courseId'] },
    { fields: ['status'] },
    { fields: ['stripeSessionId'] }
  ]
});

export default Payment;
