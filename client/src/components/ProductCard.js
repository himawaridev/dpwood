/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Card, Flex, Tooltip, Typography } from "antd";
import { FireOutlined, EyeOutlined, ShoppingCartOutlined, StopOutlined, StarFilled } from "@ant-design/icons";

const { Text } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

const getRatingValue = (product) => {
    const explicitRating = Number(product.rating ?? product.averageRating ?? product.rate);
    if (explicitRating > 0) return Math.min(5, Math.round(explicitRating * 2) / 2);
    return 0;
};

function DisplayRatingStars({ value }) {
    return (
        <span className="webcake-rating-stars" aria-label={`${value.toFixed(1)} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, index) => {
                const fill = Math.max(0, Math.min(1, value - index));

                return (
                    <span className="webcake-rating-star" key={index}>
                        <StarFilled className="webcake-rating-star-base" />
                        <span className="webcake-rating-star-fill" style={{ width: `${fill * 100}%` }}>
                            <StarFilled />
                        </span>
                    </span>
                );
            })}
        </span>
    );
}

export default function ProductCard({ product, badge, onClickDetail }) {
    const inStock = Number(product.stock || 0) > 0;
    const rating = getRatingValue(product);
    const reviewCount = Number(product.reviewCount ?? product.reviewsCount ?? product.ratingCount ?? 0);
    const image = product.imageUrl || (Array.isArray(product.images) && product.images[0]);

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
                    {image ? (
                        <img alt={product.name || "DPWOOD product"} src={image} />
                    ) : (
                        <span className="webcake-product-image-placeholder">DPWOOD</span>
                    )}
                    {(badge || !inStock) && (
                        <span className="webcake-product-status-row">
                            {badge && (
                                <span className="webcake-product-hot-badge">
                                    <FireOutlined />
                                    {badge !== "icon-only" && badge}
                                </span>
                            )}
                            {!inStock && (
                                <Tooltip title="Hết hàng">
                                    <span className="webcake-product-stock-badge" aria-label="Hết hàng">
                                        <StopOutlined />
                                    </span>
                                </Tooltip>
                            )}
                        </span>
                    )}
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
                    <DisplayRatingStars value={rating} />
                    <span>{rating.toFixed(1)} ({reviewCount})</span>
                </div>
            </Flex>
        </Card>
    );
}
