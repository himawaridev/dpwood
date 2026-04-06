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

module.exports = { getAddresses, createAddress };
