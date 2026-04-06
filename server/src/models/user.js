const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                is: /^[0-9]{10,11}$/i,
            },
        },
        role: {
            type: DataTypes.ENUM("root", "admin", "user", "seller"),
            defaultValue: "user",
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        }, // email verify
        emailVerifyToken: {
            type: DataTypes.STRING,
        },
        refreshToken: {
            type: DataTypes.STRING,
        }, // lưu refresh token
        resetPasswordToken: {
            type: DataTypes.STRING,
        }, // forgot password
        resetPasswordExpires: {
            type: DataTypes.DATE,
        },
        loginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        }, // rate limit
        lockUntil: {
            type: DataTypes.DATE,
        }, // khóa tài khoản tạm thời
    },
    {
        tableName: "users",
        timestamps: true,
    },
);

module.exports = User;
