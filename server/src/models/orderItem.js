const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const OrderItem = sequelize.define(
    "OrderItem",
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
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        priceAtPurchase: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = OrderItem;
