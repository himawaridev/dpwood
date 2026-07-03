"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Col, Empty, Row, Skeleton, Typography } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, GiftOutlined } from "@ant-design/icons";
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

export default function GiftCodesPage() {
    const { message } = App.useApp();
    const [coupons, setCoupons] = useState([]);
    const [claimedCouponIds, setClaimedCouponIds] = useState(new Set());
    const [claimingCouponId, setClaimingCouponId] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchCoupons = useCallback(async () => {
        try {
            setLoading(true);
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const storedClaimedCoupons = readStoredClaimedCoupons();
            const couponResponse = await api.get("/coupons/active", { timeout: 12000 });
            setCoupons(couponResponse.data || []);

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

    const renderCouponCard = (coupon) => {
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
        <main className="dp-gift-code-page">
            <section className="dp-gift-code-hero">
                <div className="webcake-container">
                    <Text className="webcake-section-kicker">Ưu đãi DPWOOD</Text>
                    <Title level={1}>Gift Code</Title>
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
