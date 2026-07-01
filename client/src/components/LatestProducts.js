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

const categoryDefinitions = [
    {
        key: "tables",
        title: "Bàn gỗ",
        search: "ban",
        keywords: ["ban", "table", "desk", "dining"],
        fallbackImage:
            "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80",
    },
    {
        key: "seating",
        title: "Ghế & sofa",
        search: "ghe",
        keywords: ["ghe", "chair", "sofa", "seat", "lounge", "bench"],
        fallbackImage:
            "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=900&q=80",
    },
    {
        key: "storage",
        title: "Kệ tủ",
        search: "ke tu",
        keywords: ["ke", "tu", "shelf", "cabinet", "console", "storage", "wardrobe"],
        fallbackImage:
            "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=900&q=80",
    },
    {
        key: "bedroom",
        title: "Phòng ngủ",
        search: "giuong",
        keywords: ["giuong", "bed", "bedroom", "nightstand", "tab dau giuong"],
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
        id: "fallback-oak-table",
        name: "Bàn gỗ sồi Nordic",
        description: "Bàn ăn gỗ sồi tự nhiên cho không gian bếp và phòng ăn hiện đại.",
        price: 4200000,
        stock: 12,
        sold: 18,
        imageUrl:
            "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "fallback-dining-chair",
        name: "Ghế ăn Vienna",
        description: "Ghế gỗ thanh mảnh, dễ phối với bàn ăn và bàn làm việc.",
        price: 1250000,
        stock: 9,
        sold: 22,
        imageUrl:
            "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "fallback-storage-cabinet",
        name: "Kệ tủ Oakline",
        description: "Kệ tủ lưu trữ gỗ sáng màu, phù hợp phòng khách và góc làm việc.",
        price: 3600000,
        stock: 7,
        sold: 11,
        imageUrl:
            "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "fallback-wood-bed",
        name: "Giường gỗ Minimal",
        description: "Giường ngủ gỗ tự nhiên, thiết kế thấp và gọn cho phòng ngủ ấm áp.",
        price: 6900000,
        stock: 16,
        sold: 8,
        imageUrl:
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "fallback-coffee-table",
        name: "Bàn trà Mori",
        description: "Bàn trà gỗ thấp, mặt vuông gọn đẹp cho phòng khách.",
        price: 2400000,
        stock: 6,
        sold: 15,
        imageUrl:
            "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "fallback-wood-sofa",
        name: "Sofa gỗ Nordic",
        description: "Sofa khung gỗ, đệm vải trung tính cho phòng khách tối giản.",
        price: 7800000,
        stock: 10,
        sold: 9,
        imageUrl:
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "fallback-shoe-cabinet",
        name: "Tủ giày Modern",
        description: "Tủ giày gỗ nhiều ngăn, giữ lối vào nhà gọn gàng.",
        price: 3100000,
        stock: 8,
        sold: 13,
        imageUrl:
            "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "fallback-nightstand",
        name: "Tủ đầu giường Lira",
        description: "Tủ nhỏ cạnh giường với vân gỗ ấm và ngăn kéo tiện dụng.",
        price: 1750000,
        stock: 14,
        sold: 10,
        imageUrl:
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
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

const normalizeText = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();

const matchesCategory = (product, category) => {
    const haystack = normalizeText(`${product.name || ""} ${product.description || ""}`);
    return category.keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
};

const createCollectionCards = (products) => {
    const productsWithImages = products.filter((product) => getProductImage(product));
    const newest = [...productsWithImages].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
    const bestSellers = [...productsWithImages].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
    const inStock = productsWithImages.filter((product) => Number(product.stock || 0) > 0);
    const premium = [...productsWithImages].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));

    return [
        {
            key: "new-arrivals",
            title: "Hàng mới",
            subtitle: "Vừa cập nhật",
            count: newest.length,
            image: getProductImage(newest[0], categoryDefinitions[0].fallbackImage),
            href: "/products",
        },
        {
            key: "best-sellers",
            title: "Bán chạy",
            subtitle: "Được chọn nhiều",
            count: bestSellers.length,
            image: getProductImage(bestSellers[0], categoryDefinitions[1].fallbackImage),
            href: "/products?search=",
        },
        {
            key: "in-stock",
            title: "Có sẵn",
            subtitle: "Sẵn sàng giao",
            count: inStock.length,
            image: getProductImage(inStock[0], categoryDefinitions[2].fallbackImage),
            href: "/products",
        },
        {
            key: "premium-wood",
            title: "Nội thất gỗ",
            subtitle: "Chọn lọc DPWOOD",
            count: premium.length,
            image: getProductImage(premium[0], categoryDefinitions[3].fallbackImage),
            href: "/products",
        },
    ].filter((card) => card.count > 0 && card.image);
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

export default function LatestProducts() {
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [claimedCouponIds, setClaimedCouponIds] = useState(new Set());
    const [claimingCouponId, setClaimingCouponId] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchHomepageData = useCallback(async () => {
        try {
            setLoading(true);
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const storedClaimedCoupons = readStoredClaimedCoupons();
            setClaimedCouponIds(storedClaimedCoupons);
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
    const categoryCards = useMemo(() => {
        const matchedCards = categoryDefinitions
            .map((category) => {
                const matchedProducts = productSource.filter((product) => matchesCategory(product, category));
                const coverProduct =
                    matchedProducts.find((product) => getProductImage(product)) || matchedProducts[0];

                return {
                    ...category,
                    subtitle: "Xem danh mục",
                    count: matchedProducts.length,
                    image: getProductImage(coverProduct, category.fallbackImage),
                    href: `/products?search=${encodeURIComponent(category.search)}`,
                };
            })
            .filter((category) => category.count > 0);

        if (matchedCards.length >= 3) return matchedCards.slice(0, 4);

        const collectionCards = createCollectionCards(productSource);
        const existingKeys = new Set(matchedCards.map((card) => card.key));
        const mergedCards = [
            ...matchedCards,
            ...collectionCards.filter((card) => !existingKeys.has(card.key)),
        ];

        return mergedCards.slice(0, 4);
    }, [productSource]);
    const blogSource = blogs.length ? blogs : fallbackBlogs;
    const couponSource = coupons.length ? coupons.slice(0, 3) : fallbackCoupons;
    const heroProducts = useMemo(
        () =>
            [...productSource]
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
        [productSource],
    );

    const goToProduct = (product) => {
        router.push(usingFallbackProducts ? "/products" : `/products/${product.id}`);
    };

    const handleCouponAction = async (coupon) => {
        const couponClaimKeys = getCouponClaimKeys(coupon);
        const isCouponClaimed = couponClaimKeys.some((key) => claimedCouponIds.has(key));

        if (isCouponClaimed) {
            message.info(`B?n ?? l?y m? ${coupon.code} r?i.`);
            return;
        }

        try {
            await navigator.clipboard?.writeText(coupon.code);
        } catch {
            // Clipboard can be blocked in some browsers; claiming still proceeds.
        }

        const token = localStorage.getItem("token");
        if (!token) {
            message.success(`?? sao ch?p m? ${coupon.code}`);
            message.warning("Vui l?ng ??ng nh?p ?? l?u m? v?o t?i kho?n.");
            return;
        }

        if (String(coupon.id).startsWith("fallback-")) {
            setClaimedCouponIds((prev) => {
                const next = new Set([...prev, ...couponClaimKeys]);
                writeStoredClaimedCoupons(next);
                return next;
            });
            message.success(`?? l?u m? ${coupon.code}`);
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
            message.success(`?? l?y m? ${coupon.code}`);
        } catch (error) {
            message.warning(error.response?.data?.message || `?? sao ch?p m? ${coupon.code}`);
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
                                        {slide.price.toLocaleString("vi-VN")}đ
                                    </Text>
                                    <Button type="primary" onClick={() => goToProduct(slide.product)}>
                                        SHOP NOW
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!heroProducts.length && (
                        <div>
                            <div className="webcake-hero-slide webcake-hero-empty">
                                <div className="webcake-hero-copy">
                                    <span className="webcake-hero-eyebrow">DPWOOD Collection</span>
                                    <Title level={1}>Wooden furniture for everyday living</Title>
                                    <Paragraph>Browse curated tables, seating, storage and bedroom pieces.</Paragraph>
                                    <Button type="primary" onClick={() => router.push("/products")}>
                                        SHOP NOW
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Carousel>
            </section>

            <section className="webcake-section webcake-category-section">
                <div className="webcake-container">
                    <div className="webcake-section-head">
                        <span className="dp-eyebrow">Danh mục</span>
                        <Title level={2} className="webcake-section-title">
                            Explore DPWOOD
                        </Title>
                    </div>
                    <Row gutter={[30, 30]}>
                        {categoryCards.map((category) => (
                            <Col xs={24} sm={12} lg={6} key={category.key}>
                                <button
                                    type="button"
                                    className="webcake-category-card"
                                    onClick={() => router.push(category.href)}
                                >
                                    <img src={category.image} alt={category.title} />
                                    <span className="webcake-category-label">
                                        <span className="webcake-category-icon">
                                            <TagsOutlined />
                                        </span>
                                        <strong>{category.title}</strong>
                                        <small>
                                            {category.count} sản phẩm
                                        </small>
                                        <em>{category.subtitle}</em>
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
                        {couponSource.map((coupon) => {
                            const isCouponClaimed = getCouponClaimKeys(coupon).some((key) =>
                                claimedCouponIds.has(key),
                            );

                            return (
                                <Col xs={24} md={8} key={coupon.id}>
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
                                            type={isCouponClaimed ? "default" : "primary"}
                                            icon={isCouponClaimed ? <CheckCircleOutlined /> : null}
                                            disabled={isCouponClaimed}
                                            loading={claimingCouponId === coupon.id}
                                            onClick={() => handleCouponAction(coupon)}
                                        >
                                            {isCouponClaimed ? "\u0110\u00c3 L\u1ea4Y M\u00c3" : "SAVE CODE"}
                                        </Button>
                                    </div>
                                </article>
                                </Col>
                            );
                        })}
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

            <div className="webcake-container">
                <div className="webcake-section-divider" aria-hidden="true" />
            </div>

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
