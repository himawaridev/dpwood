const express = require("express");
const cors = require("cors");
const { connectDB, sequelize } = require("./config/connectSequelize");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

// Models
const User = require("./models/user");
const AuditLog = require("./models/auditLog");
const Product = require("./models/product");
const Order = require("./models/order");
const OrderItem = require("./models/orderItem");
const Address = require("./models/address");
// Routers
const authRoutes = require("./routers/auth");
const userRoutes = require("./routers/user");
const productRoutes = require("./routers/product");
const orderRoutes = require("./routers/order");
const addressRoutes = require("./routers/address");
const notificationRoutes = require("./routers/notificationRoutes");

const app = express();

// ==========================================
// 1. CẤU HÌNH SOCKET.IO
// ==========================================
// Khởi tạo HTTP Server bọc lấy Express App
const server = http.createServer(app);

// Khởi tạo máy chủ Socket.io, cấu hình CORS để Frontend (port 3000) có thể gọi tới
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

// Tạo một Map (sổ ghi chép) để theo dõi userId nào đang dùng socketId nào
const userSockets = new Map();

io.on("connection", (socket) => {
    console.log("🟢 Một thiết bị kết nối Socket, ID:", socket.id);

    // Lắng nghe sự kiện báo danh từ Frontend gửi lên
    socket.on("register_user", (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`👤 User [${userId}] đang online với Socket ID [${socket.id}]`);
    });

    // Khi người dùng tắt tab trình duyệt hoặc mất mạng
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

// Chia sẻ biến io và userSockets cho toàn bộ app (để userController có thể lôi ra dùng)
app.set("io", io);
app.set("userSockets", userSockets);
// ==========================================

// ==========================================
// 2. CẤU HÌNH MIDDLEWARE & ROUTERS
// ==========================================
app.use(cors());
app.use(express.json());

// Khai báo quan hệ cơ sở dữ liệu
User.hasMany(AuditLog, { foreignKey: "userId" });
AuditLog.belongsTo(User, { foreignKey: "userId" });

// 1. Một User có thể có nhiều Order
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

// 2. Một Order có nhiều OrderItem (nhiều món hàng)
Order.hasMany(OrderItem, { foreignKey: "orderId" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

// 3. Một OrderItem đại diện cho một Product
Product.hasMany(OrderItem, { foreignKey: "productId" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

// Thêm quan hệ User - Address: 1 User có nhiều Address
User.hasMany(Address, { foreignKey: "userId" });
Address.belongsTo(User, { foreignKey: "userId" });

// Khai báo các đường dẫn API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/notifications", notificationRoutes);
// ==========================================

// ==========================================
// 3. KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync();

        // QUAN TRỌNG: Phải dùng server.listen thay vì app.listen
        server.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
            console.log(`⚡ Socket.io is ready to connect`);
        });
    } catch (error) {
        console.log("❌ Can't run server: ", error);
        process.exit(1);
    }
};

startServer();
