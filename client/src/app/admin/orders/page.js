"use client";
import { useEffect, useState } from "react";
import { message, Typography, Tabs, Input, Space, Button, Badge } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

// 🔴 Import các Component đã bóc tách
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
            message.error("Lỗi cập nhật trạng thái, đang khôi phục dữ liệu...");
            fetchOrders();
        }
    };

    const viewDetails = (record) => {
        setSelectedOrder(record);
        setIsDetailVisible(true);
    };

    // Bộ lọc dữ liệu
    const getFilteredOrders = (statusFilter) => {
        let filtered = orders;

        if (statusFilter !== "ALL") {
            if (statusFilter === "HISTORY") {
                filtered = filtered.filter(
                    (o) => o.status === "COMPLETED" || o.status === "CANCELED",
                );
            } else {
                filtered = filtered.filter((o) => o.status === statusFilter);
            }
        }

        if (searchText) {
            // Loại bỏ khoảng trắng thừa ở đầu/cuối từ khóa tìm kiếm
            const lowerSearch = searchText.toLowerCase().trim();

            filtered = filtered.filter((o) => {
                // 🔴 ÉP KIỂU VỀ STRING: Đảm bảo không bị lỗi nếu orderCode hay phone là dạng Số (Number)
                const orderCode = String(o.orderCode || "").toLowerCase();
                const phone = String(o.shippingPhone || "").toLowerCase();
                const customerName = String(o.User?.name || "").toLowerCase();
                const customerEmail = String(o.User?.email || "").toLowerCase(); // Bổ sung tìm kiếm Email
                const shipName = String(o.shippingName || "").toLowerCase();

                return (
                    orderCode.includes(lowerSearch) ||
                    phone.includes(lowerSearch) ||
                    customerName.includes(lowerSearch) ||
                    customerEmail.includes(lowerSearch) ||
                    shipName.includes(lowerSearch)
                );
            });
        }

        return filtered;
    };

    // 🔴 TÍNH TOÁN SỐ LƯỢNG ĐƠN HÀNG MỚI ĐỂ HIỂN THỊ CHẤM ĐỎ
    const pendingCount = orders.filter((o) => o.status === "PENDING").length;

    // 🔴 Cấu trúc Tabs gọn gàng tái sử dụng 1 component OrderTable
    const tabItems = [
        {
            key: "ALL",
            label: "Tất cả",
            children: (
                <OrderTable
                    orders={getFilteredOrders("ALL")}
                    loading={loading}
                    onStatusChange={handleStatusChange}
                    onViewDetails={viewDetails}
                />
            ),
        },
        {
            key: "PENDING",
            // 🔴 HIỂN THỊ NÚT ĐỎ BÁO ĐƠN MỚI
            label: (
                <Space size="small">
                    Chờ xử lý
                    <Badge count={pendingCount} style={{ backgroundColor: "#ff4d4f" }} />
                </Space>
            ),
            children: (
                <OrderTable
                    orders={getFilteredOrders("PENDING")}
                    loading={loading}
                    onStatusChange={handleStatusChange}
                    onViewDetails={viewDetails}
                />
            ),
        },
        {
            key: "PAID",
            label: "Đã thanh toán",
            children: (
                <OrderTable
                    orders={getFilteredOrders("PAID")}
                    loading={loading}
                    onStatusChange={handleStatusChange}
                    onViewDetails={viewDetails}
                />
            ),
        },
        {
            key: "SHIPPING",
            label: "Đang giao",
            children: (
                <OrderTable
                    orders={getFilteredOrders("SHIPPING")}
                    loading={loading}
                    onStatusChange={handleStatusChange}
                    onViewDetails={viewDetails}
                />
            ),
        },
        {
            key: "HISTORY",
            label: "Lịch sử",
            children: (
                <OrderTable
                    orders={getFilteredOrders("HISTORY")}
                    loading={loading}
                    onStatusChange={handleStatusChange}
                    onViewDetails={viewDetails}
                />
            ),
        },
    ];

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
                        onSearch={(value) => setSearchText(value)}
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

            {/* Render Tabs */}
            <Tabs defaultActiveKey="ALL" items={tabItems} />

            {/* Render Modal */}
            <OrderDetailModal
                isVisible={isDetailVisible}
                onClose={() => setIsDetailVisible(false)}
                selectedOrder={selectedOrder}
            />
        </>
    );
}
