const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { connectDB, sequelize } = require("./config/connectSequelize");
const { securityHeaders, generalLimiter } = require("./middlewares/securityMiddleware");
const { optimizeDatabase } = require("./services/databaseOptimizationService");
const { scheduleDataRetention } = require("./services/dataRetentionService");

// Tách riêng file nạp Models để server.js sạch sẽ hơn
const User = require("./models/user");
const AuditLog = require("./models/auditLog");
const Product = require("./models/product");
const Order = require("./models/order");
const OrderItem = require("./models/orderItem");
const Address = require("./models/address");
const Notification = require("./models/notification");
const SupportTicket = require("./models/supportTicket");
const Blog = require("./models/blog");
const Coupon = require("./models/coupon");
const UserCoupon = require("./models/userCoupon");
const ProductRating = require("./models/productRating");
const Wishlist = require("./models/wishlist");
require("./models/productCategory");

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
const dbState = {
    status: "starting",
    ready: false,
    lastError: null,
    lastCheckedAt: null,
};
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 60000);
const DB_REQUEST_WAIT_MS = Number(process.env.DB_REQUEST_WAIT_MS || 15000);
const QR_EXPIRATION_SWEEP_MS = Number(process.env.QR_EXPIRATION_SWEEP_MS || 60000);
let resolveDatabaseReady;
const databaseReadyPromise = new Promise((resolve) => {
    resolveDatabaseReady = resolve;
});
let qrExpirationSweepTimer = null;
app.set("trust proxy", 1);

const scheduleQrExpirationSweep = () => {
    if (qrExpirationSweepTimer) return;
    const runSweep = () => {
        const { expireStaleQrOrders } = require("./controllers/orderController");
        void expireStaleQrOrders().catch((error) => {
            console.warn("QR expiration sweep failed:", error.message);
        });
    };

    setTimeout(runSweep, 5000);
    qrExpirationSweepTimer = setInterval(runSweep, QR_EXPIRATION_SWEEP_MS);
    qrExpirationSweepTimer.unref?.();
};

const normalizeOrigin = (value = "") => String(value).trim().replace(/\/$/, "");
const configuredOrigins = [process.env.CLIENT_URL, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean);
const allowedOrigins = new Set([
    "https://dpwood.store",
    "https://www.dpwood.store",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...configuredOrigins,
]);
const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
            return callback(null, true);
        }
        return callback(new Error(`CORS origin is not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    optionsSuccessStatus: 204,
};

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

    // Quan hệ User - Wishlist - Product
    User.hasMany(Wishlist, { foreignKey: "userId", onDelete: "CASCADE" });
    Wishlist.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

    Product.hasMany(Wishlist, { foreignKey: "productId", onDelete: "CASCADE" });
    Wishlist.belongsTo(Product, { foreignKey: "productId", onDelete: "CASCADE" });
};

// ==========================================
// 2. HÀM CẤU HÌNH SOCKET.IO
// ==========================================
const setupSocketIO = () => {
    const io = new Server(server, {
        cors: corsOptions,
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
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(generalLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Kích hoạt các cấu hình
setupDatabaseAssociations();
setupSocketIO();

app.get("/api/health", async (req, res) => {
    const payload = {
        ok: true,
        timestamp: new Date().toISOString(),
    };

    if (req.query.deep === "true") {
        if (!dbState.ready) {
            payload.ok = false;
            payload.database = dbState.status;
            return res.status(503).json(payload);
        }
        try {
            await sequelize.query("SELECT 1");
            payload.database = "ready";
        } catch (error) {
            payload.ok = false;
            payload.database = "unavailable";
            return res.status(503).json(payload);
        }
    }

    if (process.env.NODE_ENV !== "production") {
        payload.service = "dpwood-api";
        payload.uptime = Math.round(process.uptime());
        payload.database = dbState.status;
    }

    res.status(200).json(payload);
});

app.use(async (req, res, next) => {
    const dbIndependentPaths = [
        "/api/health",
        "/api/ai/image-proxy",
        "/api/ai/product-image-placeholder",
        "/api/ai/sample-product-image",
        "/api/orders/webhook",
    ];

    if (dbIndependentPaths.includes(req.path) || dbState.ready) return next();

    await Promise.race([
        databaseReadyPromise,
        new Promise((resolve) => setTimeout(resolve, DB_REQUEST_WAIT_MS)),
    ]);

    if (dbState.ready) return next();

    return res.status(503).json({
        ok: false,
        message: "Database is initializing. Please try again shortly.",
        database: dbState.status,
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

app.use((error, req, res, next) => {
    if (!error) return next();

    if (error.type === "entity.too.large") {
        return res.status(413).json({ message: "Request body is too large" });
    }

    if (error instanceof SyntaxError && "body" in error) {
        return res.status(400).json({ message: "Invalid JSON body" });
    }

    console.error("Unhandled request error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
});

// ==========================================
// 4. KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

const initializeDatabase = async () => {
    try {
        dbState.status = "connecting";
        dbState.lastCheckedAt = new Date().toISOString();
        dbState.lastError = null;

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
            const tableDesc = await queryInterface.describeTable("users");
            if (!tableDesc.emailVerifySentAt) {
                await queryInterface.addColumn("users", "emailVerifySentAt", {
                    type: DataTypes.DATE,
                    allowNull: true,
                });
                console.log("Added emailVerifySentAt column to users via QueryInterface");
            }
        } catch (e) {
            console.log("QueryInterface users check skipped:", e.message);
        }

        try {
            const tableDesc = await queryInterface.describeTable("Blogs");
            if (tableDesc.thumbnail && !String(tableDesc.thumbnail.type || "").toUpperCase().includes("TEXT")) {
                await queryInterface.changeColumn("Blogs", "thumbnail", {
                    type: DataTypes.TEXT,
                    allowNull: true,
                });
                console.log("Changed Blogs.thumbnail to TEXT via QueryInterface");
            }
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
            if (!tableDesc.paymentExpiresAt) {
                await queryInterface.addColumn("Orders", "paymentExpiresAt", {
                    type: DataTypes.DATE,
                    allowNull: true,
                });
                console.log("Added paymentExpiresAt column to Orders via QueryInterface");
            }
            if (!tableDesc.paymentData) {
                await queryInterface.addColumn("Orders", "paymentData", {
                    type: DataTypes.JSON,
                    allowNull: true,
                });
                console.log("Added paymentData column to Orders via QueryInterface");
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
            if (!tableDesc.isActive) {
                await queryInterface.addColumn("Products", "isActive", {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                });
                console.log("Added isActive column to Products via QueryInterface");
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

        await optimizeDatabase(sequelize);

        dbState.ready = true;
        dbState.status = "ready";
        dbState.lastCheckedAt = new Date().toISOString();
        resolveDatabaseReady();
        scheduleDataRetention();
        scheduleQrExpirationSweep();
        console.log("✅ Database is ready");
    } catch (error) {
        dbState.ready = false;
        dbState.status = "unavailable";
        dbState.lastCheckedAt = new Date().toISOString();
        dbState.lastError = error.message;
        console.error("❌ Database initialization failed:", error.message);
        console.log(`🔁 Retrying database initialization in ${Math.round(DB_RETRY_DELAY_MS / 1000)}s`);
        setTimeout(initializeDatabase, DB_RETRY_DELAY_MS);
    }
};

const startServer = () => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`⚡ Socket.io is ready to connect`);
        initializeDatabase();
    });
};

startServer();
