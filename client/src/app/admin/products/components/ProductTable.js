import React, { useState } from "react";
import { Table, Button, Typography, Image, Flex, Popconfirm, Input, Space } from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function ProductTable({ products, loading, onAdd, onEdit, onDelete, onRefresh }) {
    const [searchText, setSearchText] = useState("");

    // Logic lọc sản phẩm theo tên
    const filteredProducts = products.filter((p) =>
        (p.name || "").toLowerCase().includes(searchText.toLowerCase()),
    );

    const columns = [
        {
            title: "Hình ảnh",
            key: "image",
            render: (_, record) => {
                const displayUrl =
                    record.images && record.images.length > 0 ? record.images[0] : record.imageUrl;
                return displayUrl ? (
                    <Image
                        src={displayUrl}
                        alt={record.name}
                        width={50}
                        height={50}
                        style={{ objectFit: "cover", borderRadius: 4 }}
                    />
                ) : (
                    "Chưa có ảnh"
                );
            },
        },
        { title: "Tên sản phẩm", dataIndex: "name", key: "name", width: "25%" },
        {
            title: "Giá tiền (VNĐ)",
            dataIndex: "price",
            key: "price",
            render: (price) =>
                new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    price,
                ),
        },
        { title: "Tồn kho", dataIndex: "stock", key: "stock" },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
        {
            title: "Hành động",
            key: "actions",
            render: (_, record) => (
                <Flex gap="small">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(record)} />
                    <Popconfirm
                        title="Xóa sản phẩm này?"
                        onConfirm={() => onDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <Flex
                justify="space-between"
                align="center"
                style={{ marginBottom: 20, flexWrap: "wrap", gap: "16px" }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Danh Sách Sản Phẩm
                </Title>
                <Space>
                    <Input.Search
                        placeholder="Tìm tên sản phẩm..."
                        allowClear
                        onSearch={(value) => setSearchText(value)}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                        enterButton={<SearchOutlined />}
                    />
                    <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                        Làm mới
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} size="middle" onClick={onAdd}>
                        Thêm Mới
                    </Button>
                </Space>
            </Flex>

            <Table
                dataSource={filteredProducts}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: "max-content" }}
            />
        </>
    );
}
