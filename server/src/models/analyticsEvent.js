const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const AnalyticsEvent = sequelize.define(
    "AnalyticsEvent",
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        eventName: {
            type: DataTypes.STRING(60),
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        sessionId: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        path: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        properties: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
        },
    },
    {
        timestamps: true,
        updatedAt: false,
        indexes: [
            { fields: ["eventName", "createdAt"] },
            { fields: ["userId", "createdAt"] },
            { fields: ["sessionId", "createdAt"] },
        ],
    },
);

module.exports = AnalyticsEvent;
