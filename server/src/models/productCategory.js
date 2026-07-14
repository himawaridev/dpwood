const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const ProductCategory = sequelize.define(
    "ProductCategory",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        value: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        label: {
            type: DataTypes.STRING(160),
            allowNull: false,
        },
        imageUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        sortOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        timestamps: true,
        indexes: [{ fields: ["isActive", "sortOrder"] }],
    },
);

module.exports = ProductCategory;
