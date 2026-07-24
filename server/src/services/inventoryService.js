const InventoryMovement = require("../models/inventoryMovement");

const getVariantStock = (product, variantId) => {
    if (!variantId) return Number(product.stock || 0);
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variant = variants.find((item) => String(item.variantId) === String(variantId));
    return Number(variant?.stock || 0);
};

const recordMovement = async (
    {
        product,
        orderId = null,
        actorId = null,
        variantId = null,
        type,
        quantity,
        reference = null,
        note = null,
        idempotencyKey = null,
    },
    { transaction } = {},
) => {
    try {
        return await InventoryMovement.create(
            {
                productId: product.id,
                orderId,
                actorId,
                variantId,
                type,
                quantity: Number(quantity),
                stockAfter: getVariantStock(product, variantId),
                reference,
                note,
                idempotencyKey,
            },
            { transaction },
        );
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError" && idempotencyKey) {
            return InventoryMovement.findOne({ where: { idempotencyKey }, transaction });
        }
        throw error;
    }
};

module.exports = { recordMovement, getVariantStock };
