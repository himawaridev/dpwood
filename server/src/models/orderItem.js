const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectSequelize").sequelize;

const OrderItem = sequelize.define("OrderItem", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    priceAtPurchase: {
        type: DataTypes.DECIMAL(15, 2), // Rất quan trọng: Lưu lại giá lúc mua để tránh việc sau này Admin đổi giá làm sai lịch sử
        allowNull: false,
    },
});

module.exports = OrderItem;
