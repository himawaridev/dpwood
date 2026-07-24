const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const CartRecovery = sequelize.define(
    "CartRecovery",
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.UUID, allowNull: false, unique: true },
        items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
        subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        lastActivityAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        lastRemindedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
        timestamps: true,
        indexes: [{ fields: ["lastActivityAt", "lastRemindedAt"] }],
    },
);

module.exports = CartRecovery;
