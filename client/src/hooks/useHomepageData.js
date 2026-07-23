"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/utils/axios";
import { getProductSalesStats } from "@/utils/productStats";
import {
    buildHomepageCategoryCards,
    fetchProductsWithWakeRetry,
    getClaimedKeysFromWallet,
    readStoredClaimedCoupons,
    writeStoredClaimedCoupons,
} from "@/utils/homepageData";

export default function useHomepageData() {
    const [products, setProducts] = useState([]);
    const [productCategories, setProductCategories] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [banners, setBanners] = useState([]);
    const [claimedCouponIds, setClaimedCouponIds] = useState(new Set());
    const [couponWalletItems, setCouponWalletItems] = useState([]);
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const storedClaimedCoupons = readStoredClaimedCoupons();
            setClaimedCouponIds(storedClaimedCoupons);

            const responses = await Promise.allSettled([
                fetchProductsWithWakeRetry(),
                api.get("/products/categories", { timeout: 12000 }),
                api.get("/blogs?public=true", { timeout: 12000 }),
                api.get("/coupons/active", { timeout: 12000 }),
                api.get("/banners/active", { timeout: 12000 }),
            ]);
            const [productResponse, categoryResponse, blogResponse, couponResponse, bannerResponse] = responses;

            const nextProducts = productResponse.status === "fulfilled" ? productResponse.value : [];
            const activeCoupons = couponResponse.status === "fulfilled" ? couponResponse.value.data || [] : [];
            setProducts(nextProducts);
            setProductCategories(categoryResponse.status === "fulfilled" ? categoryResponse.value.data || [] : []);
            setBlogs(blogResponse.status === "fulfilled" ? blogResponse.value.data || [] : []);
            setBanners(bannerResponse.status === "fulfilled" ? bannerResponse.value.data || [] : []);

            if (!token) {
                setCoupons(activeCoupons);
                setCouponWalletItems([]);
                setWishlistIds(new Set());
                return;
            }

            const [myCouponResponse, wishlistResponse] = await Promise.all([
                api.get("/coupons/my", { authRequired: true }).catch(() => ({ data: [] })),
                api.get("/products/wishlist/me", { authRequired: true }).catch(() => ({ data: [] })),
            ]);
            const walletItems = (myCouponResponse.data || []).filter((item) => item.Coupon);
            const claimedKeys = getClaimedKeysFromWallet(walletItems);
            const mergedCoupons = new Map(activeCoupons.map((coupon) => [String(coupon.id), coupon]));
            walletItems.forEach((item) => mergedCoupons.set(String(item.Coupon.id), item.Coupon));

            setCoupons([...mergedCoupons.values()]);
            setCouponWalletItems(walletItems);
            setClaimedCouponIds(claimedKeys);
            writeStoredClaimedCoupons(claimedKeys);
            setWishlistIds(new Set((wishlistResponse.data || []).map((item) => String(item.productId))));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const bestSellerProducts = useMemo(
        () => [...products]
            .filter((product) => getProductSalesStats(product).isHot)
            .sort((a, b) => getProductSalesStats(b).soldRatio - getProductSalesStats(a).soldRatio)
            .slice(0, 8),
        [products],
    );
    const catalogProducts = useMemo(() => products.slice(0, 12), [products]);
    const homepageCoupons = useMemo(
        () => [...coupons]
            .sort((a, b) => {
                const isSaved = (coupon) => couponWalletItems.some(
                    (item) => String(item.couponId || item.Coupon?.id) === String(coupon.id),
                );
                if (isSaved(a) !== isSaved(b)) return isSaved(a) ? -1 : 1;
                return new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0);
            })
            .slice(0, 3),
        [couponWalletItems, coupons],
    );
    const homepageBlogs = useMemo(() => blogs.filter((blog) => blog?.title).slice(0, 3), [blogs]);
    const heroBanners = useMemo(
        () => banners.filter((banner) => banner?.imageUrl && banner?.title),
        [banners],
    );
    const categoryCards = useMemo(
        () => buildHomepageCategoryCards(productCategories, products),
        [productCategories, products],
    );

    return {
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
    };
}
