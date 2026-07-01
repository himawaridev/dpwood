/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Carousel, Col, Row, Skeleton, Typography } from "antd";
import {
    AppstoreOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    GiftOutlined,
    SafetyCertificateOutlined,
    TagsOutlined,
    TruckOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import ProductCard from "@/app/(main)/products/components/ProductCard";

const { Title, Text, Paragraph } = Typography;

const heroSlides = [
    {
        title: "Ceramic Planters Best Quality",
        copy:
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry Lorem Ipsum has been the industry's standard dummy to make a type specimen book.",
        image:
            "https://content.pancake.vn/1/s1903x923/fwebp90/f9/3c/46/f5/92c00e77e081bb1501df20b3befb56b02be82658322739d83ac0dc33-w:1903-h:923-l:90230-t:image/jpeg.jpeg",
    },
    {
        title: "White Embossed Mini Bowls",
        copy:
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry Lorem Ipsum has been the industry's standard dummy to make a type specimen book.",
        image:
            "https://content.pancake.vn/1/s1903x923/fwebp90/2c/06/25/3f/003ab692848486cce231b46b5ead4581690c8022ca73c6fa0d4f7c1b-w:1903-h:923-l:108808-t:image/jpeg.jpeg",
    },
];

const categoryDefinitions = [
    {
        key: "tables",
        title: "Tables",
        search: "ban",
        keywords: ["ban", "table", "desk"],
        fallbackImage:
            "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80",
    },
    {
        key: "seating",
        title: "Seating",
        search: "ghe",
        keywords: ["ghe", "chair", "sofa", "seat", "lounge"],
        fallbackImage:
            "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=900&q=80",
    },
    {
        key: "storage",
        title: "Storage",
        search: "ke tu",
        keywords: ["ke", "tu", "shelf", "cabinet", "console", "storage"],
        fallbackImage:
            "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=900&q=80",
    },
    {
        key: "bedroom",
        title: "Bedroom",
        search: "giuong",
        keywords: ["giuong", "bed", "bedroom"],
        fallbackImage:
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    },
];

const serviceItems = [
    { key: "delivery", icon: <TruckOutlined />, title: "Free Delivery", desc: "Free shipping on all order" },
    { key: "return", icon: <SafetyCertificateOutlined />, title: "Money Return", desc: "Back guarantee in 7 days" },
    { key: "discount", icon: <GiftOutlined />, title: "Member Discount", desc: "Onevery order over $130.00" },
    { key: "support", icon: <CustomerServiceOutlined />, title: "Online Support", desc: "Support 24 hours a day" },
];

const fallbackCoupons = [
    {
        id: "fallback-welcome",
        code: "DPWOOD10",
        description: "Welcome discount for your first DPWOOD order",
        discountType: "percent",
        discountValue: 10,
        minOrderAmount: 1000000,
        maxDiscountAmount: 250000,
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: "fallback-freeship",
        code: "FREESHIP",
        description: "Shipping support for selected furniture orders",
        discountType: "fixed",
        discountValue: 150000,
        minOrderAmount: 2000000,
        maxDiscountAmount: null,
        expiryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: "fallback-member",
        code: "MEMBER15",
        description: "Member reward for curated wooden collections",
        discountType: "percent",
        discountValue: 15,
        minOrderAmount: 3500000,
        maxDiscountAmount: 500000,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

const fallbackBlogs = [
    {
        id: "fallback-blog-table",
        title: "Bringing Joy to Every Table",
        date: "22-9-2025",
        summary:
            "For many, it has become a daily routine to prepare nutritious meals for our families and friends, served on carefully chosen dinnerware.",
        thumbnail:
            "https://content.pancake.vn/web-media/5e/14/d7/aa/adc2fd1c22b942c0ffd5a36bd0d335e933e2bbaa71e58568755accc2-w:380-h:424-l:35375-t:image/jpeg.jpeg",
    },
    {
        id: "fallback-blog-dinner",
        title: "Preparing a Dinner Table for Success",
        date: "22-9-2025",
        summary:
            "Decorating your dinner table is a fun task that can make or break your dinner party. Everyone enjoys a beautifully decorated table.",
        thumbnail:
            "https://content.pancake.vn/web-media/a2/67/18/52/c25935341f996f6544f593f77cbed911323042478acc0198ff1b0dbd-w:380-h:424-l:21403-t:image/jpeg.jpeg",
    },
    {
        id: "fallback-blog-recipes",
        title: "Sweet & Savory Comfort Food Recipes",
        date: "22-9-2025",
        summary:
            "Comfort food does not always look the same. It often looks like a memory in meal form, passed down from someone special.",
        thumbnail:
            "https://content.pancake.vn/web-media/a4/47/67/25/fefcd5c9b916d4f2e67da78a0e4e239fbce4774debaf2d8b24207fcb-w:380-h:424-l:12469-t:image/jpeg.jpeg",
    },
];

const fallbackProducts = [
    {
        id: "fallback-serving-spoons",
        name: "Serving Spoons",
        price: 49000,
        stock: 12,
        imageUrl:
            "https://content.pancake.vn/web-media/81/98/66/19/ec8bfc121e82a52efcf4d4882a8a74aeacb97dc0cd893ce475f3f5fc-w:823-h:1034-l:29602-t:image/webp.webp",
    },
    {
        id: "fallback-cereal-bowls",
        name: "The Cereal Bowls",
        price: 55000,
        stock: 9,
        imageUrl:
            "https://content.pancake.vn/web-media/59/fc/72/63/b9dc3f4abc452f106d33f01b56dc4a46813dd7e2c74da43fbd9b7ea4-w:823-h:1034-l:13324-t:image/webp.webp",
    },
    {
        id: "fallback-mugs",
        name: "The Mugs",
        price: 75000,
        stock: 7,
        imageUrl:
            "https://content.pancake.vn/web-media/38/c4/f5/ae/9988c59ae486dc94ba0d5954d275ab62046838ddc54d7389955febb8-w:823-h:1034-l:13322-t:image/webp.webp",
    },
    {
        id: "fallback-everything-bowls",
        name: "The Everything Bowls",
        price: 45000,
        stock: 16,
        imageUrl:
            "https://content.pancake.vn/web-media/c4/2e/6c/f8/193b233a974e0d8496864dcc7347600e228a72082b8b0c836a4dcba1-w:823-h:1034-l:15118-t:image/webp.webp",
    },
    {
        id: "fallback-serving-set",
        name: "Serving Set",
        price: 105000,
        stock: 6,
        imageUrl:
            "https://content.pancake.vn/web-media/12/be/3b/b9/bdd8929ccb14e2aa64fdecc4e2fa4876c53fa189c1cd9e8e51998429-w:823-h:1034-l:11624-t:image/webp.webp",
    },
    {
        id: "fallback-pasta-bowls",
        name: "The Pasta Bowls",
        price: 69000,
        stock: 10,
        imageUrl:
            "https://content.pancake.vn/web-media/67/fb/13/df/d805f85f506f8c139e71c61e80cb5066678e04705bfc68dc38d84820-w:823-h:1034-l:11222-t:image/webp.webp",
    },
    {
        id: "fallback-flatware",
        name: "Flatware Set",
        price: 230000,
        stock: 8,
        imageUrl:
            "https://content.pancake.vn/web-media/5e/3d/fc/36/e3a202fb971d2ef476b26138ef11043e52e4078479af7fabbc10295f-w:823-h:1034-l:36250-t:image/webp.webp",
    },
    {
        id: "fallback-glassware",
        name: "Glassware Set",
        price: 125000,
        stock: 14,
        imageUrl:
            "https://content.pancake.vn/1/s617x776/fwebp90/d2/18/a3/a7/7edb62840aa27de65bc873672bd4287bdb449a4a89014b9824139ac2-w:823-h:1034-l:58450-t:image/webp.webp",
    },
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

const getProductImage = (product, fallbackImage) =>
    product?.imageUrl || (Array.isArray(product?.images) && product.images[0]) || fallbackImage;

const matchesCategory = (product, category) => {
    const haystack = `${product.name || ""} ${product.description || ""}`.toLowerCase();
    return category.keywords.some((keyword) => haystack.includes(keyword));
};

const formatCompactCurrency = (value) => {
    const numberValue = Number(value || 0);
    if (numberValue >= 1000000) return `${numberValue / 1000000}M`;
    if (numberValue >= 1000) return `${Math.round(numberValue / 1000)}K`;
    return String(numberValue);
};

const getCouponValue = (coupon) =>
    coupon.discountType === "percent"
        ? `${Number(coupon.discountValue)}%`
        : `${formatCompactCurrency(coupon.discountValue)}đ`;

const getDaysLeft = (expiryDate) => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};

export default function LatestProducts() {
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [claimingCouponId, setClaimingCouponId] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchHomepageData = useCallback(async () => {
        try {
            setLoading(true);
            const [productResponse, blogResponse, couponResponse] = await Promise.allSettled([
                api.get("/products", { timeout: 3500 }),
                api.get("/blogs?public=true", { timeout: 3500 }),
                api.get("/coupons/active", { timeout: 3500 }),
            ]);

            if (productResponse.status === "fulfilled") {
                const sortedProducts = [...(productResponse.value.data || [])].sort(
                    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
                );
                setProducts(sortedProducts);
            }

            if (blogResponse.status === "fulfilled") {
                setBlogs((blogResponse.value.data || []).slice(0, 3));
            }

            if (couponResponse.status === "fulfilled") {
                setCoupons((couponResponse.value.data || []).slice(0, 3));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHomepageData();
    }, [fetchHomepageData]);

    const productSource = products.length ? products : fallbackProducts;
    const usingFallbackProducts = !products.length;
    const bestSellerProducts = useMemo(
        () => [...productSource].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0)).slice(0, 8),
        [productSource],
    );
    const catalogProducts = useMemo(() => {
        const expanded = productSource.length >= 12 ? productSource : [...productSource, ...fallbackProducts];
        return expanded.slice(0, 12);
    }, [productSource]);
    const categoryCards = useMemo(
        () =>
            categoryDefinitions.map((category) => {
                const matchedProducts = productSource.filter((product) => matchesCategory(product, category));
                const coverProduct = matchedProducts[0] || productSource[0];

                return {
                    ...category,
                    count: matchedProducts.length,
                    image: getProductImage(coverProduct, category.fallbackImage),
                };
            }),
        [productSource],
    );
    const blogSource = blogs.length ? blogs : fallbackBlogs;
    const couponSource = coupons.length ? coupons.slice(0, 3) : fallbackCoupons;

    const goToProduct = (product) => {
        router.push(usingFallbackProducts ? "/products" : `/products/${product.id}`);
    };

    const handleCouponAction = async (coupon) => {
        try {
            await navigator.clipboard?.writeText(coupon.code);
        } catch {
            // Clipboard can be blocked in some browsers; claiming still proceeds.
        }

        const token = localStorage.getItem("token");
        if (!token || String(coupon.id).startsWith("fallback-")) {
            message.success(`Copied code ${coupon.code}`);
            router.push(token ? "/cart" : "/login");
            return;
        }

        try {
            setClaimingCouponId(coupon.id);
            await api.post("/coupons/claim", { couponId: coupon.id });
            message.success(`Saved code ${coupon.code}`);
            router.push("/cart");
        } catch (error) {
            message.warning(error.response?.data?.message || `Copied code ${coupon.code}`);
        } finally {
            setClaimingCouponId("");
        }
    };

    return (
        <main className="webcake-home">
            <section className="webcake-hero">
                <Carousel autoplay autoplaySpeed={4200} dots draggable pauseOnHover>
                    {heroSlides.map((slide) => (
                        <div key={slide.title}>
                            <div
                                className="webcake-hero-slide"
                                style={{ "--webcake-hero-image": `url(${slide.image})` }}
                            >
                                <div className="webcake-hero-copy">
                                    <Title level={1}>{slide.title}</Title>
                                    <Paragraph>{slide.copy}</Paragraph>
                                    <Button type="primary" onClick={() => router.push("/products")}>
                                        SHOP NOW
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </Carousel>
            </section>

            <section className="webcake-section webcake-category-section">
                <div className="webcake-container">
                    <Title level={2} className="webcake-section-title">
                        Shop By Category
                    </Title>
                    <Row gutter={[30, 30]}>
                        {categoryCards.map((category) => (
                            <Col xs={24} sm={12} lg={6} key={category.key}>
                                <button
                                    type="button"
                                    className="webcake-category-card"
                                    onClick={() => router.push(`/products?search=${encodeURIComponent(category.search)}`)}
                                >
                                    <img src={category.image} alt={category.title} />
                                    <span className="webcake-category-label">
                                        <span className="webcake-category-icon">
                                            <TagsOutlined />
                                        </span>
                                        <strong>{category.title}</strong>
                                        <small>
                                            {category.count || 0} {category.count === 1 ? "item" : "items"}
                                        </small>
                                    </span>
                                </button>
                            </Col>
                        ))}
                    </Row>
                </div>
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
                    ) : (
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
                    )}

                    <div className="webcake-view-all">
                        <Button icon={<AppstoreOutlined />} onClick={() => router.push("/products")}>
                            VIEW ALL PRODUCTS
                        </Button>
                    </div>
                </div>
            </section>

            <section className="webcake-coupon-section" id="special-offers">
                <div className="webcake-container">
                    <Title level={2} className="webcake-section-title">
                        Special Offers
                    </Title>
                    <Row gutter={[24, 24]} justify="center">
                        {couponSource.map((coupon) => (
                            <Col xs={24} md={8} key={coupon.id}>
                                <article className="webcake-coupon-card">
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
                                                )}đ`}
                                        </Paragraph>
                                        <div className="webcake-coupon-meta">
                                            <span>
                                                <ClockCircleOutlined /> {getDaysLeft(coupon.expiryDate)} days
                                            </span>
                                            {coupon.maxDiscountAmount && (
                                                <span>
                                                    <CheckCircleOutlined /> Max{" "}
                                                    {formatCompactCurrency(coupon.maxDiscountAmount)}đ
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            type="primary"
                                            loading={claimingCouponId === coupon.id}
                                            onClick={() => handleCouponAction(coupon)}
                                        >
                                            SAVE CODE
                                        </Button>
                                    </div>
                                </article>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>

            <section className="webcake-section webcake-catalog-section">
                <div className="webcake-container">
                    <Title level={2} className="webcake-section-title">
                        Products
                    </Title>
                    {loading ? (
                        <ProductSkeletonGrid count={12} />
                    ) : (
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
                    )}
                </div>
            </section>

            <section className="webcake-section webcake-blog-section">
                <div className="webcake-container">
                    <Title level={2} className="webcake-section-title">
                        Recent Blogs
                    </Title>
                    <Row gutter={[30, 30]}>
                        {blogSource.map((blog) => (
                            <Col xs={24} md={8} key={blog.id || blog.title}>
                                <article className="webcake-blog-card">
                                    <button
                                        type="button"
                                        className="webcake-blog-image"
                                        onClick={() => router.push(blog.slug ? `/blogs/${blog.slug}` : "/blogs")}
                                    >
                                        <img
                                            src={blog.thumbnail || fallbackBlogs[0].thumbnail}
                                            alt={blog.title || "DPWOOD blog"}
                                        />
                                    </button>
                                    <Text className="webcake-blog-date">{blog.date || "22-9-2025"}</Text>
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
        </main>
    );
}
