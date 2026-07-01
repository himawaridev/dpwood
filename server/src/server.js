const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { connectDB, sequelize } = require("./config/connectSequelize");

// Tách riêng file nạp Models để server.js sạch sẽ hơn
const User = require("./models/user");
const AuditLog = require("./models/auditLog");
const Product = require("./models/product");
const Order = require("./models/order");
const OrderItem = require("./models/orderItem");
const Address = require("./models/address");
const Notification = require("./models/notification");
const SupportTicket = require("./models/supportTicket");
const TicketMessage = require("./models/ticketMessage");
const Blog = require("./models/blog");
const Coupon = require("./models/coupon");
const UserCoupon = require("./models/userCoupon");

// Routers
const authRoutes = require("./routers/auth");
const userRoutes = require("./routers/user");
const productRoutes = require("./routers/product");
const orderRoutes = require("./routers/order");
const addressRoutes = require("./routers/address");
const notificationRoutes = require("./routers/notificationRoutes");
const supportRoutes = require("./routers/supportRoutes");
const blogRoutes = require("./routers/blogRoutes");
const uploadRoutes = require("./routers/uploadRoutes");
const couponRoutes = require("./routers/couponRoutes");
const discountRoutes = require("./routers/discountRoutes");

const app = express();
const server = http.createServer(app);

// ==========================================
// 1. HÀM CẤU HÌNH DATABASE ASSOCIATIONS
// ==========================================
const setupDatabaseAssociations = () => {
    // Quan hệ User - AuditLog
    User.hasMany(AuditLog, { foreignKey: "userId" });
    AuditLog.belongsTo(User, { foreignKey: "userId" });

    // Quan hệ User - Order - OrderItem - Product
    User.hasMany(Order, { foreignKey: "userId" });
    Order.belongsTo(User, { foreignKey: "userId" });

    Order.hasMany(OrderItem, { foreignKey: "orderId" });
    OrderItem.belongsTo(Order, { foreignKey: "orderId" });

    Product.hasMany(OrderItem, { foreignKey: "productId" });
    OrderItem.belongsTo(Product, { foreignKey: "productId" });

    // Quan hệ User - Address
    User.hasMany(Address, { foreignKey: "userId" });
    Address.belongsTo(User, { foreignKey: "userId" });

    // Quan hệ User - SupportTicket - TicketMessage
    User.hasMany(SupportTicket, { foreignKey: "userId" });
    SupportTicket.belongsTo(User, { foreignKey: "userId" });

    SupportTicket.hasMany(TicketMessage, { foreignKey: "ticketId" });
    TicketMessage.belongsTo(SupportTicket, { foreignKey: "ticketId" });

    // Quan hệ User - UserCoupon - Coupon
    User.hasMany(UserCoupon, { foreignKey: "userId" });
    UserCoupon.belongsTo(User, { foreignKey: "userId" });

    Coupon.hasMany(UserCoupon, { foreignKey: "couponId" });
    UserCoupon.belongsTo(Coupon, { foreignKey: "couponId" });
};

// ==========================================
// 2. HÀM CẤU HÌNH SOCKET.IO
// ==========================================
const setupSocketIO = () => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true,
        },
    });

    const userSockets = new Map();

    io.on("connection", (socket) => {
        console.log("🟢 Một thiết bị kết nối Socket, ID:", socket.id);

        socket.on("register_user", (userId) => {
            userSockets.set(userId, socket.id);
            console.log(`👤 User [${userId}] đang online với Socket ID [${socket.id}]`);
        });

        socket.on("disconnect", () => {
            for (let [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log(`🔴 User [${userId}] đã ngắt kết nối`);
                    break;
                }
            }
        });
    });

    app.set("io", io);
    app.set("userSockets", userSockets);
};

// ==========================================
// 3. KHỞI CHẠY MIDDLEWARE & ROUTERS
// ==========================================
// app.use(cors({
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     credentials: true,
// }));
const allowedOrigins = process.env.CLIENT_URL 
    ? process.env.CLIENT_URL.split(',') 
    : ["http://localhost:3000"];

app.use(cors({
    origin: allowedOrigins, // Truyền hẳn một danh sách (mảng) vào đây
    credentials: true,
}));
app.use(express.json());

// Kích hoạt các cấu hình
setupDatabaseAssociations();
setupSocketIO();

// Kích hoạt Routers
const routes = {
    "/api/auth": authRoutes,
    "/api/users": userRoutes,
    "/api/products": productRoutes,
    "/api/orders": orderRoutes,
    "/api/addresses": addressRoutes,
    "/api/notifications": notificationRoutes,
    "/api/support": supportRoutes,
    "/api/blogs": blogRoutes,
    "/api/upload": uploadRoutes,
    "/api/coupons": couponRoutes,
    "/api/discounts": discountRoutes,
};

Object.entries(routes).forEach(([path, route]) => {
    app.use(path, route);
});

// ==========================================
// 4. KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync();

        // Safely add missing columns using QueryInterface for TiDB to avoid UNIQUE constraint sync crash
        const queryInterface = sequelize.getQueryInterface();
        const { DataTypes } = require("sequelize");

        try {
            const tableDesc = await queryInterface.describeTable("Addresses");
            if (!tableDesc.email) {
                await queryInterface.addColumn("Addresses", "email", { type: DataTypes.STRING, allowNull: true });
                console.log("Added email column to Addresses via QueryInterface");
            }
        } catch (e) {
            console.log("QueryInterface Addresses check skipped:", e.message);
        }

        try {
            const tableDesc = await queryInterface.describeTable("Blogs");
            if (!tableDesc.comments) {
                await queryInterface.addColumn("Blogs", "comments", { type: DataTypes.JSON, allowNull: true });
                console.log("Added comments column to Blogs via QueryInterface");
            }
        } catch (e) {
            console.log("QueryInterface Blogs check skipped:", e.message);
        }

        try {
            const tableDesc = await queryInterface.describeTable("Orders");
            if (!tableDesc.couponCode) {
                await queryInterface.addColumn("Orders", "couponCode", { type: DataTypes.STRING, allowNull: true });
                console.log("Added couponCode column to Orders via QueryInterface");
            }
            if (!tableDesc.discountCode) {
                await queryInterface.addColumn("Orders", "discountCode", { type: DataTypes.STRING, allowNull: true });
                console.log("Added discountCode column to Orders via QueryInterface");
            }
            if (!tableDesc.discountAmount) {
                await queryInterface.addColumn("Orders", "discountAmount", {
                    type: DataTypes.DECIMAL(15, 0),
                    allowNull: false,
                    defaultValue: 0,
                });
                console.log("Added discountAmount column to Orders via QueryInterface");
            }
        } catch (e) {
            console.log("QueryInterface Orders check skipped:", e.message);
        }

        server.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
            console.log(`⚡ Socket.io is ready to connect`);
        });
    } catch (error) {
        console.error("❌ Can't run server: ", error);
        process.exit(1);
    }
};

startServer();
