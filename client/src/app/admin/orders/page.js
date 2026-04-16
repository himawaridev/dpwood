"use client";
import { useEffect, useState } from "react";
import { message, Typography, Tabs, Input, Space, Button, Badge } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

import OrderTable from "./components/OrderTable";
import OrderDetailModal from "./components/OrderDetailModal";

const { Title } = Typography;

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get("/orders/admin");
            setOrders(res.data);
        } catch (error) {
            message.error("Không thể lấy danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        setOrders((prevOrders) =>
            prevOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
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
                    ? filtered.filter((o) => ["COMPLETED", "CANCELED"].includes(o.status))
                    : filtered.filter((o) => o.status === statusFilter);
        }

        if (searchText) {
            const lowerSearch = searchText.toLowerCase().trim();
            filtered = filtered.filter((o) => {
                // Gom các trường cần tìm kiếm vào một mảng để check cho gọn
                const searchableFields = [
                    o.orderCode,
                    o.shippingPhone,
                    o.User?.name,
                    o.User?.email,
                    o.shippingName,
                ].map((field) => String(field || "").toLowerCase());

                return searchableFields.some((field) => field.includes(lowerSearch));
            });
        }

        return filtered;
    };

    const pendingCount = orders.filter((o) => o.status === "PENDING").length;

    const tabConfigs = [
        { key: "ALL", label: "Tất cả" },
        {
            key: "PENDING",
            label: (
                <Space size="small">
                    Chờ xử lý
                    <Badge count={pendingCount} style={{ backgroundColor: "#ff4d4f" }} />
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
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Quản Lý Đơn Hàng
                </Title>
                <Space>
                    <Input.Search
                        placeholder="Tìm mã đơn, SĐT, tên..."
                        allowClear
                        onSearch={setSearchText}
                        onChange={(e) => {
                            if (!e.target.value) setSearchText("");
                        }}
                        style={{ width: 250 }}
                        enterButton={<SearchOutlined />}
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>
                        Làm mới
                    </Button>
                </Space>
            </div>

            <Tabs defaultActiveKey="ALL" items={tabItems} />

            <OrderDetailModal
                isVisible={isDetailVisible}
                onClose={() => setIsDetailVisible(false)}
                selectedOrder={selectedOrder}
            />
        </>
    );
}
