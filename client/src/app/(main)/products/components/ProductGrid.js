import React from "react";
import { Row, Col, Spin } from "antd";
import ProductCard from "./ProductCard";

export default function ProductGrid({
    loading,
    products,
    onBuyNow,
    onClickDetail,
    wishlistIds = new Set(),
    wishlistLoadingId,
    onToggleWishlist,
}) {
    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: 100 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Row gutter={[20, 20]}>
            {products.map((product) => (
                <Col xs={24} sm={12} lg={6} key={product.id}>
                    <ProductCard
                        product={product}
                        onBuyNow={onBuyNow}
                        onClickDetail={() => onClickDetail(product.id)}
                        wished={wishlistIds.has(String(product.id))}
                        wishlistLoading={wishlistLoadingId === String(product.id)}
                        onToggleWishlist={onToggleWishlist}
                    />
                </Col>
            ))}
        </Row>
    );
}
