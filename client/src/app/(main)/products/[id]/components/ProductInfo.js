import React from "react";
import { Typography, Flex, Tag, InputNumber, Button } from "antd";
import {
    FireOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function ProductInfo({
    product,
    quantity,
    setQuantity,
    handleAddToCart,
    bestSellerThreshold,
}) {
    return (
        <>
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
                    <Tag color="blue" variant="outlined" icon={<SafetyCertificateOutlined />}>
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
                    icon={product.stock > 0 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
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
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        product.price,
                    )}
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
                    onChange={setQuantity}
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
        </>
    );
}
