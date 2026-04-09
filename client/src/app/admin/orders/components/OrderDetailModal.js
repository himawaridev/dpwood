import React from "react";
import { Modal, Descriptions, Typography, Tag, Image, Button } from "antd";

const { Title, Text } = Typography;

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
            children: <Text strong>{selectedOrder?.shippingName}</Text>,
        },
        {
            key: "2",
            label: "Số điện thoại",
            children: <Text copyable>{selectedOrder?.shippingPhone}</Text>,
        },
        { key: "3", label: "Địa chỉ", children: selectedOrder?.shippingAddress },
        { key: "4", label: "Tài khoản", children: selectedOrder?.User?.email },
    ];

    return (
        <Modal
            title="Chi Tiết Đơn Hàng"
            open={isVisible}
            onCancel={onClose}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    Đóng
                </Button>,
            ]}
            width={700}
            destroyOnHidden
            mask={{ closable: false }}
        >
            {selectedOrder && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {selectedOrder.OrderItems && selectedOrder.OrderItems.length > 0 ? (
                                selectedOrder.OrderItems.map((item) => (
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
                                                    item.Product?.image ||
                                                    "https://via.placeholder.com/60?text=No+Image"
                                                }
                                                alt={item.Product?.name || "Sản phẩm"}
                                                width={64}
                                                height={64}
                                                style={{
                                                    objectFit: "cover",
                                                    borderRadius: 8,
                                                    border: "1px solid #e8e8e8",
                                                }}
                                                preview={{
                                                    src:
                                                        item.Product?.imageUrl ||
                                                        item.Product?.image,
                                                }}
                                            />
                                            <div
                                                style={{ display: "flex", flexDirection: "column" }}
                                            >
                                                <Text strong style={{ fontSize: "15px" }}>
                                                    {item.Product?.name || "Sản phẩm đã bị xóa"}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: "13px" }}>
                                                    Đơn giá:{" "}
                                                    {new Intl.NumberFormat("vi-VN", {
                                                        style: "currency",
                                                        currency: "VND",
                                                    }).format(item.priceAtPurchase || 0)}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: "13px" }}>
                                                    Số lượng: <Text strong>{item.quantity}</Text>
                                                </Text>
                                            </div>
                                        </div>
                                        <Text strong style={{ fontSize: "16px", color: "#cf1322" }}>
                                            {new Intl.NumberFormat("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                            }).format((item.priceAtPurchase || 0) * item.quantity)}
                                        </Text>
                                    </div>
                                ))
                            ) : (
                                <Text type="secondary" italic>
                                    Không có thông tin sản phẩm cho đơn hàng này.
                                </Text>
                            )}
                        </div>
                        <div
                            style={{
                                textAlign: "right",
                                marginTop: 24,
                                padding: "16px",
                                background: "#fff2e8",
                                borderRadius: "8px",
                            }}
                        >
                            <Title level={4} style={{ margin: 0 }}>
                                Tổng cộng:{" "}
                                <Text style={{ color: "#cf1322" }}>
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
    );
}
