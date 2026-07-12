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
    TruckOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import ProductCard from "@/app/(main)/products/components/ProductCard";
import api from "@/utils/axios";
import { getKitchenCategoryLabel, KITCHEN_CATEGORY_OPTIONS } from "@/utils/kitchenProduct";
import { getProductSalesStats } from "@/utils/productStats";

const { Title, Text, Paragraph } = Typography;

const serviceItems = [
    { key: "delivery", icon: <TruckOutlined />, title: "Giao hàng nhanh", desc: "Đóng gói an toàn cho đồ bếp" },
    { key: "return", icon: <SafetyCertificateOutlined />, title: "Đổi trả 7 ngày", desc: "Hỗ trợ khi sản phẩm lỗi" },
    { key: "discount", icon: <GiftOutlined />, title: "Ưu đãi thành viên", desc: "Lưu mã và dùng khi thanh toán" },
    { key: "support", icon: <CustomerServiceOutlined />, title: "Tư vấn bếp", desc: "Hỗ trợ chọn sản phẩm phù hợp" },
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
            <Title level={4}>Chưa tải được sản phẩm</Title>
            <Paragraph>
                Máy chủ có thể đang khởi động sau thời gian không sử dụng. Vui lòng thử tải lại dữ liệu.
            </Paragraph>
            <Button type="primary" onClick={onRetry}>
                Tải lại sản phẩm
            </Button>
        </div>
    );
}

const getProductImage = (product) =>
    product?.imageUrl || (Array.isArray(product?.images) && product.images[0]);

const isUsableCategoryImage = (url = "") =>
    /^https?:\/\//i.test(url) && !url.includes("4kwallpapers.com") && !url.includes("thumbs_2t");

const categoryFallbackImages = {
    cookware: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=900&q=80",
    tableware: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=900&q=80",
    utensils: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
    storage: "https://images.unsplash.com/photo-1606914469633-bd39206ea739?auto=format&fit=crop&w=900&q=80",
    appliances: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80",
    cleaning: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=900&q=80",
};

