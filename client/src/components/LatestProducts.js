/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Carousel, Col, Row, Skeleton, Typography } from "antd";
import {
    AppstoreOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    GiftOutlined,
    SafetyCertificateOutlined,
    TruckOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import ProductCard from "@/app/(main)/products/components/ProductCard";

const { Title, Text, Paragraph } = Typography;

const serviceItems = [
    { key: "delivery", icon: <TruckOutlined />, title: "Free Delivery", desc: "Free shipping on all order" },
    { key: "return", icon: <SafetyCertificateOutlined />, title: "Money Return", desc: "Back guarantee in 7 days" },
    { key: "discount", icon: <GiftOutlined />, title: "Member Discount", desc: "Onevery order over $130.00" },
    { key: "support", icon: <CustomerServiceOutlined />, title: "Online Support", desc: "Support 24 hours a day" },
];

function ProductSkeletonGrid({ count = 8 }) {
    return (
        <Row gutter={[30, 36]}>
            {Array.from({ length: count }).map((_, index) => (
                <Col xs={12} md={8} lg={6} key={index}>
                    <div className="webcake-product-skeleton">
                        <Skeleton.Image active className="webcake-product-skeleton-image" />
                        <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                </Col>
            ))}
        </Row>
    );
}

function ProductEmptyState({ onRetry }) {
    return (
        <div className="webcake-empty-products">
            <Title level={4}>Chua tai duoc san pham</Title>
            <Paragraph>
                May chu co the dang khoi dong sau thoi gian khong su dung. Vui long thu tai lai du lieu.
            </Paragraph>
            <Button type="primary" onClick={onRetry}>
                Tai lai san pham
            </Button>
        </div>
    );
}

const getProductImage = (product) =>
    product?.imageUrl || (Array.isArray(product?.images) && product.images[0]);

const formatCompactCurrency = (value) => {
    const numberValue = Number(value || 0);
    if (numberValue >= 1000000) return `${numberValue / 1000000}M`;
    if (numberValue >= 1000) return `${Math.round(numberValue / 1000)}K`;
    return String(numberValue);
};

const getCouponValue = (coupon) =>
    coupon.discountType === "percent"
        ? `${Number(coupon.discountValue)}%`
        : `${formatCompactCurrency(coupon.discountValue)}d`;

const getDaysLeft = (expiryDate) => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};

const CLAIMED_COUPONS_KEY = "dpwoodClaimedCouponKeys";

const getCouponClaimKeys = (coupon) =>
    [coupon?.id, coupon?.code].filter(Boolean).map((value) => String(value));

const readStoredClaimedCoupons = () => {
    if (typeof window === "undefined") return new Set();
    try {
        const rawValue = localStorage.getItem(CLAIMED_COUPONS_KEY) || "[]";
        return new Set(JSON.parse(rawValue).map(String));
    } catch {
        return new Set();
    }
};

const writeStoredClaimedCoupons = (keys) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CLAIMED_COUPONS_KEY, JSON.stringify([...keys]));
};

const getClaimedKeysFromWallet = (walletItems = []) => {
    const keys = new Set();
    walletItems.forEach((item) => {
        [item.couponId, item.Coupon?.id, item.Coupon?.code].filter(Boolean).forEach((value) => {
            keys.add(String(value));
        });
    });
    return keys;
};

const wait = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const fetchProductsWithWakeRetry = async () => {
    const maxAttempts = 12;
    const retryDelayMs = 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const response = await api.get("/products", { timeout: 15000 });
            return [...(response.data || [])].sort(
                (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            await wait(retryDelayMs);
        }
    }

    return [];
};

