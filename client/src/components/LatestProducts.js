"use client";
import React, { useEffect, useState } from "react";
import { Spin, Typography, message, Carousel, Image } from "antd";
import { useRouter } from "next/navigation"; // 1. Import thêm useRouter để chuyển trang
import api from "@/utils/axios";

const { Title } = Typography;

export default function LatestProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter(); // Khởi tạo router

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

    const carouselSettings = {
        autoplay: true,
        autoplaySpeed: 3000,
        dots: true,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        fade: true,
    };

    return (
        <div style={{ marginTop: "30px", marginBottom: "80px" }}>
            {/* 2. Đã tăng maxWidth lên 1300px (thêm 100px so với cũ) */}
            <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
                <Carousel {...carouselSettings} style={{ paddingBottom: "40px" }}>
                    {products.map((data) => (
                        <div key={data.id}>
                            <div
                                style={{
                                    position: "relative",
                                    overflow: "hidden",
                                    borderRadius: "16px",
                                    cursor: "pointer",
                                    height: "500px",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                }}
                                // 3. SỰ KIỆN CLICK SẼ ĐIỀU HƯỚNG TỚI TRANG CHI TIẾT SẢN PHẨM TƯƠNG ỨNG
                                onClick={() => router.push(`/products/${data.id}`)}
                                // Hiệu ứng zoom nhẹ ảnh khi hover
                                onMouseOver={(e) => {
                                    const img = e.currentTarget.querySelector("img");
                                    if (img) img.style.transform = "scale(1.08)";
                                }}
                                onMouseOut={(e) => {
                                    const img = e.currentTarget.querySelector("img");
                                    if (img) img.style.transform = "scale(1)";
                                }}
                            >
                                {/* Ảnh nền (Dùng <img> thuần để không bị popup xem chi tiết) */}
                                <Image
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
                                        transition: "transform 0.5s ease",
                                    }}
                                />

                                {/* 4. LỚP PHỦ BÓNG TỐI Ở GÓC TRÊN BÊN TRÁI */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        // Gradient xéo (135 độ): Góc trên trái tối (0.85), nhạt dần và trong suốt hoàn toàn ở giữa ảnh
                                        background:
                                            "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0) 55%)",
                                        padding: "50px 40px",
                                        color: "white",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-start", // Kéo chữ lên trên cùng
                                        alignItems: "flex-start", // Đẩy chữ sang trái
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "36px", // Tăng size chữ vì không gian phía trên rất rộng
                                            fontWeight: "bold",
                                            maxWidth: "50%", // Ngăn không cho chữ tràn ra vùng ảnh trong suốt
                                            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                                        }}
                                    >
                                        {data.name}
                                    </div>
                                    {/* <div
                                        style={{
                                            color: "#ff4d4f",
                                            fontSize: "26px",
                                            fontWeight: "bold",
                                            marginTop: "12px",
                                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                            background: "rgba(165, 139, 139, 0.9)", // Thêm thẻ nền trắng bo góc cho giá tiền nhìn sang chảnh
                                            padding: "4px 16px",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(data.price)}
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    ))}
                </Carousel>
            </div>
        </div>
    );
}
