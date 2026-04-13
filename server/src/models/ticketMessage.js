const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const TicketMessage = sequelize.define(
    "TicketMessage",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        ticketId: { type: DataTypes.INTEGER, allowNull: false },
        senderId: { type: DataTypes.UUID, allowNull: false },
        isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false }, // Đánh dấu tin nhắn của Admin
        message: { type: DataTypes.TEXT, allowNull: false },
        attachmentUrl: { type: DataTypes.STRING, allowNull: true }, // Link ảnh bill/lỗi
    },
    { timestamps: true },
);

module.exports = TicketMessage;
