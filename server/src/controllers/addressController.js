const Address = require("../models/address");

// ==========================================
// [CLIENT] QUẢN LÝ ĐỊA CHỈ
// ==========================================

const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.findAll({
            where: { userId: req.user.id },
            order: [
                ["isDefault", "DESC"],
                ["createdAt", "DESC"],
            ],
        });
        res.status(200).json(addresses);
    } catch (error) {
        console.error("Lỗi getAddresses:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi lấy địa chỉ", error: error.message });
    }
};

const createAddress = async (req, res) => {
    try {
        const { recipientName, phoneNumber, fullAddress, isDefault } = req.body;

        if (isDefault) {
            await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
        }

        const newAddress = await Address.create({
            userId: req.user.id,
            recipientName,
            phoneNumber,
            fullAddress,
            isDefault,
        });
        res.status(201).json(newAddress);
    } catch (error) {
        console.error("Lỗi createAddress:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi tạo địa chỉ", error: error.message });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const address = await Address.findOne({ where: { id: id, userId: req.user.id } });

        if (!address) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy địa chỉ hoặc không có quyền xóa" });
        }

        await address.destroy();
        res.status(200).json({ message: "Xóa địa chỉ thành công" });
    } catch (error) {
        console.error("Lỗi deleteAddress:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi xóa địa chỉ", error: error.message });
    }
};

module.exports = { getAddresses, createAddress, deleteAddress };
