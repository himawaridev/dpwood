import React from "react";
import { Table, Typography, InputNumber, Popconfirm, Button, Flex, Radio, Card, Image } from "antd";
import { DeleteOutlined, CreditCardOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function CartTable({
    cartItems,
    handleQuantityChange,
    handleRemoveItem,
    paymentMethod,
    setPaymentMethod,
    totalPrice,
    loading,
    handleCheckoutClick,
}) {
    const columns = [
        {
            title: "Sản phẩm",
            render: (_, record) => (
                <Flex align="center" gap="middle">
                    <Image
                        src={record.imageUrl || "https://via.placeholder.com/50"}
                        alt={record.name || "Sản phẩm"}
                        width={60}
                        height={60}
                        preview={false}
                        style={{ borderRadius: 8, objectFit: "cover", border: "1px solid #f0f0f0" }}
                    />
                    <Text strong style={{ fontSize: "15px", color: "#262626" }}>
                        {record.name}
                    </Text>
                </Flex>
            ),
        },
        {
            title: "Đơn giá",
            dataIndex: "price",
            align: "right",
            width: 130,
            render: (p) => (
                <Text type="secondary" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {new Intl.NumberFormat("vi-VN").format(p)}₫
                </Text>
            ),
        },
        {
            title: "Số lượng",
            align: "center",
            width: 120,
            render: (_, record) => (
                <InputNumber
                    min={1}
                    max={99}
                    value={record.quantity}
                    onChange={(val) => handleQuantityChange(val, record.productId)}
                    size="middle"
                />
            ),
        },
        {
            title: "Thành tiền",
            align: "right",
            width: 150,
            render: (_, record) => (
                <Text
                    strong
                    style={{
                        color: "#1677ff",
                        fontSize: "16px",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {new Intl.NumberFormat("vi-VN").format(record.price * record.quantity)}₫
                </Text>
            ),
        },
        {
            title: "",
            align: "center",
            width: 60,
            render: (_, record) => (
                <Popconfirm
                    title="Xóa sản phẩm này khỏi giỏ hàng?"
                    onConfirm={() => handleRemoveItem(record.productId)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button danger icon={<DeleteOutlined />} type="text" shape="circle" />
                </Popconfirm>
            ),
        },
    ];

    return (
        <Card
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
            styles={{ body: { padding: 0 } }}
        >
            <Table
                dataSource={cartItems}
                columns={columns}
                rowKey="productId"
                pagination={false}
                scroll={{ x: 600 }}
                locale={{ emptyText: "Giỏ hàng đang trống" }}
                style={{ borderBottom: cartItems.length > 0 ? "1px solid #f0f0f0" : "none" }}
            />
            {cartItems.length > 0 && (
                <div
                    style={{
                        padding: "24px 32px",
                        background: "#fafafa",
                        borderBottomLeftRadius: 12,
                        borderBottomRightRadius: 12,
                    }}
                >
                    <Flex justify="space-between" align="flex-start" wrap="wrap" gap="large">
                        <div>
                            <Title level={5} style={{ color: "#595959", marginBottom: 16 }}>
                                Phương thức thanh toán:
                            </Title>
                            <Radio.Group
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                value={paymentMethod}
                            >
                                <Flex vertical gap="middle">
                                    <Radio value="COD">
                                        <Text strong={paymentMethod === "COD"}>
                                            Thanh toán khi nhận hàng (COD)
                                        </Text>
                                    </Radio>
                                    <Radio value="QR">
                                        <Text strong={paymentMethod === "QR"}>
                                            Chuyển khoản qua mã QR (Tự động xác nhận)
                                        </Text>
                                    </Radio>
                                </Flex>
                            </Radio.Group>
                        </div>
                        <Flex vertical align="flex-end" gap="middle">
                            <div>
                                <Text
                                    style={{ fontSize: "16px", color: "#595959", marginRight: 12 }}
                                >
                                    Tổng thanh toán:
                                </Text>
                                <Text
                                    strong
                                    style={{
                                        fontSize: "28px",
                                        color: "#1677ff",
                                        lineHeight: 1,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {new Intl.NumberFormat("vi-VN").format(totalPrice)}₫
                                </Text>
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                icon={<CreditCardOutlined />}
                                onClick={handleCheckoutClick}
                                loading={loading}
                                style={{
                                    height: 48,
                                    fontSize: "16px",
                                    padding: "0 32px",
                                    borderRadius: 8,
                                }}
                            >
                                Tiến hành Đặt hàng
                            </Button>
                        </Flex>
                    </Flex>
                </div>
            )}
        </Card>
    );
}
