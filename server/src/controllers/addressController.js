const Address = require("../models/address");

const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.findAll({
            where: { userId: req.user.id },
            order: [
                ["isDefault", "DESC"],
                ["createdAt", "DESC"],
            ], // Mặc định xếp lên đầu
        });
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createAddress = async (req, res) => {
    try {
        const { recipientName, phoneNumber, fullAddress, isDefault } = req.body;

        // Nếu chọn làm mặc định, phải gỡ mặc định của các địa chỉ cũ
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
        res.status(500).json({ message: error.message });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Chỉ cho phép xóa nếu địa chỉ tồn tại và thuộc về user đang đăng nhập
        const address = await Address.findOne({
            where: { id: id, userId: userId },
        });

        if (!address) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy địa chỉ hoặc không có quyền xóa" });
        }

        await address.destroy();
        res.status(200).json({ message: "Xóa địa chỉ thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAddresses, createAddress, deleteAddress };