const categoryDescriptions = {
    cookware: "Nồi, chảo và bộ dụng cụ nấu",
    tableware: "Bát, đĩa và set bàn ăn",
    utensils: "Dao, muỗng và phụ kiện bếp",
    storage: "Hộp, lọ và đồ bảo quản",
    appliances: "Thiết bị nhỏ cho căn bếp",
    cleaning: "Dụng cụ vệ sinh tiện lợi",
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
    const [products, setProducts] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [claimedCouponIds, setClaimedCouponIds] = useState(new Set());
    const [claimingCouponId, setClaimingCouponId] = useState("");
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [wishlistLoadingId, setWishlistLoadingId] = useState("");
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

            setProducts(productResponse.status === "fulfilled" ? productResponse.value : []);
            setBlogs(blogResponse.status === "fulfilled" ? blogResponse.value.data || [] : []);
            setCoupons(couponResponse.status === "fulfilled" ? couponResponse.value.data || [] : []);

            if (token) {
                const [myCouponResponse, wishlistResponse] = await Promise.all([
                    api.get("/coupons/my").catch(() => ({ data: [] })),
                    api.get("/products/wishlist/me").catch(() => ({ data: [] })),
                ]);
                const nextClaimedCoupons = new Set([
                    ...storedClaimedCoupons,
                    ...getClaimedKeysFromWallet(myCouponResponse.data || []),
                ]);
                setClaimedCouponIds(nextClaimedCoupons);
                writeStoredClaimedCoupons(nextClaimedCoupons);
                setWishlistIds(new Set((wishlistResponse.data || []).map((item) => String(item.productId))));
            } else {
                setClaimedCouponIds(storedClaimedCoupons);
                setWishlistIds(new Set());
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHomepageData();
    }, [fetchHomepageData]);

    const bestSellerProducts = useMemo(
        () =>
            [...products]
                .filter((product) => getProductSalesStats(product).isHot)
                .sort((a, b) => getProductSalesStats(b).soldRatio - getProductSalesStats(a).soldRatio)
                .slice(0, 8),
        [products],
    );

    const catalogProducts = useMemo(() => products.slice(0, 12), [products]);
    const couponSource = useMemo(
        () =>
            [...coupons]
                .sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0))
                .slice(0, 3),
        [coupons],
    );
    const homepageCouponItems = couponSource;
    const blogSource = blogs.filter((blog) => blog?.title);
    const homepageBlogs = useMemo(() => blogSource.slice(0, 3), [blogSource]);
    const heroProducts = useMemo(
        () =>
            [...products]
                .filter((product) => isUsableCategoryImage(getProductImage(product)))
                .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
                .slice(0, 3)
                .map((product, index) => ({
                    key: product.id || `${product.name}-${index}`,
                    product,
                    title: product.name || "DPWOOD Kitchen",
                    copy:
                        product.description ||
                        `${getKitchenCategoryLabel(product.category)} được chọn lọc cho căn bếp gọn gàng, tiện dụng và bền đẹp.`,
                    image: getProductImage(product),
                    price: Number(product.price || 0),
                })),
        [products],
    );

    const categoryCards = useMemo(() => {
        const fallbackProducts = products.filter((product) => isUsableCategoryImage(getProductImage(product)));

        return KITCHEN_CATEGORY_OPTIONS.map((category, index) => {
            const categoryProducts = products.filter((product) => product.category === category.value);
            const imageProduct =
                categoryProducts.find((product) => isUsableCategoryImage(getProductImage(product))) ||
                fallbackProducts[index % Math.max(fallbackProducts.length, 1)];
            const categoryImage = getProductImage(imageProduct);

            return {
                ...category,
                count: categoryProducts.length,
                image: categoryFallbackImages[category.value] || categoryImage,
                fallbackImage: categoryFallbackImages[category.value],
                description: categoryDescriptions[category.value] || "Khám phá danh mục",
            };
        }).filter((category) => category.count > 0 && category.image);
    }, [products]);

    const goToProduct = (product) => {
        if (!product?.id) return;
        router.push(`/products/${product.id}`);
    };

    const handleToggleWishlist = async (product) => {
        if (!localStorage.getItem("token")) {
            message.warning("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
            router.push("/login");
            return;
        }

        try {
            setWishlistLoadingId(String(product.id));
            const response = await api.post(`/products/${product.id}/wishlist`);
            setWishlistIds((current) => {
                const next = new Set(current);
                if (response.data?.wished) next.add(String(product.id));
                else next.delete(String(product.id));
                return next;
            });
            message.success(response.data?.wished ? "Đã thêm vào yêu thích." : "Đã bỏ khỏi yêu thích.");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể cập nhật yêu thích.");
        } finally {
            setWishlistLoadingId("");
        }
    };

    const goToCategory = (categoryValue) => {
        router.push(`/products?category=${encodeURIComponent(categoryValue)}`);
    };

    const renderBlogCard = (blog) => (
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
            <Title level={4} className="dp-line-clamp-2">
                {blog.title}
            </Title>
            <Paragraph className="webcake-blog-summary dp-line-clamp-2">{blog.summary}</Paragraph>
            <Button type="link" onClick={() => router.push(blog.slug ? `/blogs/${blog.slug}` : "/blogs")}>
                Đọc thêm <ArrowRightOutlined />
            </Button>
        </article>
    );

    const handleCouponAction = async (coupon) => {
        const couponClaimKeys = getCouponClaimKeys(coupon);
        const isCouponClaimed = couponClaimKeys.some((key) => claimedCouponIds.has(key));

        if (isCouponClaimed) {
            message.info(`Bạn đã lấy mã ${coupon.code} rồi.`);
            return;
        }

        try {
            await navigator.clipboard?.writeText(coupon.code);
        } catch {
            // Clipboard can be blocked in some browsers; claiming still proceeds.
        }

        const token = localStorage.getItem("token");
        if (!token) {
            message.success(`Đã sao chép mã ${coupon.code}`);
            message.warning("Vui lòng đăng nhập để lưu mã vào tài khoản.");
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
            message.success(`Đã lấy mã ${coupon.code}`);
        } catch (error) {
            message.warning(error.response?.data?.message || `Đã sao chép mã ${coupon.code}`);
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

    const renderGiftCodeCard = (coupon) => {
        const isCouponClaimed = getCouponClaimKeys(coupon).some((key) => claimedCouponIds.has(key));

        return (
            <article className={`webcake-coupon-card ${isCouponClaimed ? "webcake-coupon-card-claimed" : ""}`}>
                <div className="webcake-coupon-value">
                    <GiftOutlined />
                    <strong>{getCouponValue(coupon)}</strong>
                    <span>OFF</span>
                </div>
                <div className="webcake-coupon-content">
                    <Text className="webcake-coupon-code">{coupon.code}</Text>
                    <Paragraph>
                        {coupon.description ||
                            `Đơn hàng từ ${new Intl.NumberFormat("vi-VN").format(coupon.minOrderAmount || 0)}đ`}
                    </Paragraph>
                    <div className="webcake-coupon-meta">
                        <span>
                            <ClockCircleOutlined /> Còn {getDaysLeft(coupon.expiryDate)} ngày
                        </span>
                        {coupon.maxDiscountAmount && (
                            <span>
                                <CheckCircleOutlined /> Tối đa {formatCompactCurrency(coupon.maxDiscountAmount)}đ
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
                        {isCouponClaimed ? "Đã lấy mã" : "Lưu mã"}
                    </Button>
                </div>
            </article>
        );
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
                                    <span className="webcake-hero-eyebrow">Kitchen Highlight</span>
                                    <Title level={1}>{slide.title}</Title>
                                    <Paragraph className="dp-line-clamp-2">{slide.copy}</Paragraph>
                                    <Text className="webcake-hero-price">
                                        {slide.price.toLocaleString("vi-VN")}đ
                                    </Text>
                                    <Button type="primary" onClick={() => goToProduct(slide.product)}>
                                        XEM SẢN PHẨM
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
                                    <span className="webcake-hero-eyebrow">DPWOOD Kitchen</span>
                                    <Title level={1}>Đồ gia dụng nhà bếp cho từng bữa ăn</Title>
                                    <Paragraph>Khám phá nồi chảo, dụng cụ bếp và sản phẩm tiện ích được chọn lọc.</Paragraph>
                                    <Button type="primary" onClick={() => router.push("/products")}>
                                        XEM CỬA HÀNG
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Carousel>
            </section>

            <section className="webcake-section webcake-category-section">
                <div className="webcake-container">
                    <Title level={2} className="webcake-section-title">
                        Danh mục sản phẩm
                    </Title>

                    {loading ? (
                        <Row gutter={[30, 30]}>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Col xs={24} sm={12} lg={8} key={index}>
                                    <div className="webcake-category-skeleton">
                                        <Skeleton.Image active />
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Row gutter={[30, 30]}>
                            {categoryCards.map((category) => (
                                <Col xs={24} sm={12} lg={8} key={category.value}>
                                    <button
                                        type="button"
                                        className="webcake-category-card"
                                        onClick={() => goToCategory(category.value)}
                                        aria-label={`Xem danh mục ${category.label}`}
                                    >
                                        <img
                                            src={category.image}
                                            alt={category.label}
                                            onError={(event) => {
                                                if (event.currentTarget.src !== category.fallbackImage) {
                                                    event.currentTarget.src = category.fallbackImage;
                                                }
                                            }}
                                        />
                                        <span className="webcake-category-label">
                                            <span className="webcake-category-icon">
                                                <AppstoreOutlined />
                                            </span>
                                            <strong>{category.label}</strong>
                                        </span>
                                    </button>
                                </Col>
                            ))}
                        </Row>
                    )}
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
                            Bán chạy
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
                                        wished={wishlistIds.has(String(product.id))}
                                        wishlistLoading={wishlistLoadingId === String(product.id)}
                                        onToggleWishlist={handleToggleWishlist}
                                    />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <ProductEmptyState onRetry={fetchHomepageData} />
                    )}

                    <div className="webcake-view-all">
                        <Button icon={<AppstoreOutlined />} onClick={() => router.push("/products")}>
                            XEM TẤT CẢ SẢN PHẨM
                        </Button>
                    </div>
                </div>
            </section>

            {couponSource.length > 0 && (
                <section className="webcake-coupon-section" id="special-offers">
                    <div className="webcake-container">
                        <Title level={2} className="webcake-section-title">
                            Mã giảm giá
                        </Title>
                        <div className="webcake-coupon-mobile-list">
                            {homepageCouponItems.map((coupon) => (
                                <div key={coupon.id || coupon.code} className="webcake-coupon-mobile-item">
                                    {renderGiftCodeCard(coupon)}
                                </div>
                            ))}
                            {couponSource.length > 1 && (
                                <Button
                                    className="webcake-coupon-view-all"
                                    onClick={() => router.push("/gift-codes")}
                                >
                                    Xem tất cả mã
                                </Button>
                            )}
                        </div>
                        <div className="webcake-coupon-all-action">
                            <Button onClick={() => router.push("/gift-codes")}>Xem tất cả mã</Button>
                        </div>
                    </div>
                </section>
            )}

            <section className="webcake-section webcake-catalog-section">
                <div className="webcake-container">
                    <Title level={2} className="webcake-section-title">
                        Sản phẩm đồ bếp
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
                                        wished={wishlistIds.has(String(product.id))}
                                        wishlistLoading={wishlistLoadingId === String(product.id)}
                                        onToggleWishlist={handleToggleWishlist}
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
                            Bài viết mới
                        </Title>
                        <Row gutter={[30, 30]}>
                            {homepageBlogs.map((blog) => (
                                <Col xs={24} md={8} key={blog.id || blog.slug || blog.title}>
                                    {renderBlogCard(blog)}
                                </Col>
                            ))}
                        </Row>
                        <div className="webcake-view-all">
                            <Button icon={<AppstoreOutlined />} onClick={() => router.push("/blogs")}>
                                XEM TẤT CẢ BÀI VIẾT
                            </Button>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
