const { sequelize } = require("../config/connectSequelize");
const Product = require("../models/product");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const AuditLog = require("../models/auditLog");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail"); // 🔴 Import hàm gửi mail

// --- HÀM HỖ TRỢ: TẠO GIAO DIỆN EMAIL HTML ---
const generateOrderHtml = (orderInfo, orderItems, isPaid) => {
    const itemsHtml = orderItems
        .map(
            (item) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #cf1322;">
                ${new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)}₫
            </td>
        </tr>
    `,
        )
        .join("");

    const statusBadge = isPaid
        ? `<span style="background: #52c41a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">ĐÃ THANH TOÁN (QR)</span>`
        : `<span style="background: #1677ff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">CHỜ THANH TOÁN KHI NHẬN HÀNG (COD)</span>`;

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #001529; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">DPWOOD</h1>
                <p style="margin: 5px 0 0 0; color: #aaa;">Xác nhận đơn hàng #${orderInfo.orderCode}</p>
            </div>
            
            <div style="padding: 20px;">
                <p>Xin chào <strong>${orderInfo.customerName}</strong>,</p>
                <p>Cảm ơn bạn đã mua sắm tại DPWOOD. Đơn hàng của bạn đã được ghi nhận thành công!</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Thông tin giao hàng:</h3>
                    <p style="margin: 5px 0;"><strong>Người nhận:</strong> ${orderInfo.shippingName} - ${orderInfo.shippingPhone}</p>
                    <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${orderInfo.shippingAddress}</p>
                    <p style="margin: 5px 0;"><strong>Trạng thái:</strong> ${statusBadge}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #fafafa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Sản phẩm</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">SL</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Tổng thanh toán:</td>
                            <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #cf1322;">
                                ${new Intl.NumberFormat("vi-VN").format(orderInfo.totalAmount)}₫
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                    Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua hotline hoặc email hỗ trợ.<br/>
                    Trân trọng,<br/>Đội ngũ DPWOOD.
                </p>
            </div>
        </div>
    `;
};

// --- 1. HÀM TẠO ĐƠN HÀNG ---
const checkout = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { items, paymentMethod, shippingInfo } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email; // Đảm bảo middleware auth đã gắn email vào req.user

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống" });
        }

        let totalAmount = 0;
        const orderItemsData = [];
        const emailItemsInfo = []; // Mảng riêng để chứa Tên SP phục vụ cho Email

        // 1. Kiểm tra tồn kho & trừ tồn kho
        for (const item of items) {
            const product = await Product.findByPk(item.productId, {
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            if (!product) throw new Error(`Sản phẩm không tồn tại`);
            if (product.stock < item.quantity)
                throw new Error(`"${product.name}" chỉ còn ${product.stock} kiện.`);

            totalAmount += product.price * item.quantity;
            product.stock -= item.quantity;
            await product.save({ transaction: t });

            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                priceAtPurchase: product.price,
            });

            // Lưu tên SP để gửi mail
            emailItemsInfo.push({
                name: product.name,
                quantity: item.quantity,
                price: product.price,
            });
        }

        // 2. Tạo mã đơn hàng ngẫu nhiên 6 số
        const orderCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Tạo Đơn hàng
        const order = await Order.create(
            {
                userId,
                orderCode,
                totalAmount,
                paymentMethod: paymentMethod || "COD",
                status: "PENDING",
                shippingName: shippingInfo?.recipientName,
                shippingPhone: shippingInfo?.phoneNumber,
                shippingAddress: shippingInfo?.fullAddress,
            },
            { transaction: t },
        );

        const orderItemsWithOrderId = orderItemsData.map((item) => ({
            ...item,
            orderId: order.id,
        }));
        await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction: t });

        // 4. Ghi Log đặt hàng
        await AuditLog.create(
            {
                userId,
                action: "ORDER_CREATED",
                details: `Tạo đơn hàng #${orderCode} - Phương thức: ${paymentMethod} - Tổng: ${new Intl.NumberFormat("vi-VN").format(totalAmount)}đ`,
            },
            { transaction: t },
        );

        await t.commit(); // ✅ CHỐT DATABASE TRƯỚC KHI GỬI MAIL

        // 🔴 5. GỬI EMAIL NẾU LÀ COD
        // Nếu là QR, ta chờ Webhook xác nhận có tiền mới gửi
        if (paymentMethod === "COD") {
            const orderInfo = {
                orderCode: order.orderCode,
                customerName: req.user.name || "Quý khách",
                shippingName: order.shippingName,
                shippingPhone: order.shippingPhone,
                shippingAddress: order.shippingAddress,
                totalAmount: order.totalAmount,
            };

            const emailHtml = generateOrderHtml(orderInfo, emailItemsInfo, false);
            // Hàm này chạy ngầm, không block thời gian trả response
            sendEmail(userEmail, `[DPWOOD] Xác nhận đặt hàng thành công #${orderCode}`, emailHtml);
        }

        res.status(200).json({
            message: "Đặt hàng thành công!",
            orderId: order.id,
            orderCode: order.orderCode,
        });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

