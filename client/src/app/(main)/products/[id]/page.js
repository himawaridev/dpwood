"use client";
import { useEffect, useState } from "react";
import { Typography, Row, Col, Button, Spin, message, Divider } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/axios";

// 🔴 Import các component đã chia nhỏ
import ProductGallery from "./components/ProductGallery";
import ProductInfo from "./components/ProductInfo";
import ProductDescription from "./components/ProductDescription";
import RelatedProducts from "./components/RelatedProducts";

const { Title } = Typography;

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    const [activeImage, setActiveImage] = useState("");
    const [imageList, setImageList] = useState([]);

    const bestSellerThreshold = 20;

    useEffect(() => {
        if (!id) return;

        const fetchProductDetailAndRelated = async () => {
            try {
                setLoading(true);
                const [productRes, allProductsRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get("/products"),
                ]);

                const data = productRes.data;
                setProduct(data);

                let fetchedImages = [];
                if (Array.isArray(data.images) && data.images.length > 0) {
                    fetchedImages = data.images;
                } else if (data.imageUrl) {
                    fetchedImages = [data.imageUrl];
                } else {
                    fetchedImages = ["https://via.placeholder.com/600x600?text=Chưa+có+hình+ảnh"];
                }
                setImageList(fetchedImages);
                setActiveImage(fetchedImages[0]);

                const products = allProductsRes.data.filter((p) => p.id !== id);
                const shuffled = products.sort(() => 0.5 - Math.random());
                setRelatedProducts(shuffled.slice(0, 4));
            } catch (error) {
                const errorMsg =
                    error.response?.data?.message || error.response?.data?.error || "Lỗi Server!";
                message.error(`Lỗi: ${errorMsg}`);
            } finally {
                setLoading(false);
            }
        };
        fetchProductDetailAndRelated();
    }, [id]);

    const handleAddToCart = (isBuyNow = false) => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = cart.findIndex((item) => item.productId === product.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl || (product.images ? product.images[0] : ""),
                quantity: quantity,
            });
        }
        localStorage.setItem("cart", JSON.stringify(cart));

        if (isBuyNow) {
            router.push("/cart");
        } else {
            message.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "80vh",
                }}
            >
                <Spin size="large" description="Đang tải thông tin sản phẩm..." />
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Title level={3}>Sản phẩm không tồn tại hoặc đã bị xóa.</Title>
                <Button type="primary" onClick={() => router.push("/products")}>
                    Quay lại cửa hàng
                </Button>
            </div>
        );
    }

    return (
        <div style={{ background: "#f0f2f5", padding: "40px 20px", minHeight: "100vh" }}>
            <div
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    width: "100%",
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                }}
            >
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                    style={{
                        marginBottom: "24px",
                        fontSize: "16px",
                        paddingLeft: 0,
                        fontWeight: 500,
                        color: "#595959",
                    }}
                >
                    Quay lại
                </Button>

                <Row gutter={[48, 32]}>
                    <Col xs={24} md={14}>
                        <ProductGallery
                            activeImage={activeImage}
                            setActiveImage={setActiveImage}
                            imageList={imageList}
                            productName={product.name}
                        />
                    </Col>

                    <Col xs={24} md={10}>
                        <ProductInfo
                            product={product}
                            quantity={quantity}
                            setQuantity={setQuantity}
                            handleAddToCart={handleAddToCart}
                            bestSellerThreshold={bestSellerThreshold}
                        />
                    </Col>
                </Row>

                <Divider style={{ margin: "48px 0" }} />

                <ProductDescription description={product.description} />

                <Divider style={{ margin: "48px 0" }} />

                <RelatedProducts
                    relatedProducts={relatedProducts}
                    bestSellerThreshold={bestSellerThreshold}
                    onProductClick={(pId) => router.push(`/products/${pId}`)}
                />
            </div>
        </div>
    );
}
