const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const ReturnRequest = sequelize.define(
    "ReturnRequest",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "REQUESTED",
        },
        reason: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        images: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        refundAmount: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false,
            defaultValue: 0,
        },
        resolutionNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        reviewedById: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        reviewedAt: DataTypes.DATE,
        receivedAt: DataTypes.DATE,
        completedAt: DataTypes.DATE,
    },
    {
        timestamps: true,
        indexes: [
            { fields: ["userId", "createdAt"] },
            { fields: ["orderId", "status"] },
            { fields: ["status", "createdAt"] },
        ],
    },
);

module.exports = ReturnRequest;
