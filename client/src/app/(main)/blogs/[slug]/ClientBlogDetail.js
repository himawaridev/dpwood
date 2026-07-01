"use client";

import React, { useEffect, useState } from "react";
import { App, Breadcrumb, Button, Empty, Flex, Image, Spin, Tag, Typography } from "antd";
import { CalendarOutlined, EyeOutlined, HomeOutlined, UserOutlined } from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import api from "@/utils/axios";

const { Title, Text, Paragraph } = Typography;

export default function ClientBlogDetail({ slug }) {
    const { message } = App.useApp();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogDetail = async () => {
            if (!slug) return;

            try {
                setLoading(true);
                const res = await api.get(`/blogs/${slug}`);
                setBlog(res.data);
            } catch {
                setBlog(null);
                message.error("Không tìm thấy bài viết hoặc máy chủ đang bận.");
            } finally {
                setLoading(false);
            }
        };

        fetchBlogDetail();
    }, [slug, message]);

    if (loading) {
        return (
            <div className="dp-page" style={{ display: "grid", placeItems: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="dp-page">
                <div className="dp-container">
                    <section className="dp-panel" style={{ padding: 42, textAlign: "center" }}>
                        <Empty description="Bài viết không tồn tại hoặc đã bị ẩn" />
                        <Link href="/blogs">
                            <Button type="primary" style={{ marginTop: 16 }}>
                                Quay lại bài viết
                            </Button>
                        </Link>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="dp-page">
            <article className="dp-container" style={{ maxWidth: 960 }}>
                <Breadcrumb
                    style={{ marginBottom: 18 }}
                    items={[
                        { title: <Link href="/"><HomeOutlined /></Link> },
                        { title: <Link href="/blogs">Cẩm nang</Link> },
                        { title: blog.title },
                    ]}
                />

                <section className="dp-panel" style={{ padding: "28px clamp(18px, 4vw, 38px)" }}>
                    <Tag color="green" style={{ marginBottom: 16 }}>
                        DPWOOD Journal
                    </Tag>
                    <Title level={1} style={{ margin: 0, lineHeight: 1.14 }}>
                        {blog.title}
                    </Title>
                    {blog.summary && (
                        <Paragraph className="dp-muted" style={{ fontSize: 16, marginTop: 14 }}>
                            {blog.summary}
                        </Paragraph>
                    )}

                    <Flex gap="large" style={{ margin: "22px 0 28px" }} wrap="wrap">
                        <Text type="secondary">
                            <UserOutlined /> {blog.author || "DPWOOD"}
                        </Text>
                        <Text type="secondary">
                            <CalendarOutlined /> {dayjs(blog.createdAt).format("DD/MM/YYYY")}
                        </Text>
                        <Text type="secondary">
                            <EyeOutlined /> {blog.views || 0} lượt xem
                        </Text>
                    </Flex>

                    {blog.thumbnail && (
                        <Image
                            preview={false}
                            src={blog.thumbnail}
                            alt={blog.title}
                            style={{
                                width: "100%",
                                maxHeight: 520,
                                objectFit: "cover",
                                borderRadius: 8,
                                border: "1px solid var(--dp-soft-border)",
                            }}
                        />
                    )}

                    <div
                        className="dp-rich-content"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                        style={{ marginTop: 30 }}
                    />
                </section>
            </article>
        </div>
    );
}
