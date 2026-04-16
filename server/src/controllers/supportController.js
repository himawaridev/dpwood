const SupportTicket = require("../models/supportTicket");
const TicketMessage = require("../models/ticketMessage");
const User = require("../models/user");

// ==========================================
// [CLIENT] YÊU CẦU HỖ TRỢ
// ==========================================
const createTicket = async (req, res) => {
    try {
        const { topic, title, message, orderCode } = req.body;
        const ticketCode = `SP-${Math.floor(10000 + Math.random() * 90000)}`;

        const ticket = await SupportTicket.create({
            ticketCode,
            userId: req.user.id,
            topic,
            title,
            orderCode: orderCode || null,
        });

        await TicketMessage.create({ ticketId: ticket.id, senderId: req.user.id, message });
        res.status(201).json(ticket);
    } catch (error) {
        console.error("🔥 LỖI TẠO TICKET:", error);
        res.status(500).json({ message: "Lỗi tạo Ticket", error: error.message });
    }
};

const getMyTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.findAll({
            where: { userId: req.user.id },
            order: [["updatedAt", "DESC"]],
        });
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Lỗi getMyTickets:", error);
        res.status(500).json({ message: "Lỗi tải dữ liệu", error: error.message });
    }
};

// ==========================================
// [ADMIN] QUẢN LÝ YÊU CẦU
// ==========================================
const getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.findAll({
            include: [{ model: User, attributes: ["name", "email"] }],
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Lỗi getAllTickets:", error);
        res.status(500).json({ message: "Lỗi tải dữ liệu", error: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        await SupportTicket.update({ status: req.body.status }, { where: { id: req.params.id } });
        res.status(200).json({ message: "Cập nhật thành công" });
    } catch (error) {
        console.error("Lỗi updateStatus:", error);
        res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
    }
};

// ==========================================
// [CHUNG] TIN NHẮN REAL-TIME
// ==========================================
const getTicketMessages = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const messages = await TicketMessage.findAll({
            where: { ticketId: req.params.id },
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        });
        res.status(200).json(messages.reverse());
    } catch (error) {
        console.error("Lỗi getTicketMessages:", error);
        res.status(500).json({ message: "Lỗi tải tin nhắn", error: error.message });
    }
};

const replyTicket = async (req, res) => {
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

        if (isAdmin) {
            await SupportTicket.update({ status: "PROCESSING" }, { where: { id: ticketId } });
        }

        const io = req.app.get("io");
        if (io) io.emit("receive_message", newMessage);

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Lỗi replyTicket:", error);
        res.status(500).json({ message: "Lỗi gửi tin nhắn", error: error.message });
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    getAllTickets,
    updateStatus,
    getTicketMessages,
    replyTicket,
};
