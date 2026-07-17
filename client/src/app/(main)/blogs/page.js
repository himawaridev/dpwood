"use client";

import React, { useEffect, useState } from "react";
import { App, Card, Col, Empty, Flex, Image, Row, Skeleton, Space, Tag, Typography } from "antd";
import { CalendarOutlined, EyeOutlined, ReadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import api from "@/utils/axios";

const { Title, Paragraph, Text } = Typography;

export default function ClientBlogPage() {
    const { message } = App.useApp();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchPublicBlogs = async () => {
            try {
                const res = await api.get("/blogs?public=true");
                setBlogs(res.data || []);
            } catch {
                setBlogs([]);
                message.error("Không thể tải bài viết.");
            } finally {
                setLoading(false);
            }
        };
        fetchPublicBlogs();
    }, [message]);

    return (
        <div className="dp-page">
            <div className="dp-container">
                <section style={{ marginBottom: 24 }}>
                    <span className="dp-eyebrow">
                        <ReadOutlined />
                        Cẩm nang DPWOOD
                    </span>
                    <Paragraph className="dp-muted" style={{ maxWidth: 700, margin: 0 }}>
                        Kinh nghiệm chọn, sử dụng và chăm sóc đồ gia dụng cho căn bếp hiện đại.
                    </Paragraph>
                </section>

                {loading ? (
                    <Row gutter={[20, 20]}>
                        {[1, 2, 3].map((item) => (
                            <Col xs={24} md={8} key={item}>
                                <section className="dp-panel dp-blog-card-skeleton">
                                    <Skeleton.Image active className="dp-blog-skeleton-image" />
                                    <Skeleton active paragraph={{ rows: 3 }} />
                                </section>
                            </Col>
                        ))}
                    </Row>
                ) : blogs.length === 0 ? (
                    <section className="dp-panel" style={{ padding: 42 }}>
                        <Empty description="Hiện chưa có bài viết nào" />
                    </section>
                ) : (
                    <Row gutter={[20, 20]}>
                        {blogs.map((blog) => (
                            <Col xs={24} sm={12} lg={8} key={blog.id}>
                                <Card
                                    hoverable
                                    className="dp-card-hover"
                                    cover={
                                        <Image
                                            preview={false}
                                            alt={blog.title}
                                            src={blog.thumbnail || "https://placehold.co/720x440?text=DPWOOD"}
                                            height={220}
                                            style={{ width: "100%", objectFit: "cover" }}
                                        />
                                    }
                                    onClick={() => router.push(`/blogs/${blog.slug}`)}
                                    styles={{
                                        body: {
                                            minHeight: 220,
                                            display: "flex",
                                            flexDirection: "column",
                                        },
                                    }}
                                >
                                    <Tag color="green" style={{ width: "fit-content", marginBottom: 12 }}>
                                        DPWOOD Journal
                                    </Tag>
                                    <Title level={4} className="dp-blog-card-title" ellipsis={{ rows: 2 }}>
                                        {blog.title}
                                    </Title>
                                    <Paragraph className="dp-muted dp-blog-card-summary" ellipsis={{ rows: 2 }}>
                                        {blog.summary || "Khám phá kinh nghiệm lựa chọn và sử dụng đồ gia dụng nhà bếp."}
                                    </Paragraph>
                                    <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                                        <Space size={6}>
                                            <CalendarOutlined />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {dayjs(blog.createdAt).format("DD/MM/YYYY")}
                                            </Text>
                                        </Space>
                                        <Space size={6}>
                                            <EyeOutlined />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {blog.views || 0}
                                            </Text>
                                        </Space>
                                    </Flex>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </div>
    );
}
