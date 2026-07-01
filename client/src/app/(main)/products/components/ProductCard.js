import React from "react";
import { Card, Typography, Flex, Tag, Button, Image } from "antd";
import {
    EyeOutlined,
    ShoppingCartOutlined,
    FireOutlined,
    StopOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function ProductCard({ product, onBuyNow, onClickDetail }) {
    const inStock = Number(product.stock || 0) > 0;
    const image =
        product.imageUrl ||
        (Array.isArray(product.images) && product.images[0]) ||
        "https://via.placeholder.com/420x320?text=DPWOOD";

    return (
        <Card
            hoverable
            className="dp-card-hover"
            variant="outlined"
            style={{
                height: "100%",
                overflow: "hidden",
                borderColor: "var(--dp-soft-border)",
                background: "var(--dp-surface)",
            }}
            styles={{
                body: {
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 214,
                },
            }}
            cover={
                <button
                    type="button"
                    onClick={onClickDetail}
                    style={{
                        border: 0,
                        padding: 0,
                        width: "100%",
                        height: 230,
                        cursor: "pointer",
                        background: "#eef2ea",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <Image
                        alt={product.name || "Sản phẩm DPWOOD"}
                        src={image}
                        preview={false}
                        className="dp-image-cover"
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            right: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                        }}
                    >
                        {Number(product.sold || 0) >= 20 ? (
                            <Tag color="error" icon={<FireOutlined />} style={{ margin: 0 }}>
                                Bán chạy
                            </Tag>
                        ) : (
                            <span />
                        )}
                        <Tag
                            color={inStock ? "success" : "default"}
                            icon={inStock ? null : <StopOutlined />}
                            style={{ margin: 0 }}
                        >
                            {inStock ? `Còn ${product.stock}` : "Hết hàng"}
                        </Tag>
                    </div>
                </button>
            }
        >
            <Flex vertical gap={10} style={{ height: "100%" }}>
                <button
                    type="button"
                    onClick={onClickDetail}
                    className="dp-line-clamp-2"
                    style={{
                        border: 0,
                        background: "transparent",
                        padding: 0,
                        textAlign: "left",
                        cursor: "pointer",
                        color: "var(--dp-ink)",
                        fontSize: 16,
                        fontWeight: 800,
                        minHeight: 48,
                    }}
                >
                    {product.name}
                </button>

                <Text type="secondary" style={{ fontSize: 12 }}>
                    SKU: {product.id?.substring(0, 8).toUpperCase()}
                </Text>

                <div style={{ marginTop: "auto" }}>
                    <Text className="dp-price" style={{ fontSize: 21 }}>
                        {formatCurrency(product.price)}
                    </Text>
                </div>

                <Flex gap={8} wrap style={{ marginTop: 8 }}>
                    <Button
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        onClick={onBuyNow}
                        disabled={!inStock}
                        style={{ flex: "1 1 150px" }}
                    >
                        Mua ngay
                    </Button>
                    <Button
                        aria-label="Xem chi tiết"
                        icon={<EyeOutlined />}
                        onClick={onClickDetail}
                        style={{ flex: "0 0 auto" }}
                    />
                </Flex>
            </Flex>
        </Card>
    );
}
