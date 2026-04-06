"use client";
import { useEffect, useState } from "react";
import { Card, Button, Row, Col, Typography, message, Spin, Layout, Image } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import AppNavigation from "@/components/AppNavigation"; // Import Menu của bạn

const { Header, Content } = Layout;
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
                message.error("Không thể tải danh sách sản phẩm" + error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleAddToCart = (product) => {
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
        message.success(`Đã thêm ${product.name} vào giỏ hàng`);
    };

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {/* Header MỚI DÙNG APP NAVIGATION */}
            <Header
                style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#001529",
                    padding: "0 40px",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                }}
            >
                <div
                    style={{
                        color: "#fff",
                        fontSize: 22,
                        fontWeight: "bold",
                        cursor: "pointer",
                        marginRight: 24,
                        letterSpacing: 1,
                    }}
                    onClick={() => router.push("/")}
                >
                    DPWOOD
                </div>
                <AppNavigation />
            </Header>

            <Content style={{ padding: "40px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
                <Title level={2} style={{ textAlign: "center", marginBottom: 40 }}>
                    Sản Phẩm Của Chúng Tôi
                </Title>

                {loading ? (
                    <div style={{ textAlign: "center", marginTop: 100 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {products.map((product) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                <Card
                                    hoverable
                                    cover={
                                        <Image
                                            alt={product.name}
                                            src={
                                                product.imageUrl ||
                                                "https://via.placeholder.com/300x200?text=No+Image"
                                            }
                                            height={200}
                                            style={{ objectFit: "cover", width: "100%" }}
                                            preview={false} // Tắt tính năng click vào để phóng to ảnh
                                        />
                                    }
                                    actions={[
                                        <Button
                                            key="add-cart"
                                            type="primary"
                                            icon={<ShoppingCartOutlined />}
                                            onClick={() => handleAddToCart(product)}
                                            disabled={product.stock === 0}
                                        >
                                            {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
                                        </Button>,
                                    ]}
                                >
                                    <Meta
                                        title={product.name}
                                        description={
                                            <div>
                                                <Text
                                                    type="danger"
                                                    strong
                                                    style={{
                                                        fontSize: 18,
                                                        display: "block",
                                                        marginTop: 8,
                                                    }}
                                                >
                                                    {new Intl.NumberFormat("vi-VN", {
                                                        style: "currency",
                                                        currency: "VND",
                                                    }).format(product.price)}
                                                </Text>
                                                <Text type="secondary">
                                                    Tồn kho: {product.stock}
                                                </Text>
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Content>
        </Layout>
    );
}
