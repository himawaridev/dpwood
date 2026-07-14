"use client";

import React, { useCallback, useEffect, useState } from "react";
import { App, Button, Flex, Image, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function AdminBlogPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);

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
                    <Tooltip title="Chỉnh sửa bài viết">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            aria-label="Chỉnh sửa bài viết"
                            className="dp-admin-action-button"
                            onClick={() => router.push(`/admin/blogs/${record.id}`)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xác nhận xóa?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Tooltip title="Xóa bài viết">
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                aria-label="Xóa bài viết"
                                className="dp-admin-action-button"
                            />
                        </Tooltip>
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
                <Tooltip title="Viết bài mới">
                    <Button
                        type="text"
                        icon={<PlusOutlined />}
                        aria-label="Viết bài mới"
                        className="dp-admin-action-button"
                        onClick={() => router.push("/admin/blogs/create")}
                    />
                </Tooltip>
            </Flex>

            <Table
                dataSource={blogs}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: "max-content" }}
            />
        </>
    );
}
