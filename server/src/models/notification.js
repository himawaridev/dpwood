const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Notification = sequelize.define(
    "Notification",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("info", "success", "warning", "error"),
            defaultValue: "info",
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = Notification;
