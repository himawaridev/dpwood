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
        paymentStatus: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "UNPAID",
        },
        fulfillmentStatus: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "UNFULFILLED",
        },
        shippingFee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false,
            defaultValue: 0,
        },
        idempotencyKey: {
            type: DataTypes.STRING(180),
            allowNull: true,
            unique: true,
        },
        stockReservedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        stockReservationExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        paymentExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        paymentData: {
            type: DataTypes.JSON,
            allowNull: true,
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
        couponCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("PENDING", "PAID", "SHIPPING", "COMPLETED", "CANCELED"),
            defaultValue: "PENDING",
        },
        discountCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        discountAmount: {
            type: DataTypes.DECIMAL(15, 0),
            defaultValue: 0,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = Order;
