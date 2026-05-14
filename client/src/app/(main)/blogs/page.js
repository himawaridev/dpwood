"use client";
import React, { useState, useEffect } from "react";
import { Typography, Row, Col, Card, Spin, Flex, Tag, message, Divider } from "antd";
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
        <div style={{ background: "#ffffff", minHeight: "100vh", padding: "60px 0 80px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
                <div style={{ textAlign: "center", marginBottom: 60 }}>
                    <Title level={1} style={{ color: "#1f1f1f", margin: 0, fontWeight: 800, letterSpacing: "-0.5px" }}>
                        Cẩm Nang & Tin Tức
                    </Title>
                    <Paragraph style={{ color: "#595959", fontSize: "18px", marginTop: 16, maxWidth: 600, margin: "16px auto 0" }}>
                        Cập nhật những xu hướng thiết kế nội thất mới nhất và mẹo trang trí không gian sống hoàn hảo.
                    </Paragraph>
                </div>

                <Row gutter={[32, 48]}>
                    {blogs.map((blog) => (
                        <Col xs={24} sm={12} md={8} key={blog.id}>
                            <Card
                                hoverable
                                cover={
                                    <div style={{ overflow: "hidden", height: 240, borderRadius: "16px 16px 0 0" }}>
                                        <img
                                            alt={blog.title}
                                            src={blog.thumbnail || "https://placehold.co/600x400?text=No+Image"}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                transition: "transform 0.4s ease",
                                            }}
                                            onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                                            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                                        />
                                    </div>
                                }
                                onClick={() => router.push(`/blogs/${blog.slug}`)}
                                style={{ 
                                    height: "100%", 
                                    borderRadius: 16, 
                                    overflow: "hidden", 
                                    border: "1px solid #f0f0f0", 
                                    background: "#f0f2f5",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                                    transition: "all 0.3s ease",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.08)";
                                    e.currentTarget.style.transform = "translateY(-4px)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                                styles={{ body: { display: "flex", flexDirection: "column", padding: "24px 24px 32px" } }}
                            >
                                <Tag color="blue" style={{ alignSelf: "flex-start", marginBottom: 16, borderRadius: 6, padding: "2px 12px", border: "none", background: "#e6f4ff", color: "#1677ff", fontWeight: 600 }}>Tin tức</Tag>
                                <Title level={4} style={{ margin: "0 0 12px", fontWeight: 700, lineHeight: 1.4, color: "#1f1f1f" }} ellipsis={{ rows: 2 }}>
                                    {blog.title}
                                </Title>
                                <Paragraph type="secondary" ellipsis={{ rows: 3 }} style={{ flex: 1, fontSize: 15, lineHeight: 1.6, color: "#595959" }}>
                                    {blog.summary}
                                </Paragraph>
                                <Flex justify="space-between" align="center" style={{ marginTop: 20 }}>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                                        <CalendarOutlined style={{ marginRight: 6 }} />
                                        {dayjs(blog.createdAt).format("DD/MM/YYYY")}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                                        <EyeOutlined /> {blog.views}
                                    </Text>
                                </Flex>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {blogs.length === 0 && (
                    <div style={{ textAlign: "center", padding: "80px 0", background: "#fff", borderRadius: 24, border: "1px dashed #d9d9d9" }}>
                        <Title level={4} style={{ color: "#8c8c8c" }}>Hiện chưa có bài viết nào được đăng.</Title>
                        <Text type="secondary">Vui lòng quay lại sau nhé!</Text>
                    </div>
                )}
            </div>
        </div>
    );
}
