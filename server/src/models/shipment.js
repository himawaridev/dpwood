const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Shipment = sequelize.define(
    "Shipment",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        carrier: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        service: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        trackingCode: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "READY",
        },
        shippingFee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false,
            defaultValue: 0,
        },
        estimatedDeliveryAt: DataTypes.DATE,
        shippedAt: DataTypes.DATE,
        deliveredAt: DataTypes.DATE,
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
        },
    },
    {
        timestamps: true,
        indexes: [
            { fields: ["trackingCode"] },
            { fields: ["status", "updatedAt"] },
        ],
    },
);

module.exports = Shipment;
