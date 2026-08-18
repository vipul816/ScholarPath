import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Course = sequelize.define('Course', {
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
    category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'General'
    },
    thumbnail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'https://via.placeholder.com/400x225/4F46E5/FFFFFF?text=Course'
    },
    duration: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Estimated duration (e.g., "8 weeks", "3 months")'
    },
    level: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        allowNull: false,
        defaultValue: 'Beginner'
    },
    instructorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    enrollmentOpen: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether new enrollments are accepted'
    }
}, {
    timestamps: true
});

export default Course;
