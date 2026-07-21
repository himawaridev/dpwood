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
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        images: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        isVerifiedPurchase: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        source: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "CUSTOMER",
            validate: {
                isIn: [["CUSTOMER", "ADMIN"]],
            },
        },
        managedById: {
            type: DataTypes.UUID,
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
            {
                fields: ["productId", "updatedAt"],
            },
        ],
    },
);

module.exports = ProductRating;
