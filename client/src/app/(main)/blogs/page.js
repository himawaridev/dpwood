"use client";
import React, { useState, useEffect } from "react";
import { Typography, Row, Col, Card, Spin, Flex, Tag, message } from "antd";
import { EyeOutlined, CalendarOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import dayjs from "dayjs";

const { Title, Paragraph, Text } = Typography;

export default function ClientBlogPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchPublicBlogs = async () => {
            try {
                // Gọi API lấy bài viết (chỉ lấy bài đã Published)
                const res = await api.get("/blogs?public=true");
                setBlogs(res.data);
            } catch (error) {
                message.error("Lỗi tải bài viết");
            } finally {
                setLoading(false);
            }
        };
        fetchPublicBlogs();
    }, []);

    if (loading) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: "60vh" }}>
                <Spin size="large" />
            </Flex>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <Title level={2} style={{ textAlign: "center", marginBottom: 40 }}>
                Cẩm Nang & Tin Tức
            </Title>

            <Row gutter={[24, 24]}>
                {blogs.map((blog) => (
                    <Col xs={24} sm={12} md={8} key={blog.id}>
                        <Card
                            hoverable
                            cover={
                                <img
                                    alt={blog.title}
                                    src={
                                        blog.thumbnail ||
                                        "https://placehold.co/600x400?text=No+Image"
                                    }
                                    style={{ height: 200, objectFit: "cover" }}
                                />
                            }
                            onClick={() => router.push(`/blogs/${blog.slug}`)} // Chuyển hướng sang trang chi tiết
                            style={{ height: "100%", display: "flex", flexDirection: "column" }}
                            styles={{ body: { flex: 1, display: "flex", flexDirection: "column" } }}
                        >
                            <Title level={4} style={{ marginTop: 0 }} ellipsis={{ rows: 2 }}>
                                {blog.title}
                            </Title>
                            <Paragraph type="secondary" ellipsis={{ rows: 3 }} style={{ flex: 1 }}>
                                {blog.summary}
                            </Paragraph>
                            <Flex justify="space-between" align="center" style={{ marginTop: 16 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <CalendarOutlined style={{ marginRight: 4 }} />
                                    {dayjs(blog.createdAt).format("DD/MM/YYYY")}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <EyeOutlined style={{ marginRight: 4 }} /> {blog.views}
                                </Text>
                            </Flex>
                        </Card>
                    </Col>
                ))}
            </Row>
            {blogs.length === 0 && (
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                    <Text type="secondary">Hiện chưa có bài viết nào được đăng.</Text>
                </div>
            )}
        </div>
    );
}
