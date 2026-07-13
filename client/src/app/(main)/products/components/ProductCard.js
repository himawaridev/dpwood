/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Card, Flex, Tooltip, Typography } from "antd";
import {
    EyeOutlined,
    FireOutlined,
    HeartFilled,
    HeartOutlined,
    ShoppingCartOutlined,
    StarFilled,
    StopOutlined,
} from "@ant-design/icons";
import { getKitchenCategoryLabel } from "@/utils/kitchenProduct";
import { getProductSalesStats } from "@/utils/productStats";

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
        <span className="webcake-rating-stars" aria-label={`${value.toFixed(1)} trên 5 sao`}>
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

export default function ProductCard({
    product,
    badge,
    onClickDetail,
    wished = false,
    onToggleWishlist,
    wishlistLoading = false,
}) {
    const inStock = Number(product.stock || 0) > 0;
    const salesStats = getProductSalesStats(product);
    const hotBadge = salesStats.isHot ? badge || "icon-only" : "";
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
                    minHeight: 136,
                },
            }}
            cover={
                <div className="webcake-product-media">
                    <button type="button" className="webcake-product-image" onClick={onClickDetail}>
                        {image ? (
                            <img alt={product.name || "Sản phẩm nhà bếp DPWOOD"} src={image} />
                        ) : (
                            <span className="webcake-product-image-placeholder">DPWOOD</span>
                        )}
                        {(hotBadge || !inStock) && (
                            <span className="webcake-product-status-row">
                                {hotBadge && (
                                    <Tooltip title={`Đã bán ${salesStats.sold}/${salesStats.total} sản phẩm`}>
                                        <span className="webcake-product-hot-badge">
                                            <FireOutlined />
                                            {hotBadge !== "icon-only" && hotBadge}
                                        </span>
                                    </Tooltip>
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
                            <span><EyeOutlined /></span>
                            <span><ShoppingCartOutlined /></span>
                        </span>
                    </button>
                    {onToggleWishlist && (
                        <Tooltip title={wished ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}>
                            <button
                                type="button"
                                className={`webcake-product-wishlist ${wished ? "is-wished" : ""}`}
                                onClick={() => onToggleWishlist(product)}
                                disabled={wishlistLoading}
                                aria-label={wished ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                            >
                                {wished ? <HeartFilled /> : <HeartOutlined />}
                            </button>
                        </Tooltip>
                    )}
                </div>
            }
        >
            <Flex vertical align="center" gap={8}>
                <button type="button" onClick={onClickDetail} className="webcake-product-name">
                    {product.name}
                </button>
                <Text className="webcake-product-category">{getKitchenCategoryLabel(product.category)}</Text>
                <Text className="webcake-product-price">{formatCurrency(product.price)}</Text>
                <div className="webcake-product-rating">
                    <DisplayRatingStars value={rating} />
                    <span>{rating.toFixed(1)} ({reviewCount})</span>
                </div>
            </Flex>
        </Card>
    );
}
