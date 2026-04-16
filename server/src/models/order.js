const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Order = sequelize.define(
    "Order",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        orderCode: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        totalAmount: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            defaultValue: "COD",
        },
        shippingName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        shippingPhone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        shippingAddress: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("PENDING", "PAID", "SHIPPING", "COMPLETED", "CANCELED"),
            defaultValue: "PENDING",
        },
    },
    {
        timestamps: true,
    },
);

module.exports = Order;
