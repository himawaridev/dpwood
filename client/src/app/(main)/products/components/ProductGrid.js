"use client";
import React from "react";
import { Row, Col, Spin } from "antd";
import ProductCard from "@/components/ProductCard";
import { useRouter } from "next/navigation";

export default function ProductGrid({ loading, products, onBuyNow, onClickDetail }) {
    const router = useRouter();

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: 100 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Row gutter={[16, 24]}>
            {products.map((product) => (
                <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                    <ProductCard
                        product={product}
                        onBuyNow={onBuyNow}
                        onClickDetail={() => {
                            if (onClickDetail) onClickDetail(product.id);
                            else router.push(`/products/${product.id}`);
                        }}
                    />
                </Col>
            ))}
        </Row>
    );
}