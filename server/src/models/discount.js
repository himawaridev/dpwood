const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Discount = sequelize.define(
    "Discount",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        code: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        percentage: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 100 },
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = Discount;
