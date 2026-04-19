"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Typography, Tag, Space, message, Flex, Image, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function AdminBlogPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter(); // 🔴 Dùng để chuyển trang

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const res = await api.get("/blogs");
            setBlogs(res.data);
        } catch (error) {
            message.error("Lỗi lấy danh sách bài viết");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/blogs/${id}`);
            message.success("Đã xóa bài viết");
            fetchBlogs();
        } catch (error) {
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
                        width={60}
                        height={40}
                        style={{ objectFit: "cover", borderRadius: 4 }}
                    />
                ) : (
                    <Tag>Không có</Tag>
                ),
        },
        { title: "Tiêu đề", dataIndex: "title", render: (text) => <Text strong>{text}</Text> },
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
                <Tag color={isPublished ? "success" : "default"}>
                    {isPublished ? "Công khai" : "Riêng tư"}
                </Tag>
            ),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    {/* 🔴 Bấm sửa sẽ nhảy sang URL: /admin/blogs/1 (số 1 là ID bài) */}
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => router.push(`/admin/blogs/${record.id}`)}
                    />
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
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                <Title level={3} style={{ margin: 0 }}>
                    Quản Lý Cẩm Nang / Blog
                </Title>
                {/* 🔴 Bấm viết bài mới sẽ nhảy sang URL: /admin/blogs/create */}
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push("/admin/blogs/create")}
                >
                    Viết bài mới
                </Button>
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
