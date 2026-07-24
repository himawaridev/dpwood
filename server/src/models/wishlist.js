const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Wishlist = sequelize.define(
    "Wishlist",
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
        priceWhenAdded: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        lastNotifiedPrice: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
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

module.exports = Wishlist;
