import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Institute = sequelize.define('Institute', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true
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
    instituteType: {
        type: DataTypes.ENUM('college', 'university', 'training_centre', 'other'),
        allowNull: false,
        defaultValue: 'college'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    logo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    contactNumber: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    adminName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    adminEmail: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    adminPhone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Institute must be verified by platform admin before they can login'
    },
    rejectionComment: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    hooks: {
        // Hash password before creating institute
        beforeCreate: async (institute) => {
            if (institute.password) {
                const salt = await bcrypt.genSalt(10);
                institute.password = await bcrypt.hash(institute.password, salt);
            }
        },
        // Hash password before updating institute
        beforeUpdate: async (institute) => {
            if (institute.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                institute.password = await bcrypt.hash(institute.password, salt);
            }
        }
    }
});

// Instance method to compare passwords
Institute.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to hide password in JSON responses
Institute.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

export default Institute;
