"use client";

import React, { useEffect, useState } from "react";
import {
    Table,
    Typography,
    InputNumber,
    Popconfirm,
    Button,
    Flex,
    Radio,
    Card,
    Image,
    Input,
    Divider,
    App,
    Tag,
    Empty,
    Modal,
} from "antd";
import {
    DeleteOutlined,
    CreditCardOutlined,
    TagOutlined,
    WalletOutlined,
    QrcodeOutlined,
    GiftOutlined,
} from "@ant-design/icons";
import api from "@/utils/axios";

const { Title, Text } = Typography;
const { Search } = Input;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function CartTable({
    cartItems,
    handleQuantityChange,
    handleRemoveItem,
    paymentMethod,
    setPaymentMethod,
    totalPrice,
    loading,
    handleCheckoutClick,
    discountCode,
    setDiscountCode,
    discountData = { percentage: 0, amount: 0 },
    setDiscountData,
}) {
    const { message } = App.useApp();
    const [activeVouchers, setActiveVouchers] = useState([]);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [isVoucherLoading, setIsVoucherLoading] = useState(false);

    useEffect(() => {
        const fetchActiveVouchers = async () => {
            try {
                setIsVoucherLoading(true);
                const response = await api.get("/discounts/active");
                setActiveVouchers(response.data || []);
            } catch {
                setActiveVouchers([]);
            } finally {
                setIsVoucherLoading(false);
            }
        };

        fetchActiveVouchers();
    }, []);

    const handleApplyDiscount = async (value) => {
        const code = value.trim().toUpperCase();
        if (!code) {
            setDiscountCode("");
            setDiscountData({ percentage: 0, amount: 0 });
            return;
        }

        try {
            const res = await api.post("/discounts/validate", { code });
            const amount = Math.floor((totalPrice * res.data.percentage) / 100);
            setDiscountCode(code);
            setDiscountData({ percentage: res.data.percentage, amount });
            message.success(`Áp dụng mã thành công. Bạn được giảm ${res.data.percentage}%.`);
        } catch (error) {
            setDiscountCode("");
            setDiscountData({ percentage: 0, amount: 0 });
            message.error(error.response?.data?.message || "Mã giảm giá không hợp lệ");
        }
    };

    const handleDiscountInputChange = (event) => {
        const nextCode = event.target.value.toUpperCase();
        setDiscountCode(nextCode);
        if (!nextCode) setDiscountData({ percentage: 0, amount: 0 });
    };

    const handleSelectVoucher = async (voucher) => {
        await handleApplyDiscount(voucher.code);
        setIsVoucherModalOpen(false);
    };

    const finalPrice = Math.max(0, totalPrice - (discountData?.amount || 0));

    const columns = [
        {
            title: "Sản phẩm",
            key: "product",
            render: (_, record) => (
                <Flex align="center" gap={14}>
                    <Image
                        src={record.imageUrl || "https://via.placeholder.com/96?text=DPWOOD"}
                        alt={record.name}
                        width={76}
                        height={76}
                        preview={false}
                        style={{
                            borderRadius: 8,
                            objectFit: "cover",
                            border: "1px solid var(--dp-soft-border)",
                        }}
                    />
                    <div style={{ minWidth: 180 }}>
                        <Text strong className="dp-line-clamp-2" style={{ fontSize: 15 }}>
                            {record.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                            SKU: {record.productId?.substring(0, 8).toUpperCase()}
                        </Text>
                    </div>
                </Flex>
            ),
        },
        {
            title: "Đơn giá",
            dataIndex: "price",
            align: "right",
            width: 140,
            render: (price) => <Text strong>{formatCurrency(price)}</Text>,
        },
        {
            title: "Số lượng",
            align: "center",
            width: 130,
            render: (_, record) => (
                <InputNumber
                    min={1}
                    max={100}
                    value={record.quantity}
                    onChange={(value) => handleQuantityChange(record.productId, value)}
                />
            ),
        },
        {
            title: "Thành tiền",
            align: "right",
            width: 150,
            render: (_, record) => (
                <Text className="dp-price">{formatCurrency(record.price * record.quantity)}</Text>
            ),
        },
        {
            title: "",
            align: "center",
            width: 64,
            render: (_, record) => (
                <Popconfirm
                    title="Xóa sản phẩm này?"
                    onConfirm={() => handleRemoveItem(record.productId)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    if (cartItems.length === 0) {
        return (
            <Card variant="outlined" className="dp-panel">
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Giỏ hàng của bạn đang trống"
                >
                    <Button type="primary" href="/products">
                        Tiếp tục mua sắm
                    </Button>
                </Empty>
            </Card>
        );
    }

    return (
        <Card variant="outlined" className="dp-panel" styles={{ body: { padding: 0 } }}>
            <Table
                dataSource={cartItems}
                columns={columns}
                rowKey="productId"
                pagination={false}
                loading={loading}
                scroll={{ x: 760 }}
            />

            <div
                style={{
                    padding: "24px clamp(18px, 4vw, 32px)",
                    borderTop: "1px solid var(--dp-soft-border)",
                    background: "var(--dp-surface-muted)",
                }}
            >
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={24}>
                    <Flex vertical gap={20} style={{ flex: 1, minWidth: 300 }}>
                        <div>
                            <Title level={5} style={{ marginBottom: 12 }}>
                                Phương thức thanh toán
                            </Title>
                            <Radio.Group
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                optionType="button"
                                buttonStyle="solid"
                            >
                                <Radio value="COD">
                                    <WalletOutlined /> COD
                                </Radio>
                                <Radio value="QR">
                                    <QrcodeOutlined /> QR PayOS
                                </Radio>
                            </Radio.Group>
                        </div>

                        <div style={{ maxWidth: 380 }}>
                            <Text strong>
                                <TagOutlined /> Ưu đãi & mã giảm giá
                            </Text>
                            <Flex gap={8} wrap style={{ marginTop: 8 }}>
                                <Search
                                    placeholder="Nhập mã voucher"
                                    allowClear
                                    enterButton="Áp dụng"
                                    onSearch={handleApplyDiscount}
                                    value={discountCode}
                                    onChange={handleDiscountInputChange}
                                    style={{ flex: "1 1 220px", minWidth: 0 }}
                                />
                                <Button
                                    icon={<GiftOutlined />}
                                    onClick={() => setIsVoucherModalOpen(true)}
                                    style={{ flex: "0 0 auto" }}
                                >
                                    {"Kho m\u00e3"}
                                </Button>
                            </Flex>
                            {discountData?.percentage > 0 && (
                                <Tag
                                    color="success"
                                    closable
                                    onClose={() => handleApplyDiscount("")}
                                    style={{ marginTop: 10, padding: "4px 8px" }}
                                >
                                    {discountCode}: giảm {discountData.percentage}%
                                </Tag>
                            )}
                        </div>
                    </Flex>

                    <Flex vertical align="stretch" gap={10} style={{ minWidth: 300 }}>
                        <Flex justify="space-between">
                            <Text type="secondary">Tổng tiền hàng</Text>
                            <Text strong>{formatCurrency(totalPrice)}</Text>
                        </Flex>
                        {(discountData?.amount || 0) > 0 && (
                            <Flex justify="space-between">
                                <Text type="secondary">Giảm giá ({discountData.percentage}%)</Text>
                                <Text type="danger" strong>
                                    -{formatCurrency(discountData.amount)}
                                </Text>
                            </Flex>
                        )}
                        <Divider style={{ margin: "8px 0" }} />
                        <Flex justify="space-between" align="center">
                            <Text strong style={{ fontSize: 16 }}>
                                Tổng thanh toán
                            </Text>
                            <Text className="dp-price" style={{ fontSize: 28 }}>
                                {formatCurrency(finalPrice)}
                            </Text>
                        </Flex>
                        <Button
                            type="primary"
                            size="large"
                            icon={<CreditCardOutlined />}
                            onClick={handleCheckoutClick}
                            loading={loading}
                            block
                        >
                            Tiến hành đặt hàng
                        </Button>
                    </Flex>
                </Flex>
            </div>

            <Modal
                title={"Kho m\u00e3 \u01b0u \u0111\u00e3i"}
                open={isVoucherModalOpen}
                onCancel={() => setIsVoucherModalOpen(false)}
                footer={null}
                width={620}
            >
                {isVoucherLoading ? (
                    <Text type="secondary">{"\u0110ang t\u1ea3i kho m\u00e3..."}</Text>
                ) : activeVouchers.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            "Hi\u1ec7n ch\u01b0a c\u00f3 m\u00e3 \u01b0u \u0111\u00e3i \u0111ang ho\u1ea1t \u0111\u1ed9ng."
                        }
                    />
                ) : (
                    <Flex vertical gap={12}>
                        {activeVouchers.map((voucher) => (
                            <Card
                                key={voucher.id}
                                size="small"
                                variant="outlined"
                                styles={{ body: { padding: 14 } }}
                            >
                                <Flex justify="space-between" align="flex-start" gap={14} wrap="wrap">
                                    <Flex gap={12} align="flex-start" style={{ flex: 1, minWidth: 260 }}>
                                        <Tag color="warning" style={{ marginTop: 2 }}>
                                            -{voucher.percentage}%
                                        </Tag>
                                        <Flex vertical gap={4}>
                                            <Flex align="center" gap={8} wrap="wrap">
                                                <Text strong copyable>
                                                    {voucher.code}
                                                </Text>
                                                {discountCode === voucher.code && (
                                                    <Tag color="success">
                                                        {"\u0110\u00e3 \u00e1p d\u1ee5ng"}
                                                    </Tag>
                                                )}
                                            </Flex>
                                            <Text type="secondary">
                                                {voucher.description ||
                                                    "\u00c1p d\u1ee5ng cho \u0111\u01a1n h\u00e0ng ph\u00f9 h\u1ee3p."}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {"H\u1ebft h\u1ea1n"}:{" "}
                                                {new Date(voucher.expiryDate).toLocaleDateString("vi-VN")}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Button
                                        type={discountCode === voucher.code ? "primary" : "default"}
                                        onClick={() => handleSelectVoucher(voucher)}
                                    >
                                        {discountCode === voucher.code
                                            ? "\u0110ang d\u00f9ng"
                                            : "Ch\u1ecdn m\u00e3"}
                                    </Button>
                                </Flex>
                            </Card>
                        ))}
                    </Flex>
                )}
            </Modal>
        </Card>
    );
}
