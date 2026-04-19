const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Coupon = sequelize.define(
    "Coupon",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        discountType: {
            type: DataTypes.ENUM("percent", "fixed"),
            allowNull: false,
            defaultValue: "percent",
        },
        discountValue: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        minOrderAmount: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false,
            defaultValue: 0,
        },
        maxDiscountAmount: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true,
        },
        usageLimit: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        usedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = Coupon;
