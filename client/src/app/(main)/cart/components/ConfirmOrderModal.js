import React from "react";
import { Modal, Descriptions, Divider, Table, Flex, Typography, Tag, Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function ConfirmOrderModal({
    isConfirmModalVisible,
    setIsConfirmModalVisible,
    confirmOrder,
    loading,
    selectedAddress,
    paymentMethod,
    cartItems,
    totalPrice,
}) {
    const descriptionItems = [
        {
            key: "recipient",
            label: "Người nhận",
            children: <Text strong>{selectedAddress?.recipientName}</Text>,
        },
        {
            key: "phone",
            label: "Số điện thoại",
            children: <Text strong>{selectedAddress?.phoneNumber}</Text>,
        },
        {
            key: "payment",
            label: "Phương thức",
            children: (
                <Tag color={paymentMethod === "COD" ? "blue" : "cyan"}>
                    {paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : "QR PayOS"}
                </Tag>
            ),
        },
        {
            key: "address",
            label: "Địa chỉ giao",
            children: <Text strong>{selectedAddress?.fullAddress}</Text>,
        },
    ];

    return (
        <Modal
            title={
                <span style={{ fontSize: 18, color: "var(--dp-ink)" }}>
                    <InfoCircleOutlined style={{ color: "var(--dp-primary)", marginRight: 8 }} />
                    Xác nhận thông tin đơn hàng
                </span>
            }
            open={isConfirmModalVisible}
            onOk={confirmOrder}
            confirmLoading={loading}
            onCancel={() => setIsConfirmModalVisible(false)}
            okText="Chốt đơn hàng"
            cancelText="Quay lại kiểm tra"
            width={860}
            centered
        >
            <div style={{ padding: "10px 0" }}>
                <Descriptions title="Giao hàng" bordered size="small" column={1} items={descriptionItems} />

                <Divider titlePlacement="left" style={{ marginTop: 24 }}>
                    Sản phẩm đã chọn
                </Divider>
                <Table
                    dataSource={cartItems}
                    pagination={false}
                    size="small"
                    scroll={{ y: 240 }}
                    rowKey="productId"
                    columns={[
                        { title: "Tên sản phẩm", dataIndex: "name" },
                        { title: "SL", dataIndex: "quantity", width: 60, align: "center" },
                        {
                            title: "Thành tiền",
                            width: 160,
                            align: "right",
                            render: (_, record) => (
                                <Text className="dp-price">
                                    {formatCurrency(record.price * record.quantity)}
                                </Text>
                            ),
                        },
                    ]}
                />

                <Flex justify="flex-end" style={{ marginTop: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>
                        Tổng cộng:{" "}
                        <Text className="dp-price" style={{ fontSize: 24 }}>
                            {formatCurrency(totalPrice)}
                        </Text>
                    </Title>
                </Flex>

                <Alert
                    style={{ marginTop: 20 }}
                    type="info"
                    showIcon
                    message="Thông báo đơn hàng"
                    description="Trạng thái đơn hàng và hóa đơn điện tử sẽ được gửi về email tài khoản của bạn. Vui lòng kiểm tra số lượng và địa chỉ trước khi chốt đơn."
                />
            </div>
        </Modal>
    );
}
