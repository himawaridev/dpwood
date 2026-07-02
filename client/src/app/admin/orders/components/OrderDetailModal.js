import React from "react";
import { Modal, Descriptions, Typography, Tag, Image, Button } from "antd";

const { Title, Text } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

export default function OrderDetailModal({ isVisible, onClose, selectedOrder }) {
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

    const getModalDescriptionItems = () => [
        {
            key: "1",
            label: "Người nhận",
            children: <Text strong>{selectedOrder?.shippingName || "-"}</Text>,
        },
        {
            key: "2",
            label: "Số điện thoại",
            children: selectedOrder?.shippingPhone ? <Text copyable>{selectedOrder.shippingPhone}</Text> : "-",
        },
        { key: "3", label: "Địa chỉ", children: selectedOrder?.shippingAddress || "-" },
        { key: "4", label: "Tài khoản", children: selectedOrder?.User?.email || selectedOrder?.user?.email || "-" },
    ];

    return (
        <Modal
            title="Chi tiết đơn hàng"
            open={isVisible}
            onCancel={onClose}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    Đóng
                </Button>,
            ]}
            width={760}
            destroyOnHidden
            mask={{ closable: false }}
        >
            {selectedOrder && (
                <div className="dp-admin-order-detail">
                    <div className="dp-admin-order-summary">
                        <div>
                            <Text type="secondary">Mã đơn: </Text>
                            <Text strong style={{ fontSize: 16 }}>
                                #{selectedOrder.orderCode}
                            </Text>
                        </div>
                        <div>{renderStatusTag(selectedOrder.status)}</div>
                    </div>

                    <Descriptions
                        title="Thông tin giao hàng"
                        bordered
                        column={1}
                        size="small"
                        items={getModalDescriptionItems()}
                    />

                    <div>
                        <Title level={5} style={{ marginBottom: 16 }}>
                            Sản phẩm đã mua
                        </Title>
                        <div className="dp-admin-order-items">
                            {selectedOrder.OrderItems && selectedOrder.OrderItems.length > 0 ? (
                                selectedOrder.OrderItems.map((item) => (
                                    <div key={item.id} className="dp-admin-order-item">
                                        <div className="dp-admin-order-product">
                                            <Image
                                                src={
                                                    item.Product?.imageUrl ||
                                                    item.Product?.image ||
                                                    "https://via.placeholder.com/60?text=No+Image"
                                                }
                                                alt={item.Product?.name || "Sản phẩm"}
                                                width={64}
                                                height={64}
                                                style={{ objectFit: "cover", border: "1px solid #e8e8e8" }}
                                                preview={{
                                                    src: item.Product?.imageUrl || item.Product?.image,
                                                }}
                                            />
                                            <div>
                                                <Text strong style={{ fontSize: 15 }}>
                                                    {item.Product?.name || "Sản phẩm đã bị xóa"}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                                                    Đơn giá: {formatCurrency(item.priceAtPurchase)}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                                                    Số lượng: <Text strong>{item.quantity}</Text>
                                                </Text>
                                            </div>
                                        </div>
                                        <Text strong style={{ fontSize: 16, color: "#cf1322" }}>
                                            {formatCurrency((item.priceAtPurchase || 0) * item.quantity)}
                                        </Text>
                                    </div>
                                ))
                            ) : (
                                <Text type="secondary" italic>
                                    Không có thông tin sản phẩm cho đơn hàng này.
                                </Text>
                            )}
                        </div>
                        <div className="dp-admin-order-total">
                            <Title level={4} style={{ margin: 0 }}>
                                Tổng cộng: <Text style={{ color: "#cf1322" }}>{formatCurrency(selectedOrder.totalAmount)}</Text>
                            </Title>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
