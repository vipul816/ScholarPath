import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Discussion = sequelize.define('Discussion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Courses',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Discussions',
            key: 'id'
        },
        comment: 'If null, this is a top-level query. If set, this is a reply.'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: true
});

// Self-referential association for replies
Discussion.hasMany(Discussion, { as: 'replies', foreignKey: 'parentId' });
Discussion.belongsTo(Discussion, { as: 'parent', foreignKey: 'parentId' });

export default Discussion;
