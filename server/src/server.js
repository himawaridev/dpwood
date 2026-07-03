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
const ProductRating = require("./models/productRating");

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
const aiRoutes = require("./routers/aiRoutes");

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

    // Quan hệ User - ProductRating - Product
    User.hasMany(ProductRating, { foreignKey: "userId" });
    ProductRating.belongsTo(User, { foreignKey: "userId" });

    Product.hasMany(ProductRating, { foreignKey: "productId" });
    ProductRating.belongsTo(Product, { foreignKey: "productId" });
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

app.get("/api/health", (req, res) => {
    res.status(200).json({
        ok: true,
        service: "dpwood-api",
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

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
    "/api/ai": aiRoutes,
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

        try {
            const tableDesc = await queryInterface.describeTable("Products");
            if (tableDesc.imageUrl && !String(tableDesc.imageUrl.type || "").toUpperCase().includes("TEXT")) {
                await queryInterface.changeColumn("Products", "imageUrl", {
                    type: DataTypes.TEXT,
                    allowNull: true,
                });
                console.log("Changed Products.imageUrl to TEXT via QueryInterface");
            }
            if (!tableDesc.category) {
                await queryInterface.addColumn("Products", "category", {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: "cookware",
                });
                console.log("Added category column to Products via QueryInterface");
            }
            if (!tableDesc.material) {
                await queryInterface.addColumn("Products", "material", { type: DataTypes.STRING, allowNull: true });
                console.log("Added material column to Products via QueryInterface");
            }
            if (!tableDesc.color) {
                await queryInterface.addColumn("Products", "color", { type: DataTypes.STRING, allowNull: true });
                console.log("Added color column to Products via QueryInterface");
            }
            if (!tableDesc.brand) {
                await queryInterface.addColumn("Products", "brand", { type: DataTypes.STRING, allowNull: true });
                console.log("Added brand column to Products via QueryInterface");
            }
            if (!tableDesc.capacity) {
                await queryInterface.addColumn("Products", "capacity", { type: DataTypes.STRING, allowNull: true });
                console.log("Added capacity column to Products via QueryInterface");
            }
            if (!tableDesc.warranty) {
                await queryInterface.addColumn("Products", "warranty", { type: DataTypes.STRING, allowNull: true });
                console.log("Added warranty column to Products via QueryInterface");
            }
            if (!tableDesc.origin) {
                await queryInterface.addColumn("Products", "origin", { type: DataTypes.STRING, allowNull: true });
                console.log("Added origin column to Products via QueryInterface");
            }
            if (!tableDesc.dishwasherSafe) {
                await queryInterface.addColumn("Products", "dishwasherSafe", {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                });
                console.log("Added dishwasherSafe column to Products via QueryInterface");
            }
            if (!tableDesc.microwaveSafe) {
                await queryInterface.addColumn("Products", "microwaveSafe", {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                });
                console.log("Added microwaveSafe column to Products via QueryInterface");
            }
            if (!tableDesc.rating) {
                await queryInterface.addColumn("Products", "rating", {
                    type: DataTypes.DECIMAL(3, 2),
                    allowNull: false,
                    defaultValue: 0,
                });
                console.log("Added rating column to Products via QueryInterface");
            }
            if (!tableDesc.ratingCount) {
                await queryInterface.addColumn("Products", "ratingCount", {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                });
                console.log("Added ratingCount column to Products via QueryInterface");
            }
            if (!tableDesc.variants) {
                await queryInterface.addColumn("Products", "variants", {
                    type: DataTypes.JSON,
                    allowNull: true,
                    defaultValue: [],
                });
                console.log("Added variants column to Products via QueryInterface");
            }
        } catch (e) {
            console.log("QueryInterface Products check skipped:", e.message);
        }

        try {
            const tableDesc = await queryInterface.describeTable("OrderItems");
            if (!tableDesc.variantId) {
                await queryInterface.addColumn("OrderItems", "variantId", { type: DataTypes.STRING, allowNull: true });
                console.log("Added variantId column to OrderItems via QueryInterface");
            }
            if (!tableDesc.variantLabel) {
                await queryInterface.addColumn("OrderItems", "variantLabel", { type: DataTypes.STRING, allowNull: true });
                console.log("Added variantLabel column to OrderItems via QueryInterface");
            }
            if (!tableDesc.variantSnapshot) {
                await queryInterface.addColumn("OrderItems", "variantSnapshot", {
                    type: DataTypes.JSON,
                    allowNull: true,
                });
                console.log("Added variantSnapshot column to OrderItems via QueryInterface");
            }
        } catch (e) {
            console.log("QueryInterface OrderItems check skipped:", e.message);
        }

        try {
            const tableDesc = await queryInterface.describeTable("Coupons");
            if (!tableDesc.sourceDiscountId) {
                await queryInterface.addColumn("Coupons", "sourceDiscountId", {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                });
                console.log("Added sourceDiscountId column to Coupons via QueryInterface");
            }
        } catch (e) {
            console.log("QueryInterface Coupons check skipped:", e.message);
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
