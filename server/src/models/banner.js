const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Banner = sequelize.define(
    "Banner",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        eyebrow: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        title: {
            type: DataTypes.STRING(180),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        imageUrl: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        priceText: {
            type: DataTypes.STRING(80),
            allowNull: true,
        },
        buttonText: {
            type: DataTypes.STRING(80),
            allowNull: false,
            defaultValue: "XEM SẢN PHẨM",
        },
        buttonLink: {
            type: DataTypes.STRING(500),
            allowNull: false,
            defaultValue: "/products",
        },
        sortOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        timestamps: true,
        indexes: [
            { fields: ["isActive", "sortOrder"] },
            { unique: true, fields: ["sortOrder"] },
        ],
    },
);

module.exports = Banner;
