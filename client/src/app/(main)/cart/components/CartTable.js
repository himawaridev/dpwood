import React, { useState } from "react";
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
    Tag,
    Space,
    Popover,
    List,
    Empty,
} from "antd";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";
import {
    DeleteOutlined,
    CreditCardOutlined,
    GiftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    WalletOutlined,
    ClockCircleOutlined,
    StopOutlined,
    PercentageOutlined,
    TagOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

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
    // Coupon props
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponLoading,
    handleApplyCoupon,
    handleRemoveCoupon,
    discountAmount,
    finalPrice,
    myCoupons,
}) {
    const screens = useBreakpoint();
    const isMobile = screens.xs || screens.sm && !screens.md;

    const [walletOpen, setWalletOpen] = useState(false);

    // Lọc mã có thể dùng từ ví
    const availableCoupons = (myCoupons || []).filter((uc) => {
        const coupon = uc.Coupon;
        if (!coupon || uc.isUsed) return false;
        const now = new Date();
        if (new Date(coupon.expiryDate) <= now) return false;
        if (!coupon.isActive) return false;
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return false;
        return true;
    });

    const handleSelectCoupon = (code) => {
        setCouponCode(code);
        setWalletOpen(false);
    };

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
                    max={9999}
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

    // Nội dung popover ví mã giảm giá
    const walletContent = (
        <div style={{ width: 280, maxHeight: 300, overflow: "auto" }}>
            {availableCoupons.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có mã khả dụng"
                    style={{ padding: "16px 0" }}
                />
            ) : (
                <List
                    size="small"
                    dataSource={availableCoupons}
                    renderItem={(uc) => {
                        const c = uc.Coupon;
                        const isSelected =
                            couponCode.toUpperCase() === c.code.toUpperCase();
                        return (
                            <List.Item
                                style={{
                                    cursor: "pointer",
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    background: isSelected ? "#f6ffed" : "transparent",
                                    border: isSelected
                                        ? "1px solid #b7eb8f"
                                        : "1px solid transparent",
                                    marginBottom: 4,
                                    transition: "all 0.2s",
                                }}
                                onClick={() => handleSelectCoupon(c.code)}
                            >
                                <div style={{ width: "100%" }}>
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                    >
                                        <Text
                                            strong
                                            style={{
                                                fontFamily: "monospace",
                                                color: "#1677ff",
                                                fontSize: 13,
                                            }}
                                        >
                                            {c.code}
                                        </Text>
                                        <Tag
                                            color={
                                                c.discountType === "percent"
                                                    ? "#f5222d"
                                                    : "#fa8c16"
                                            }
                                            style={{
                                                border: "none",
                                                borderRadius: 4,
                                                fontSize: 11,
                                                margin: 0,
                                            }}
                                        >
                                            {c.discountType === "percent"
                                                ? `−${Number(c.discountValue)}%`
                                                : `−${new Intl.NumberFormat("vi-VN").format(c.discountValue)}₫`}
                                        </Tag>
                                    </Flex>
                                    <Flex
                                        justify="space-between"
                                        style={{ marginTop: 2 }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                color: "#8c8c8c",
                                            }}
                                        >
                                            {Number(c.minOrderAmount) > 0
                                                ? `Đơn từ ${new Intl.NumberFormat("vi-VN").format(c.minOrderAmount)}₫`
                                                : "Mọi đơn hàng"}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                color: "#bfbfbf",
                                            }}
                                        >
                                            <ClockCircleOutlined /> HSD:{" "}
                                            {dayjs(c.expiryDate).format(
                                                "DD/MM",
                                            )}
                                        </Text>
                                    </Flex>
                                </div>
                            </List.Item>
                        );
                    }}
                />
            )}
        </div>
    );

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
                scroll={{ x: "max-content" }}
                locale={{ emptyText: "Giỏ hàng đang trống" }}
                style={{ borderBottom: cartItems.length > 0 ? "1px solid #f0f0f0" : "none" }}
            />
            {cartItems.length > 0 && (
                <div
                    style={{
                        padding: isMobile ? "20px 16px" : "24px 32px",
                        background: "#fafafa",
                        borderBottomLeftRadius: 12,
                        borderBottomRightRadius: 12,
                    }}
                >
                    {/* Mã giảm giá */}
                    <div
                        style={{
                            padding: isMobile ? "12px 16px" : "16px 20px",
                            background: "#fff",
                            borderRadius: 10,
                            border: appliedCoupon
                                ? "1px solid #b7eb8f"
                                : "1px dashed #d9d9d9",
                            marginBottom: 20,
                        }}
                    >
                        <Flex align="center" gap="small" style={{ marginBottom: 12 }}>
                            <GiftOutlined style={{ color: "#f5222d", fontSize: 16 }} />
                            <Text strong style={{ color: "#262626" }}>
                                Mã giảm giá
                            </Text>
                        </Flex>

                        {appliedCoupon ? (
                            <Flex justify="space-between" align="center">
                                <Space>
                                    <Tag
                                        color="success"
                                        icon={<CheckCircleOutlined />}
                                        style={{
                                            borderRadius: 6,
                                            fontSize: 13,
                                            padding: "2px 10px",
                                        }}
                                    >
                                        {appliedCoupon.couponCode}
                                    </Tag>
                                    <Text type="success" strong>
                                        -
                                        {new Intl.NumberFormat("vi-VN").format(
                                            discountAmount,
                                        )}
                                        ₫
                                    </Text>
                                </Space>
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<CloseCircleOutlined />}
                                    onClick={handleRemoveCoupon}
                                >
                                    Hủy mã
                                </Button>
                            </Flex>
                        ) : (
                            <Flex gap="small" align="center" wrap="wrap">
                                <Input
                                    placeholder="Nhập mã giảm giá..."
                                    value={couponCode}
                                    onChange={(e) =>
                                        setCouponCode(e.target.value.toUpperCase())
                                    }
                                    onPressEnter={handleApplyCoupon}
                                    style={{
                                        flex: 1,
                                        textTransform: "uppercase",
                                        fontFamily: "monospace",
                                        letterSpacing: 1,
                                    }}
                                    allowClear
                                />
                                <Popover
                                    content={walletContent}
                                    title={
                                        <Flex align="center" gap={6}>
                                            <WalletOutlined
                                                style={{ color: "#1677ff" }}
                                            />
                                            <span>Chọn từ kho mã</span>
                                        </Flex>
                                    }
                                    trigger="click"
                                    open={walletOpen}
                                    onOpenChange={setWalletOpen}
                                    placement="bottomRight"
                                >
                                    <Button
                                        icon={<WalletOutlined />}
                                        style={{ borderRadius: 6 }}
                                    >
                                        Kho mã
                                        {availableCoupons.length > 0 && (
                                            <span
                                                style={{
                                                    background: "#f5222d",
                                                    color: "#fff",
                                                    borderRadius: 10,
                                                    padding: "0 6px",
                                                    fontSize: 11,
                                                    marginLeft: 4,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {availableCoupons.length}
                                            </span>
                                        )}
                                    </Button>
                                </Popover>
                                <Button
                                    type="primary"
                                    onClick={handleApplyCoupon}
                                    loading={couponLoading}
                                    style={{ borderRadius: 6 }}
                                >
                                    Áp dụng
                                </Button>
                            </Flex>
                        )}
                    </div>

                    <Flex
                        justify="space-between"
                        align={isMobile ? "flex-start" : "flex-start"}
                        vertical={isMobile}
                        gap="large"
                    >
                        <div style={{ width: isMobile ? "100%" : "auto" }}>
                            <Title
                                level={5}
                                style={{ color: "#595959", marginBottom: 16 }}
                            >
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
                                            Chuyển khoản qua mã QR (Tự động xác
                                            nhận)
                                        </Text>
                                    </Radio>
                                </Flex>
                            </Radio.Group>
                        </div>
                        <Flex vertical align={isMobile ? "flex-start" : "flex-end"} gap="small" style={{ width: isMobile ? "100%" : "auto", paddingTop: isMobile ? 12 : 0, borderTop: isMobile ? "1px solid #e8e8e8" : "none" }}>
                            {/* Tạm tính */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <Text
                                    style={{
                                        fontSize: "14px",
                                        color: "#8c8c8c",
                                        marginRight: 8,
                                    }}
                                >
                                    Tạm tính:
                                </Text>
                                <Text
                                    style={{
                                        fontSize: "16px",
                                        color: "#595959",
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {new Intl.NumberFormat("vi-VN").format(
                                        totalPrice,
                                    )}
                                    ₫
                                </Text>
                            </div>

                            {/* Giảm giá */}
                            {appliedCoupon && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <Text
                                        style={{
                                            fontSize: "14px",
                                            color: "#52c41a",
                                            marginRight: 8,
                                        }}
                                    >
                                        Giảm giá:
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: "16px",
                                            color: "#52c41a",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        -
                                        {new Intl.NumberFormat("vi-VN").format(
                                            discountAmount,
                                        )}
                                        ₫
                                    </Text>
                                </div>
                            )}

                            {/* Tổng thanh toán */}
                            <div
                                style={{
                                    marginTop: appliedCoupon ? 4 : 0,
                                    display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: "16px",
                                        color: "#595959",
                                        marginRight: 12,
                                    }}
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
                                    {new Intl.NumberFormat("vi-VN").format(
                                        finalPrice,
                                    )}
                                    ₫
                                </Text>
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                block={isMobile}
                                icon={<CreditCardOutlined />}
                                onClick={handleCheckoutClick}
                                loading={loading}
                                style={{
                                    height: 48,
                                    fontSize: "16px",
                                    padding: "0 32px",
                                    borderRadius: 8,
                                    marginTop: isMobile ? 16 : 8,
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
