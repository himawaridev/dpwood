const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Address = sequelize.define(
    "Address",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        recipientName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fullAddress: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = Address;