export default function LatestProducts() {
    const { message } = App.useApp();
    const router = useRouter();
    const couponCarouselRef = useRef(null);
    const [products, setProducts] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [claimedCouponIds, setClaimedCouponIds] = useState(new Set());
    const [claimingCouponId, setClaimingCouponId] = useState("");
    const [couponSlideIndex, setCouponSlideIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchHomepageData = useCallback(async () => {
        try {
            setLoading(true);
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const storedClaimedCoupons = readStoredClaimedCoupons();
            setClaimedCouponIds(storedClaimedCoupons);

            const [productResponse, blogResponse, couponResponse] = await Promise.allSettled([
                fetchProductsWithWakeRetry(),
                api.get("/blogs?public=true", { timeout: 12000 }),
                api.get("/coupons/active", { timeout: 12000 }),
            ]);

            if (productResponse.status === "fulfilled") {
                setProducts(productResponse.value);
            } else {
                setProducts([]);
            }

            if (blogResponse.status === "fulfilled") {
                setBlogs((blogResponse.value.data || []).slice(0, 3));
            } else {
                setBlogs([]);
            }

            if (couponResponse.status === "fulfilled") {
                setCoupons(couponResponse.value.data || []);
            } else {
                setCoupons([]);
            }

            if (token) {
                const myCouponResponse = await api.get("/coupons/my").catch(() => ({ data: [] }));
                const nextClaimedCoupons = new Set([
                    ...storedClaimedCoupons,
                    ...getClaimedKeysFromWallet(myCouponResponse.data || []),
                ]);
                setClaimedCouponIds(nextClaimedCoupons);
                writeStoredClaimedCoupons(nextClaimedCoupons);
            } else {
                setClaimedCouponIds(storedClaimedCoupons);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHomepageData();
    }, [fetchHomepageData]);

    useEffect(() => {
        setCouponSlideIndex(0);
        couponCarouselRef.current?.goTo?.(0, true);
    }, [coupons.length]);

    const bestSellerProducts = useMemo(
        () => [...products].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0)).slice(0, 8),
        [products],
    );

    const catalogProducts = useMemo(() => products.slice(0, 12), [products]);

    const couponSource = coupons;
    const blogSource = blogs.filter((blog) => blog?.title);
    const heroProducts = useMemo(
        () =>
            [...products]
                .filter((product) => getProductImage(product))
                .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
                .slice(0, 3)
                .map((product, index) => ({
                    key: product.id || `${product.name}-${index}`,
                    product,
                    title: product.name || "DPWOOD Collection",
                    copy:
                        product.description ||
                        "Selected wooden furniture with clean lines, warm materials and everyday comfort.",
                    image: getProductImage(product),
                    price: Number(product.price || 0),
                })),
        [products],
    );

    const goToProduct = (product) => {
        if (!product?.id) return;
        router.push(`/products/${product.id}`);
    };

    const handleCouponAction = async (coupon) => {
        const couponClaimKeys = getCouponClaimKeys(coupon);
        const isCouponClaimed = couponClaimKeys.some((key) => claimedCouponIds.has(key));

        if (isCouponClaimed) {
            message.info(`Ban da lay ma ${coupon.code} roi.`);
            return;
        }

        try {
            await navigator.clipboard?.writeText(coupon.code);
        } catch {
            // Clipboard can be blocked in some browsers; claiming still proceeds.
        }

        const token = localStorage.getItem("token");
        if (!token) {
            message.success(`Da sao chep ma ${coupon.code}`);
            message.warning("Vui long dang nhap de luu ma vao tai khoan.");
            return;
        }

        try {
            setClaimingCouponId(coupon.id);
            await api.post("/coupons/claim", { couponId: coupon.id });
            setClaimedCouponIds((prev) => {
                const next = new Set([...prev, ...couponClaimKeys]);
                writeStoredClaimedCoupons(next);
                return next;
            });
            message.success(`Da lay ma ${coupon.code}`);
        } catch (error) {
            message.warning(error.response?.data?.message || `Da sao chep ma ${coupon.code}`);
            const myCouponResponse = await api.get("/coupons/my").catch(() => ({ data: [] }));
            const nextClaimedCoupons = new Set([
                ...readStoredClaimedCoupons(),
                ...getClaimedKeysFromWallet(myCouponResponse.data || []),
            ]);
            setClaimedCouponIds(nextClaimedCoupons);
            writeStoredClaimedCoupons(nextClaimedCoupons);
        } finally {
            setClaimingCouponId("");
        }
    };

    return (
        <main className="webcake-home">
            <section className="webcake-hero">
                <Carousel autoplay autoplaySpeed={4200} dots draggable pauseOnHover>
                    {heroProducts.map((slide) => (
                        <div key={slide.key}>
                            <div
                                className="webcake-hero-slide"
                                style={{ "--webcake-hero-image": `url(${slide.image})` }}
                            >
                                <div className="webcake-hero-copy">
                                    <span className="webcake-hero-eyebrow">Featured Product</span>
                                    <Title level={1}>{slide.title}</Title>
                                    <Paragraph className="dp-line-clamp-2">{slide.copy}</Paragraph>
                                    <Text className="webcake-hero-price">
                                        {slide.price.toLocaleString("vi-VN")}d
                                    </Text>
                                    <Button type="primary" onClick={() => goToProduct(slide.product)}>
                                        SHOP NOW
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!heroProducts.length && loading && (
                        <div>
                            <div className="webcake-hero-slide webcake-hero-empty">
                                <div className="webcake-hero-copy">
                                    <Skeleton active paragraph={{ rows: 3 }} title={{ width: "70%" }} />
                                </div>
                            </div>
                        </div>
                    )}
                    {!heroProducts.length && !loading && (
                        <div>
                            <div className="webcake-hero-slide webcake-hero-empty">
                                <div className="webcake-hero-copy">
                                    <span className="webcake-hero-eyebrow">DPWOOD Collection</span>
                                    <Title level={1}>Wooden furniture for everyday living</Title>
                                    <Paragraph>Browse curated wooden furniture from DPWOOD.</Paragraph>
                                    <Button type="primary" onClick={() => router.push("/products")}>
                                        SHOP NOW
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Carousel>
            </section>

            <section className="webcake-services">
                <div className="webcake-container">
                    <Row gutter={[24, 24]}>
                        {serviceItems.map((item) => (
                            <Col xs={12} lg={6} key={item.key}>
                                <div className="webcake-service-item">
                                    <span className="webcake-service-icon">{item.icon}</span>
                                    <div>
                                        <Text strong>{item.title}</Text>
                                        <Text type="secondary">{item.desc}</Text>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>

            <section className="webcake-section">
                <div className="webcake-container">
                    <div className="webcake-section-head">
                        <Title level={2} className="webcake-section-title">
                            Best Sellers
                        </Title>
                    </div>

                    {loading ? (
                        <ProductSkeletonGrid />
                    ) : bestSellerProducts.length ? (
                        <Row gutter={[30, 36]}>
                            {bestSellerProducts.map((product) => (
                                <Col xs={12} md={8} lg={6} key={product.id}>
                                    <ProductCard
                                        product={product}
                                        badge="icon-only"
                                        onBuyNow={() => goToProduct(product)}
                                        onClickDetail={() => goToProduct(product)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <ProductEmptyState onRetry={fetchHomepageData} />
                    )}

                    <div className="webcake-view-all">
                        <Button icon={<AppstoreOutlined />} onClick={() => router.push("/products")}>
                            VIEW ALL PRODUCTS
                        </Button>
                    </div>
                </div>
            </section>

            {couponSource.length > 0 && (
                <section className="webcake-coupon-section" id="special-offers">
                    <div className="webcake-container">
                        <Title level={2} className="webcake-section-title">
                            Special Offers
                        </Title>
                        <Carousel
                            ref={couponCarouselRef}
                            className="webcake-coupon-carousel"
                            dots={false}
                            draggable
                            infinite={couponSource.length > 3}
                            slidesToShow={Math.min(3, couponSource.length)}
                            slidesToScroll={1}
                            afterChange={(current) =>
                                setCouponSlideIndex(couponSource.length ? current % couponSource.length : 0)
                            }
                            responsive={[
                                {
                                    breakpoint: 992,
                                    settings: {
                                        slidesToShow: Math.min(2, couponSource.length),
                                    },
                                },
                                {
                                    breakpoint: 576,
                                    settings: {
                                        slidesToShow: 1,
                                    },
                                },
                            ]}
                        >
                            {couponSource.map((coupon) => {
                                const isCouponClaimed = getCouponClaimKeys(coupon).some((key) =>
                                    claimedCouponIds.has(key),
                                );

                                return (
                                    <div key={coupon.id} className="webcake-coupon-slide">
                                        <article
                                            className={`webcake-coupon-card ${
                                                isCouponClaimed ? "webcake-coupon-card-claimed" : ""
                                            }`}
                                        >
                                            <div className="webcake-coupon-value">
                                                <GiftOutlined />
                                                <strong>{getCouponValue(coupon)}</strong>
                                                <span>OFF</span>
                                            </div>
                                            <div className="webcake-coupon-content">
                                                <Text className="webcake-coupon-code">{coupon.code}</Text>
                                                <Paragraph>
                                                    {coupon.description ||
                                                        `Orders from ${new Intl.NumberFormat("vi-VN").format(
                                                            coupon.minOrderAmount || 0,
                                                        )}d`}
                                                </Paragraph>
                                                <div className="webcake-coupon-meta">
                                                    <span>
                                                        <ClockCircleOutlined /> {getDaysLeft(coupon.expiryDate)} days
                                                    </span>
                                                    {coupon.maxDiscountAmount && (
                                                        <span>
                                                            <CheckCircleOutlined /> Max{" "}
                                                            {formatCompactCurrency(coupon.maxDiscountAmount)}d
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    type={isCouponClaimed ? "default" : "primary"}
                                                    icon={isCouponClaimed ? <CheckCircleOutlined /> : null}
                                                    disabled={isCouponClaimed}
                                                    loading={claimingCouponId === coupon.id}
                                                    onClick={() => handleCouponAction(coupon)}
                                                >
                                                    {isCouponClaimed ? "DA LAY MA" : "SAVE CODE"}
                                                </Button>
                                            </div>
                                        </article>
                                    </div>
                                );
                            })}
                        </Carousel>
                        {couponSource.length > 1 && (
                            <div className="webcake-coupon-custom-dots" aria-label="Coupon carousel navigation">
                                {couponSource.map((coupon, index) => (
                                    <button
                                        key={coupon.id || coupon.code || index}
                                        type="button"
                                        aria-label={`Go to coupon ${index + 1}`}
                                        aria-current={couponSlideIndex === index ? "true" : undefined}
                                        className={couponSlideIndex === index ? "is-active" : ""}
                                        onClick={() => {
                                            couponCarouselRef.current?.goTo?.(index);
                                            setCouponSlideIndex(index);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            <section className="webcake-section webcake-catalog-section">
                <div className="webcake-container">
                    <Title level={2} className="webcake-section-title">
                        Products
                    </Title>
                    {loading ? (
                        <ProductSkeletonGrid count={12} />
                    ) : catalogProducts.length ? (
                        <Row gutter={[30, 36]}>
                            {catalogProducts.map((product, index) => (
                                <Col xs={12} md={8} lg={6} key={`${product.id}-${index}`}>
                                    <ProductCard
                                        product={product}
                                        onBuyNow={() => goToProduct(product)}
                                        onClickDetail={() => goToProduct(product)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <ProductEmptyState onRetry={fetchHomepageData} />
                    )}
                </div>
            </section>

            <div className="webcake-container">
                <div className="webcake-section-divider" aria-hidden="true" />
            </div>

            {blogSource.length > 0 && (
                <section className="webcake-section webcake-blog-section">
                    <div className="webcake-container">
                        <Title level={2} className="webcake-section-title">
                            Recent Blogs
                        </Title>
                        <Row gutter={[30, 30]}>
                            {blogSource.map((blog) => (
                                <Col xs={24} md={8} key={blog.id || blog.title}>
                                    <article className="webcake-blog-card">
                                        {blog.thumbnail && (
                                            <button
                                                type="button"
                                                className="webcake-blog-image"
                                                onClick={() => router.push(blog.slug ? `/blogs/${blog.slug}` : "/blogs")}
                                            >
                                                <img src={blog.thumbnail} alt={blog.title || "DPWOOD blog"} />
                                            </button>
                                        )}
                                        <Text className="webcake-blog-date">{blog.date || "DPWOOD"}</Text>
                                        <Title level={4}>{blog.title}</Title>
                                        <Paragraph>{blog.summary}</Paragraph>
                                        <Button
                                            type="link"
                                            onClick={() => router.push(blog.slug ? `/blogs/${blog.slug}` : "/blogs")}
                                        >
                                            Read <ArrowRightOutlined />
                                        </Button>
                                    </article>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </section>
            )}
        </main>
    );
}
