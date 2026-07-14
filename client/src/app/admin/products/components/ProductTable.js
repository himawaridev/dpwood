import React, { useState } from "react";
import { Table, Button, Typography, Image, Flex, Popconfirm, Input, Space, Tag, Upload, Tooltip } from "antd";
import {
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    FireOutlined,
    FileTextOutlined,
    PlusOutlined,
    PictureOutlined,
    ReloadOutlined,
    SearchOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { getKitchenCategoryLabel } from "@/utils/kitchenProduct";
import { getProductSalesStats } from "@/utils/productStats";

const { Title, Text } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

export default function ProductTable({
    products,
    loading,
    onAdd,
    onEdit,
    onDelete,
    onRefresh,
    onExportJson,
    onDeleteAll,
    deletingAll,
    onImportJson,
    onDownloadSample,
    jsonLoading,
    onManageCategories,
}) {
    const [searchText, setSearchText] = useState("");

    const filteredProducts = products.filter((product) =>
        `${product.name || ""} ${product.brand || ""} ${product.material || ""} ${product.color || ""} ${product.categoryLabel || getKitchenCategoryLabel(product.category)}`
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
                        <Tag color="#222">{record.categoryLabel || getKitchenCategoryLabel(record.category)}</Tag>
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
                    <Tooltip title="Chỉnh sửa sản phẩm">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            aria-label="Chỉnh sửa sản phẩm"
                            className="dp-admin-action-button"
                            onClick={() => onEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa sản phẩm này?"
                        onConfirm={() => onDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Tooltip title="Xóa sản phẩm">
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                aria-label="Xóa sản phẩm"
                                className="dp-admin-action-button"
                            />
                        </Tooltip>
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
                    <Tooltip title="Làm mới danh sách">
                        <Button
                            type="text"
                            icon={<ReloadOutlined />}
                            aria-label="Làm mới danh sách sản phẩm"
                            className="dp-admin-action-button"
                            onClick={onRefresh}
                            loading={loading}
                        />
                    </Tooltip>
                    <Tooltip title="Quản lý danh mục">
                        <Button
                            type="text"
                            icon={<PictureOutlined />}
                            aria-label="Quản lý danh mục sản phẩm"
                            className="dp-admin-action-button"
                            onClick={onManageCategories}
                        />
                    </Tooltip>
                    <Tooltip title="Xuất sản phẩm ra JSON">
                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            aria-label="Xuất sản phẩm ra JSON"
                            className="dp-admin-action-button"
                            onClick={onExportJson}
                            disabled={loading || !products.length}
                        />
                    </Tooltip>
                    <Tooltip title="Nhập sản phẩm từ JSON">
                        <Upload
                            accept="application/json,.json"
                            showUploadList={false}
                            beforeUpload={onImportJson}
                            disabled={jsonLoading}
                        >
                            <Button
                                type="text"
                                icon={<UploadOutlined />}
                                aria-label="Nhập sản phẩm từ JSON"
                                className="dp-admin-action-button"
                                loading={jsonLoading}
                            />
                        </Upload>
                    </Tooltip>
                    <Tooltip title="Tải file JSON mẫu">
                        <Button
                            type="text"
                            icon={<FileTextOutlined />}
                            aria-label="Tải file JSON mẫu"
                            className="dp-admin-action-button"
                            onClick={onDownloadSample}
                            loading={jsonLoading}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa toàn bộ sản phẩm">
                        <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            aria-label="Xóa toàn bộ sản phẩm"
                            className="dp-admin-action-button"
                            onClick={onDeleteAll}
                            loading={deletingAll}
                            disabled={loading || !products.length}
                        />
                    </Tooltip>
                    <Tooltip title="Thêm sản phẩm mới">
                        <Button
                            type="text"
                            icon={<PlusOutlined />}
                            aria-label="Thêm sản phẩm mới"
                            className="dp-admin-action-button"
                            onClick={onAdd}
                        />
                    </Tooltip>
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
