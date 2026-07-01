"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Carousel, Col, Empty, Row, Skeleton, Space, Tag, Typography } from "antd";
import {
    ArrowRightOutlined,
    CheckCircleOutlined,
    CreditCardOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
    TruckOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import ProductCard from "@/app/(main)/products/components/ProductCard";

const { Title, Text, Paragraph } = Typography;

const fallbackHeroImage =
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

function ProductSkeletonGrid() {
    return (
        <Row gutter={[20, 20]}>
            {Array.from({ length: 4 }).map((_, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                    <div className="dp-panel" style={{ padding: 16 }}>
                        <Skeleton.Image active style={{ width: "100%", height: 220 }} />
                        <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 16 }} />
                    </div>
                </Col>
            ))}
        </Row>
    );
}

export default function LatestProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();

    const fetchLatestProducts = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            const res = await api.get("/products");
            const sortedProducts = [...(res.data || [])].sort(
                (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );
            setProducts(sortedProducts);
        } catch (error) {
            setProducts([]);
            setErrorMessage(error.response?.data?.message || error.message || "Không thể tải sản phẩm.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLatestProducts();
    }, [fetchLatestProducts]);

    const latestProducts = useMemo(() => products.slice(0, 8), [products]);
    const heroSlides = useMemo(() => {
        const productSlides = products.slice(0, 5).map((product, index) => ({
            key: product.id,
            eyebrow: index === 0 ? "Bộ sưu tập mới" : "Gợi ý cho bạn",
            title: product.name,
            description:
                product.description ||
                "Khám phá sản phẩm nội thất gỗ chọn lọc, tồn kho rõ ràng và thanh toán thuận tiện.",
            imageUrl: product.imageUrl || fallbackHeroImage,
            price: product.price,
            stock: product.stock,
            productId: product.id,
        }));

        if (productSlides.length) return productSlides;

        return [
            {
                key: "fallback",
                eyebrow: "Bộ sưu tập mới",
                title: "Nội thất gỗ chọn lọc cho không gian sống hiện đại",
                description:
                    "Khám phá sản phẩm nổi bật, xem tồn kho rõ ràng và hoàn tất đơn hàng bằng COD hoặc QR PayOS ngay trên website.",
                imageUrl: fallbackHeroImage,
                price: null,
                stock: null,
                productId: null,
            },
        ];
    }, [products]);

    return (
        <div className="dp-page">
            <div className="dp-container">
                <section className="dp-panel dp-home-hero-slider">
                    {loading ? (
                        <div className="dp-home-slide dp-home-slide-loading">
                            <Skeleton active paragraph={{ rows: 4 }} />
                        </div>
                    ) : (
                        <Carousel autoplay autoplaySpeed={3600} draggable dots pauseOnHover>
                            {heroSlides.map((slide) => (
                                <div key={slide.key}>
                                    <div
                                        className="dp-home-slide"
                                        style={{ "--hero-image": `url(${slide.imageUrl})` }}
                                    >
                                        <div className="dp-home-slide-content">
                                            <span className="dp-eyebrow dp-home-slide-eyebrow">
                                                {slide.eyebrow}
                                            </span>
                                            <Title level={1} className="dp-home-slide-title">
                                                {slide.title}
                                            </Title>
                                            <Paragraph className="dp-home-slide-copy">
                                                {slide.description}
                                            </Paragraph>
                                            <Space size={12} wrap className="dp-home-slide-actions">
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    icon={<ArrowRightOutlined />}
                                                    onClick={() =>
                                                        slide.productId
                                                            ? router.push(`/products/${slide.productId}`)
                                                            : router.push("/products")
                                                    }
                                                >
                                                    Xem sản phẩm
                                                </Button>
                                                <Button size="large" onClick={() => router.push("/products")}>
                                                    Khám phá bộ sưu tập
                                                </Button>
                                            </Space>
                                        </div>

                                        <div className="dp-home-slide-meta">
                                            <Tag
                                                color={slide.stock > 0 ? "success" : "default"}
                                                icon={<CheckCircleOutlined />}
                                            >
                                                {slide.stock > 0 ? "Còn hàng" : "Sản phẩm nổi bật"}
                                            </Tag>
                                            <Text className="dp-home-slide-price">
                                                {slide.price ? formatCurrency(slide.price) : "DPWOOD"}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Carousel>
                    )}
                </section>

                <section className="dp-home-proof-row">
                    {[
                        { icon: <TruckOutlined />, label: "Giao hàng rõ trạng thái" },
                        { icon: <CreditCardOutlined />, label: "COD hoặc QR PayOS" },
                        { icon: <SafetyCertificateOutlined />, label: "Giá tính lại từ hệ thống" },
                    ].map((item) => (
                        <div className="dp-home-proof-item" key={item.label}>
                            <span>{item.icon}</span>
                            <Text>{item.label}</Text>
                        </div>
                    ))}
                </section>

                <section className="dp-section">
                    <div className="dp-section-heading-row">
                        <div>
                            <span className="dp-eyebrow">Sản phẩm mới</span>
                            <Title level={2} className="dp-section-title">
                                Vừa cập nhật
                            </Title>
                        </div>
                        <Button icon={<ArrowRightOutlined />} onClick={() => router.push("/products")}>
                            Xem tất cả
                        </Button>
                    </div>

                    {loading ? (
                        <ProductSkeletonGrid />
                    ) : errorMessage ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Chưa tải được dữ liệu sản phẩm"
                            description="Backend hoặc database có thể chưa sẵn sàng. Bạn có thể thử tải lại sau khi Docker server chạy ổn định."
                            action={
                                <Button icon={<ReloadOutlined />} onClick={fetchLatestProducts}>
                                    Thử lại
                                </Button>
                            }
                        />
                    ) : latestProducts.length ? (
                        <Row gutter={[20, 20]}>
                            {latestProducts.map((product) => (
                                <Col xs={24} sm={12} lg={6} key={product.id}>
                                    <ProductCard
                                        product={product}
                                        onBuyNow={() => router.push(`/products/${product.id}`)}
                                        onClickDetail={() => router.push(`/products/${product.id}`)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div className="dp-panel" style={{ padding: 44 }}>
                            <Empty
                                description={
                                    <span>
                                        Database đang trống. Sau khi thêm sản phẩm trong admin, danh sách sẽ hiện ở đây.
                                    </span>
                                }
                            />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
