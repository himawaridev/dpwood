import React from "react";
import { Card, Typography, Flex, Tag, Button, Image } from "antd";
import { ShoppingCartOutlined, EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Meta } = Card;

export default function ProductCard({ product, onBuyNow, onClickDetail }) {
    return (
        <Card
            hoverable
            variant="borderless" // 🔴 Chuẩn Antd V5
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: "12px",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
            }}
            styles={{
                // 🔴 Chuẩn Antd V5 thay thế cho bodyStyle
                body: {
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                },
            }}
            cover={
                <Image
                    alt={product.name || "Sản phẩm"}
                    src={product.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
                    height={220}
                    style={{ objectFit: "cover", width: "100%" }}
                    preview={false}
                    onClick={onClickDetail}
                />
            }
        >
            <Meta
                title={
                    <span
                        style={{
                            fontSize: "16px",
                            whiteSpace: "normal",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {product.name}
                    </span>
                }
            />

            <div style={{ marginTop: "auto", paddingTop: 16 }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 20, color: "#1677ff" }}>
                        {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        }).format(product.price)}
                    </Text>
                    <Tag color={product.stock > 0 ? "blue" : "default"} style={{ margin: 0 }}>
                        Tồn: {product.stock}
                    </Tag>
                </Flex>

                <Flex gap="small">
                    <Button
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => onBuyNow(product)}
                        disabled={product.stock === 0}
                        style={{ flex: 1 }}
                    >
                        Mua ngay
                    </Button>
                    <Button icon={<EyeOutlined />} onClick={onClickDetail} style={{ flex: 1 }}>
                        Chi tiết
                    </Button>
                </Flex>
            </div>
        </Card>
    );
}