// --- 2. HÀM ĐÓN TÍN HIỆU TỪ NGÂN HÀNG (WEBHOOK) ---
const handleWebhook = async (req, res) => {
    res.status(200).json({ success: true });

    try {
        const { amount, content, transactionId } = req.body;
        const match = content.match(/DPWOOD(\d{6})/i);
        if (!match) return;

        const orderCode = match[1];

        // 🔴 Lấy thêm thông tin User và các Món hàng để gửi Email
        const order = await Order.findOne({
            where: { orderCode, status: "PENDING" },
            include: [
                { model: User, attributes: ["email", "name"] }, // Cần setup relationship trong models
            ],
        });

        if (!order) return;

        if (Number(amount) >= Number(order.totalAmount)) {
            order.status = "PAID";
            await order.save();
            const items = await OrderItem.findAll({ where: { orderId: order.id } });

            for (const item of items) {
                const product = await Product.findByPk(item.productId);
                if (product) {
                    product.sold += item.quantity; // Cộng dồn số lượng vừa mua
                    await product.save();
                }
            }

            await AuditLog.create({
                userId: order.userId,
                action: "PAYMENT_RECEIVED",
                details: `Hệ thống tự động xác nhận đã nhận ${new Intl.NumberFormat("vi-VN").format(amount)}đ cho đơn hàng #${orderCode}. Mã GD: ${transactionId}`,
            });

            console.log(`✅ [WEBHOOK] Đã tự động xác nhận thanh toán cho đơn hàng ${orderCode}`);

            // 🔴 GỬI EMAIL KHI NHẬN ĐƯỢC TIỀN
            if (order.User && order.User.email) {
                // Truy xuất danh sách sản phẩm của đơn hàng
                const items = await OrderItem.findAll({
                    where: { orderId: order.id },
                    include: [{ model: Product, attributes: ["name"] }],
                });

                const emailItemsInfo = items.map((i) => ({
                    name: i.Product ? i.Product.name : "Sản phẩm",
                    quantity: i.quantity,
                    price: i.priceAtPurchase,
                }));

                const orderInfo = {
                    orderCode: order.orderCode,
                    customerName: order.User.name,
                    shippingName: order.shippingName,
                    shippingPhone: order.shippingPhone,
                    shippingAddress: order.shippingAddress,
                    totalAmount: order.totalAmount,
                };

                const emailHtml = generateOrderHtml(orderInfo, emailItemsInfo, true);
                sendEmail(
                    order.User.email,
                    `[DPWOOD] Thanh toán thành công đơn hàng #${orderCode}`,
                    emailHtml,
                );
            }
        } else {
            console.log(`❌ [WEBHOOK] Đơn hàng ${orderCode} chuyển thiếu tiền`);
        }
    } catch (error) {
        console.error("Lỗi khi xử lý Webhook:", error);
    }
};

// ... CÁC HÀM CÒN LẠI GIỮ NGUYÊN ...
// --- 3. KIỂM TRA TRẠNG THÁI ĐƠN HÀNG ---
const getOrderStatus = async (req, res) => {
    try {
        const { orderCode } = req.params;
        const order = await Order.findOne({ where: { orderCode } });
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        res.json({ status: order.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 4. HỦY ĐƠN HÀNG VÀ HOÀN LẠI TỒN KHO ---
const cancelOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { orderCode } = req.params;
        const order = await Order.findOne({
            where: { orderCode, status: "PENDING" },
            transaction: t,
        });

        if (!order) throw new Error("Không thể hủy đơn hàng này");

        // Tìm các món hàng trong đơn và cộng lại tồn kho
        const items = await OrderItem.findAll({ where: { orderId: order.id }, transaction: t });
        for (const item of items) {
            const product = await Product.findByPk(item.productId, {
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            if (product) {
                product.stock += item.quantity;
                await product.save({ transaction: t });
            }
        }

        // Cập nhật trạng thái thành CANCELED
        order.status = "CANCELED";
        await order.save({ transaction: t });

        // Ghi Log
        await AuditLog.create(
            {
                userId: req.user.id,
                action: "ORDER_CANCELED",
                details: `Khách hàng hủy thanh toán đơn #${orderCode}, đã hoàn lại tồn kho.`,
            },
            { transaction: t },
        );

        await t.commit();
        res.json({ message: "Đã hủy giao dịch" });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

// --- 5. LẤY TOÀN BỘ ĐƠN HÀNG (DÀNH CHO ADMIN) ---
const getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, attributes: ["name", "email"] },
                {
                    model: OrderItem,
                    include: [{ model: Product, attributes: ["name", "imageUrl"] }],
                },
            ],
            order: [["createdAt", "DESC"]], // Đơn mới nhất xếp lên đầu
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 6. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (DÀNH CHO ADMIN) ---
const updateOrderStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findByPk(id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        if (status === "CANCELED" && order.status !== "CANCELED") {
            const items = await OrderItem.findAll({ where: { orderId: order.id } });
            for (const item of items) {
                const product = await Product.findByPk(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        order.status = status;
        await order.save();

        await AuditLog.create({
            userId: req.user.id,
            action: "ADMIN_UPDATE_ORDER",
            details: `Admin cập nhật đơn #${order.orderCode} sang trạng thái ${status}`,
        });

        res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// [GET] Lấy lịch sử đơn hàng của cá nhân
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json(orders);
    } catch (error) {
        console.error("Lỗi getMyOrders:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

module.exports = {
    checkout,
    handleWebhook,
    getOrderStatus,
    cancelOrder,
    getAllOrdersAdmin,
    updateOrderStatusAdmin,
    getMyOrders,
};
