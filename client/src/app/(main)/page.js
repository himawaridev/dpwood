"use client";
import { useEffect, useState } from "react";
import { Spin, message } from "antd";
import { TrophyOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";

import LatestProducts from "@/components/LatestProducts";
import CouponBanner from "@/components/CouponBanner";
import TrustBadges from "@/components/TrustBadges";
import ProductSection from "@/components/ProductSection";
import { useProducts } from "@/hooks/useProducts";

export default function HomePage() {
    const { products, loading } = useProducts();
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = screens.xs || (screens.sm && !screens.md);

    // Logic Mua ngay / Thêm vào giỏ đồng nhất
    const handleBuyNow = (product) => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = cart.findIndex((item) => item.productId === product.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1,
            });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        message.success(`Đã thêm ${product.name} vào giỏ hàng`);
        router.push("/cart");
    };

    if (loading) return <div style={{ textAlign: "center", padding: "100px 0" }}><Spin size="large" /></div>;

    const bestSellers = products.filter(p => p.sold >= 20).slice(0, 8);
    const allProducts = products.slice(0, 8);

    return (
        <div style={{ background: "#ffffff", minHeight: "100vh" }}>
            <LatestProducts />
            <TrustBadges isMobile={isMobile} />

            <div style={{ marginTop: 32 }}>
                <CouponBanner />
            </div>

            {/* Mục Bán Chạy */}
            {bestSellers.length > 0 && (
                <div style={{ marginTop: 32 }}>
                    <ProductSection
                        title="Bán chạy nhất"
                        icon={<TrophyOutlined style={{ color: '#faad14' }} />}
                        products={bestSellers}
                        onBuyNow={handleBuyNow}
                        isMobile={isMobile}
                    />
                </div>
            )}

            {/* Mục Tất cả sản phẩm */}
            <div style={{ marginTop: 32, marginBottom: 48 }}>
                <ProductSection
                    title="Khám phá sản phẩm"
                    icon={<AppstoreOutlined style={{ color: '#1677ff' }} />}
                    products={allProducts}
                    onBuyNow={handleBuyNow}
                    isMobile={isMobile}
                />
            </div>
        </div>
    );
}