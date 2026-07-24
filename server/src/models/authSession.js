const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const AuthSession = sequelize.define(
    "AuthSession",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        refreshTokenHash: {
            type: DataTypes.STRING(128),
            allowNull: false,
            unique: true,
        },
        deviceLabel: {
            type: DataTypes.STRING(160),
            allowNull: true,
        },
        ipAddress: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        lastUsedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        revokedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        indexes: [
            { fields: ["userId", "revokedAt", "lastUsedAt"] },
            { fields: ["expiresAt"] },
        ],
    },
);

module.exports = AuthSession;
