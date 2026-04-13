"use client";
import React, { useState, useEffect } from "react";
import { Typography, Spin, Flex, message, Breadcrumb, Divider, Image } from "antd";
import { UserOutlined, CalendarOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import api from "@/utils/axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function ClientBlogDetail({ slug }) {
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogDetail = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                const res = await api.get(`/blogs/${slug}`);
                setBlog(res.data);
            } catch (error) {
                console.error("Lỗi fetch blog:", error);
                message.error("Không tìm thấy bài viết hoặc lỗi máy chủ");
            } finally {
                setLoading(false);
            }
        };

        fetchBlogDetail();
    }, [slug]);

    if (loading) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: "80vh" }}>
                {/* 🔴 Sửa 'tip' thành 'description' */}
                <Spin size="large" description="Đang tải nội dung..." />
            </Flex>
        );
    }

    if (!blog) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Title level={3}>Xin lỗi, bài viết không tồn tại!</Title>
                <Link href="/blogs">Quay lại danh sách tin tức</Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
            <Breadcrumb
                style={{ marginBottom: 20 }}
                items={[
                    { title: <Link href="/">Trang chủ</Link> },
                    { title: <Link href="/blogs">Cẩm nang</Link> },
                    { title: blog.title },
                ]}
            />

            <Title level={1} style={{ marginBottom: 16 }}>
                {blog.title}
            </Title>

            <Flex gap="large" style={{ marginBottom: 30 }} wrap="wrap">
                <Text type="secondary">
                    <UserOutlined /> {blog.author || "Admin"}
                </Text>
                <Text type="secondary">
                    <CalendarOutlined /> {dayjs(blog.createdAt).format("DD/MM/YYYY")}
                </Text>
                <Text type="secondary">
                    <EyeOutlined /> {blog.views || 0} lượt xem
                </Text>
            </Flex>

            {blog.thumbnail && (
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <Image
                        src={blog.thumbnail}
                        alt={blog.title}
                        style={{
                            width: "100%",
                            maxHeight: 500,
                            objectFit: "cover",
                            borderRadius: 12,
                        }}
                    />
                </div>
            )}

            <Divider />

            {/* Hiển thị nội dung bài viết và xử lý tràn chữ */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .blog-content img { 
                    max-width: 100% !important; 
                    height: auto !important; 
                    border-radius: 8px; 
                    display: block;
                    margin: 10px auto;
                }
                .blog-content iframe { 
                    max-width: 100% !important; 
                }
            `,
                }}
            />

            {/* Hiển thị nội dung bài viết */}
            <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
                style={{
                    fontSize: "17px",
                    lineHeight: "1.8",
                    color: "#333",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                }}
            />
        </div>
    );
}
