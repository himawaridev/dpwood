/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Card, Flex, Rate, Tag, Typography } from "antd";
import { FireOutlined, EyeOutlined, ShoppingCartOutlined } from "@ant-design/icons";

const { Text } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

const getRatingValue = (product) => {
    const explicitRating = Number(product.rating ?? product.averageRating ?? product.rate);
    if (explicitRating > 0) return Math.min(5, explicitRating);
    const seed = String(product.id || product.name || "").split("").reduce((total, char) => total + char.charCodeAt(0), 0);
    return 4 + (seed % 3) * 0.5;
};

export default function ProductCard({ product, badge, onClickDetail }) {
    const inStock = Number(product.stock || 0) > 0;
    const rating = getRatingValue(product);
    const reviewCount = Number(product.reviewCount ?? product.reviewsCount ?? product.ratingCount ?? 0);
    const image =
        product.imageUrl ||
        (Array.isArray(product.images) && product.images[0]) ||
        "https://content.pancake.vn/web-media/81/98/66/19/ec8bfc121e82a52efcf4d4882a8a74aeacb97dc0cd893ce475f3f5fc-w:823-h:1034-l:29602-t:image/webp.webp";

    return (
        <Card
            hoverable
            className="webcake-product-card"
            variant="borderless"
            styles={{
                body: {
                    padding: "16px 0 0",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 124,
                },
            }}
            cover={
                <button type="button" className="webcake-product-image" onClick={onClickDetail}>
                    <img alt={product.name || "DPWOOD product"} src={image} />
                    {badge && (
                        <span className="webcake-product-hot-badge">
                            <FireOutlined />
                            {badge !== "icon-only" && badge}
                        </span>
                    )}
                    {!inStock && <Tag className="webcake-product-badge">Out of stock</Tag>}
                    <span className="webcake-product-actions" aria-hidden="true">
                        <span>
                            <EyeOutlined />
                        </span>
                        <span>
                            <ShoppingCartOutlined />
                        </span>
                    </span>
                </button>
            }
        >
            <Flex vertical align="center" gap={8}>
                <button type="button" onClick={onClickDetail} className="webcake-product-name">
                    {product.name}
                </button>
                <Text className="webcake-product-price">{formatCurrency(product.price)}</Text>
                <div className="webcake-product-rating">
                    <Rate disabled allowHalf value={rating} />
                    <span>({reviewCount})</span>
                </div>
            </Flex>
        </Card>
    );
}
