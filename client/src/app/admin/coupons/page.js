"use client";

import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Switch,
    Tag,
    Space,
    message,
    Popconfirm,
    Typography,
    Card,
    Flex,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "@/utils/axios";
import AdminIconButton from "@/components/ui/AdminIconButton";
import AdminDeleteAllButton from "@/components/ui/AdminDeleteAllButton";
import { formatNumber } from "@/utils/formatters";

const { Title, Text } = Typography;

const formatVnd = (value) => `${formatNumber(value)} đ`;

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteAllLoading, setDeleteAllLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [form] = Form.useForm();

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await api.get("/coupons/admin");
            setCoupons(res.data);
        } catch {
            message.error("Lỗi khi tải danh sách mã giảm giá");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleOpenCreate = () => {
        setEditingCoupon(null);
        form.resetFields();
        form.setFieldsValue({
            discountType: "percent",
            isActive: true,
        });
        setIsModalVisible(true);
    };

    const handleOpenEdit = (coupon) => {
        setEditingCoupon(coupon);
        form.setFieldsValue({
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            minOrderAmount: Number(coupon.minOrderAmount),
            maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
            usageLimit: coupon.usageLimit,
            startDate: dayjs(coupon.startDate),
            expiryDate: dayjs(coupon.expiryDate),
            isActive: coupon.isActive,
        });
        setIsModalVisible(true);
    };

    const handleSubmit = async (values) => {
        try {
            const payload = {
                ...values,
                code: values.code.trim().toUpperCase(),
                startDate: values.startDate.toISOString(),
                expiryDate: values.expiryDate.toISOString(),
            };

            if (editingCoupon) {
                await api.put(`/coupons/admin/${editingCoupon.id}`, payload);
                message.success("Cập nhật mã giảm giá thành công");
            } else {
                await api.post("/coupons/admin", payload);
                message.success("Tạo mã giảm giá thành công");
            }

            setIsModalVisible(false);
            form.resetFields();
            fetchCoupons();
        } catch (error) {
            message.error(error.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/coupons/admin/${id}`);
            message.success("Đã xóa mã giảm giá");
            fetchCoupons();
        } catch {
            message.error("Lỗi khi xóa mã giảm giá");
        }
    };

    const handleDeleteAll = async () => {
        try {
            setDeleteAllLoading(true);
            const response = await api.delete("/coupons/admin/all");
            setCoupons([]);
            message.success(response.data?.message || "Đã xóa tất cả mã giảm giá");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể xóa tất cả mã giảm giá");
            throw error;
        } finally {
            setDeleteAllLoading(false);
        }
    };

    const getStatusTag = (coupon) => {
        const now = new Date();
        const expiry = new Date(coupon.expiryDate);
        const start = new Date(coupon.startDate);

        if (!coupon.isActive) return <Tag color="default">Vô hiệu hóa</Tag>;
        if (expiry <= now) return <Tag color="red">Hết hạn</Tag>;
        if (start > now) return <Tag color="blue">Chưa bắt đầu</Tag>;
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return <Tag color="orange">Hết lượt</Tag>;
        return <Tag color="green">Đang hoạt động</Tag>;
    };

    const columns = [
        {
            title: "Mã",
            dataIndex: "code",
            key: "code",
            render: (code) => (
                <Text strong copyable style={{ color: "#f09b90", fontFamily: "monospace" }}>
                    {code}
                </Text>
            ),
        },
        { title: "Mô tả", dataIndex: "description", key: "description", ellipsis: true },
        {
            title: "Giảm giá",
            key: "discount",
            render: (_, record) => (
                <Text strong style={{ color: "#cf1322" }}>
                    {record.discountType === "percent" ? `${Number(record.discountValue)}%` : formatVnd(record.discountValue)}
                </Text>
            ),
        },
        {
            title: "Đơn tối thiểu",
            key: "minOrder",
            render: (_, record) => (
                <Text type="secondary">{Number(record.minOrderAmount) > 0 ? formatVnd(record.minOrderAmount) : "Không"}</Text>
            ),
        },
        {
            title: "Sử dụng",
            key: "usage",
            render: (_, record) => (
                <Text>
                    {record.usedCount}/{record.usageLimit || "∞"}
                </Text>
            ),
        },
        { title: "Trạng thái", key: "status", render: (_, record) => getStatusTag(record) },
        {
            title: "Hết hạn",
            dataIndex: "expiryDate",
            key: "expiryDate",
            render: (date) => <Text type="secondary">{dayjs(date).format("DD/MM/YYYY HH:mm")}</Text>,
        },
        {
            title: "Hành động",
            key: "actions",
            fixed: "right",
            render: (_, record) => (
                <Space>
                    <AdminIconButton
                        label="Chỉnh sửa mã giảm giá"
                        tooltip="Chỉnh sửa"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEdit(record)}
                    />
                    <Popconfirm
                        title="Xóa mã giảm giá này?"
                        description="Hành động này không thể hoàn tác"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <AdminIconButton label="Xóa mã giảm giá" tooltip="Xóa" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <GiftOutlined style={{ color: "#f09b90", marginRight: 8 }} />
                        Quản lý mã giảm giá
                    </Title>
                    <Text type="secondary">Các mã đang hoạt động sẽ hiển thị ở trang chủ và kho mã thanh toán.</Text>
                </div>
                <Space wrap>
                    <AdminDeleteAllButton
                        entityLabel="mã giảm giá"
                        count={coupons.length}
                        loading={deleteAllLoading}
                        onConfirm={handleDeleteAll}
                    />
                    <AdminIconButton
                        label="Làm mới danh sách mã giảm giá"
                        tooltip="Làm mới danh sách mã"
                        icon={<ReloadOutlined />}
                        onClick={fetchCoupons}
                        loading={loading}
                    />
                    <AdminIconButton
                        label="Tạo mã giảm giá"
                        icon={<PlusOutlined />}
                        onClick={handleOpenCreate}
                    />
                </Space>
            </Flex>

            <Card variant="borderless">
                <Table
                    dataSource={coupons}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    scroll={{ x: "max-content" }}
                />
            </Card>

            <Modal
                title={
                    <span style={{ fontSize: 18 }}>
                        <GiftOutlined style={{ color: "#f09b90", marginRight: 8 }} />
                        {editingCoupon ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
                    </span>
                }
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={620}
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
                    <Form.Item name="code" label="Mã giảm giá" rules={[{ required: true, message: "Nhập mã giảm giá" }]}>
                        <Input placeholder="VD: SALE5, NEWUSER..." style={{ textTransform: "uppercase" }} />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <Input placeholder="Mô tả ngắn về mã giảm giá" />
                    </Form.Item>

                    <Flex gap="middle" wrap="wrap">
                        <Form.Item name="discountType" label="Loại giảm" rules={[{ required: true }]} style={{ flex: "1 1 220px" }}>
                            <Select
                                options={[
                                    { label: "Phần trăm (%)", value: "percent" },
                                    { label: "Số tiền cố định (đ)", value: "fixed" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            name="discountValue"
                            label="Giá trị giảm"
                            rules={[{ required: true, message: "Nhập giá trị" }]}
                            style={{ flex: "1 1 220px" }}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                placeholder="VD: 5 hoặc 10000"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value.replace(/,/g, "")}
                            />
                        </Form.Item>
                    </Flex>

                    <Flex gap="middle" wrap="wrap">
                        <Form.Item name="minOrderAmount" label="Đơn tối thiểu (đ)" style={{ flex: "1 1 220px" }}>
                            <InputNumber min={0} style={{ width: "100%" }} placeholder="0 = không giới hạn" />
                        </Form.Item>

                        <Form.Item name="maxDiscountAmount" label="Giảm tối đa (đ)" style={{ flex: "1 1 220px" }}>
                            <InputNumber min={0} style={{ width: "100%" }} placeholder="Bỏ trống nếu không giới hạn" />
                        </Form.Item>
                    </Flex>

                    <Flex gap="middle" wrap="wrap">
                        <Form.Item name="usageLimit" label="Giới hạn lượt dùng" style={{ flex: "1 1 220px" }}>
                            <InputNumber min={1} style={{ width: "100%" }} placeholder="Bỏ trống nếu không giới hạn" />
                        </Form.Item>
                        <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked" style={{ flex: "1 1 220px" }}>
                            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                        </Form.Item>
                    </Flex>

                    <Flex gap="middle" wrap="wrap">
                        <Form.Item
                            name="startDate"
                            label="Ngày bắt đầu"
                            rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                            style={{ flex: "1 1 220px" }}
                        >
                            <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
                        </Form.Item>

                        <Form.Item
                            name="expiryDate"
                            label="Ngày hết hạn"
                            rules={[{ required: true, message: "Chọn ngày hết hạn" }]}
                            style={{ flex: "1 1 220px" }}
                        >
                            <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
                        </Form.Item>
                    </Flex>

                    <Flex justify="end" gap="small" style={{ marginTop: 16 }} wrap="wrap">
                        <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit">
                            {editingCoupon ? "Cập nhật" : "Tạo mã"}
                        </Button>
                    </Flex>
                </Form>
            </Modal>
        </div>
    );
}
