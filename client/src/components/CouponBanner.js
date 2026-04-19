"use client";
import { useEffect, useState, useRef } from "react";
import { Button, Tag, Typography, message, Flex, Spin, Tooltip } from "antd";
import {
    GiftOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    LeftOutlined,
    RightOutlined,
    CopyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "@/utils/axios";

const { Text } = Typography;

export default function CouponBanner() {
    const [coupons, setCoupons] = useState([]);
    const [claimedIds, setClaimedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const couponRes = await api.get("/coupons/active");
                setCoupons(couponRes.data);

                const token =
                    typeof window !== "undefined" ? localStorage.getItem("token") : null;
                if (token) {
                    const myRes = await api.get("/coupons/my");
                    const ids = new Set(myRes.data.map((uc) => uc.couponId));
                    setClaimedIds(ids);
                }
            } catch (error) {
                console.error("Lỗi tải mã giảm giá:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) el.addEventListener("scroll", checkScroll);
        window.addEventListener("resize", checkScroll);
        return () => {
            if (el) el.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [coupons]);

    const handleClaim = async (couponId) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            message.warning("Vui lòng đăng nhập để nhận mã giảm giá!");
            return;
        }
        try {
            setClaimingId(couponId);
            await api.post("/coupons/claim", { couponId });
            message.success("Nhận mã giảm giá thành công! 🎉");
            setClaimedIds((prev) => new Set([...prev, couponId]));
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể nhận mã giảm giá");
        } finally {
            setClaimingId(null);
        }
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const amount = direction === "left" ? -300 : 300;
            scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
        }
    };

    if (loading) return null;
    if (coupons.length === 0) return null;

    return (
        <div
            style={{
                margin: "0 auto 28px auto",
                maxWidth: 1300,
                padding: "0 20px",
                position: "relative",
            }}
        >
            {/* Header */}
            <Flex
                align="center"
                justify="space-between"
                style={{ marginBottom: 12 }}
            >
                <Flex align="center" gap={8}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "linear-gradient(135deg, #1677ff 0%, #4096ff 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <GiftOutlined style={{ fontSize: 16, color: "#fff" }} />
                    </div>
                    <Text strong style={{ fontSize: 16, color: "#141414", letterSpacing: 0.3 }}>
                        Ưu đãi dành cho bạn
                    </Text>
                    <Tag
                        color="#1677ff"
                        style={{
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "0 8px",
                            lineHeight: "20px",
                            border: "none",
                        }}
                    >
                        {coupons.length} mã
                    </Tag>
                </Flex>
                <Flex gap={6}>
                    <Button
                        type="text"
                        size="small"
                        icon={<LeftOutlined style={{ fontSize: 11 }} />}
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            border: "1px solid #e8e8e8",
                            background: canScrollLeft ? "#fff" : "#fafafa",
                        }}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<RightOutlined style={{ fontSize: 11 }} />}
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            border: "1px solid #e8e8e8",
                            background: canScrollRight ? "#fff" : "#fafafa",
                        }}
                    />
                </Flex>
            </Flex>

            {/* Scrollable coupon strip */}
            <div style={{ position: "relative" }}>
                {/* Left fade gradient */}
                {canScrollLeft && (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 40,
                            background: "linear-gradient(90deg, #fff 0%, transparent 100%)",
                            zIndex: 2,
                            pointerEvents: "none",
                        }}
                    />
                )}
                {/* Right fade gradient */}
                {canScrollRight && (
                    <div
                        style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: 40,
                            background: "linear-gradient(270deg, #fff 0%, transparent 100%)",
                            zIndex: 2,
                            pointerEvents: "none",
                        }}
                    />
                )}

                <div
                    ref={scrollRef}
                    style={{
                        display: "flex",
                        gap: 14,
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        paddingBottom: 4,
                    }}
                >
                    {coupons.map((coupon) => {
                        const isClaimed = claimedIds.has(coupon.id);
                        const daysLeft = dayjs(coupon.expiryDate).diff(dayjs(), "day");

                        return (
                            <div
                                key={coupon.id}
                                style={{
                                    minWidth: 280,
                                    maxWidth: 280,
                                    display: "flex",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    background: "#fff",
                                    border: isClaimed
                                        ? "1.5px solid #91caff"
                                        : "1.5px solid #e8e8e8",
                                    boxShadow: isClaimed
                                        ? "0 2px 8px rgba(22,119,255,0.08)"
                                        : "0 2px 8px rgba(0,0,0,0.04)",
                                    flexShrink: 0,
                                    transition: "all 0.25s ease",
                                    cursor: "default",
                                    position: "relative",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isClaimed) {
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 16px rgba(22,119,255,0.12)";
                                        e.currentTarget.style.borderColor = "#91caff";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isClaimed) {
                                        e.currentTarget.style.boxShadow =
                                            "0 2px 8px rgba(0,0,0,0.04)";
                                        e.currentTarget.style.borderColor = "#e8e8e8";
                                    }
                                }}
                            >
                                {/* Left accent stripe */}
                                <div
                                    style={{
                                        width: 5,
                                        background: isClaimed
                                            ? "linear-gradient(180deg, #52c41a, #95de64)"
                                            : "linear-gradient(180deg, #1677ff, #4096ff)",
                                        flexShrink: 0,
                                    }}
                                />

                                {/* Discount badge area */}
                                <div
                                    style={{
                                        width: 80,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "12px 8px",
                                        background: isClaimed
                                            ? "linear-gradient(135deg, #f6ffed 0%, #fff 100%)"
                                            : "linear-gradient(135deg, #e6f4ff 0%, #fff 100%)",
                                        borderRight: "1px dashed #e8e8e8",
                                        position: "relative",
                                    }}
                                >
                                    {/* Dashed border circle cutouts */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: -6,
                                            top: -6,
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            background: "#fff",
                                            border: "1px solid #e8e8e8",
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: -6,
                                            bottom: -6,
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            background: "#fff",
                                            border: "1px solid #e8e8e8",
                                        }}
                                    />

                                    <Text
                                        strong
                                        style={{
                                            fontSize: 22,
                                            color: isClaimed ? "#52c41a" : "#1677ff",
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {coupon.discountType === "percent"
                                            ? `${Number(coupon.discountValue)}%`
                                            : `${Number(coupon.discountValue) >= 1000 ? `${Math.floor(Number(coupon.discountValue) / 1000)}K` : Number(coupon.discountValue)}`}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            color: isClaimed ? "#389e0d" : "#4096ff",
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        {coupon.discountType === "percent" ? "Giảm" : "Giảm ₫"}
                                    </Text>
                                </div>

                                {/* Main content */}
                                <div
                                    style={{
                                        flex: 1,
                                        padding: "10px 14px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        gap: 4,
                                        minWidth: 0,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: "#595959",
                                            lineHeight: 1.4,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {coupon.description ||
                                            (Number(coupon.minOrderAmount) > 0
                                                ? `Đơn từ ${new Intl.NumberFormat("vi-VN").format(coupon.minOrderAmount)}₫`
                                                : "Áp dụng mọi đơn hàng")}
                                    </Text>

                                    {coupon.maxDiscountAmount &&
                                        coupon.discountType === "percent" && (
                                            <Text
                                                style={{ fontSize: 11, color: "#8c8c8c" }}
                                            >
                                                Giảm tối đa{" "}
                                                {new Intl.NumberFormat("vi-VN").format(
                                                    coupon.maxDiscountAmount,
                                                )}
                                                ₫
                                            </Text>
                                        )}

                                    <Flex
                                        align="center"
                                        justify="space-between"
                                        style={{ marginTop: 2 }}
                                    >
                                        <Text style={{ fontSize: 10, color: "#bfbfbf" }}>
                                            <ClockCircleOutlined
                                                style={{ marginRight: 3 }}
                                            />
                                            Còn {daysLeft} ngày
                                        </Text>

                                        {isClaimed ? (
                                            <Tag
                                                icon={<CheckCircleOutlined />}
                                                color="success"
                                                style={{
                                                    borderRadius: 4,
                                                    fontSize: 11,
                                                    margin: 0,
                                                    padding: "0 6px",
                                                    lineHeight: "20px",
                                                }}
                                            >
                                                Đã lưu
                                            </Tag>
                                        ) : (
                                            <Button
                                                type="primary"
                                                size="small"
                                                onClick={() => handleClaim(coupon.id)}
                                                loading={claimingId === coupon.id}
                                                style={{
                                                    borderRadius: 6,
                                                    fontWeight: 600,
                                                    fontSize: 12,
                                                    height: 26,
                                                    padding: "0 14px",
                                                    boxShadow: "0 2px 4px rgba(22,119,255,0.2)",
                                                }}
                                            >
                                                Lưu mã
                                            </Button>
                                        )}
                                    </Flex>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
