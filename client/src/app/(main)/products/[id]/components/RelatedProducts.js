"use client";
import React from "react";
import { Typography, Row, Col, message } from "antd";
// ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT ĐÃ ĐƯỢC SỬA:
import ProductCard from "@/components/ProductCard";
import { useRouter } from "next/navigation";

const { Title } = Typography;

export default function RelatedProducts({ relatedProducts, onProductClick }) {
    const router = useRouter();

    if (!relatedProducts || relatedProducts.length === 0) return null;

    const handleFallbackBuyNow = (product) => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = cart.findIndex((item) => item.productId === product.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl || (product.images && product.images[0]),
                quantity: 1,
            });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        message.success(`Đã thêm ${product.name} vào giỏ hàng`);
        router.push("/cart");
    };

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
                            onBuyNow={handleFallbackBuyNow}
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