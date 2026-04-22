"use client";
import { Spin } from "antd";
import { TrophyOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";

import LatestProducts from "@/components/LatestProducts";
import CouponBanner from "@/components/CouponBanner";
import TrustBadges from "@/components/TrustBadges";
import ProductSection from "@/components/ProductSection";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";

export default function HomePage() {
    const { products, loading } = useProducts();
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = screens.xs || (screens.sm && !screens.md);
    const { buyNow } = useCart();

    if (loading) return <div style={{ textAlign: "center", padding: "100px 0" }}><Spin size="large" /></div>;

    // ==============================================================
    // 1. DANH SÁCH BÁN CHẠY: Lọc trên TOÀN BỘ kho hàng (Độc lập)
    // Dùng Number() để an toàn với các sản phẩm cũ bị null sold
    // ==============================================================
    // bestSellers: ngưỡng sold >= 20 đồng nhất với badge "Bán chạy" trong ProductCard
    const bestSellers = [...products]
        .sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0))
        .filter(p => (Number(p.sold) || 0) >= 20)
        .slice(0, 8);

    // products đã sort theo createdAt desc từ hook → lấy 8 mới nhất
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
                        onBuyNow={buyNow}
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
                    onBuyNow={buyNow}
                    isMobile={isMobile}
                />
            </div>
        </div>
    );
}