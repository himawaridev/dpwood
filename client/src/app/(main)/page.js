"use client";
import { useEffect, useState } from "react";
import { Spin, Typography, Button, Card, Flex, Row, Col, Tag } from "antd";
import {
    ArrowRightOutlined,
    AppstoreOutlined,
    SafetyCertificateOutlined,
    TruckOutlined,
    CustomerServiceOutlined,
    StarFilled,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";
import LatestProducts from "@/components/LatestProducts";
import CouponBanner from "@/components/CouponBanner";
import { useProducts } from "@/hooks/useProducts";
import api from "@/utils/axios";

// Import các Component Modal đã chia nhỏ
import AuthModal from "@/components/AuthModal";
import WelcomeModal from "@/components/WelcomeModal";

const { Title, Text, Paragraph } = Typography;

// Reusable product card for featured/bestseller sections
function ProductCard({ product, isMobile }) {
    const router = useRouter();
    const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price);

    return (
        <Card
            hoverable
            onClick={() => router.push(`/products/${product.id}`)}
            cover={
                <div style={{ overflow: "hidden", height: isMobile ? 180 : 240 }}>
                    <img
                        alt={product.name}
                        src={product.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.5s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                </div>
            }
            styles={{
                body: { padding: isMobile ? "12px" : "16px" },
            }}
            style={{
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #f0f0f0",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                transition: "all 0.3s ease",
                height: "100%",
            }}
        >
            <Text
                strong
                style={{
                    fontSize: isMobile ? 14 : 15,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.4,
                    minHeight: isMobile ? 39 : 42,
                }}
            >
                {product.name}
            </Text>
            <Flex align="center" justify="space-between" style={{ marginTop: 10 }}>
                <Text
                    strong
                    style={{
                        fontSize: isMobile ? 16 : 18,
                        color: "#cf1322",
                    }}
                >
                    {formatPrice(product.price)}₫
                </Text>
                {product.sold > 0 && (
                    <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
                        <StarFilled style={{ color: "#faad14", marginRight: 3 }} />
                        Đã bán {product.sold}
                    </Text>
                )}
            </Flex>
        </Card>
    );
}

// Features/trust badges section
function TrustBadges({ isMobile }) {
    const badges = [
        {
            icon: <TruckOutlined style={{ fontSize: 28, color: "#1677ff" }} />,
            title: "Giao hàng toàn quốc",
            desc: "Miễn phí vận chuyển cho đơn từ 500K",
        },
        {
            icon: <SafetyCertificateOutlined style={{ fontSize: 28, color: "#52c41a" }} />,
            title: "Cam kết chất lượng",
            desc: "Gỗ nhập khẩu chính hãng 100%",
        },
        {
            icon: <CustomerServiceOutlined style={{ fontSize: 28, color: "#fa8c16" }} />,
            title: "Hỗ trợ 24/7",
            desc: "Tư vấn miễn phí mọi lúc",
        },
        {
            icon: <AppstoreOutlined style={{ fontSize: 28, color: "#722ed1" }} />,
            title: "Đa dạng mẫu mã",
            desc: "Hơn 500+ sản phẩm gỗ cao cấp",
        },
    ];

    return (
        <div
            style={{
                width: "100vw",
                marginLeft: "calc(-50vw + 50%)",
                background: "#fff",
                borderTop: "1px solid #f0f0f0",
                borderBottom: "1px solid #f0f0f0",
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: isMobile ? "24px 16px" : "36px 24px",
                }}
            >
                <Row gutter={[16, 16]}>
                    {badges.map((badge, idx) => (
                        <Col xs={12} sm={12} md={6} key={idx}>
                            <Flex
                                align="center"
                                gap={isMobile ? 10 : 14}
                                style={{
                                    padding: isMobile ? "8px 0" : "12px 0",
                                }}
                            >
                                <div
                                    style={{
                                        width: isMobile ? 44 : 56,
                                        height: isMobile ? 44 : 56,
                                        borderRadius: 14,
                                        background: "#f5f5f5",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {badge.icon}
                                </div>
                                <div>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: isMobile ? 13 : 14,
                                            display: "block",
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {badge.title}
                                    </Text>
                                    {!isMobile && (
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: "#8c8c8c",
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {badge.desc}
                                        </Text>
                                    )}
                                </div>
                            </Flex>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
}

// Product grid section
function ProductSection({ title, products, isMobile, showViewAll = true }) {
    const router = useRouter();

    if (!products || products.length === 0) return null;

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px" : "0 24px" }}>
            <Flex
                align="center"
                justify="space-between"
                style={{ marginBottom: isMobile ? 16 : 20 }}
            >
                <Title
                    level={isMobile ? 5 : 4}
                    style={{
                        margin: 0,
                        color: "#141414",
                        fontWeight: 700,
                    }}
                >
                    {title}
                </Title>
                {showViewAll && (
                    <Button
                        type="link"
                        onClick={() => router.push("/products")}
                        style={{ fontWeight: 500, fontSize: 14, padding: 0 }}
                    >
                        Xem tất cả <ArrowRightOutlined />
                    </Button>
                )}
            </Flex>

            <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
                {products.map((product) => (
                    <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                        <ProductCard product={product} isMobile={isMobile} />
                    </Col>
                ))}
            </Row>
        </div>
    );
}

export default function HomePage() {
    const router = useRouter();
    const { products } = useProducts();
    const screens = useBreakpoint();
    const isMobile = screens.xs || (screens.sm && !screens.md);

    const [authState, setAuthState] = useState({
        isAuth: false,
        userName: "",
        loading: true,
    });

    const [activeNotifications, setActiveNotifications] = useState([]);

    // States cho Modal
    const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(false);
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

    const [dontShowWelcomeAgain, setDontShowWelcomeAgain] = useState(false);
    const [dontShowAuthAgain, setDontShowAuthAgain] = useState(false);

    useEffect(() => {
        // Lấy danh sách thông báo động
        const fetchNotifications = async () => {
            try {
                const res = await api.get("/notifications/active");
                setActiveNotifications(res.data);
            } catch (error) {
                console.error("Lỗi lấy thông báo:", error);
            }
        };
        fetchNotifications();

        const checkAuthTimeout = setTimeout(() => {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const name = typeof window !== "undefined" ? localStorage.getItem("userName") : "";
            const now = Date.now();

            setAuthState({
                isAuth: !!token,
                userName: name || "Người dùng",
                loading: false,
            });

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
        }, 0);

        return () => clearTimeout(checkAuthTimeout);
    }, []);

    const handleCloseWelcomeModal = () => {
        if (dontShowWelcomeAgain) {
            const expireTime = Date.now() + 6 * 60 * 60 * 1000;
            localStorage.setItem("hideWelcomeModalUntil", expireTime.toString());
        }
        setIsWelcomeModalVisible(false);
    };

    const handleCloseAuthModal = () => {
        if (dontShowAuthAgain) {
            const expireTime = Date.now() + 6 * 60 * 60 * 1000;
            localStorage.setItem("hideAuthModalUntil", expireTime.toString());
        }
        setIsAuthModalVisible(false);
    };

    if (authState.loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
                <Spin size="large" />
            </div>
        );
    }

    // Derive product sections from available products
    const bestSellers = [...products]
        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
        .slice(0, 8);

    const allProducts = products.slice(0, 8);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Hero Banner - Full width */}
            <LatestProducts />

            {/* Trust Badges */}
            <TrustBadges isMobile={isMobile} />

            {/* Coupon Banner */}
            <div style={{ marginTop: isMobile ? 20 : 32 }}>
                <CouponBanner />
            </div>

            {/* Best Sellers Section */}
            <div style={{ marginTop: isMobile ? 12 : 24, marginBottom: isMobile ? 20 : 32 }}>
                <ProductSection
                    title="🔥 Bán chạy nhất"
                    products={bestSellers}
                    isMobile={isMobile}
                />
            </div>

            {/* All Products Section */}
            <div
                style={{
                    width: "100vw",
                    marginLeft: "calc(-50vw + 50%)",
                    background: "#fff",
                    padding: isMobile ? "24px 0" : "40px 0",
                    marginBottom: 0,
                }}
            >
                <ProductSection
                    title="🛒 Tất cả sản phẩm"
                    products={allProducts}
                    isMobile={isMobile}
                />
            </div>

            {/* CTA Banner */}
            <div
                style={{
                    width: "100vw",
                    marginLeft: "calc(-50vw + 50%)",
                    background: "linear-gradient(135deg, #001529 0%, #003a8c 100%)",
                    padding: isMobile ? "40px 20px" : "60px 24px",
                    textAlign: "center",
                }}
            >
                <div style={{ maxWidth: 700, margin: "0 auto" }}>
                    <Title
                        level={isMobile ? 4 : 3}
                        style={{
                            color: "#fff",
                            margin: 0,
                            fontWeight: 700,
                        }}
                    >
                        Khám phá bộ sưu tập gỗ cao cấp
                    </Title>
                    <Paragraph
                        style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: isMobile ? 14 : 16,
                            marginTop: 12,
                            marginBottom: 24,
                        }}
                    >
                        Hàng trăm sản phẩm nội thất từ gỗ nhập khẩu chính hãng, đa dạng mẫu mã,
                        phù hợp mọi không gian sống.
                    </Paragraph>
                    <Flex gap={12} justify="center" wrap="wrap">
                        <Button
                            type="primary"
                            size="large"
                            icon={<AppstoreOutlined />}
                            onClick={() => router.push("/products")}
                            style={{
                                borderRadius: 12,
                                fontWeight: 600,
                                height: 48,
                                padding: "0 32px",
                                fontSize: 15,
                                boxShadow: "0 4px 20px rgba(22,119,255,0.4)",
                            }}
                        >
                            Xem sản phẩm
                        </Button>
                        <Button
                            size="large"
                            ghost
                            icon={<CustomerServiceOutlined />}
                            onClick={() => router.push("/support")}
                            style={{
                                borderRadius: 12,
                                fontWeight: 600,
                                height: 48,
                                padding: "0 32px",
                                fontSize: 15,
                                borderColor: "rgba(255,255,255,0.4)",
                                color: "#fff",
                            }}
                        >
                            Liên hệ tư vấn
                        </Button>
                    </Flex>
                </div>
            </div>

            {/* Modals */}
            <AuthModal
                isOpen={isAuthModalVisible}
                onClose={handleCloseAuthModal}
                onLogin={() => router.push("/login")}
                onCheckboxChange={setDontShowAuthAgain}
            />

            <WelcomeModal
                isOpen={isWelcomeModalVisible}
                onClose={handleCloseWelcomeModal}
                userName={authState.userName}
                onCheckboxChange={setDontShowWelcomeAgain}
                notifications={activeNotifications}
            />
        </div>
    );
}
