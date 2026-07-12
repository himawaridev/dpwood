const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const SupportTicket = sequelize.define(
    "SupportTicket",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        ticketCode: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        orderCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        topic: {
            type: DataTypes.ENUM("PAYMENT", "ORDER", "PRODUCT", "ACCOUNT", "OTHER"),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        resolutionNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        handlerType: {
            type: DataTypes.ENUM("NONE", "ADMIN", "AI"),
            allowNull: false,
            defaultValue: "NONE",
        },
        lastHandledAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("PENDING", "PROCESSING", "RESOLVED", "CLOSED"),
            defaultValue: "PENDING",
        },
    },
    {
        timestamps: true,
        indexes: [
            { fields: ["userId", "createdAt"] },
            { fields: ["status", "createdAt"] },
            { fields: ["orderCode"] },
        ],
    },
);

module.exports = SupportTicket;
