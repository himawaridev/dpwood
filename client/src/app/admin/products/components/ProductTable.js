import React, { useState } from "react";
import { Table, Button, Typography, Image, Flex, Popconfirm, Input, Space, Tag } from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    FireOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import { getKitchenCategoryLabel } from "@/utils/kitchenProduct";
import { getProductSalesStats } from "@/utils/productStats";

const { Title, Text } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

export default function ProductTable({ products, loading, onAdd, onAiDraft, onEdit, onDelete, onRefresh, aiLoading }) {
    const [searchText, setSearchText] = useState("");

    const filteredProducts = products.filter((product) =>
        `${product.name || ""} ${product.brand || ""} ${product.material || ""} ${product.color || ""} ${getKitchenCategoryLabel(product.category)}`
            .toLowerCase()
            .includes(searchText.toLowerCase()),
    );

    const columns = [
        {
            title: "Hình ảnh",
            key: "image",
            width: 86,
            render: (_, record) => {
                const displayUrl = record.images && record.images.length > 0 ? record.images[0] : record.imageUrl;
                return displayUrl ? (
                    <Image
                        src={displayUrl}
                        alt={record.name}
                        width={54}
                        height={54}
                        style={{ objectFit: "cover" }}
                    />
                ) : (
                    <Text type="secondary">Chưa có ảnh</Text>
                );
            },
        },
        {
            title: "Sản phẩm",
            key: "product",
            width: 280,
            render: (_, record) => (
                <Flex vertical gap={4}>
                    <Text strong>{record.name}</Text>
                    <Space size={6} wrap>
                        <Tag color="pink">{getKitchenCategoryLabel(record.category)}</Tag>
                        {record.brand && <Tag>{record.brand}</Tag>}
                        {record.material && <Tag>{record.material}</Tag>}
                        {record.color && <Tag color="geekblue">{record.color}</Tag>}
                        {Array.isArray(record.variants) && record.variants.length > 0 && (
                            <Tag color="purple">{record.variants.length} biến thể</Tag>
                        )}
                    </Space>
                </Flex>
            ),
        },
        {
            title: "Giá tiền",
            dataIndex: "price",
            key: "price",
            render: (price) => <Text strong>{formatCurrency(price)}</Text>,
        },
        {
            title: "Tồn kho",
            dataIndex: "stock",
            key: "stock",
            render: (stock) => <Tag color={Number(stock || 0) <= 10 ? "red" : "green"}>{Number(stock || 0)}</Tag>,
        },
        {
            title: "Đã bán",
            dataIndex: "sold",
            key: "sold",
            render: (sold) => Number(sold || 0),
        },
        {
            title: "Hot",
            key: "hot",
            render: (_, record) => {
                const stats = getProductSalesStats(record);
                return stats.isHot ? (
                    <Tag color="magenta" icon={<FireOutlined />}>
                        Bán chạy
                    </Tag>
                ) : (
                    <Tag>Thường</Tag>
                );
            },
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
        {
            title: "Hành động",
            key: "actions",
            fixed: "right",
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
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }} wrap="wrap" gap={16}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        Quản lý sản phẩm đồ bếp
                    </Title>
                    <Text type="secondary">
                        Theo dõi danh mục, giá, tồn kho, hình ảnh và trạng thái bán chạy của từng sản phẩm.
                    </Text>
                </div>
                <Space wrap>
                    <Input.Search
                        placeholder="Tìm tên, danh mục, thương hiệu..."
                        allowClear
                        onSearch={(value) => setSearchText(value)}
                        onChange={(event) => setSearchText(event.target.value)}
                        style={{ width: 280 }}
                        enterButton={<SearchOutlined />}
                    />
                    <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                        Làm mới
                    </Button>
                    <Button icon={<ThunderboltOutlined />} onClick={onAiDraft} loading={aiLoading}>
                        AI tạo nháp
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
                        Thêm mới
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
