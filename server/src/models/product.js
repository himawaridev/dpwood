const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectSequelize").sequelize;

const Product = sequelize.define("Product", {
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
        type: DataTypes.DECIMAL(15, 2), // Lưu giá tiền (VD: 1000000.00)
        allowNull: false,
    },
    stock: {
        type: DataTypes.INTEGER, // Số lượng tồn kho
        allowNull: false,
        defaultValue: 0,
    },
    imageUrl: {
        type: DataTypes.STRING, // Link ảnh sản phẩm
        allowNull: true,
    },
});

module.exports = Product;
