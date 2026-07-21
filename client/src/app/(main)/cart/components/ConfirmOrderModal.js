import React from "react";
import { Modal, Descriptions, Divider, Table, Flex, Typography, Tag, Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/utils/formatters";

const { Title, Text } = Typography;

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
                    rowKey={(record) => record.cartItemId || record.productId}
                    columns={[
                        {
                            title: "Tên sản phẩm",
                            render: (_, record) => (
                                <Flex vertical gap={4}>
                                    <Text strong>{record.name}</Text>
                                    {record.variantLabel && <Tag color="pink">{record.variantLabel}</Tag>}
                                </Flex>
                            ),
                        },
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
                    title="Thông báo đơn hàng"
                    description="Đơn hàng dự kiến được giao trong 1-5 ngày làm việc. Sản phẩm đủ điều kiện có thể đổi trả trong 7 ngày kể từ khi nhận hàng. Trạng thái đơn và hóa đơn điện tử sẽ được gửi về email tài khoản của bạn."
                />
            </div>
        </Modal>
    );
}
