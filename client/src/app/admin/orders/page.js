"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Typography, Tabs, Input, Space, Button, Badge, Flex } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import OrderTable from "./components/OrderTable";
import OrderDetailModal from "./components/OrderDetailModal";

const { Title, Text } = Typography;

export default function AdminOrdersPage() {
    const { message } = App.useApp();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/orders/admin");
            setOrders(res.data);
        } catch {
            message.error("Không thể lấy danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleStatusChange = async (orderId, newStatus) => {
        setOrders((prevOrders) =>
            prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
        );
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }

        try {
            await api.put(`/orders/admin/${orderId}/status`, { status: newStatus });
            message.success("Cập nhật trạng thái thành công");
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Lỗi cập nhật trạng thái";
            message.error(`Thất bại: ${errorMsg}`);
            fetchOrders();
        }
    };

    const viewDetails = (record) => {
        setSelectedOrder(record);
        setIsDetailVisible(true);
    };

    const getFilteredOrders = (statusFilter) => {
        let filtered = orders;

        if (statusFilter !== "ALL") {
            filtered =
                statusFilter === "HISTORY"
                    ? filtered.filter((order) => ["COMPLETED", "CANCELED"].includes(order.status))
                    : filtered.filter((order) => order.status === statusFilter);
        }

        if (searchText) {
            const lowerSearch = searchText.toLowerCase().trim();
            filtered = filtered.filter((order) => {
                const searchableFields = [
                    order.orderCode,
                    order.shippingPhone,
                    order.User?.name,
                    order.User?.email,
                    order.shippingName,
                ].map((field) => String(field || "").toLowerCase());

                return searchableFields.some((field) => field.includes(lowerSearch));
            });
        }

        return filtered;
    };

    const pendingCount = orders.filter((order) => order.status === "PENDING").length;

    const tabConfigs = [
        { key: "ALL", label: "Tất cả" },
        {
            key: "PENDING",
            label: (
                <Space size="small">
                    Chờ xử lý
                    <Badge count={pendingCount} style={{ backgroundColor: "#f09b90" }} />
                </Space>
            ),
        },
        { key: "PAID", label: "Đã thanh toán" },
        { key: "SHIPPING", label: "Đang giao" },
        { key: "HISTORY", label: "Lịch sử" },
    ];

    const tabItems = tabConfigs.map((tab) => ({
        key: tab.key,
        label: tab.label,
        children: (
            <OrderTable
                orders={getFilteredOrders(tab.key)}
                loading={loading}
                onStatusChange={handleStatusChange}
                onViewDetails={viewDetails}
            />
        ),
    }));

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }} wrap="wrap" gap={16}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        Quản lý đơn hàng
                    </Title>
                    <Text type="secondary">Theo dõi thanh toán, giao hàng và lịch sử xử lý đơn.</Text>
                </div>
                <Space wrap>
                    <Input.Search
                        placeholder="Tìm mã đơn, SĐT, tên..."
                        allowClear
                        onSearch={setSearchText}
                        onChange={(event) => {
                            if (!event.target.value) setSearchText("");
                        }}
                        style={{ width: 260 }}
                        enterButton={<SearchOutlined />}
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>
                        Làm mới
                    </Button>
                </Space>
            </Flex>

            <Tabs defaultActiveKey="ALL" items={tabItems} destroyInactiveTabPane />

            <OrderDetailModal
                isVisible={isDetailVisible}
                onClose={() => setIsDetailVisible(false)}
                selectedOrder={selectedOrder}
            />
        </>
    );
}
