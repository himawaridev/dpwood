"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    App,
    Card,
    Empty,
    Flex,
    Form,
    Input,
    Modal,
    Popconfirm,
    Rate,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    CheckCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    StarOutlined,
} from "@ant-design/icons";
import api from "@/utils/axios";
import AdminIconButton from "@/components/ui/AdminIconButton";
import { formatDate } from "@/utils/formatters";

const { Paragraph, Text, Title } = Typography;

export default function AdminReviewsPage() {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [ratings, setRatings] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRating, setEditingRating] = useState(null);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ rating: undefined, source: undefined, verified: undefined });
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const fetchRatings = useCallback(async (page = 1, nextSearch = search, nextFilters = filters) => {
        try {
            setLoading(true);
            const response = await api.get("/products/admin/ratings", {
                params: {
                    page,
                    limit: pagination.pageSize,
                    search: nextSearch || undefined,
                    rating: nextFilters.rating,
                    source: nextFilters.source,
                    verified: nextFilters.verified,
                },
            });
            setRatings(response.data?.ratings || []);
            setPagination((current) => ({
                ...current,
                current: page,
                total: Number(response.data?.pagination?.total || 0),
            }));
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải danh sách đánh giá.");
        } finally {
            setLoading(false);
        }
    }, [filters, message, pagination.pageSize, search]);

    const fetchOptions = useCallback(async () => {
        try {
            const [productResponse, userResponse] = await Promise.all([
                api.get("/products"),
                api.get("/users"),
            ]);
            setProducts(productResponse.data?.products || productResponse.data || []);
            setUsers((userResponse.data || []).filter((user) => !user.deletedAt));
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải sản phẩm và tài khoản.");
        }
    }, [message]);

    useEffect(() => {
        fetchRatings(1);
        fetchOptions();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const productOptions = useMemo(
        () => products.map((product) => ({ value: product.id, label: product.name })),
        [products],
    );
    const userOptions = useMemo(
        () => users.map((user) => ({
            value: user.id,
            label: `${user.name || "Chưa đặt tên"} (${user.email})`,
        })),
        [users],
    );

    const openCreateModal = () => {
        setEditingRating(null);
        form.resetFields();
        form.setFieldsValue({ rating: 5 });
        setModalOpen(true);
    };

    const openEditModal = (record) => {
        setEditingRating(record);
        form.setFieldsValue({
            productId: record.productId,
            userId: record.userId,
            rating: Number(record.rating),
            comment: record.comment || "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            if (editingRating) {
                await api.put(`/products/admin/ratings/${editingRating.id}`, values);
                message.success("Đã cập nhật đánh giá.");
            } else {
                await api.post("/products/admin/ratings", values);
                message.success("Đã tạo đánh giá.");
            }
            setModalOpen(false);
            form.resetFields();
            await fetchRatings(editingRating ? pagination.current : 1);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error.response?.data?.message || "Không thể lưu đánh giá.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ratingId) => {
        try {
            await api.delete(`/products/admin/ratings/${ratingId}`);
            message.success("Đã xóa đánh giá.");
            const targetPage = ratings.length === 1 && pagination.current > 1
                ? pagination.current - 1
                : pagination.current;
            await fetchRatings(targetPage);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể xóa đánh giá.");
        }
    };

    const updateFilters = (key, value) => {
        const nextFilters = { ...filters, [key]: value };
        setFilters(nextFilters);
        fetchRatings(1, search, nextFilters);
    };

    const columns = [
        {
            title: "Sản phẩm",
            key: "product",
            width: 230,
            render: (_, record) => <Text strong>{record.Product?.name || "Sản phẩm không còn tồn tại"}</Text>,
        },
        {
            title: "Người đánh giá",
            key: "user",
            width: 220,
            render: (_, record) => (
                <Flex vertical gap={2}>
                    <Text strong>{record.User?.name || "Chưa đặt tên"}</Text>
                    <Text type="secondary">{record.User?.email}</Text>
                </Flex>
            ),
        },
        {
            title: "Số sao",
            dataIndex: "rating",
            key: "rating",
            width: 155,
            render: (value) => <Rate disabled allowHalf value={Number(value || 0)} style={{ fontSize: 14 }} />,
        },
        {
            title: "Bình luận",
            dataIndex: "comment",
            key: "comment",
            width: 280,
            render: (value) => value ? (
                <Paragraph ellipsis={{ rows: 2, tooltip: value }} style={{ margin: 0 }}>{value}</Paragraph>
            ) : <Text type="secondary">Không có bình luận</Text>,
        },
        {
            title: "Nguồn",
            key: "source",
            width: 150,
            render: (_, record) => (
                <Space direction="vertical" size={4}>
                    <Tag color={record.source === "ADMIN" ? "pink" : "default"}>
                        {record.source === "ADMIN" ? "Quản trị nhập" : "Khách hàng"}
                    </Tag>
                    {record.isVerifiedPurchase && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>Đã mua hàng</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: "Cập nhật",
            dataIndex: "updatedAt",
            key: "updatedAt",
            width: 130,
            render: formatDate,
        },
        {
            title: "Hành động",
            key: "actions",
            fixed: "right",
            width: 100,
            render: (_, record) => (
                <Flex gap={6}>
                    <AdminIconButton
                        label="Chỉnh sửa đánh giá"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                    />
                    <Popconfirm
                        title="Xóa đánh giá này?"
                        description="Điểm trung bình của sản phẩm sẽ được tính lại."
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <AdminIconButton label="Xóa đánh giá" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16} style={{ marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <StarOutlined style={{ color: "#f09b90", marginRight: 8 }} />
                        Quản lý đánh giá
                    </Title>
                    <Text type="secondary">Tạo, kiểm tra và cập nhật đánh giá sản phẩm từ một nơi.</Text>
                </div>
                <Space wrap>
                    <AdminIconButton
                        label="Làm mới danh sách đánh giá"
                        icon={<ReloadOutlined />}
                        loading={loading}
                        onClick={() => fetchRatings(pagination.current)}
                    />
                    <AdminIconButton
                        label="Tạo đánh giá"
                        icon={<PlusOutlined />}
                        onClick={openCreateModal}
                    />
                </Space>
            </Flex>

            <Card variant="outlined" className="dp-panel">
                <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
                    <Input.Search
                        allowClear
                        placeholder="Tìm sản phẩm, tên, email hoặc bình luận"
                        enterButton={<SearchOutlined />}
                        style={{ width: 340, maxWidth: "100%" }}
                        onSearch={(value) => {
                            setSearch(value.trim());
                            fetchRatings(1, value.trim(), filters);
                        }}
                    />
                    <Select
                        allowClear
                        placeholder="Tất cả số sao"
                        style={{ width: 150 }}
                        options={[1, 2, 3, 4, 5].map((value) => ({ value, label: `${value} sao` }))}
                        onChange={(value) => updateFilters("rating", value)}
                    />
                    <Select
                        allowClear
                        placeholder="Tất cả nguồn"
                        style={{ width: 170 }}
                        options={[
                            { value: "CUSTOMER", label: "Khách hàng" },
                            { value: "ADMIN", label: "Quản trị nhập" },
                        ]}
                        onChange={(value) => updateFilters("source", value)}
                    />
                    <Select
                        allowClear
                        placeholder="Trạng thái mua"
                        style={{ width: 175 }}
                        options={[
                            { value: "true", label: "Đã mua hàng" },
                            { value: "false", label: "Chưa xác minh mua" },
                        ]}
                        onChange={(value) => updateFilters("verified", value)}
                    />
                </Flex>

                <Table
                    rowKey="id"
                    dataSource={ratings}
                    columns={columns}
                    loading={loading}
                    scroll={{ x: "max-content" }}
                    locale={{ emptyText: <Empty description="Chưa có đánh giá" /> }}
                    pagination={{
                        ...pagination,
                        showSizeChanger: false,
                        onChange: (page) => fetchRatings(page),
                    }}
                />
            </Card>

            <Modal
                open={modalOpen}
                title={editingRating ? "Chỉnh sửa đánh giá" : "Tạo đánh giá"}
                okText={editingRating ? "Lưu thay đổi" : "Tạo đánh giá"}
                cancelText="Hủy"
                confirmLoading={saving}
                onOk={handleSave}
                onCancel={() => !saving && setModalOpen(false)}
                destroyOnHidden
                width={620}
            >
                <Form form={form} layout="vertical" requiredMark="optional">
                    <Form.Item
                        name="productId"
                        label="Sản phẩm"
                        rules={[{ required: true, message: "Hãy chọn sản phẩm" }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Chọn sản phẩm"
                            options={productOptions}
                            disabled={Boolean(editingRating)}
                        />
                    </Form.Item>
                    <Form.Item
                        name="userId"
                        label="Tài khoản người đánh giá"
                        rules={[{ required: true, message: "Hãy chọn tài khoản" }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Chọn tài khoản"
                            options={userOptions}
                            disabled={Boolean(editingRating)}
                        />
                    </Form.Item>
                    <Form.Item
                        name="rating"
                        label="Số sao"
                        rules={[{ required: true, message: "Hãy chọn số sao" }]}
                    >
                        <Rate allowHalf />
                    </Form.Item>
                    <Form.Item name="comment" label="Bình luận">
                        <Input.TextArea
                            rows={5}
                            maxLength={2000}
                            showCount
                            placeholder="Nhập nhận xét về sản phẩm"
                        />
                    </Form.Item>
                    <Text type="secondary">
                        Đánh giá do quản trị viên lưu sẽ được ghi nguồn để truy vết. Nhãn “Đã mua hàng” chỉ xuất hiện khi tài khoản có đơn hợp lệ.
                    </Text>
                </Form>
            </Modal>
        </>
    );
}
