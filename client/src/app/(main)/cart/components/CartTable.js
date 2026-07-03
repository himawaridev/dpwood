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

const formatCouponValue = (coupon) => {
    if (coupon.discountType === "percent") return `-${Number(coupon.discountValue)}%`;
    return `-${formatCurrency(coupon.discountValue)}`;
};

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
    discountData = { amount: 0 },
    setDiscountData,
}) {
    const { message } = App.useApp();
    const [savedCoupons, setSavedCoupons] = useState([]);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [isVoucherLoading, setIsVoucherLoading] = useState(false);

    useEffect(() => {
        const fetchSavedCoupons = async () => {
            try {
                setIsVoucherLoading(true);
                const response = await api.get("/coupons/my");
                setSavedCoupons(
                    (response.data || [])
                        .filter((item) => item.Coupon && !item.isUsed)
                        .map((item) => ({
                            ...item.Coupon,
                            userCouponId: item.id,
                        })),
                );
            } catch {
                setSavedCoupons([]);
            } finally {
                setIsVoucherLoading(false);
            }
        };

        fetchSavedCoupons();
    }, []);

    const handleApplyDiscount = async (value) => {
        const code = value.trim().toUpperCase();
        if (!code) {
            setDiscountCode("");
            setDiscountData({ amount: 0 });
            return;
        }

        try {
            const res = await api.post("/coupons/apply", { code, totalAmount: totalPrice });
            setDiscountCode(code);
            setDiscountData({
                amount: Number(res.data.discountAmount || 0),
                type: res.data.discountType,
                value: Number(res.data.discountValue || 0),
            });
            message.success(res.data.message || "Áp dụng mã thành công.");
        } catch (error) {
            setDiscountCode("");
            setDiscountData({ amount: 0 });
            message.error(error.response?.data?.message || "Mã giảm giá không hợp lệ.");
        }
    };

    const handleDiscountInputChange = (event) => {
        const nextCode = event.target.value.toUpperCase();
        setDiscountCode(nextCode);
        if (!nextCode) setDiscountData({ amount: 0 });
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
                            borderRadius: 0,
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
                        {record.variantLabel && (
                            <Tag color="pink" style={{ marginTop: 6 }}>
                                {record.variantLabel}
                            </Tag>
                        )}
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
                    onChange={(value) => handleQuantityChange(record.cartItemId || record.productId, value)}
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
                    onConfirm={() => handleRemoveItem(record.cartItemId || record.productId)}
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
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Giỏ hàng của bạn đang trống">
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
                rowKey={(record) => record.cartItemId || record.productId}
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

                        <div className="dp-cart-discount-box">
                            <Text strong>
                                <TagOutlined /> Ưu đãi & mã giảm giá
                            </Text>
                            <Flex gap={8} wrap className="dp-cart-discount-row">
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
                                    Kho mã
                                </Button>
                            </Flex>
                            {(discountData?.amount || 0) > 0 && (
                                <Tag
                                    color="success"
                                    closable
                                    onClose={() => handleApplyDiscount("")}
                                    style={{ marginTop: 10, padding: "4px 8px" }}
                                >
                                    {discountCode}: giảm {formatCurrency(discountData.amount)}
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
                                <Text type="secondary">Giảm giá</Text>
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
                title="Kho mã ưu đãi"
                open={isVoucherModalOpen}
                onCancel={() => setIsVoucherModalOpen(false)}
                footer={null}
                width={620}
            >
                {isVoucherLoading ? (
                    <Text type="secondary">Đang tải kho mã...</Text>
                ) : savedCoupons.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Bạn chưa lưu mã ưu đãi nào. Hãy lấy mã ở trang chủ trước khi thanh toán."
                    />
                ) : (
                    <Flex vertical gap={12} className="dp-cart-voucher-list">
                        {savedCoupons.map((voucher) => (
                            <Card
                                className="dp-cart-voucher-card"
                                key={voucher.userCouponId || voucher.id}
                                size="small"
                                variant="outlined"
                            >
                                <Flex justify="space-between" align="flex-start" gap={14} wrap="wrap">
                                    <Flex gap={12} align="flex-start" className="dp-cart-voucher-card-content" style={{ flex: 1, minWidth: 260 }}>
                                        <Tag color="warning" style={{ marginTop: 2 }}>
                                            {formatCouponValue(voucher)}
                                        </Tag>
                                        <Flex vertical gap={4}>
                                            <Flex align="center" gap={8} wrap="wrap">
                                                <Text strong copyable className="dp-cart-voucher-code">
                                                    {voucher.code}
                                                </Text>
                                                {discountCode === voucher.code && (
                                                    <Tag color="success">Đang áp dụng</Tag>
                                                )}
                                            </Flex>
                                            <Text type="secondary">
                                                {voucher.description ||
                                                    `Áp dụng cho đơn hàng từ ${formatCurrency(
                                                        voucher.minOrderAmount,
                                                    )}.`}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Hết hạn:{" "}
                                                {new Date(voucher.expiryDate).toLocaleDateString("vi-VN")}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Button
                                        type={discountCode === voucher.code ? "primary" : "default"}
                                        onClick={() => handleSelectVoucher(voucher)}
                                    >
                                        {discountCode === voucher.code ? "Đang dùng" : "Chọn mã"}
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
