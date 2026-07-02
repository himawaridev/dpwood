"use client";

import React, { useCallback, useEffect, useState } from "react";
import { App, Button, Flex, Image, Input, Modal, Popconfirm, Space, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function AdminBlogPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [aiOpen, setAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const fetchBlogs = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/blogs");
            setBlogs(res.data || []);
        } catch {
            message.error("Lỗi lấy danh sách bài viết");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/blogs/${id}`);
            message.success("Đã xóa bài viết");
            fetchBlogs();
        } catch {
            message.error("Không thể xóa bài viết");
        }
    };

    const handleAiDraft = async () => {
        const prompt = aiPrompt.trim();
        if (prompt.length < 8) {
            message.warning("Vui lòng nhập chủ đề blog chi tiết hơn.");
            return;
        }

        try {
            setAiLoading(true);
            const res = await api.post("/ai/blog-draft", { prompt });
            sessionStorage.setItem("dpwood_ai_blog_draft", JSON.stringify(res.data?.draft || {}));
            setAiOpen(false);
            setAiPrompt("");
            message.success("AI đã tạo nháp blog. Bạn kiểm tra rồi xuất bản.");
            router.push("/admin/blogs/create");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tạo nháp blog bằng AI");
        } finally {
            setAiLoading(false);
        }
    };

    const columns = [
        {
            title: "Ảnh bìa",
            dataIndex: "thumbnail",
            width: 100,
            render: (url) =>
                url ? (
                    <Image
                        src={url}
                        alt="Ảnh bìa bài viết"
                        width={60}
                        height={40}
                        style={{ objectFit: "cover", borderRadius: 0 }}
                    />
                ) : (
                    <Tag>Không có</Tag>
                ),
        },
        {
            title: "Tiêu đề",
            dataIndex: "title",
            render: (value) => <Text strong>{value}</Text>,
        },
        { title: "Tác giả", dataIndex: "author" },
        {
            title: "Lượt xem",
            dataIndex: "views",
            render: (views) => <Tag color="blue">{views} view</Tag>,
        },
        {
            title: "Trạng thái",
            dataIndex: "isPublished",
            render: (isPublished) => (
                <Tag color={isPublished ? "success" : "default"}>{isPublished ? "Công khai" : "Bản nháp"}</Tag>
            ),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => router.push(`/admin/blogs/${record.id}`)} />
                    <Popconfirm
                        title="Xác nhận xóa?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }} wrap="wrap" gap={12}>
                <Title level={3} style={{ margin: 0 }}>
                    Quản lý cẩm nang / Blog
                </Title>
                <Space wrap>
                    <Button icon={<ThunderboltOutlined />} loading={aiLoading} onClick={() => setAiOpen(true)}>
                        AI tạo nháp
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/admin/blogs/create")}>
                        Viết bài mới
                    </Button>
                </Space>
            </Flex>

            <Table
                dataSource={blogs}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: "max-content" }}
            />

            <Modal
                title="AI tạo nháp blog"
                open={aiOpen}
                onCancel={() => setAiOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setAiOpen(false)}>
                        Hủy
                    </Button>,
                    <Button key="generate" type="primary" loading={aiLoading} onClick={handleAiDraft}>
                        Tạo nháp
                    </Button>,
                ]}
            >
                <Flex vertical gap={12}>
                    <Text type="secondary">
                        Nhập chủ đề, từ khóa hoặc mục tiêu bài viết. AI sẽ tạo bản nháp để bạn chỉnh lại trước khi xuất bản.
                    </Text>
                    <Input.TextArea
                        rows={5}
                        value={aiPrompt}
                        onChange={(event) => setAiPrompt(event.target.value)}
                        placeholder="VD: Viết bài tư vấn cách chọn nồi inox 304 cho bếp gia đình, giọng văn thân thiện, có mục mẹo bảo quản."
                    />
                </Flex>
            </Modal>
        </>
    );
}
