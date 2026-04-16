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
            allowNull: false,
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
        },
        emailVerifyToken: {
            type: DataTypes.STRING,
        },
        refreshToken: {
            type: DataTypes.STRING,
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
