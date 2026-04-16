const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Blog = sequelize.define(
    "Blog",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        thumbnail: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        summary: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT("long"),
            allowNull: false,
        },
        author: {
            type: DataTypes.STRING,
            defaultValue: "Admin",
        },
        views: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isPublished: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        metaTitle: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        metaDescription: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        metaKeywords: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = Blog;
