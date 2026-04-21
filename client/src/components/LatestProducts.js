"use client";
import React, { useEffect, useState, useRef } from "react";
import { Spin, Typography, Carousel, Tag, Button, Flex } from "antd";
import {
    FireOutlined,
    ShoppingCartOutlined,
    StarFilled,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";
import { useProducts } from "@/hooks/useProducts";

const { Text } = Typography;

export default function LatestProducts() {
    const { products, loading } = useProducts();
    const [currentSlide, setCurrentSlide] = useState(0);

    const carouselRef = useRef(null);
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = screens.xs || (screens.sm && !screens.md);
    const isTablet = screens.md && !screens.lg;

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (products.length === 0) return null;

    const carouselSettings = {
        autoplay: true,
        autoplaySpeed: 5000,
        dots: false,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        fade: true,
        speed: 800,
        pauseOnHover: true,
        waitForAnimate: false,
        beforeChange: (_, next) => setCurrentSlide(next),
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price);
    };

    const bannerHeight = isMobile ? "55vh" : isTablet ? "60vh" : "85vh";

    return (
        <div
            style={{
                position: "relative",
                width: "100vw",
                marginLeft: "calc(-50vw + 50%)",
                marginTop: isMobile ? -16 : -24,
            }}
        >
            <Carousel ref={carouselRef} {...carouselSettings}>
                {products.map((data, index) => (
                    <div key={data.id}>
                        <div
                            style={{
                                position: "relative",
                                overflow: "hidden",
                                cursor: "pointer",
                                height: bannerHeight,
                                minHeight: isMobile ? 300 : 500,
                            }}
                            onClick={() => router.push(`/products/${data.id}`)}
                        >
                            {/* Background image with Ken Burns effect */}
                            <img
                                alt={data.name}
                                src={
                                    data.imageUrl ||
                                    "https://via.placeholder.com/1920x900?text=No+Image"
                                }
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "block",
                                    objectFit: "cover",
                                    animation: currentSlide === index ? "kenBurns 12s ease forwards" : "none",
                                }}
                            />

                            {/* Dark overlay for readability */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.65) 100%)",
                                }}
                            />

                            {/* Top-right badge */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: isMobile ? 16 : 28,
                                    right: isMobile ? 16 : 40,
                                    zIndex: 3,
                                }}
                            >
                                <Tag
                                    icon={<FireOutlined />}
                                    color="#1677ff"
                                    style={{
                                        fontSize: isMobile ? 12 : 14,
                                        fontWeight: 600,
                                        padding: isMobile ? "3px 12px" : "5px 18px",
                                        borderRadius: 24,
                                        border: "none",
                                        boxShadow: "0 4px 16px rgba(22,119,255,0.4)",
                                    }}
                                >
                                    Mới
                                </Tag>
                            </div>

                            {/* Bottom content overlay */}
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: isMobile
                                        ? "60px 20px 24px"
                                        : isTablet
                                        ? "80px 40px 36px"
                                        : "100px 80px 48px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: isMobile ? "flex-start" : "flex-end",
                                    flexDirection: isMobile ? "column" : "row",
                                    gap: isMobile ? 16 : 24,
                                }}
                            >
                                {/* Left: Product info */}
                                <div
                                    style={{
                                        maxWidth: isMobile ? "100%" : "60%",
                                        width: "100%",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: isMobile ? 22 : isTablet ? 28 : 38,
                                            fontWeight: 800,
                                            color: "#fff",
                                            lineHeight: 1.2,
                                            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                                            marginBottom: 12,
                                            letterSpacing: -0.5,
                                        }}
                                    >
                                        {data.name}
                                    </div>

                                    {data.description && !isMobile && (
                                        <div
                                            style={{
                                                fontSize: 15,
                                                color: "rgba(255,255,255,0.8)",
                                                lineHeight: 1.6,
                                                marginBottom: 16,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                maxWidth: 550,
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: data.description
                                                    .replace(/<[^>]*>/g, " ")
                                                    .substring(0, 150),
                                            }}
                                        />
                                    )}

                                    <Flex align="center" gap={10} wrap="wrap">
                                        {data.sold > 0 && (
                                            <Tag
                                                style={{
                                                    background: "rgba(255,255,255,0.12)",
                                                    border: "1px solid rgba(255,255,255,0.2)",
                                                    color: "#fff",
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    backdropFilter: "blur(8px)",
                                                    padding: "2px 10px",
                                                }}
                                            >
                                                <StarFilled
                                                    style={{
                                                        color: "#fadb14",
                                                        marginRight: 4,
                                                    }}
                                                />
                                                Đã bán {data.sold}
                                            </Tag>
                                        )}
                                        {data.stock > 0 && data.stock <= 10 && (
                                            <Tag
                                                style={{
                                                    background: "rgba(255,77,79,0.2)",
                                                    border: "1px solid rgba(255,77,79,0.4)",
                                                    color: "#ff7875",
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    backdropFilter: "blur(8px)",
                                                    padding: "2px 10px",
                                                }}
                                            >
                                                Chỉ còn {data.stock} sản phẩm
                                            </Tag>
                                        )}
                                    </Flex>
                                </div>

                                {/* Right: Price & CTA */}
                                <div
                                    style={{
                                        textAlign: isMobile ? "left" : "right",
                                        flexShrink: 0,
                                        alignSelf: isMobile ? "stretch" : "auto",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: isMobile ? 24 : isTablet ? 30 : 36,
                                            fontWeight: 800,
                                            color: "#fff",
                                            lineHeight: 1,
                                            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                                            marginBottom: 14,
                                        }}
                                    >
                                        {formatPrice(data.price)}
                                        <span
                                            style={{
                                                fontSize: isMobile ? 14 : 18,
                                                fontWeight: 500,
                                                marginLeft: 2,
                                            }}
                                        >
                                            ₫
                                        </span>
                                    </div>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<ShoppingCartOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/products/${data.id}`);
                                        }}
                                        style={{
                                            borderRadius: 12,
                                            fontWeight: 600,
                                            height: isMobile ? 40 : 48,
                                            padding: isMobile ? "0 20px" : "0 32px",
                                            fontSize: isMobile ? 14 : 15,
                                            boxShadow: "0 4px 20px rgba(22,119,255,0.4)",
                                            width: isMobile ? "100%" : "auto",
                                        }}
                                    >
                                        Xem chi tiết
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </Carousel>

            {/* Dot indicators at bottom */}
            <Flex
                gap={8}
                justify="center"
                style={{
                    position: "absolute",
                    bottom: isMobile ? 8 : 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 5,
                }}
            >
                {products.map((_, idx) => (
                    <div
                        key={idx}
                        onClick={() => carouselRef.current?.goTo(idx)}
                        style={{
                            width: currentSlide === idx ? 32 : 8,
                            height: 8,
                            borderRadius: 4,
                            background:
                                currentSlide === idx
                                    ? "#1677ff"
                                    : "rgba(255,255,255,0.5)",
                            cursor: "pointer",
                            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow:
                                currentSlide === idx
                                    ? "0 0 12px rgba(22,119,255,0.6)"
                                    : "none",
                        }}
                    />
                ))}
            </Flex>

            {/* CSS Animations */}
            <style jsx global>{`
                @keyframes kenBurns {
                    0% {
                        transform: scale(1);
                    }
                    100% {
                        transform: scale(1.08);
                    }
                }
            `}</style>
        </div>
    );
}
