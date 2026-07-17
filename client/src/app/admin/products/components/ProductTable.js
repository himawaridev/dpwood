import React, { useState } from "react";
import { Table, Typography, Image, Flex, Popconfirm, Input, Space, Tag, Upload } from "antd";
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
import { formatCurrency, formatDate } from "@/utils/formatters";
import AdminIconButton from "@/components/ui/AdminIconButton";

const { Title, Text } = Typography;

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
            render: formatDate,
        },
        {
            title: "Hành động",
            key: "actions",
            fixed: "right",
            render: (_, record) => (
                <Flex gap="small">
                    <AdminIconButton
                        label="Chỉnh sửa sản phẩm"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(record)}
                    />
                    <Popconfirm
                        title="Xóa sản phẩm này?"
                        onConfirm={() => onDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <AdminIconButton label="Xóa sản phẩm" icon={<DeleteOutlined />} />
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
                    <AdminIconButton
                        label="Làm mới danh sách sản phẩm"
                        tooltip="Làm mới danh sách"
                        icon={<ReloadOutlined />}
                        onClick={onRefresh}
                        loading={loading}
                    />
                    <AdminIconButton
                        label="Quản lý danh mục sản phẩm"
                        tooltip="Quản lý danh mục"
                        icon={<PictureOutlined />}
                        onClick={onManageCategories}
                    />
                    <AdminIconButton
                        label="Xuất sản phẩm ra JSON"
                        icon={<DownloadOutlined />}
                        onClick={onExportJson}
                        disabled={loading || !products.length}
                    />
                    <Upload
                        accept="application/json,.json"
                        showUploadList={false}
                        beforeUpload={onImportJson}
                        disabled={jsonLoading}
                    >
                        <AdminIconButton
                            label="Nhập sản phẩm từ JSON"
                            icon={<UploadOutlined />}
                            loading={jsonLoading}
                        />
                    </Upload>
                    <AdminIconButton
                        label="Tải file JSON mẫu"
                        icon={<FileTextOutlined />}
                        onClick={onDownloadSample}
                        loading={jsonLoading}
                    />
                    <AdminIconButton
                        label="Xóa toàn bộ sản phẩm"
                        icon={<DeleteOutlined />}
                        onClick={onDeleteAll}
                        loading={deletingAll}
                        disabled={loading || !products.length}
                    />
                    <AdminIconButton
                        label="Thêm sản phẩm mới"
                        icon={<PlusOutlined />}
                        onClick={onAdd}
                    />
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
