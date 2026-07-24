const toValidSortOrder = (value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
};

const planBannerSortOrderRepairs = (rows = []) => {
    const reservedOrders = new Set();
    const ownerByOrder = new Map();

    for (const row of rows) {
        const sortOrder = toValidSortOrder(row?.sortOrder);
        if (sortOrder === null || ownerByOrder.has(sortOrder)) continue;
        ownerByOrder.set(sortOrder, String(row.id));
        reservedOrders.add(sortOrder);
    }

    let nextAvailableOrder = 1;
    const repairs = [];

    for (const row of rows) {
        const currentOrder = toValidSortOrder(row?.sortOrder);
        const ownsCurrentOrder =
            currentOrder !== null && ownerByOrder.get(currentOrder) === String(row.id);

        if (ownsCurrentOrder) continue;

        while (reservedOrders.has(nextAvailableOrder)) nextAvailableOrder += 1;
        repairs.push({ id: row.id, sortOrder: nextAvailableOrder });
        reservedOrders.add(nextAvailableOrder);
        nextAvailableOrder += 1;
    }

    return repairs;
};

module.exports = {
    planBannerSortOrderRepairs,
};
