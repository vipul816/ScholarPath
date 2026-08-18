import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InstructorInstitute = sequelize.define('InstructorInstitute', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    instructorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    instituteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Institutes',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Institute admin must approve instructors joining'
    },
    joinedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['instructorId', 'instituteId']
        }
    ]
});

export default InstructorInstitute;
