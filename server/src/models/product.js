const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Product = sequelize.define(
    "Product",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        price: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        imageUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        sku: {
            type: DataTypes.STRING(120),
            allowNull: true,
            unique: true,
        },
        gtin: {
            type: DataTypes.STRING(32),
            allowNull: true,
        },
        mpn: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        images: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        variants: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "cookware",
        },
        material: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        capacity: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        dimensions: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        weight: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        warranty: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        origin: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        packageContents: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        careInstructions: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        safetyInstructions: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        specifications: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
        },
        returnEligible: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        returnWindowDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 7,
        },
        dishwasherSafe: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        microwaveSafe: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        sold: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        rating: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: false,
            defaultValue: 0,
        },
        ratingCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = Product;
