const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectSequelize").sequelize;

const Order = sequelize.define("Order", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Thêm mã đơn hàng ngắn (6 số) để dùng cho chuyển khoản
    orderCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    totalAmount: {
        type: DataTypes.DECIMAL(15, 0),
        allowNull: false,
    },
    paymentMethod: {
        type: DataTypes.STRING,
        defaultValue: "COD", // COD hoặc QR
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "PENDING", // PENDING (Chờ thanh toán/Giao hàng), PAID (Đã trả tiền), CANCELED (Đã hủy)
    },
    shippingName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    shippingPhone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    shippingAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

module.exports = Order;
