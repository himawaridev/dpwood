"use client";
import { useEffect, useState } from "react";
import { Card, Button, Row, Col, Typography, message, Spin, Image, Flex, Tag } from "antd";
import { ShoppingCartOutlined, EyeOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Title, Text } = Typography;
const { Meta } = Card;

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get("/products");
                setProducts(res.data);
            } catch (error) {
                message.error("Không thể tải danh sách sản phẩm: " + error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Hàm xử lý Thêm vào giỏ hàng (Dùng chung cho logic Mua ngay)
    const addToCartLogic = (product) => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = cart.findIndex((item) => item.productId === product.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1,
            });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
    };

    // Hàm Xử lý MUA NGAY: Thêm vào giỏ và đi tới trang thanh toán
    const handleBuyNow = (product) => {
        addToCartLogic(product);
        message.success(`Đã thêm ${product.name} vào giỏ hàng. Đang chuyển hướng...`);
        router.push("/cart"); // Chuyển hướng ngay lập tức
    };

    return (
        // Thêm nền xám nhạt để tách biệt với thẻ Card màu trắng
        <div style={{ padding: "40px 20px", background: "#f0f2f5", minHeight: "100vh" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
                <Title
                    level={2}
                    style={{ textAlign: "center", marginBottom: 40, color: "#001529" }}
                >
                    <AppstoreOutlined style={{ color: "#1677ff", marginRight: 12 }} />
                    Sản Phẩm Của Chúng Tôi
                </Title>

                {loading ? (
                    <div style={{ textAlign: "center", marginTop: 100 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {products.map((product) => (
                            <Col xs={24} sm={12} md={12} lg={8} xl={6} key={product.id}>
                                <Card
                                    hoverable
                                    variant="borderless"
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        borderRadius: "12px", // Bo góc mềm mại
                                        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)", // Nổi bật Card trên nền xám
                                    }}
                                    // AntD v5: Dùng styles.body thay vì bodyStyle
                                    styles={{
                                        body: {
                                            padding: "20px",
                                            display: "flex",
                                            flexDirection: "column",
                                            flex: 1,
                                        },
                                    }}
                                    cover={
                                        <Image
                                            alt={product.name || "Sản phẩm"}
                                            src={
                                                product.imageUrl ||
                                                "https://via.placeholder.com/300x200?text=No+Image"
                                            }
                                            height={220}
                                            style={{ objectFit: "cover", width: "100%" }}
                                            preview={false}
                                            onClick={() => router.push(`/products/${product.id}`)}
                                        />
                                    }
                                >
                                    {/* Cắt ngắn tên nếu quá 2 dòng để giữ form Card đồng đều */}
                                    <Meta
                                        title={
                                            <span
                                                style={{
                                                    fontSize: "16px",
                                                    whiteSpace: "normal",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {product.name}
                                            </span>
                                        }
                                    />

                                    <div style={{ marginTop: "auto", paddingTop: 16 }}>
                                        {/* Hiển thị Giá và Tồn kho */}
                                        <Flex
                                            justify="space-between"
                                            align="center"
                                            style={{ marginBottom: 16 }}
                                        >
                                            <Text strong style={{ fontSize: 20, color: "#1677ff" }}>
                                                {new Intl.NumberFormat("vi-VN", {
                                                    style: "currency",
                                                    currency: "VND",
                                                }).format(product.price)}
                                            </Text>
                                            <Tag
                                                color={product.stock > 0 ? "blue" : "default"}
                                                style={{ margin: 0 }}
                                            >
                                                Tồn: {product.stock}
                                            </Tag>
                                        </Flex>

                                        {/* AntD v5 Flex thay thế cho mảng actions[] cũ */}
                                        <Flex gap="small">
                                            <Button
                                                type="primary"
                                                icon={<ShoppingCartOutlined />}
                                                onClick={() => handleBuyNow(product)}
                                                disabled={product.stock === 0}
                                                style={{ flex: 1 }} // Nút tự động chia đều chiều ngang
                                            >
                                                Mua ngay
                                            </Button>
                                            <Button
                                                icon={<EyeOutlined />}
                                                onClick={() =>
                                                    router.push(`/products/${product.id}`)
                                                }
                                                style={{ flex: 1 }} // Nút tự động chia đều chiều ngang
                                            >
                                                Chi tiết
                                            </Button>
                                        </Flex>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </div>
    );
}
