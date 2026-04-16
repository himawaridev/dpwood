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
};

// ==========================================
// 2. HÀM CẤU HÌNH SOCKET.IO
// ==========================================
const setupSocketIO = () => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST", "PUT", "DELETE"],
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
app.use(cors());
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
