"use client";
import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Modal,
    Select,
    message,
    Typography,
    Tag,
    Descriptions,
    Image,
    Tabs,
    Input,
    Space,
} from "antd";
import { EyeOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    // States cho Modal Xem chi tiết
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
        // Cập nhật giao diện ngay lập tức cho mượt (Optimistic Update)
        setOrders((prevOrders) =>
            prevOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }

        try {
            // Gọi API lưu vào Database
            await api.put(`/orders/admin/${orderId}/status`, { status: newStatus });
            message.success("Cập nhật trạng thái thành công");
        } catch (error) {
            message.error("Lỗi cập nhật trạng thái, đang khôi phục dữ liệu...");
            fetchOrders(); // Nếu lỗi thì tải lại danh sách cũ
        }
    };

    const viewDetails = (record) => {
        setSelectedOrder(record);
        setIsDetailVisible(true);
    };

    const renderStatusTag = (status) => {
        switch (status) {
            case "PENDING":
                return <Tag color="warning">Chờ xử lý</Tag>;
            case "PAID":
                return <Tag color="processing">Đã thanh toán</Tag>;
            case "SHIPPING":
                return <Tag color="blue">Đang giao hàng</Tag>;
            case "COMPLETED":
                return <Tag color="success">Hoàn thành</Tag>;
            case "CANCELED":
                return <Tag color="error">Đã hủy</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    // Hàm lọc đơn hàng dùng chung cho Search và Tabs
    const getFilteredOrders = (statusFilter) => {
        let filtered = orders;

        // 1. Lọc theo trạng thái của Tab
        if (statusFilter !== "ALL") {
            if (statusFilter === "HISTORY") {
                filtered = filtered.filter(
                    (o) => o.status === "COMPLETED" || o.status === "CANCELED",
                );
            } else {
                filtered = filtered.filter((o) => o.status === statusFilter);
            }
        }

        // 2. Lọc theo từ khóa Tìm kiếm (Mã đơn, SĐT, Tên khách hàng)
        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            filtered = filtered.filter(
                (o) =>
                    o.orderCode?.toLowerCase().includes(lowerSearch) ||
                    o.shippingPhone?.includes(lowerSearch) ||
                    o.User?.name?.toLowerCase().includes(lowerSearch) ||
                    o.shippingName?.toLowerCase().includes(lowerSearch),
            );
        }

        return filtered;
    };

    const columns = [
        {
            title: "Mã Đơn",
            dataIndex: "orderCode",
            key: "orderCode",
            render: (code, record) => <Text code>{code || record.id?.substring(0, 8)}</Text>,
        },
        {
            title: "Khách hàng",
            key: "user",
            render: (_, record) => record.User?.name || "Khách vãng lai",
        },
        {
            title: "Ngày đặt",
            dataIndex: "createdAt",
            render: (date) => new Date(date).toLocaleString("vi-VN"),
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            render: (price) => (
                <Text type="danger" strong>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        price || 0,
                    )}
                </Text>
            ),
        },
        {
            title: "Thanh toán",
            dataIndex: "paymentMethod",
            render: (method) => <Tag color={method === "QR" ? "purple" : "default"}>{method}</Tag>,
        },
        { title: "Trạng thái", dataIndex: "status", render: (status) => renderStatusTag(status) },
        {
            title: "Cập nhật",
            key: "action",
            render: (_, record) => (
                <Select
                    value={record.status}
                    style={{ width: 140 }}
                    onChange={(val) => handleStatusChange(record.id, val)}
                    disabled={record.status === "CANCELED" || record.status === "COMPLETED"}
                >
                    <Select.Option value="PENDING">Chờ xử lý</Select.Option>
                    <Select.Option value="PAID">Đã thanh toán</Select.Option>
                    <Select.Option value="SHIPPING">Đang giao</Select.Option>
                    <Select.Option value="COMPLETED">Hoàn thành</Select.Option>
                    <Select.Option value="CANCELED">Hủy đơn</Select.Option>
                </Select>
            ),
        },
        {
            title: "Chi tiết",
            key: "details",
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => viewDetails(record)}
                    size="small"
                >
                    Xem
                </Button>
            ),
        },
    ];

    const tabItems = [
        {
            key: "ALL",
            label: "Tất cả",
            children: (
                <Table
                    dataSource={getFilteredOrders("ALL")}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                />
            ),
        },
        {
            key: "PENDING",
            label: "Chờ xử lý",
            children: (
                <Table
                    dataSource={getFilteredOrders("PENDING")}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                />
            ),
        },
        {
            key: "PAID",
            label: "Đã thanh toán (Cần giao)",
            children: (
                <Table
                    dataSource={getFilteredOrders("PAID")}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                />
            ),
        },
        {
            key: "SHIPPING",
            label: "Đang giao",
            children: (
                <Table
                    dataSource={getFilteredOrders("SHIPPING")}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                />
            ),
        },
        {
            key: "HISTORY",
            label: "Lịch sử (Xong/Hủy)",
            children: (
                <Table
                    dataSource={getFilteredOrders("HISTORY")}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
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
                            // Tự động tìm kiếm khi xóa hết text
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

            <Modal
                title={`Chi Tiết Đơn Hàng`}
                open={isDetailVisible}
                onCancel={() => setIsDetailVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsDetailVisible(false)}>
                        Đóng
                    </Button>,
                ]}
                width={700}
                destroyOnHidden
                mask={{ closable: false }}
            >
                {selectedOrder && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {/* Header của Modal */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "#fafafa",
                                padding: "12px 16px",
                                borderRadius: "8px",
                            }}
                        >
                            <div>
                                <Text type="secondary">Mã đơn: </Text>
                                <Text strong style={{ fontSize: "16px" }}>
                                    #{selectedOrder.orderCode}
                                </Text>
                            </div>
                            <div>{renderStatusTag(selectedOrder.status)}</div>
                        </div>

                        <Descriptions title="Thông tin giao hàng" bordered column={1} size="small">
                            <Descriptions.Item label="Người nhận">
                                <Text strong>{selectedOrder.shippingName}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                <Text copyable>{selectedOrder.shippingPhone}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ">
                                {selectedOrder.shippingAddress}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tài khoản đặt mua">
                                {selectedOrder.User?.email}
                            </Descriptions.Item>
                        </Descriptions>

                        <div>
                            <Title level={5}>Sản phẩm đã mua</Title>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                    marginTop: "16px",
                                }}
                            >
                                {selectedOrder.OrderItems?.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingBottom: "12px",
                                            borderBottom: "1px solid #f0f0f0",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "16px",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Image
                                                src={
                                                    item.Product?.imageUrl ||
                                                    "https://via.placeholder.com/50"
                                                }
                                                alt={item.Product?.name || "Hình ảnh sản phẩm"}
                                                width={50}
                                                height={50}
                                                style={{ objectFit: "cover", borderRadius: 4 }}
                                                preview={false}
                                            />
                                            <div>
                                                <Text strong>
                                                    {item.Product?.name || "Sản phẩm đã bị xóa"}
                                                </Text>
                                                <div
                                                    style={{
                                                        color: "#8c8c8c",
                                                        fontSize: "13px",
                                                        marginTop: "4px",
                                                    }}
                                                >
                                                    Số lượng: {item.quantity} | Giá lúc mua:{" "}
                                                    {new Intl.NumberFormat("vi-VN").format(
                                                        item.priceAtPurchase || 0,
                                                    )}
                                                    đ
                                                </div>
                                            </div>
                                        </div>
                                        <Text strong type="danger" style={{ fontSize: "16px" }}>
                                            {new Intl.NumberFormat("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                            }).format((item.priceAtPurchase || 0) * item.quantity)}
                                        </Text>
                                    </div>
                                ))}
                            </div>
                            <div style={{ textAlign: "right", marginTop: 16 }}>
                                <Title level={4}>
                                    Tổng cộng:{" "}
                                    <Text type="danger">
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(selectedOrder.totalAmount || 0)}
                                    </Text>
                                </Title>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
