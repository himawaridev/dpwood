"use client";

import { useState } from "react";
import { App } from "antd";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import { addCatalogProductToCart } from "@/utils/cartStorage";
import { getProductImage } from "@/utils/productImages";
import {
    getClaimedKeysFromWallet,
    getCouponClaimKeys,
    readStoredClaimedCoupons,
    writeStoredClaimedCoupons,
} from "@/utils/homepageData";
import useHomepageData from "@/hooks/useHomepageData";
import HomeHero from "@/components/home/HomeHero";
import HomeServiceStrip from "@/components/home/HomeServiceStrip";
import HomeCategorySection from "@/components/home/HomeCategorySection";
import HomeProductSection from "@/components/home/HomeProductSection";
import HomeCouponSection from "@/components/home/HomeCouponSection";
import HomeBlogSection from "@/components/home/HomeBlogSection";

export default function LatestProducts() {
    const { message } = App.useApp();
    const router = useRouter();
    const [claimingCouponId, setClaimingCouponId] = useState("");
    const [deletingCouponId, setDeletingCouponId] = useState("");
    const [wishlistLoadingId, setWishlistLoadingId] = useState("");
    const {
        bestSellerProducts,
        catalogProducts,
        categoryCards,
        claimedCouponIds,
        couponWalletItems,
        heroBanners,
        homepageBlogs,
        homepageCoupons,
        loading,
        refresh,
        setClaimedCouponIds,
        setCouponWalletItems,
        setWishlistIds,
        wishlistIds,
    } = useHomepageData();

    const goToProduct = (product) => {
        if (product?.id) router.push(`/products/${product.id}`);
    };

    const goToBannerLink = (link) => {
        const target = String(link || "/products");
        if (target.startsWith("https://")) window.location.assign(target);
        else router.push(target);
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
            const response = await api.post(
                `/products/${product.id}/wishlist`,
                undefined,
                { authRequired: true },
            );
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

    const handleClaimCoupon = async (coupon) => {
        const couponClaimKeys = getCouponClaimKeys(coupon);
        if (couponClaimKeys.some((key) => claimedCouponIds.has(key))) {
            message.info(`Bạn đã lấy mã ${coupon.code} rồi.`);
            return;
        }

        try {
            await navigator.clipboard?.writeText(coupon.code);
        } catch {
            // Claiming still works when clipboard access is unavailable.
        }

        if (!localStorage.getItem("token")) {
            message.success(`Đã sao chép mã ${coupon.code}`);
            message.warning("Vui lòng đăng nhập để lưu mã vào tài khoản.");
            return;
        }

        try {
            setClaimingCouponId(coupon.id);
            await api.post("/coupons/claim", { couponId: coupon.id }, { authRequired: true });
            const response = await api.get("/coupons/my", { authRequired: true });
            setCouponWalletItems((response.data || []).filter((item) => item.Coupon));
            setClaimedCouponIds((current) => {
                const next = new Set([...current, ...couponClaimKeys]);
                writeStoredClaimedCoupons(next);
                return next;
            });
            message.success(`Đã lấy mã ${coupon.code}`);
        } catch (error) {
            message.warning(error.response?.data?.message || `Đã sao chép mã ${coupon.code}`);
            const response = await api.get("/coupons/my", { authRequired: true }).catch(() => ({ data: [] }));
            const nextClaimedCoupons = new Set([
                ...readStoredClaimedCoupons(),
                ...getClaimedKeysFromWallet(response.data || []),
            ]);
            setCouponWalletItems((response.data || []).filter((item) => item.Coupon));
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
            await api.delete(`/coupons/my/${walletItem.id}`, { authRequired: true });
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

    const productSectionProps = {
        loading,
        wishlistIds,
        wishlistLoadingId,
        onAddToCart: handleAddToCart,
        onOpenProduct: goToProduct,
        onToggleWishlist: handleToggleWishlist,
        onRetry: refresh,
        viewAllHref: "/products",
    };

    return (
        <main className="webcake-home">
            <HomeHero
                banners={heroBanners}
                loading={loading}
                onOpenBanner={goToBannerLink}
                onOpenProducts={() => router.push("/products")}
            />
            <HomeServiceStrip />
            <HomeCategorySection
                categories={categoryCards}
                loading={loading}
                onOpenCategory={(category) => router.push(`/products?category=${encodeURIComponent(category)}`)}
            />
            <HomeProductSection
                {...productSectionProps}
                title="Bán chạy"
                products={bestSellerProducts}
                wrapHeading
                badge="icon-only"
            />
            <HomeCouponSection
                coupons={homepageCoupons}
                walletItems={couponWalletItems}
                claimedCouponIds={claimedCouponIds}
                claimingCouponId={claimingCouponId}
                deletingCouponId={deletingCouponId}
                onClaim={handleClaimCoupon}
                onDelete={handleDeleteCoupon}
            />
            <HomeProductSection
                {...productSectionProps}
                title="Sản phẩm đồ bếp"
                products={catalogProducts}
                skeletonCount={12}
                className="webcake-catalog-section"
            />
            <div className="webcake-container">
                <div className="webcake-section-divider" aria-hidden="true" />
            </div>
            <HomeBlogSection
                blogs={homepageBlogs}
                onOpenBlog={(blog) => router.push(blog.slug ? `/blogs/${blog.slug}` : "/blogs")}
            />
        </main>
    );
}
