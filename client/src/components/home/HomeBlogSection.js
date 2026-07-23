"use client";

import Image from "next/image";
import { Button, Col, Row, Typography } from "antd";
import { AppstoreOutlined, ArrowRightOutlined } from "@ant-design/icons";
import HomeViewAllLink from "@/components/home/HomeViewAllLink";

const { Paragraph, Text, Title } = Typography;

function HomeBlogCard({ blog, onOpen }) {
    return (
        <article className="webcake-blog-card">
            {blog.thumbnail && (
                <button type="button" className="webcake-blog-image" onClick={onOpen}>
                    <Image
                        src={blog.thumbnail}
                        alt={blog.title || "DPWOOD blog"}
                        width={740}
                        height={500}
                        unoptimized
                    />
                </button>
            )}
            <Text className="webcake-blog-date">{blog.date || "DPWOOD"}</Text>
            <Title level={4} className="dp-line-clamp-2">{blog.title}</Title>
            <Paragraph className="webcake-blog-summary dp-line-clamp-2">{blog.summary}</Paragraph>
            <Button type="link" onClick={onOpen}>Đọc thêm <ArrowRightOutlined /></Button>
        </article>
    );
}

export default function HomeBlogSection({ blogs, onOpenBlog }) {
    if (!blogs.length) return null;

    return (
        <section className="webcake-section webcake-blog-section">
            <div className="webcake-container">
                <Title level={2} className="webcake-section-title">Bài viết mới</Title>
                <Row gutter={[30, 30]}>
                    {blogs.map((blog) => (
                        <Col xs={24} md={8} key={blog.id || blog.slug || blog.title}>
                            <HomeBlogCard blog={blog} onOpen={() => onOpenBlog(blog)} />
                        </Col>
                    ))}
                </Row>
                <HomeViewAllLink
                    href="/blogs"
                    label="XEM TẤT CẢ BÀI VIẾT"
                    icon={<AppstoreOutlined />}
                />
            </div>
        </section>
    );
}
