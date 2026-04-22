"use client";
import React from "react";
import { Typography, Row, Col } from "antd";
import ProductCard from "@/components/ProductCard";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";

const { Title } = Typography;

export default function RelatedProducts({ relatedProducts, onProductClick }) {
    const router = useRouter();
    const { buyNow } = useCart();

    if (!relatedProducts || relatedProducts.length === 0) return null;

    return (
        <div style={{ marginBottom: "16px", marginTop: "40px" }}>
            <Title level={3} style={{ textAlign: "center", marginBottom: "32px", color: "#001529" }}>
                Sản phẩm liên quan
            </Title>
            <Row gutter={[16, 24]}>
                {relatedProducts.map((p) => (
                    <Col xs={12} sm={12} md={8} lg={6} key={p.id}>
                        <ProductCard
                            product={p}
                            onBuyNow={buyNow}
                            onClickDetail={() => {
                                if (onProductClick) onProductClick(p.id);
                                else router.push(`/products/${p.id}`);
                            }}
                        />
                    </Col>
                ))}
            </Row>
        </div>
    );
}