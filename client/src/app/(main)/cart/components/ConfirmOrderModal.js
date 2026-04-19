import React from "react";
import { Modal, Descriptions, Divider, Table, Flex, Typography, Tag } from "antd";
import { InfoCircleOutlined, MailOutlined, GiftOutlined } from "@ant-design/icons";

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
    appliedCoupon,
    discountAmount,
    finalPrice,
}) {
    // Chuẩn Ant Design V5: Dùng mảng items
    const descriptionItems = [
        {
            key: "1",
            label: "Người nhận",
            children: <Text strong>{selectedAddress?.recipientName}</Text>,
        },
        {
            key: "2",
            label: "Số điện thoại",
            children: <Text strong>{selectedAddress?.phoneNumber}</Text>,
        },
        {
            key: "3",
            label: "Phương thức",
            children: (
                <Tag color={paymentMethod === "COD" ? "blue" : "cyan"}>
                    {paymentMethod === "COD"
                        ? "Thanh toán khi nhận hàng (COD)"
                        : "Chuyển khoản tự động qua mã QR"}
                </Tag>
            ),
        },
        {
            key: "4",
            label: "Địa chỉ giao",
            children: <Text strong>{selectedAddress?.fullAddress}</Text>,
        },
    ];

    return (
        <Modal
            title={
                <span style={{ fontSize: "18px", color: "#001529" }}>
                    <InfoCircleOutlined style={{ color: "#1677ff", marginRight: 8 }} /> Xác nhận
                    thông tin đơn hàng
                </span>
            }
            open={isConfirmModalVisible}
            onOk={confirmOrder}
            confirmLoading={loading}
            onCancel={() => setIsConfirmModalVisible(false)}
            okText="Chốt đơn hàng"
            cancelText="Quay lại kiểm tra"
            width={850}
            centered
        >
            <div style={{ padding: "10px 0" }}>
                <Descriptions
                    title="Giao hàng"
                    bordered
                    size="small"
                    column={1}
                    items={descriptionItems}
                />

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
                            width: 150,
                            align: "right",
                            render: (r) => (
                                <Text
                                    strong
                                    style={{ color: "#1677ff", fontVariantNumeric: "tabular-nums" }}
                                >
                                    {new Intl.NumberFormat("vi-VN").format(r.price * r.quantity)}₫
                                </Text>
                            ),
                        },
                    ]}
                />

                {/* Hiển thị giảm giá nếu có */}
                {appliedCoupon && (
                    <div
                        style={{
                            marginTop: 16,
                            padding: "12px 16px",
                            background: "#f6ffed",
                            borderRadius: 8,
                            border: "1px solid #b7eb8f",
                        }}
                    >
                        <Flex justify="space-between" align="center">
                            <Flex align="center" gap="small">
                                <GiftOutlined style={{ color: "#52c41a" }} />
                                <Text strong style={{ color: "#389e0d" }}>
                                    Mã giảm giá: {appliedCoupon.couponCode}
                                </Text>
                            </Flex>
                            <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
                                -{new Intl.NumberFormat("vi-VN").format(discountAmount)}₫
                            </Text>
                        </Flex>
                    </div>
                )}

                <Flex
                    justify="flex-end"
                    vertical
                    align="flex-end"
                    gap="small"
                    style={{ marginTop: 16 }}
                >
                    {appliedCoupon && (
                        <>
                            <div>
                                <Text style={{ color: "#8c8c8c", marginRight: 8 }}>Tạm tính:</Text>
                                <Text
                                    style={{
                                        fontSize: "16px",
                                        fontVariantNumeric: "tabular-nums",
                                        color: "#595959",
                                    }}
                                >
                                    {new Intl.NumberFormat("vi-VN").format(totalPrice)}₫
                                </Text>
                            </div>
                            <div>
                                <Text style={{ color: "#52c41a", marginRight: 8 }}>Giảm giá:</Text>
                                <Text
                                    strong
                                    style={{
                                        fontSize: "16px",
                                        fontVariantNumeric: "tabular-nums",
                                        color: "#52c41a",
                                    }}
                                >
                                    -{new Intl.NumberFormat("vi-VN").format(discountAmount)}₫
                                </Text>
                            </div>
                        </>
                    )}
                    <Title level={4} style={{ margin: 0, color: "#262626" }}>
                        Tổng cộng:{" "}
                        <Text
                            style={{
                                color: "#1677ff",
                                fontSize: "24px",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {new Intl.NumberFormat("vi-VN").format(finalPrice)}₫
                        </Text>
                    </Title>
                </Flex>

                <div
                    style={{
                        marginTop: 24,
                        background: "#e6f4ff",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #91caff",
                    }}
                >
                    <Text strong style={{ color: "#0958d9" }}>
                        <MailOutlined /> Thông báo quan trọng:
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "13px", color: "#1677ff" }}>
                        Trạng thái đơn hàng và hóa đơn điện tử sẽ được gửi tự động về Email tài
                        khoản của bạn. Vui lòng kiểm tra lại để chắc chắn số lượng và địa chỉ đã
                        chính xác.
                    </Text>
                </div>
            </div>
        </Modal>
    );
}
