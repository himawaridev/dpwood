import React, { useEffect, useMemo, useState } from "react";
import { Typography, Flex, Tag, InputNumber, Button, Space, Divider, Rate } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    CreditCardOutlined,
    FireOutlined,
    SafetyCertificateOutlined,
    ShoppingCartOutlined,
    ToolOutlined,
    TruckOutlined,
} from "@ant-design/icons";
import { getProductSalesStats } from "@/utils/productStats";

const { Title, Text, Paragraph } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);


const getVariantSize = (variant = {}) => variant.size || variant.capacity || "Tiêu chuẩn";

const uniqueValues = (items) => [...new Set(items.filter(Boolean))];

export default function ProductInfo({
    product,
    quantity,
    setQuantity,
    handleAddToCart,
    onRateProduct,
    ratingSubmitting,
    hasRatedProduct,
    userRating,
    onVariantChange,
}) {
    const variants = useMemo(() => (Array.isArray(product.variants) ? product.variants : []), [product.variants]);
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const colorOptions = useMemo(() => uniqueValues(variants.map((variant) => variant.color)), [variants]);
    const effectiveColor = selectedColor || colorOptions[0] || "";
    const sizeOptions = useMemo(
        () => uniqueValues(variants.filter((variant) => variant.color === effectiveColor).map(getVariantSize)),
        [effectiveColor, variants],
    );
    const effectiveSize = sizeOptions.includes(selectedSize) ? selectedSize : sizeOptions[0] || "";
    const selectedVariant =
        variants.find((variant) => variant.color === effectiveColor && getVariantSize(variant) === effectiveSize) ||
        variants[0] ||
        null;
    const effectiveStock = selectedVariant ? Number(selectedVariant.stock || 0) : Number(product.stock || 0);
    const effectivePrice = selectedVariant ? Number(selectedVariant.price || product.price || 0) : Number(product.price || 0);
    const inStock = effectiveStock > 0;
    const rating = Number(product.rating || 0);
    const ratingCount = Number(product.ratingCount || 0);
    const salesStats = getProductSalesStats(product);

    useEffect(() => {
        if (quantity > Math.max(1, effectiveStock)) {
            setQuantity(Math.max(1, effectiveStock));
        }
    }, [effectiveStock, quantity, setQuantity]);

    useEffect(() => {
        onVariantChange?.(selectedVariant);
    }, [onVariantChange, selectedVariant]);

    const handleSelectColor = (color) => {
        setSelectedColor(color);
        setSelectedSize("");
        setQuantity(1);
    };

    const handleSelectSize = (size) => {
        setSelectedSize(size);
        setQuantity(1);
    };

    return (
        <Flex vertical gap={22}>
            <div>
                <Space size={8} wrap style={{ marginBottom: 14 }}>
                    {salesStats.isHot && (
                        <Tag color="error" icon={<FireOutlined />}>
                            Bán chạy
                        </Tag>
                    )}
                    <Tag color="success" icon={<SafetyCertificateOutlined />}>
                        DPWOOD Kitchen
                    </Tag>
                    <Tag
                        color={inStock ? "processing" : "default"}
                        icon={inStock ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    >
                        {inStock ? "Còn hàng" : "Hết hàng"}
                    </Tag>
                </Space>

                <Title
                    level={1}
                    className="dp-product-detail-title"
                    style={{ margin: 0, color: "var(--dp-ink)", lineHeight: 1.15 }}
                >
                    {product.name}
                </Title>
                <Text className="dp-muted">SKU: {product.id?.substring(0, 8).toUpperCase()}</Text>
            </div>

            <div className="dp-product-rating-panel">
                <div>
                    <Text strong>Đánh giá sản phẩm</Text>
                    <Flex align="center" gap={10} wrap style={{ marginTop: 8 }}>
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
                        {hasRatedProduct ? "Bạn có thể thay đổi đánh giá của mình" : "Chọn số sao của bạn"}
                    </Text>
                    <Rate allowHalf value={userRating || 0} disabled={ratingSubmitting} onChange={onRateProduct} />
                </div>
            </div>

            <div>
                <Text className="dp-price" style={{ fontSize: 34 }}>
                    {formatCurrency(effectivePrice)}
                </Text>
                <Paragraph className="dp-muted" style={{ margin: "8px 0 0" }}>
                    Tồn kho hiện tại: <strong>{effectiveStock}</strong> sản phẩm
                </Paragraph>
                <Paragraph className="dp-muted" style={{ margin: "4px 0 0" }}>
                    Đã bán: <strong>{salesStats.sold}</strong>
                    {salesStats.total > 0 && <> / {salesStats.total} sản phẩm</>}
                </Paragraph>
            </div>

            {variants.length > 0 && (
                <div className="dp-product-variant-panel">
                    <Text strong style={{ display: "block", marginBottom: 10 }}>
                        Chọn màu sắc
                    </Text>
                    <div className="dp-product-choice-row">
                        {colorOptions.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`dp-product-choice-button ${color === effectiveColor ? "is-selected" : ""}`}
                                onClick={() => handleSelectColor(color)}
                            >
                                {color}
                            </button>
                        ))}
                    </div>

                    <Text strong style={{ display: "block", margin: "16px 0 10px" }}>
                        Chọn kích cỡ / dung tích
                    </Text>
                    <div className="dp-product-choice-row">
                        {sizeOptions.map((size) => {
                            const variant = variants.find(
                                (item) => item.color === effectiveColor && getVariantSize(item) === size,
                            );
                            const isSelected = size === effectiveSize;
                            const isUnavailable = Number(variant?.stock || 0) <= 0;

                            return (
                                <button
                                    key={size}
                                    type="button"
                                    className={`dp-product-choice-button dp-product-size-button ${
                                        isSelected ? "is-selected" : ""
                                    }`}
                                    onClick={() => handleSelectSize(size)}
                                    disabled={isUnavailable}
                                >
                                    <strong>{size}</strong>
                                    <span>{formatCurrency(variant?.price || product.price)}</span>
                                    <small>{isUnavailable ? "Hết hàng" : `Còn ${variant?.stock || 0}`}</small>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}


            <Divider style={{ margin: 0 }} />

            <div>
                <Text strong style={{ display: "block", marginBottom: 10 }}>
                    Số lượng
                </Text>
                <InputNumber
                    min={1}
                    max={Math.max(1, effectiveStock)}
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
                    onClick={() => handleAddToCart(false, selectedVariant)}
                    disabled={!inStock}
                    style={{ flex: "1 1 180px" }}
                >
                    Thêm vào giỏ
                </Button>
                <Button
                    type="primary"
                    size="large"
                    icon={<CreditCardOutlined />}
                    onClick={() => handleAddToCart(true, selectedVariant)}
                    disabled={!inStock}
                    style={{ flex: "1 1 180px" }}
                >
                    Mua ngay
                </Button>
            </Flex>

            <div className="dp-kitchen-promise-grid">
                {[
                    { icon: <TruckOutlined />, title: "Giao hàng", text: "Theo dõi trạng thái đơn" },
                    { icon: <SafetyCertificateOutlined />, title: "Thanh toán", text: "COD hoặc QR PayOS" },
                    { icon: <ToolOutlined />, title: "Hướng dẫn", text: "Tư vấn sử dụng và bảo quản" },
                ].map((item) => (
                    <div key={item.title} className="dp-kitchen-promise-item">
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

