const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const InventoryMovement = sequelize.define(
    "InventoryMovement",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        actorId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        variantId: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        stockAfter: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reference: {
            type: DataTypes.STRING(160),
            allowNull: true,
        },
        note: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        idempotencyKey: {
            type: DataTypes.STRING(180),
            allowNull: true,
            unique: true,
        },
    },
    {
        timestamps: true,
        updatedAt: false,
        indexes: [
            { fields: ["productId", "createdAt"] },
            { fields: ["orderId", "createdAt"] },
        ],
    },
);

module.exports = InventoryMovement;
