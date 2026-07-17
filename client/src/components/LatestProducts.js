"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Carousel, Col, Popconfirm, Row, Skeleton, Tooltip, Typography } from "antd";
import {
    AppstoreOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    GiftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/axios";
import { getKitchenCategoryLabel } from "@/utils/kitchenProduct";
import { getProductSalesStats } from "@/utils/productStats";
import { addCatalogProductToCart } from "@/utils/cartStorage";
import { getProductImage } from "@/utils/productImages";
import HomeServiceStrip from "@/components/home/HomeServiceStrip";
import HomeProductSection from "@/components/home/HomeProductSection";
import HomeViewAllLink from "@/components/home/HomeViewAllLink";

const { Title, Text, Paragraph } = Typography;

const isUsableCategoryImage = (url = "") =>
    /^https?:\/\//i.test(url) && !url.includes("4kwallpapers.com") && !url.includes("thumbs_2t");

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
    const [productCategories, setProductCategories] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [claimedCouponIds, setClaimedCouponIds] = useState(new Set());
    const [couponWalletItems, setCouponWalletItems] = useState([]);
    const [claimingCouponId, setClaimingCouponId] = useState("");
    const [deletingCouponId, setDeletingCouponId] = useState("");
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [wishlistLoadingId, setWishlistLoadingId] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchHomepageData = useCallback(async () => {
        try {
            setLoading(true);
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const storedClaimedCoupons = readStoredClaimedCoupons();
            setClaimedCouponIds(storedClaimedCoupons);

            const [productResponse, categoryResponse, blogResponse, couponResponse] = await Promise.allSettled([
                fetchProductsWithWakeRetry(),
                api.get("/products/categories", { timeout: 12000 }),
                api.get("/blogs?public=true", { timeout: 12000 }),
                api.get("/coupons/active", { timeout: 12000 }),
            ]);

            setProducts(productResponse.status === "fulfilled" ? productResponse.value : []);
            setProductCategories(
                categoryResponse.status === "fulfilled" ? categoryResponse.value.data || [] : [],
            );
            setBlogs(blogResponse.status === "fulfilled" ? blogResponse.value.data || [] : []);
            const activeCoupons = couponResponse.status === "fulfilled" ? couponResponse.value.data || [] : [];

            if (token) {
                const [myCouponResponse, wishlistResponse] = await Promise.all([
                    api.get("/coupons/my").catch(() => ({ data: [] })),
                    api.get("/products/wishlist/me").catch(() => ({ data: [] })),
                ]);
                const nextWalletItems = (myCouponResponse.data || []).filter((item) => item.Coupon);
                const nextClaimedCoupons = getClaimedKeysFromWallet(nextWalletItems);
                const mergedCoupons = new Map(activeCoupons.map((coupon) => [String(coupon.id), coupon]));
                nextWalletItems.forEach((item) => {
                    mergedCoupons.set(String(item.Coupon.id), item.Coupon);
                });

                setCoupons([...mergedCoupons.values()]);
                setCouponWalletItems(nextWalletItems);
                setClaimedCouponIds(nextClaimedCoupons);
                writeStoredClaimedCoupons(nextClaimedCoupons);
                setWishlistIds(new Set((wishlistResponse.data || []).map((item) => String(item.productId))));
            } else {
                setCoupons(activeCoupons);
                setClaimedCouponIds(storedClaimedCoupons);
                setCouponWalletItems([]);
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
                .sort((a, b) => {
                    const aSaved = couponWalletItems.some(
                        (item) => String(item.couponId || item.Coupon?.id) === String(a.id),
                    );
                    const bSaved = couponWalletItems.some(
                        (item) => String(item.couponId || item.Coupon?.id) === String(b.id),
                    );
                    if (aSaved !== bSaved) return aSaved ? -1 : 1;
                    return new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0);
                })
                .slice(0, 3),
        [couponWalletItems, coupons],
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
                        `${product.categoryLabel || getKitchenCategoryLabel(product.category)} được chọn lọc cho căn bếp gọn gàng, tiện dụng và bền đẹp.`,
                    image: getProductImage(product),
                    price: Number(product.price || 0),
                })),
        [products],
    );

    const categoryCards = useMemo(() => {
        return productCategories.map((category) => {
            const categoryProducts = products.filter((product) => product.category === category.value);
            const imageProduct = categoryProducts.find((product) =>
                isUsableCategoryImage(getProductImage(product)),
            );
            const categoryImage = getProductImage(imageProduct);

            return {
                ...category,
                count: categoryProducts.length,
                image: category.imageUrl || categoryImage || "/logo.png",
                fallbackImage:
                    categoryImage && categoryImage !== category.imageUrl
                        ? categoryImage
                        : "/logo.png",
                description: category.description || "Khám phá danh mục",
            };
        });
    }, [productCategories, products]);

    const goToProduct = (product) => {
        if (!product?.id) return;
        router.push(`/products/${product.id}`);
    };

    const handleAddToCart = (product) => {
        if (!product?.id || Number(product.stock || 0) <= 0) return;

        addCatalogProductToCart(product, getProductImage(product));
        message.success(`Đã thêm ${product.name} vào giỏ hàng.`);
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
            window.dispatchEvent(new Event("wishlist-updated"));
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
                    <Image
                        src={blog.thumbnail}
                        alt={blog.title || "DPWOOD blog"}
                        width={740}
                        height={500}
                        unoptimized
                    />
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
            const myCouponResponse = await api.get("/coupons/my");
            setCouponWalletItems((myCouponResponse.data || []).filter((item) => item.Coupon));
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
            setCouponWalletItems((myCouponResponse.data || []).filter((item) => item.Coupon));
            setClaimedCouponIds(nextClaimedCoupons);
            writeStoredClaimedCoupons(nextClaimedCoupons);
        } finally {
            setClaimingCouponId("");
        }
    };

    const handleDeleteCoupon = async (coupon, walletItem) => {
        if (!walletItem?.id) return;

        try {
            setDeletingCouponId(walletItem.id);
            await api.delete(`/coupons/my/${walletItem.id}`);

            const removedKeys = new Set(getCouponClaimKeys(coupon));
            setCouponWalletItems((current) => current.filter((item) => item.id !== walletItem.id));
            setClaimedCouponIds((current) => {
                const next = new Set([...current].filter((key) => !removedKeys.has(String(key))));
                writeStoredClaimedCoupons(next);
                return next;
            });
            message.success(`Đã xóa mã ${coupon.code} khỏi kho.`);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể xóa mã giảm giá.");
        } finally {
            setDeletingCouponId("");
        }
    };

    const renderGiftCodeCard = (coupon) => {
        const isCouponClaimed = getCouponClaimKeys(coupon).some((key) => claimedCouponIds.has(key));
        const walletItem = couponWalletItems.find(
            (item) => String(item.couponId || item.Coupon?.id) === String(coupon.id),
        );

        return (
            <article className={`webcake-coupon-card ${isCouponClaimed ? "webcake-coupon-card-claimed" : ""}`}>
                <div className="webcake-coupon-value">
                    <GiftOutlined />
                    <strong>{getCouponValue(coupon)}</strong>
                    <span>GIẢM</span>
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
                    <div className="dp-coupon-wallet-actions">
                        <Button
                            type={isCouponClaimed ? "default" : "primary"}
                            icon={isCouponClaimed ? <CheckCircleOutlined /> : null}
                            disabled={isCouponClaimed}
                            loading={claimingCouponId === coupon.id}
                            onClick={() => handleCouponAction(coupon)}
                        >
                            {isCouponClaimed ? "Đã lấy mã" : "Lưu mã"}
                        </Button>
                        {walletItem && (
                            <Popconfirm
                                title={`Xóa mã ${coupon.code}?`}
                                description="Mã sẽ được xóa khỏi kho ưu đãi của bạn."
                                okText="Xóa"
                                cancelText="Giữ lại"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleDeleteCoupon(coupon, walletItem)}
                            >
                                <Tooltip title="Xóa mã khỏi kho">
                                    <Button
                                        type="text"
                                        danger
                                        aria-label={`Xóa mã ${coupon.code} khỏi kho`}
                                        icon={<DeleteOutlined />}
                                        loading={deletingCouponId === walletItem.id}
                                        className="dp-coupon-delete-button"
                                    />
                                </Tooltip>
                            </Popconfirm>
                        )}
                    </div>
                </div>
            </article>
        );
    };
    return (
        <main className="webcake-home">
            <section className="webcake-hero">
                <Carousel
                    autoplay
                    autoplaySpeed={4200}
                    dots
                    draggable
                    pauseOnHover
                    beforeChange={() => {
                        const activeElement = document.activeElement;
                        if (activeElement instanceof HTMLElement && activeElement.closest(".slick-slide")) {
                            activeElement.blur();
                        }
                    }}
                >
                    {heroProducts.map((slide) => (
                        <div key={slide.key}>
                            <div
                                className="webcake-hero-slide"
                                style={{ "--webcake-hero-image": `url(${slide.image})` }}
                            >
                                <div className="webcake-hero-copy">
                                    <span className="webcake-hero-eyebrow">Nổi bật cho gian bếp</span>
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
                                    <span className="webcake-hero-eyebrow">Gian bếp DPWOOD</span>
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

            <HomeServiceStrip />

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
                            {categoryCards.slice(0, 6).map((category) => (
                                <Col xs={24} sm={12} lg={8} key={category.value}>
                                    <button
                                        type="button"
                                        className="webcake-category-card"
                                        onClick={() => goToCategory(category.value)}
                                        aria-label={`Xem danh mục ${category.label}`}
                                    >
                                        <Image
                                            src={category.image}
                                            alt={category.label}
                                            width={760}
                                            height={848}
                                            unoptimized
                                            onError={(event) => {
                                                if (event.currentTarget.dataset.fallbackApplied) return;
                                                event.currentTarget.dataset.fallbackApplied = "true";
                                                event.currentTarget.src = category.fallbackImage;
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
                    {!loading && categoryCards.length > 6 && (
                        <HomeViewAllLink
                            href="/products"
                            label="XEM TẤT CẢ DANH MỤC"
                            icon={<AppstoreOutlined />}
                        />
                    )}
                </div>
            </section>

            <HomeProductSection
                title="Bán chạy"
                products={bestSellerProducts}
                loading={loading}
                wrapHeading
                badge="icon-only"
                wishlistIds={wishlistIds}
                wishlistLoadingId={wishlistLoadingId}
                onAddToCart={handleAddToCart}
                onOpenProduct={goToProduct}
                onToggleWishlist={handleToggleWishlist}
                onRetry={fetchHomepageData}
                viewAllHref="/products"
            />

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
                        </div>
                        {couponSource.length > 1 && (
                            <HomeViewAllLink
                                href="/gift-codes"
                                label="XEM TẤT CẢ MÃ"
                                icon={<GiftOutlined />}
                            />
                        )}
                    </div>
                </section>
            )}

            <HomeProductSection
                title="Sản phẩm đồ bếp"
                products={catalogProducts}
                loading={loading}
                skeletonCount={12}
                className="webcake-catalog-section"
                wishlistIds={wishlistIds}
                wishlistLoadingId={wishlistLoadingId}
                onAddToCart={handleAddToCart}
                onOpenProduct={goToProduct}
                onToggleWishlist={handleToggleWishlist}
                onRetry={fetchHomepageData}
                viewAllHref="/products"
            />

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
                        <HomeViewAllLink
                            href="/blogs"
                            label="XEM TẤT CẢ BÀI VIẾT"
                            icon={<AppstoreOutlined />}
                        />
                    </div>
                </section>
            )}
        </main>
    );
}
