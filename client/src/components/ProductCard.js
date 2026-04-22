"use client";
import React from "react";
import { Card, Typography, Flex, Tag, Button, Tooltip } from "antd";
import { ShoppingCartOutlined, TrophyOutlined, StarFilled } from "@ant-design/icons";

const { Text } = Typography;

export default function ProductCard({ product, onBuyNow, onClickDetail }) {
    const isBestSeller = product.sold >= 20;

    return (
        <Card
            hoverable
            onClick={onClickDetail}
            variant="borderless"
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                overflow: "hidden",
                border: "none",                 // 🔴 XÓA VIỀN TUYỆT ĐỐI
                backgroundColor: "#f5f5f5",     // 🔴 ĐỔI NỀN THẺ THÀNH XÁM
                transition: "all 0.3s ease",
            }}
            styles={{
                body: { padding: "12px 16px", display: "flex", flexDirection: "column", flex: 1 },
            }}
            cover={
                <div style={{ overflow: "hidden", height: 220, position: "relative" }}>
                    {isBestSeller && (
                        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2 }}>
                            <Tag
                                color="gold"
                                icon={<TrophyOutlined />}
                                style={{ margin: 0, fontWeight: 600, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", padding: "2px 8px" }}
                            >
                                Bán chạy
                            </Tag>
                        </div>
                    )}
                    <img
                        alt={product.name || "Sản phẩm"}
                        src={product.imageUrl || (product.images && product.images[0]) || "https://via.placeholder.com/300x200?text=No+Image"}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                </div>
            }
        >
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Text
                    strong
                    style={{ fontSize: "15px", color: "#141414", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4, minHeight: 42, marginBottom: 10, transition: "color 0.3s" }}
                    className="product-name"
                >
                    {product.name}
                </Text>
                <Flex align="center" justify="space-between" style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
                        <StarFilled style={{ color: "#faad14", marginRight: 4 }} />
                        {product.sold > 0 ? `Đã bán ${product.sold}` : "Mới ra mắt"}
                    </Text>
                    <Text style={{ fontSize: 12, color: product.stock > 0 ? "#52c41a" : "#ff4d4f", fontWeight: 500 }}>
                        {product.stock > 0 ? `Tồn: ${product.stock}` : "Hết hàng"}
                    </Text>
                </Flex>
            </div>

            <Flex justify="space-between" align="flex-end" style={{ marginTop: "auto", borderTop: "1px dashed #d9d9d9", paddingTop: 12 }}>
                <div>
                    <Text strong style={{ fontSize: 18, color: "#cf1322", lineHeight: 1 }}>
                        {new Intl.NumberFormat("vi-VN").format(product.price)}₫
                    </Text>
                </div>

                <Tooltip title={product.stock === 0 ? "Đã hết hàng" : "Thêm vào giỏ"}>
                    <Button
                        type="primary"
                        shape="circle"
                        size="large"
                        icon={<ShoppingCartOutlined style={{ fontSize: 18 }} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onBuyNow) {
                                onBuyNow(product);
                            } else {
                                onClickDetail();
                            }
                        }}
                        disabled={product.stock === 0}
                        style={{ width: 40, height: 40, boxShadow: product.stock > 0 ? "0 4px 12px rgba(22,119,255,0.3)" : "none" }}
                    />
                </Tooltip>
            </Flex>

            {/* Tạo hiệu ứng đổi màu tên sản phẩm khi hover chuột */}
            <style jsx global>{`
                .ant-card:hover .product-name { color: #1677ff !important; }
            `}</style>
        </Card>
    );
}