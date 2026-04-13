const SupportTicket = require("../models/supportTicket");
const TicketMessage = require("../models/ticketMessage");
const User = require("../models/user"); // Model User của bạn

const supportController = {
    // 1. [CLIENT] Tạo yêu cầu hỗ trợ mới
    createTicket: async (req, res) => {
        try {
            const { topic, title, message, orderCode } = req.body;
            const ticketCode = `SP-${Math.floor(10000 + Math.random() * 90000)}`; // Tạo mã ngẫu nhiên

            // Tạo Ticket
            const ticket = await SupportTicket.create({
                ticketCode,
                userId: req.user.id,
                topic,
                title,
                orderCode: orderCode || null, // Xử lý an toàn nếu form gửi lên chuỗi rỗng
            });

            // Tạo tin nhắn đầu tiên của khách
            await TicketMessage.create({
                ticketId: ticket.id,
                senderId: req.user.id,
                message,
            });

            res.status(201).json(ticket);
        } catch (error) {
            // 🔴 ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT ĐỂ TÌM LỖI
            console.error("🔥 LỖI TẠO TICKET:", error);
            res.status(500).json({ message: "Lỗi tạo Ticket" });
        }
    },

    // 2. [CLIENT] Lấy danh sách Ticket của chính mình
    getMyTickets: async (req, res) => {
        try {
            const tickets = await SupportTicket.findAll({
                where: { userId: req.user.id },
                order: [["updatedAt", "DESC"]],
            });
            res.status(200).json(tickets);
        } catch (error) {
            res.status(500).json({ message: "Lỗi tải dữ liệu" });
        }
    },

    // 3. [ADMIN] Lấy tất cả Ticket
    getAllTickets: async (req, res) => {
        try {
            const tickets = await SupportTicket.findAll({
                include: [{ model: User, attributes: ["name", "email"] }], // Nhớ setup relationship
                order: [["createdAt", "DESC"]],
            });
            res.status(200).json(tickets);
        } catch (error) {
            res.status(500).json({ message: "Lỗi tải dữ liệu" });
        }
    },

    // 4. [CHUNG] Lấy chi tiết tin nhắn của 1 Ticket
    getTicketMessages: async (req, res) => {
        try {
            const messages = await TicketMessage.findAll({
                where: { ticketId: req.params.id },
                order: [["createdAt", "ASC"]],
            });
            res.status(200).json(messages);
        } catch (error) {
            res.status(500).json({ message: "Lỗi tải tin nhắn" });
        }
    },

    // 5. [CHUNG] Trả lời Ticket
    replyTicket: async (req, res) => {
        try {
            const { message } = req.body;
            const ticketId = req.params.id;
            const isAdmin = req.user.role === "admin" || req.user.role === "root";

            const newMessage = await TicketMessage.create({
                ticketId,
                senderId: req.user.id,
                isAdmin,
                message,
            });

            // Cập nhật trạng thái Ticket nếu Admin trả lời
            if (isAdmin) {
                await SupportTicket.update({ status: "PROCESSING" }, { where: { id: ticketId } });
            }

            // 🔴 PHÁT SÓNG TIN NHẮN REAL-TIME
            const io = req.app.get("io"); // Lấy đối tượng io đã set ở server.js
            if (io) {
                // Gửi tin nhắn mới tới tất cả các client đang lắng nghe "receive_message"
                io.emit("receive_message", newMessage);
            }

            res.status(201).json(newMessage); // Nên trả về newMessage thay vì chỉ message thành công
        } catch (error) {
            console.error("Lỗi gửi tin nhắn:", error);
            res.status(500).json({ message: "Lỗi gửi tin nhắn" });
        }
    },

    // 6. [ADMIN] Đổi trạng thái Ticket (Đã xong, Hủy...)
    updateStatus: async (req, res) => {
        try {
            await SupportTicket.update(
                { status: req.body.status },
                { where: { id: req.params.id } },
            );
            res.status(200).json({ message: "Cập nhật thành công" });
        } catch (error) {
            res.status(500).json({ message: "Lỗi cập nhật" });
        }
    },
};

module.exports = supportController;
