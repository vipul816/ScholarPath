import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProgramEnrollment = sequelize.define('ProgramEnrollment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    programId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Programs',
            key: 'id'
        }
    },
    progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'dropped'),
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['studentId', 'programId']
        }
    ]
});

export default ProgramEnrollment;
