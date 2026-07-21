"use client";

import { useEffect, useState } from "react";
import { App, Typography, Row, Col, Button, Spin, Divider, Breadcrumb } from "antd";
import { ArrowLeftOutlined, HomeOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/axios";
import ProductDescription from "./components/ProductDescription";
import ProductGallery from "./components/ProductGallery";
import ProductInfo from "./components/ProductInfo";
import ProductKitchenSpecs from "./components/ProductKitchenSpecs";
import RelatedProducts from "./components/RelatedProducts";
import ProductReviews from "./components/ProductReviews";

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
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [userRating, setUserRating] = useState(0);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingEligibility, setRatingEligibility] = useState({ canRate: false, message: "" });
    const [userComment, setUserComment] = useState("");
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        if (!id) return;

        const fetchProductDetailAndRelated = async () => {
            try {
                setLoading(true);
                const [productRes, relatedProductsRes, reviewsRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/products/${id}/related`),
                    api.get(`/products/${id}/reviews`),
                ]);

                const data = productRes.data;
                setProduct(data);

                const token = localStorage.getItem("token");
                if (token) {
                    const ratingRes = await api.get(`/products/${data.id}/rating`).catch(() => ({ data: { rating: 0 } }));
                    setUserRating(Number(ratingRes.data?.rating || 0));
                    setUserComment(ratingRes.data?.comment || "");
                    setRatingEligibility({
                        canRate: Boolean(ratingRes.data?.canRate),
                        message: ratingRes.data?.eligibilityMessage || "",
                    });
                } else {
                    setUserRating(0);
                    setUserComment("");
                    setRatingEligibility({ canRate: false, message: "Đăng nhập và hoàn thành đơn hàng để đánh giá." });
                }

                const variantImages = (Array.isArray(data.variants) ? data.variants : [])
                    .map((variant) => variant.imageUrl)
                    .filter(Boolean);
                const fetchedImages =
                    Array.isArray(data.images) && data.images.length > 0
                        ? [...new Set([...data.images, ...variantImages])]
                        : data.imageUrl
                          ? [...new Set([data.imageUrl, ...variantImages])]
                          : ["https://via.placeholder.com/700x700?text=DPWOOD"];

                setImageList(fetchedImages);
                setActiveImage(fetchedImages[0]);

                setRelatedProducts((relatedProductsRes.data || []).slice(0, 4));
                setReviews(reviewsRes.data?.reviews || []);
            } catch (error) {
                const errorMsg = error.response?.data?.message || error.response?.data?.error || "Lỗi server";
                message.error(`Không thể tải sản phẩm: ${errorMsg}`);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetailAndRelated();
    }, [id, message]);

    const handleVariantChange = (variant) => {
        setSelectedVariant(variant || null);
        if (variant?.imageUrl) setActiveImage(variant.imageUrl);
    };

    const handleAddToCart = (isBuyNow = false, variant = selectedVariant) => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const variantId = variant?.variantId || "";
        const cartItemId = variantId ? `${product.id}:${variantId}` : product.id;
        const existingItemIndex = cart.findIndex((item) => item.cartItemId === cartItemId);
        const safeQuantity = Math.max(1, Number(quantity || 1));
        const variantLabel = [variant?.color, variant?.size || variant?.capacity].filter(Boolean).join(" / ");
        const itemPrice = Number(variant?.price || product.price || 0);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += safeQuantity;
        } else {
            cart.push({
                cartItemId,
                productId: product.id,
                variantId,
                variantLabel,
                variantSnapshot: variant || null,
                name: product.name,
                price: itemPrice,
                imageUrl: variant?.imageUrl || product.imageUrl || (product.images ? product.images[0] : ""),
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

    const handleRateProduct = async (rating) => {
        if (!rating || ratingSubmitting) return;

        if (!localStorage.getItem("token")) {
            message.warning("Vui lòng đăng nhập để đánh giá sản phẩm.");
            router.push("/login");
            return;
        }
        if (!ratingEligibility.canRate) {
            message.warning(ratingEligibility.message || "Chỉ khách hàng đã mua sản phẩm mới có thể đánh giá.");
            return;
        }

        try {
            setRatingSubmitting(true);
            const response = await api.post(`/products/${product.id}/rating`, { rating, comment: userComment });
            setProduct(response.data.product);
            setUserRating(Number(response.data.userRating || rating));
            const reviewsResponse = await api.get(`/products/${product.id}/reviews`).catch(() => null);
            if (reviewsResponse) setReviews(reviewsResponse.data?.reviews || []);
            message.success(userRating ? "Đã cập nhật đánh giá sản phẩm." : "Cảm ơn bạn đã đánh giá sản phẩm.");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể gửi đánh giá lúc này.");
        } finally {
            setRatingSubmitting(false);
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
                            <ProductKitchenSpecs product={product} selectedVariant={selectedVariant} />
                        </Col>

                        <Col xs={24} lg={11}>
                            <ProductInfo
                                product={product}
                                quantity={quantity}
                                setQuantity={setQuantity}
                                handleAddToCart={handleAddToCart}
                                onVariantChange={handleVariantChange}
                                onRateProduct={handleRateProduct}
                                ratingSubmitting={ratingSubmitting}
                                hasRatedProduct={Boolean(userRating)}
                                userRating={userRating}
                                canRateProduct={ratingEligibility.canRate}
                                ratingEligibilityMessage={ratingEligibility.message}
                                userComment={userComment}
                                setUserComment={setUserComment}
                            />
                        </Col>
                    </Row>

                    <Divider style={{ margin: "34px 0" }} />
                    <ProductDescription
                        description={product.description}
                        careInstructions={product.careInstructions}
                        safetyInstructions={product.safetyInstructions}
                    />
                </section>

                <ProductReviews reviews={reviews} />

                <section className="dp-section">
                    <RelatedProducts
                        relatedProducts={relatedProducts}
                        onProductClick={(productId) => router.push(`/products/${productId}`)}
                    />
                </section>
            </div>
        </div>
    );
}
