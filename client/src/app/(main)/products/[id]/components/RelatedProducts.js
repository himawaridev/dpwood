import React from "react";
import { Typography, Row, Col, Card, Image, Flex, Tag, Button } from "antd";
import { FireOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function RelatedProducts({ relatedProducts, bestSellerThreshold, onProductClick }) {
    if (!relatedProducts || relatedProducts.length === 0) return null;

    return (
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
                                    onClick={() => onProductClick(p.id)}
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
                                    onClick={() => onProductClick(p.id)}
                                >
                                    Chi tiết
                                </Button>
                            </Flex>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
