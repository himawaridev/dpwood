const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");
const { ROLES } = require("../config/accessControl");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: "unique_username_index",
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: "unique_email_index",
            validate: {
                isEmail: true,
            },
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            validate: {
                is: /^[0-9]{10,11}$/i,
            },
        },
        role: {
            type: DataTypes.ENUM(...Object.values(ROLES)),
            defaultValue: "user",
        },
        authProvider: {
            type: DataTypes.ENUM("local", "google", "telegram"),
            defaultValue: "local",
        },
        googleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        telegramId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        emailVerifyToken: {
            type: DataTypes.STRING,
        },
        emailVerifySentAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        refreshToken: {
            type: DataTypes.STRING,
        },
        twoFactorEnabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        twoFactorCodeHash: {
            type: DataTypes.STRING(128),
            allowNull: true,
        },
        twoFactorExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        resetPasswordToken: {
            type: DataTypes.STRING,
        },
        resetPasswordExpires: {
            type: DataTypes.DATE,
        },
        loginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        lockUntil: {
            type: DataTypes.DATE,
        },
    },
    {
        tableName: "users",
        timestamps: true,
        paranoid: true,
    },
);

module.exports = User;
