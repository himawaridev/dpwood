"use client";
import { useEffect, useState } from "react";
import {
    Typography,
    Row,
    Col,
    Button,
    Image,
    Spin,
    message,
    InputNumber,
    Divider,
    Tag,
    Flex,
    Card,
} from "antd";
import {
    ShoppingCartOutlined,
    CreditCardOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FireOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Title, Text, Paragraph } = Typography;

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]); // State cho sản phẩm liên quan
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    // State cho Gallery ảnh
    const [activeImage, setActiveImage] = useState("");
    const [imageList, setImageList] = useState([]);

    const bestSellerThreshold = 20; // Ngưỡng bán chạy

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

                // --- LOGIC ĐỌC NHIỀU ẢNH TỪ DATABASE ---
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

                // --- LOGIC LẤY SẢN PHẨM LIÊN QUAN ---
                // Lấy ngẫu nhiên 4 sản phẩm khác sản phẩm hiện tại
                const products = allProductsRes.data.filter((p) => p.id !== id);
                const shuffled = products.sort(() => 0.5 - Math.random());
                setRelatedProducts(shuffled.slice(0, 4));
            } catch (error) {
                console.error("Lỗi Backend:", error.response?.data || error.message);
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

                {/* --- CHÍNH SỬA: SỬ DỤNG ROW/COL ĐỂ ÉP CHÚNG NẰM CẠNH NHAU --- */}
                {/* Tỷ lệ: md={14} cho ảnh (lớn hơn), md={10} cho nội dung (nhỏ hơn) */}
                <Row gutter={[48, 32]}>
                    {/* 1. CỘT TRÁI: GALLERY HÌNH ẢNH (Chiếm 14/24) */}
                    <Col xs={24} md={14}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div
                                style={{
                                    border: "1px solid #f0f0f0",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    padding: "12px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    background: "#fafafa",
                                }}
                            >
                                <Image
                                    src={activeImage}
                                    alt={product.name}
                                    style={{
                                        width: "100%",
                                        maxHeight: "550px", // Mở rộng chiều cao tối đa cho ảnh
                                        borderRadius: "8px",
                                        objectFit: "contain",
                                    }}
                                />
                            </div>

                            {imageList.length > 1 && (
                                <Flex
                                    gap="small"
                                    style={{ overflowX: "auto", paddingBottom: "8px" }}
                                >
                                    {imageList.map((img, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setActiveImage(img)}
                                            style={{
                                                width: "80px",
                                                height: "80px",
                                                borderRadius: "8px",
                                                border:
                                                    activeImage === img
                                                        ? "2px solid #1677ff"
                                                        : "1px solid #d9d9d9",
                                                overflow: "hidden",
                                                cursor: "pointer",
                                                opacity: activeImage === img ? 1 : 0.6,
                                                transition: "all 0.3s ease",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Image
                                                src={img}
                                                preview={false}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                                alt={`Thumbnail ${index + 1}`}
                                            />
                                        </div>
                                    ))}
                                </Flex>
                            )}
                        </div>
                    </Col>

                    {/* 2. CỘT PHẢI: THÔNG TIN SẢN PHẨM (Chiếm 10/24) */}
                    <Col xs={24} md={10}>
                        <div
                            style={{
                                borderBottom: "1px solid #f0f0f0",
                                paddingBottom: "20px",
                                marginBottom: "24px",
                            }}
                        >
                            <Flex gap="small" align="center" style={{ marginBottom: "12px" }}>
                                {product.sold >= bestSellerThreshold && (
                                    <Tag color="red" variant="solid" icon={<FireOutlined />}>
                                        Bán chạy ({product.sold} đã bán)
                                    </Tag>
                                )}
                                <Tag
                                    color="blue"
                                    variant="outlined"
                                    icon={<SafetyCertificateOutlined />}
                                >
                                    Chính hãng 100%
                                </Tag>
                            </Flex>
                            <Title
                                level={2}
                                style={{
                                    marginTop: 0,
                                    marginBottom: "8px",
                                    color: "#001529",
                                    fontWeight: 700,
                                    lineHeight: 1.3,
                                }}
                            >
                                {product.name}
                            </Title>
                            <Text type="secondary" style={{ fontSize: "14px" }}>
                                Mã sản phẩm (SKU):{" "}
                                <Text strong style={{ color: "#595959" }}>
                                    {product.id?.substring(0, 8).toUpperCase()}
                                </Text>
                            </Text>
                        </div>

                        <Flex gap="middle" align="center" style={{ marginBottom: 24 }}>
                            <Tag
                                color={product.stock > 0 ? "success" : "error"}
                                icon={
                                    product.stock > 0 ? (
                                        <CheckCircleOutlined />
                                    ) : (
                                        <CloseCircleOutlined />
                                    )
                                }
                                style={{ fontSize: "14px", padding: "4px 8px" }}
                            >
                                {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: "15px" }}>
                                Tồn kho: <strong>{product.stock}</strong> sản phẩm
                            </Text>
                        </Flex>

                        <div
                            style={{
                                background: "#f0f5ff",
                                padding: "20px 24px",
                                borderRadius: "12px",
                                border: "1px solid #d6e4ff",
                                marginBottom: "32px",
                            }}
                        >
                            <Text
                                strong
                                style={{
                                    fontSize: "32px",
                                    color: "#1677ff",
                                    lineHeight: 1,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                }).format(product.price)}
                            </Text>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <Text
                                strong
                                style={{
                                    fontSize: "16px",
                                    display: "block",
                                    marginBottom: "12px",
                                    color: "#262626",
                                }}
                            >
                                Chọn số lượng:
                            </Text>
                            <InputNumber
                                min={1}
                                max={product.stock}
                                value={quantity}
                                onChange={(value) => setQuantity(value)}
                                size="large"
                                style={{ width: "140px" }}
                                disabled={product.stock === 0}
                            />
                        </div>

                        <Flex gap="middle" style={{ width: "100%" }}>
                            <Button
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                style={{
                                    flex: 1,
                                    height: "56px",
                                    fontSize: "15px",
                                    color: "#1677ff",
                                    borderColor: "#1677ff",
                                    fontWeight: 500,
                                }}
                                onClick={() => handleAddToCart(false)}
                                disabled={product.stock === 0}
                            >
                                Thêm vào giỏ
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                icon={<CreditCardOutlined />}
                                style={{
                                    flex: 1,
                                    height: "56px",
                                    fontSize: "15px",
                                    background: "#1677ff",
                                    fontWeight: 500,
                                }}
                                onClick={() => handleAddToCart(true)}
                                disabled={product.stock === 0}
                            >
                                Mua ngay
                            </Button>
                        </Flex>
                    </Col>
                </Row>

                <Divider style={{ margin: "48px 0" }} />

                {/* --- CHÍNH SỬA: LẤY LẠI MÔ TẢ TỪ DATABASE THEO YÊU CẦU --- */}
                <div>
                    <Title level={4} style={{ marginBottom: 16 }}>
                        Mô tả chi tiết sản phẩm
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: "15px",
                            lineHeight: "1.8",
                            whiteSpace: "pre-line",
                            color: "#595959",
                            background: "#fafafa",
                            padding: "24px",
                            borderRadius: "12px",
                            border: "1px solid #f0f0f0",
                        }}
                    >
                        {product.description ||
                            "Đang cập nhật thông tin chi tiết cho sản phẩm này."}
                    </Paragraph>
                </div>

                <Divider style={{ margin: "48px 0" }} />

                {/* --- SẢN PHẨM LIÊN QUAN --- */}
                {relatedProducts.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                        <Title
                            level={3}
                            style={{ textAlign: "center", marginBottom: "40px", color: "#001529" }}
                        >
                            Sản phẩm liên quan
                        </Title>
                        <Row gutter={[24, 24]}>
                            {relatedProducts.map((p) => (
                                <Col xs={24} sm={12} md={6} key={p.id}>
                                    <Card
                                        hoverable
                                        variant="borderless"
                                        style={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            borderRadius: "12px",
                                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                                        }}
                                        styles={{
                                            body: {
                                                padding: "16px",
                                                display: "flex",
                                                flexDirection: "column",
                                                flex: 1,
                                            },
                                        }}
                                        cover={
                                            <Image
                                                alt={p.name}
                                                src={
                                                    p.imageUrl ||
                                                    (p.images
                                                        ? p.images[0]
                                                        : "https://via.placeholder.com/300x200?text=No+Image")
                                                }
                                                height={180}
                                                style={{
                                                    objectFit: "cover",
                                                    width: "100%",
                                                    borderTopLeftRadius: "12px",
                                                    borderTopRightRadius: "12px",
                                                }}
                                                preview={false}
                                                onClick={() => router.push(`/products/${p.id}`)}
                                            />
                                        }
                                    >
                                        <Flex
                                            justify="space-between"
                                            align="center"
                                            style={{ marginBottom: "8px" }}
                                        >
                                            {p.sold >= bestSellerThreshold && (
                                                <Tag
                                                    color="red"
                                                    variant="solid"
                                                    icon={<FireOutlined />}
                                                    style={{ margin: 0, fontSize: "11px" }}
                                                >
                                                    Bán chạy
                                                </Tag>
                                            )}
                                            <Tag
                                                color="blue"
                                                variant="outlined"
                                                style={{ margin: 0, fontSize: "11px" }}
                                            >
                                                Tồn: {p.stock}
                                            </Tag>
                                        </Flex>

                                        <Text
                                            strong
                                            style={{
                                                fontSize: "15px",
                                                whiteSpace: "normal",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                flex: 1,
                                                marginBottom: "12px",
                                                color: "#141414",
                                            }}
                                        >
                                            {p.name}
                                        </Text>

                                        <Flex
                                            justify="space-between"
                                            align="flex-end"
                                            style={{ marginTop: "auto" }}
                                        >
                                            <Text
                                                strong
                                                style={{
                                                    fontSize: "17px",
                                                    color: "#1677ff",
                                                    fontVariantNumeric: "tabular-nums",
                                                }}
                                            >
                                                {new Intl.NumberFormat("vi-VN").format(p.price)}₫
                                            </Text>
                                            <Button
                                                type="text"
                                                size="small"
                                                onClick={() => router.push(`/products/${p.id}`)}
                                            >
                                                Chi tiết
                                            </Button>
                                        </Flex>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}
            </div>
        </div>
    );
}
