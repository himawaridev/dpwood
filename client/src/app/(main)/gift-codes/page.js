"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Col, Empty, Popconfirm, Row, Skeleton, Tooltip, Typography } from "antd";
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    GiftOutlined,
} from "@ant-design/icons";
import api from "@/utils/axios";

const { Title, Text, Paragraph } = Typography;

const CLAIMED_COUPONS_KEY = "dpwoodClaimedCouponKeys";

const formatCompactCurrency = (value) => {
    const numberValue = Number(value || 0);
    if (numberValue >= 1000000) return `${numberValue / 1000000}M`;
    if (numberValue >= 1000) return `${Math.round(numberValue / 1000)}K`;
    return String(numberValue);
};

const getCouponValue = (coupon) =>
    coupon.discountType === "percent" ? `${Number(coupon.discountValue)}%` : `${formatCompactCurrency(coupon.discountValue)}đ`;

const getDaysLeft = (expiryDate) => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};

const getCouponClaimKeys = (coupon) => [coupon?.id, coupon?.code].filter(Boolean).map((value) => String(value));

const readStoredClaimedCoupons = () => {
    if (typeof window === "undefined") return new Set();
    try {
        return new Set(JSON.parse(localStorage.getItem(CLAIMED_COUPONS_KEY) || "[]").map(String));
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

const getCouponStatus = (coupon, walletItem) => {
    if (!walletItem) return "available";
    if (walletItem.isUsed) return "used";

    const now = Date.now();
    const usageLimitReached =
        coupon.usageLimit !== null &&
        coupon.usageLimit !== undefined &&
        Number(coupon.usedCount) >= Number(coupon.usageLimit);

    if (!coupon.isActive || new Date(coupon.expiryDate).getTime() <= now || usageLimitReached) {
        return "expired";
    }
    if (new Date(coupon.startDate).getTime() > now) return "upcoming";
    return "claimed";
};

export default function GiftCodesPage() {
    const { message } = App.useApp();
    const [coupons, setCoupons] = useState([]);
    const [walletItems, setWalletItems] = useState([]);
    const [claimedCouponIds, setClaimedCouponIds] = useState(new Set());
    const [claimingCouponId, setClaimingCouponId] = useState("");
    const [deletingWalletId, setDeletingWalletId] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchCoupons = useCallback(async () => {
        try {
            setLoading(true);
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const couponResponse = await api.get("/coupons/active", { timeout: 12000 });
            const activeCoupons = couponResponse.data || [];

            if (token) {
                const myCouponResponse = await api.get("/coupons/my").catch(() => ({ data: [] }));
                const nextWalletItems = (myCouponResponse.data || []).filter((item) => item.Coupon);
                const nextClaimedCoupons = getClaimedKeysFromWallet(nextWalletItems);
                const mergedCoupons = new Map(activeCoupons.map((coupon) => [String(coupon.id), coupon]));

                nextWalletItems.forEach((item) => {
                    mergedCoupons.set(String(item.Coupon.id), item.Coupon);
                });

                setCoupons([...mergedCoupons.values()]);
                setWalletItems(nextWalletItems);
                setClaimedCouponIds(nextClaimedCoupons);
                writeStoredClaimedCoupons(nextClaimedCoupons);
            } else {
                setCoupons(activeCoupons);
                setWalletItems([]);
                setClaimedCouponIds(readStoredClaimedCoupons());
            }
        } catch {
            setCoupons([]);
            message.error("Không thể tải mã giảm giá.");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const sortedCoupons = useMemo(
        () =>
            [...coupons].sort(
                (a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0),
            ),
        [coupons],
    );

    const walletItemsByCouponId = useMemo(
        () => new Map(walletItems.map((item) => [String(item.couponId || item.Coupon?.id), item])),
        [walletItems],
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
            // Claiming still works if clipboard permission is blocked.
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
            setWalletItems((myCouponResponse.data || []).filter((item) => item.Coupon));
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

    const handleDeleteCoupon = async (coupon, walletItem) => {
        if (!walletItem?.id) return;

        try {
            setDeletingWalletId(walletItem.id);
            await api.delete(`/coupons/my/${walletItem.id}`);

            const couponKeys = new Set(getCouponClaimKeys(coupon));
            setWalletItems((current) => current.filter((item) => item.id !== walletItem.id));
            setClaimedCouponIds((current) => {
                const next = new Set([...current].filter((key) => !couponKeys.has(String(key))));
                writeStoredClaimedCoupons(next);
                return next;
            });

            const isStillAvailable =
                coupon.isActive &&
                new Date(coupon.startDate).getTime() <= Date.now() &&
                new Date(coupon.expiryDate).getTime() > Date.now() &&
                (coupon.usageLimit === null ||
                    coupon.usageLimit === undefined ||
                    Number(coupon.usedCount) < Number(coupon.usageLimit));

            if (!isStillAvailable) {
                setCoupons((current) => current.filter((item) => item.id !== coupon.id));
            }

            message.success(`Đã xóa mã ${coupon.code} khỏi kho.`);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể xóa mã giảm giá.");
        } finally {
            setDeletingWalletId("");
        }
    };

    const renderCouponCard = (coupon) => {
        const walletItem = walletItemsByCouponId.get(String(coupon.id));
        const couponStatus = getCouponStatus(coupon, walletItem);
        const isCouponClaimed = couponStatus !== "available";
        const statusLabel = {
            claimed: "Đã lấy mã",
            expired: "Đã hết hạn",
            upcoming: "Chưa hiệu lực",
            used: "Đã sử dụng",
        }[couponStatus];

        return (
            <article
                className={`webcake-coupon-card ${isCouponClaimed ? "webcake-coupon-card-claimed" : ""} ${
                    ["expired", "used"].includes(couponStatus) ? "webcake-coupon-card-unavailable" : ""
                }`}
            >
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
                        {walletItem && couponStatus !== "claimed" && (
                            <span className="dp-coupon-status-label">{statusLabel}</span>
                        )}
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
                            {statusLabel || "Lưu mã"}
                        </Button>
                        {walletItem && (
                            <Popconfirm
                                title={`Xóa mã ${coupon.code}?`}
                                description="Mã sẽ được xóa khỏi kho cá nhân của bạn."
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
                                        loading={deletingWalletId === walletItem.id}
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
        <main className="dp-gift-code-page">
            <section className="dp-gift-code-hero">
                <div className="webcake-container">
                    <Text className="webcake-section-kicker">Ưu đãi DPWOOD</Text>
                    <Title level={1}>Kho mã giảm giá</Title>
                    <Paragraph>Lưu mã giảm giá vào tài khoản để sử dụng nhanh khi thanh toán.</Paragraph>
                </div>
            </section>

            <section className="webcake-section">
                <div className="webcake-container">
                    {loading ? (
                        <Row gutter={[24, 24]}>
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Col xs={24} md={12} xl={8} key={index}>
                                    <Skeleton active paragraph={{ rows: 4 }} />
                                </Col>
                            ))}
                        </Row>
                    ) : sortedCoupons.length ? (
                        <Row gutter={[24, 24]}>
                            {sortedCoupons.map((coupon) => (
                                <Col xs={24} md={12} xl={8} key={coupon.id || coupon.code}>
                                    {renderCouponCard(coupon)}
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Empty description="Hiện chưa có mã giảm giá khả dụng." />
                    )}
                </div>
            </section>
        </main>
    );
}
