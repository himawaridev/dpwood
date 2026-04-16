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
            type: DataTypes.ENUM("PAYMENT", "ORDER", "ACCOUNT", "OTHER"),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("PENDING", "PROCESSING", "RESOLVED", "CLOSED"),
            defaultValue: "PENDING",
        },
    },
    {
        timestamps: true,
    },
);

module.exports = SupportTicket;
