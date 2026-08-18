import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('student', 'instructor', 'institute'),
        allowNull: false,
        defaultValue: 'student'
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    educationDetails: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    institutionalDetails: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    areaOfInterest: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    certificatesEarned: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // Will be set to false for instructors during signup
    },
    // Instructor-specific fields
    qualification: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    experience: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    profession: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    instructorSummary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    resumePath: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    rejectionComment: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    hooks: {
        // Hash password before creating user
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        // Hash password before updating user
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to compare passwords
User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to hide password in JSON responses
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

export default User;
