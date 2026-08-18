import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ClassNotes = sequelize.define('ClassNotes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    classId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Classes',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    instructorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    noteContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Text notes taken during class'
    },
    whiteboardData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Canvas drawing data as JSON or image data URL'
    },
    whiteboardImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL to saved whiteboard image'
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Summary of what was covered in class'
    }
}, {
    timestamps: true
});

export default ClassNotes;
