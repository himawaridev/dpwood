"use client";

import { useEffect, useState } from "react";
import { App, Typography, Row, Col, Button, Spin, Divider, Breadcrumb } from "antd";
import { ArrowLeftOutlined, HomeOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/axios";
import ProductGallery from "./components/ProductGallery";
import ProductInfo from "./components/ProductInfo";
import ProductDescription from "./components/ProductDescription";
import RelatedProducts from "./components/RelatedProducts";

const { Title } = Typography;

export default function ProductDetailPage() {
    const { message } = App.useApp();
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

                const fetchedImages =
                    Array.isArray(data.images) && data.images.length > 0
                        ? data.images
                        : data.imageUrl
                          ? [data.imageUrl]
                          : ["https://via.placeholder.com/700x700?text=DPWOOD"];

                setImageList(fetchedImages);
                setActiveImage(fetchedImages[0]);

                const products = allProductsRes.data.filter((p) => p.id !== id);
                const sorted = products
                    .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
                    .slice(0, 4);
                setRelatedProducts(sorted);
            } catch (error) {
                const errorMsg =
                    error.response?.data?.message || error.response?.data?.error || "Lỗi server";
                message.error(`Không thể tải sản phẩm: ${errorMsg}`);
            } finally {
                setLoading(false);
            }
        };
        fetchProductDetailAndRelated();
    }, [id, message]);

    const handleAddToCart = (isBuyNow = false) => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = cart.findIndex((item) => item.productId === product.id);
        const safeQuantity = Math.max(1, Number(quantity || 1));

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += safeQuantity;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl || (product.images ? product.images[0] : ""),
                quantity: safeQuantity,
            });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cart-updated"));

        if (isBuyNow) {
            router.push("/cart");
        } else {
            message.success(`Đã thêm ${safeQuantity} sản phẩm vào giỏ hàng`);
        }
    };

    if (loading) {
        return (
            <div className="dp-page" style={{ display: "grid", placeItems: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="dp-page" style={{ display: "grid", placeItems: "center" }}>
                <div className="dp-panel" style={{ padding: 40, textAlign: "center" }}>
                    <Title level={3}>Sản phẩm không tồn tại hoặc đã bị xóa.</Title>
                    <Button type="primary" onClick={() => router.push("/products")}>
                        Quay lại cửa hàng
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="dp-page">
            <div className="dp-container">
                <Breadcrumb
                    style={{ marginBottom: 18 }}
                    items={[
                        { title: <HomeOutlined />, onClick: () => router.push("/") },
                        { title: "Sản phẩm", onClick: () => router.push("/products") },
                        { title: product.name },
                    ]}
                />

                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                    style={{ paddingLeft: 0, marginBottom: 16, fontWeight: 700 }}
                >
                    Quay lại
                </Button>

                <section className="dp-panel" style={{ padding: "clamp(18px, 4vw, 34px)" }}>
                    <Row gutter={[36, 36]} align="top">
                        <Col xs={24} lg={13}>
                            <ProductGallery
                                activeImage={activeImage}
                                setActiveImage={setActiveImage}
                                imageList={imageList}
                                productName={product.name}
                            />
                        </Col>

                        <Col xs={24} lg={11}>
                            <ProductInfo
                                product={product}
                                quantity={quantity}
                                setQuantity={setQuantity}
                                handleAddToCart={handleAddToCart}
                                bestSellerThreshold={bestSellerThreshold}
                            />
                        </Col>
                    </Row>

                    <Divider style={{ margin: "34px 0" }} />
                    <ProductDescription description={product.description} />
                </section>

                <section className="dp-section">
                    <RelatedProducts
                        relatedProducts={relatedProducts}
                        bestSellerThreshold={bestSellerThreshold}
                        onProductClick={(pId) => router.push(`/products/${pId}`)}
                    />
                </section>
            </div>
        </div>
    );
}
