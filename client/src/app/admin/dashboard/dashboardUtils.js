import { getProductSalesStats } from "@/utils/productStats";

export const PERIOD_OPTIONS = [
    { label: "7 ngày", value: 7 },
    { label: "30 ngày", value: 30 },
    { label: "90 ngày", value: 90 },
    { label: "Tất cả", value: "all" },
];

export const STATUS_META = {
    PENDING: { label: "Chờ xử lý", color: "gold", chartColor: "#f5b544" },
    PAID: { label: "Đã thanh toán", color: "green", chartColor: "#22a06b" },
    SHIPPING: { label: "Đang giao", color: "blue", chartColor: "#4f8cff" },
    COMPLETED: { label: "Hoàn thành", color: "success", chartColor: "#15a46b" },
    CANCELED: { label: "Đã hủy", color: "red", chartColor: "#e5484d" },
};

const SUCCESS_STATUSES = new Set(["PAID", "SHIPPING", "COMPLETED"]);
const FINAL_STATUSES = new Set(["COMPLETED", "CANCELED"]);

export const compactNumber = (value) =>
    new Intl.NumberFormat("vi-VN", {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
    }).format(Number(value || 0));

export const normalizeStatus = (status = "") => String(status || "").toUpperCase();
export const getOrderAmount = (order) => Number(order?.totalAmount ?? order?.totalPrice ?? 0);

const isInsidePeriod = (dateValue, period) => {
    if (period === "all") return true;
    if (!dateValue) return false;

    const date = new Date(dateValue);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - Number(period) + 1);
    return date >= start;
};

const makeDateLabels = (period) => {
    const days = period === "all" ? 30 : Number(period);
    return Array.from({ length: days }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - index));
        return date.toLocaleDateString("vi-VN");
    });
};

export const buildDashboardData = (data, period) => {
    const ordersInPeriod = data.orders.filter((order) => isInsidePeriod(order.createdAt, period));
    const paidOrders = ordersInPeriod.filter((order) => SUCCESS_STATUSES.has(normalizeStatus(order.status)));
    const pendingOrders = ordersInPeriod.filter((order) => normalizeStatus(order.status) === "PENDING");
    const canceledOrders = ordersInPeriod.filter((order) => normalizeStatus(order.status) === "CANCELED");
    const activeUsers = data.users.filter((user) => !user.deletedAt);
    const lowStockProducts = data.products
        .filter((product) => Number(product.stock || 0) <= 10)
        .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
    const topProducts = [...data.products]
        .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
        .slice(0, 8);
    const hotProducts = data.products.filter((product) => getProductSalesStats(product).isHot);

    const revenue = paidOrders.reduce((sum, order) => sum + getOrderAmount(order), 0);
    const averageOrderValue = paidOrders.length ? revenue / paidOrders.length : 0;
    const completionBase = ordersInPeriod.filter((order) => !FINAL_STATUSES.has(normalizeStatus(order.status))).length;
    const processedOrders = ordersInPeriod.filter((order) => FINAL_STATUSES.has(normalizeStatus(order.status))).length;
    const processingRate = ordersInPeriod.length ? Math.round((processedOrders / ordersInPeriod.length) * 100) : 0;

    const chartMap = makeDateLabels(period).reduce((map, label) => {
        map[label] = { date: label.slice(0, 5), revenue: 0, orders: 0 };
        return map;
    }, {});

    ordersInPeriod.forEach((order) => {
        const key = new Date(order.createdAt).toLocaleDateString("vi-VN");
        if (!chartMap[key]) return;
        chartMap[key].orders += 1;
        if (SUCCESS_STATUSES.has(normalizeStatus(order.status))) {
            chartMap[key].revenue += getOrderAmount(order);
        }
    });

    const statusMap = ordersInPeriod.reduce((map, order) => {
        const status = normalizeStatus(order.status) || "UNKNOWN";
        map[status] = (map[status] || 0) + 1;
        return map;
    }, {});

    const statusData = Object.entries(statusMap).map(([status, value]) => ({
        status,
        name: STATUS_META[status]?.label || status,
        value,
        color: STATUS_META[status]?.chartColor || "#8c8c8c",
    }));

    return {
        ordersInPeriod,
        paidOrders,
        pendingOrders,
        canceledOrders,
        activeUsers,
        lowStockProducts,
        topProducts,
        hotProducts,
        revenue,
        averageOrderValue,
        processingRate,
        remainingWorkCount: completionBase,
        chartData: Object.values(chartMap),
        statusData,
    };
};
