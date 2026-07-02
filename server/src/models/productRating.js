const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const ProductRating = sequelize.define(
    "ProductRating",
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
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        rating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
    },
    {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["userId", "productId"],
            },
        ],
    },
);

module.exports = ProductRating;
