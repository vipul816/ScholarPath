import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Program = sequelize.define('Program', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    instituteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Institutes',
            key: 'id'
        }
    },
    duration: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Duration of program (e.g., "3 months", "6 weeks")'
    },
    level: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        allowNull: false,
        defaultValue: 'Beginner'
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'General'
    },
    thumbnail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'https://via.placeholder.com/400x225/6366F1/FFFFFF?text=Program'
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    enrollmentOpen: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether new enrollments are accepted'
    },
    maxEnrollments: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum number of students allowed. NULL means unlimited'
    },
    coordinator: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Name of the program coordinator/lead instructor'
    },
    instructors: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of instructor names/emails involved in the program'
    },
    syllabus: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed syllabus and course outline'
    },
    schedule: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Program schedule details (days, times, etc.)'
    }
}, {
    timestamps: true
});

export default Program;
