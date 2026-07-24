const SupportTicket = require("../models/supportTicket");
const User = require("../models/user");

const TICKET_STATUSES = new Set(["PENDING", "PROCESSING", "RESOLVED", "CLOSED"]);

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
            description: String(message || "").trim(),
        });
        res.status(201).json(ticket);
    } catch (error) {
        console.error("🔥 LỖI TẠO TICKET:", error);
        res.status(500).json({ message: "Lỗi tạo Ticket", error: error.message });
    }
};

const getMyTickets = async (req, res) => {
    try {
        const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const query = {
            where: { userId: req.user.id },
            order: [["updatedAt", "DESC"]],
            ...(hasPagination ? { limit, offset: (page - 1) * limit } : { limit: 100 }),
        };
        if (!hasPagination) {
            return res.status(200).json(await SupportTicket.findAll(query));
        }
        const { rows, count } = await SupportTicket.findAndCountAll(query);
        return res.status(200).json({
            items: rows,
            pagination: { page, limit, total: count, totalPages: Math.max(1, Math.ceil(count / limit)) },
        });
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
        const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
        const query = {
            include: [{ model: User, attributes: ["name", "email"] }],
            order: [["createdAt", "DESC"]],
            ...(hasPagination ? { limit, offset: (page - 1) * limit } : { limit: 200 }),
        };
        if (!hasPagination) {
            return res.status(200).json(await SupportTicket.findAll(query));
        }
        const { rows, count } = await SupportTicket.findAndCountAll(query);
        return res.status(200).json({
            items: rows,
            pagination: { page, limit, total: count, totalPages: Math.max(1, Math.ceil(count / limit)) },
        });
    } catch (error) {
        console.error("Lỗi getAllTickets:", error);
        res.status(500).json({ message: "Lỗi tải dữ liệu", error: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const status = String(req.body.status || "").toUpperCase();
        if (!TICKET_STATUSES.has(status)) {
            return res.status(400).json({ message: "Trang thai ticket khong hop le" });
        }
        await SupportTicket.update({ status }, { where: { id: req.params.id } });
        res.status(200).json({ message: "Cập nhật thành công" });
    } catch (error) {
        console.error("Lỗi updateStatus:", error);
        res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
    }
};

const updateResolution = async (req, res) => {
    try {
        const ticket = await SupportTicket.findByPk(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Khong tim thay ticket" });
        const resolutionNote = String(req.body.resolutionNote || "").trim().slice(0, 5000);
        await ticket.update({
            resolutionNote: resolutionNote || null,
            handlerType: resolutionNote ? "ADMIN" : "NONE",
            lastHandledAt: resolutionNote ? new Date() : null,
            status: resolutionNote && ticket.status === "PENDING" ? "PROCESSING" : ticket.status,
        });
        res.status(200).json({ message: "Da luu ghi chu xu ly", ticket });
    } catch (error) {
        console.error("Loi updateResolution:", error);
        res.status(500).json({ message: "Khong the luu ghi chu xu ly", error: error.message });
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    getAllTickets,
    updateStatus,
    updateResolution,
};
