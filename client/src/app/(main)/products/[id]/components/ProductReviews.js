import { Avatar, Card, Empty, Flex, Image, Rate, Tag, Typography } from "antd";
import { CheckCircleOutlined, SafetyCertificateOutlined } from "@ant-design/icons";

const { Paragraph, Text, Title } = Typography;

export default function ProductReviews({ reviews = [] }) {
    return (
        <section className="dp-section" aria-labelledby="product-reviews-title">
            <Title id="product-reviews-title" level={3}>Đánh giá từ khách hàng</Title>
            {!reviews.length ? (
                <Card variant="outlined" className="dp-panel dp-product-reviews-empty">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Chưa có đánh giá từ khách đã mua sản phẩm."
                    />
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {reviews.map((review) => (
                        <article key={review.id} className="dp-panel" style={{ padding: 18 }}>
                            <Flex gap={12} align="flex-start">
                                <Avatar src={review.user?.avatarUrl}>{review.user?.name?.[0] || "D"}</Avatar>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <Flex gap={8} align="center" wrap>
                                        <Text strong>{review.user?.name || "Khách hàng DPWOOD"}</Text>
                                        {review.isVerifiedPurchase && (
                                            <Tag color="success" icon={<CheckCircleOutlined />}>Đã mua hàng</Tag>
                                        )}
                                        {review.source === "ADMIN" && (
                                            <Tag icon={<SafetyCertificateOutlined />}>Quản trị nhập</Tag>
                                        )}
                                    </Flex>
                                    <Rate disabled allowHalf value={Number(review.rating || 0)} style={{ fontSize: 15 }} />
                                    {review.comment && <Paragraph style={{ margin: "8px 0 0" }}>{review.comment}</Paragraph>}
                                    {!!review.images?.length && (
                                        <Image.PreviewGroup>
                                            <Flex gap={8} wrap style={{ marginTop: 10 }}>
                                                {review.images.map((url) => <Image key={url} src={url} width={72} height={72} alt="Ảnh đánh giá" />)}
                                            </Flex>
                                        </Image.PreviewGroup>
                                    )}
                                </div>
                            </Flex>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
