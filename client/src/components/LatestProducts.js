"use client";
import React, { useEffect, useState, useRef } from "react";
import { Spin, Typography, message, Carousel, Tag, Button, Flex } from "antd";
import {
    FireOutlined,
    ShoppingCartOutlined,
    ArrowRightOutlined,
    LeftOutlined,
    RightOutlined,
    StarFilled,
    ThunderboltOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function LatestProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const fetchLatestProducts = async () => {
            try {
                const res = await api.get("/products");
                const sortedProducts = res.data.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                );
                setProducts(sortedProducts.slice(0, 5));
            } catch (error) {
                message.error("Lỗi khi tải sản phẩm mới: " + error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLatestProducts();
    }, []);

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
        autoplaySpeed: 4500,
        dots: false,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        fade: true,
        speed: 600,
        pauseOnHover: true,
        pauseOnDotsHover: true,
        waitForAnimate: false,
        beforeChange: (_, next) => setCurrentSlide(next),
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price);
    };

    return (
        <div style={{ marginTop: 30, marginBottom: 40 }}>
            <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
                {/* Section header */}
                <Flex
                    align="center"
                    justify="space-between"
                    style={{ marginBottom: 16 }}
                >
                    <Flex align="center" gap={10}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background:
                                    "linear-gradient(135deg, #1677ff 0%, #4096ff 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ThunderboltOutlined
                                style={{ fontSize: 18, color: "#fff" }}
                            />
                        </div>
                        <div>
                            <Title
                                level={4}
                                style={{
                                    margin: 0,
                                    color: "#141414",
                                    letterSpacing: 0.3,
                                }}
                            >
                                Sản phẩm mới nhất
                            </Title>
                        </div>
                    </Flex>
                    <Button
                        type="link"
                        onClick={() => router.push("/products")}
                        style={{ fontWeight: 500, fontSize: 14 }}
                    >
                        Xem tất cả <ArrowRightOutlined />
                    </Button>
                </Flex>

                {/* Main carousel container */}
                <div style={{ position: "relative" }}>
                    <Carousel ref={carouselRef} {...carouselSettings}>
                        {products.map((data, index) => (
                            <div key={data.id}>
                                <div
                                    style={{
                                        position: "relative",
                                        overflow: "hidden",
                                        borderRadius: 16,
                                        cursor: "pointer",
                                        height: 480,
                                        boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
                                    }}
                                    onClick={() => router.push(`/products/${data.id}`)}
                                    onMouseOver={(e) => {
                                        const img =
                                            e.currentTarget.querySelector("img");
                                        if (img)
                                            img.style.transform = "scale(1.06)";
                                    }}
                                    onMouseOut={(e) => {
                                        const img =
                                            e.currentTarget.querySelector("img");
                                        if (img) img.style.transform = "scale(1)";
                                    }}
                                >
                                    {/* Background image */}
                                    <img
                                        alt={data.name}
                                        src={
                                            data.imageUrl ||
                                            "https://via.placeholder.com/1300x500?text=No+Image"
                                        }
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            objectFit: "cover",
                                            transition: "transform 0.6s ease",
                                        }}
                                    />

                                    {/* Top-right badge */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 20,
                                            right: 20,
                                            zIndex: 3,
                                        }}
                                    >
                                        <Tag
                                            icon={<FireOutlined />}
                                            color="#1677ff"
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                padding: "4px 14px",
                                                borderRadius: 20,
                                                border: "none",
                                                boxShadow:
                                                    "0 2px 8px rgba(22,119,255,0.3)",
                                            }}
                                        >
                                            Mới
                                        </Tag>
                                    </div>

                                    {/* Bottom overlay with product info */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            background:
                                                "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)",
                                            padding: "80px 40px 32px 40px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-end",
                                        }}
                                    >
                                        {/* Left info */}
                                        <div
                                            style={{
                                                maxWidth: "60%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 28,
                                                    fontWeight: 700,
                                                    color: "#fff",
                                                    lineHeight: 1.3,
                                                    textShadow:
                                                        "0 2px 4px rgba(0,0,0,0.3)",
                                                    marginBottom: 10,
                                                }}
                                            >
                                                {data.name}
                                            </div>

                                            {data.description && (
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        color: "rgba(255,255,255,0.75)",
                                                        lineHeight: 1.5,
                                                        marginBottom: 14,
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient:
                                                            "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: data.description
                                                            .replace(/<[^>]*>/g, " ")
                                                            .substring(0, 120),
                                                    }}
                                                />
                                            )}

                                            <Flex align="center" gap={12}>
                                                {data.sold > 0 && (
                                                    <Tag
                                                        style={{
                                                            background:
                                                                "rgba(255,255,255,0.15)",
                                                            border: "1px solid rgba(255,255,255,0.25)",
                                                            color: "#fff",
                                                            borderRadius: 6,
                                                            fontSize: 12,
                                                            backdropFilter:
                                                                "blur(4px)",
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
                                                            background:
                                                                "rgba(255,77,79,0.2)",
                                                            border: "1px solid rgba(255,77,79,0.4)",
                                                            color: "#ff7875",
                                                            borderRadius: 6,
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        Chỉ còn {data.stock} sản phẩm
                                                    </Tag>
                                                )}
                                            </Flex>
                                        </div>

                                        {/* Right price & CTA */}
                                        <div
                                            style={{
                                                textAlign: "right",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 30,
                                                    fontWeight: 800,
                                                    color: "#fff",
                                                    lineHeight: 1,
                                                    textShadow:
                                                        "0 2px 8px rgba(0,0,0,0.3)",
                                                    marginBottom: 12,
                                                }}
                                            >
                                                {formatPrice(data.price)}
                                                <span
                                                    style={{
                                                        fontSize: 16,
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
                                                    router.push(
                                                        `/products/${data.id}`,
                                                    );
                                                }}
                                                style={{
                                                    borderRadius: 10,
                                                    fontWeight: 600,
                                                    height: 44,
                                                    padding: "0 24px",
                                                    fontSize: 14,
                                                    boxShadow:
                                                        "0 4px 12px rgba(22,119,255,0.35)",
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

                    {/* Custom navigation arrows */}
                    <Button
                        type="text"
                        icon={<LeftOutlined style={{ fontSize: 16, color: "#fff" }} />}
                        onClick={() => carouselRef.current?.prev()}
                        style={{
                            position: "absolute",
                            left: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 5,
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: "rgba(0,0,0,0.35)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(0,0,0,0.55)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(0,0,0,0.35)";
                        }}
                    />
                    <Button
                        type="text"
                        icon={
                            <RightOutlined style={{ fontSize: 16, color: "#fff" }} />
                        }
                        onClick={() => carouselRef.current?.next()}
                        style={{
                            position: "absolute",
                            right: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 5,
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: "rgba(0,0,0,0.35)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(0,0,0,0.55)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(0,0,0,0.35)";
                        }}
                    />

                    {/* Custom dot indicators */}
                    <Flex
                        gap={8}
                        justify="center"
                        style={{
                            position: "absolute",
                            bottom: 16,
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
                                    width: currentSlide === idx ? 28 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    background:
                                        currentSlide === idx
                                            ? "#1677ff"
                                            : "rgba(255,255,255,0.45)",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    boxShadow:
                                        currentSlide === idx
                                            ? "0 0 8px rgba(22,119,255,0.5)"
                                            : "none",
                                }}
                            />
                        ))}
                    </Flex>
                </div>
            </div>
        </div>
    );
}
