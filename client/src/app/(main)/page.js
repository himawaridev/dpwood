"use client";
import { Spin } from "antd";
import { TrophyOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";

import LatestProducts from "@/components/LatestProducts";
import CouponBanner from "@/components/CouponBanner";
import TrustBadges from "@/components/TrustBadges";
import ProductSection from "@/components/ProductSection";
import AuthModal from "@/components/AuthModal";
import WelcomeModal from "@/components/WelcomeModal";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useState, useEffect } from "react";

export default function HomePage() {
    const { products, loading } = useProducts();
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = screens.xs || (screens.sm && !screens.md);
    const { buyNow } = useCart();

    const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(false);
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
    const [dontShowWelcomeAgain, setDontShowWelcomeAgain] = useState(false);
    const [dontShowAuthAgain, setDontShowAuthAgain] = useState(false);
    const [userName, setUserName] = useState("Người dùng");

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const name = typeof window !== "undefined" ? localStorage.getItem("userName") : "";
        setUserName(name || "Người dùng");
        const now = Date.now();

        if (token) {
            const hideWelcomeUntil = localStorage.getItem("hideWelcomeModalUntil");
            if (!hideWelcomeUntil || now > parseInt(hideWelcomeUntil, 10)) {
                setIsWelcomeModalVisible(true);
            }
        } else {
            const hideAuthUntil = localStorage.getItem("hideAuthModalUntil");
            if (!hideAuthUntil || now > parseInt(hideAuthUntil, 10)) {
                setIsAuthModalVisible(true);
            }
        }
    }, []);

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
            
            <AuthModal
                isOpen={isAuthModalVisible}
                onClose={() => {
                    if (dontShowAuthAgain) {
                        localStorage.setItem("hideAuthModalUntil", Date.now() + 6 * 3600000);
                    }
                    setIsAuthModalVisible(false);
                }}
                onLogin={() => router.push("/login")}
                onCheckboxChange={setDontShowAuthAgain}
            />

            <WelcomeModal
                isOpen={isWelcomeModalVisible}
                onClose={() => {
                    if (dontShowWelcomeAgain) {
                        localStorage.setItem("hideWelcomeModalUntil", Date.now() + 6 * 3600000);
                    }
                    setIsWelcomeModalVisible(false);
                }}
                userName={userName}
                onCheckboxChange={setDontShowWelcomeAgain}
            />
        </div>
    );
}