import React from "react";
import { Typography, Flex, Tag, InputNumber, Button, Space, Divider, Rate } from "antd";
import {
    FireOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
    TruckOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function ProductInfo({
    product,
    quantity,
    setQuantity,
    handleAddToCart,
    bestSellerThreshold,
    onRateProduct,
    ratingSubmitting,
    hasRatedProduct,
    userRating,
}) {
    const inStock = Number(product.stock || 0) > 0;
    const rating = Number(product.rating || 0);
    const ratingCount = Number(product.ratingCount || 0);

    return (
        <Flex vertical gap={22}>
            <div>
                <Space size={8} wrap style={{ marginBottom: 14 }}>
                    {Number(product.sold || 0) >= bestSellerThreshold && (
                        <Tag color="error" icon={<FireOutlined />}>
                            Bán chạy ({product.sold} đã bán)
                        </Tag>
                    )}
                    <Tag color="success" icon={<SafetyCertificateOutlined />}>
                        DPWOOD selected
                    </Tag>
                    <Tag color={inStock ? "processing" : "default"} icon={inStock ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                        {inStock ? "Còn hàng" : "Hết hàng"}
                    </Tag>
                </Space>

                <Title
                    level={1}
                    className="dp-product-detail-title"
                    style={{
                        margin: 0,
                        color: "var(--dp-ink)",
                        lineHeight: 1.15,
                    }}
                >
                    {product.name}
                </Title>
                <Text className="dp-muted">SKU: {product.id?.substring(0, 8).toUpperCase()}</Text>
            </div>

            <div className="dp-product-rating-panel">
                <div>
                    <Text strong>Đánh giá sản phẩm</Text>
                    <Flex align="center" gap={10} wrap="wrap" style={{ marginTop: 8 }}>
                        <Rate disabled allowHalf value={rating} />
                        <Text className="dp-muted">
                            {ratingCount > 0
                                ? `${rating.toFixed(1)} / 5 từ ${ratingCount} lượt đánh giá`
                                : "Chưa có đánh giá"}
                        </Text>
                    </Flex>
                </div>

                <div>
                    <Text className="dp-muted" style={{ display: "block", marginBottom: 8 }}>
                        {hasRatedProduct ? "Bạn đã đánh giá sản phẩm này" : "Chọn số sao của bạn"}
                    </Text>
                    <Rate
                        value={userRating || 0}
                        disabled={ratingSubmitting || hasRatedProduct}
                        onChange={onRateProduct}
                    />
                </div>
            </div>

            <div>
                <Text className="dp-price" style={{ fontSize: 34 }}>
                    {formatCurrency(product.price)}
                </Text>
                <Paragraph className="dp-muted" style={{ margin: "8px 0 0" }}>
                    Tồn kho hiện tại: <strong>{product.stock}</strong> sản phẩm
                </Paragraph>
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
                <Text strong style={{ display: "block", marginBottom: 10 }}>
                    Số lượng
                </Text>
                <InputNumber
                    min={1}
                    max={Math.max(1, Number(product.stock || 1))}
                    value={quantity}
                    onChange={(value) => setQuantity(value || 1)}
                    size="large"
                    disabled={!inStock}
                    style={{ width: 132 }}
                />
            </div>

            <Flex gap={12} wrap="wrap">
                <Button
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleAddToCart(false)}
                    disabled={!inStock}
                    style={{ flex: "1 1 180px" }}
                >
                    Thêm vào giỏ
                </Button>
                <Button
                    type="primary"
                    size="large"
                    icon={<CreditCardOutlined />}
                    onClick={() => handleAddToCart(true)}
                    disabled={!inStock}
                    style={{ flex: "1 1 180px" }}
                >
                    Mua ngay
                </Button>
            </Flex>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 12,
                }}
            >
                {[
                    { icon: <TruckOutlined />, title: "Giao hàng", text: "Theo dõi trạng thái đơn" },
                    { icon: <SafetyCertificateOutlined />, title: "Thanh toán", text: "COD hoặc QR PayOS" },
                ].map((item) => (
                    <div
                        key={item.title}
                        style={{
                            border: "1px solid var(--dp-soft-border)",
                            borderRadius: 8,
                            padding: 14,
                            background: "var(--dp-surface-muted)",
                        }}
                    >
                        <div style={{ color: "var(--dp-primary)", fontSize: 20 }}>{item.icon}</div>
                        <Text strong>{item.title}</Text>
                        <br />
                        <Text className="dp-muted" style={{ fontSize: 13 }}>
                            {item.text}
                        </Text>
                    </div>
                ))}
            </div>
        </Flex>
    );
}
