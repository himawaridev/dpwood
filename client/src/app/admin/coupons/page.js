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
    Tooltip,
    Flex,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    GiftOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [form] = Form.useForm();

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await api.get("/coupons/admin");
            setCoupons(res.data);
        } catch (error) {
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
                startDate: values.startDate.toISOString(),
                expiryDate: values.expiryDate.toISOString(),
            };

            if (editingCoupon) {
                await api.put(`/coupons/admin/${editingCoupon.id}`, payload);
                message.success("Cập nhật mã giảm giá thành công!");
            } else {
                await api.post("/coupons/admin", payload);
                message.success("Tạo mã giảm giá thành công!");
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
        } catch (error) {
            message.error("Lỗi khi xóa mã giảm giá");
        }
    };

    const getStatusTag = (coupon) => {
        const now = new Date();
        const expiry = new Date(coupon.expiryDate);
        const start = new Date(coupon.startDate);

        if (!coupon.isActive) return <Tag color="default">Vô hiệu hóa</Tag>;
        if (expiry <= now) return <Tag color="red">Hết hạn</Tag>;
        if (start > now) return <Tag color="blue">Chưa bắt đầu</Tag>;
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
            return <Tag color="orange">Hết lượt</Tag>;
        return <Tag color="green">Đang hoạt động</Tag>;
    };

    const columns = [
        {
            title: "Mã",
            dataIndex: "code",
            key: "code",
            render: (code) => (
                <Text strong copyable style={{ color: "#1677ff", fontFamily: "monospace" }}>
                    {code}
                </Text>
            ),
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
        },
        {
            title: "Giảm giá",
            key: "discount",
            render: (_, record) => (
                <Text strong style={{ color: "#cf1322" }}>
                    {record.discountType === "percent"
                        ? `${Number(record.discountValue)}%`
                        : `${new Intl.NumberFormat("vi-VN").format(record.discountValue)}₫`}
                </Text>
            ),
        },
        {
            title: "Đơn tối thiểu",
            key: "minOrder",
            render: (_, record) => (
                <Text type="secondary">
                    {Number(record.minOrderAmount) > 0
                        ? `${new Intl.NumberFormat("vi-VN").format(record.minOrderAmount)}₫`
                        : "Không"}
                </Text>
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
        {
            title: "Trạng thái",
            key: "status",
            render: (_, record) => getStatusTag(record),
        },
        {
            title: "Hết hạn",
            dataIndex: "expiryDate",
            key: "expiryDate",
            render: (date) => (
                <Text type="secondary">{dayjs(date).format("DD/MM/YYYY HH:mm")}</Text>
            ),
        },
        {
            title: "Hành động",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa mã giảm giá này?"
                        description="Hành động này không thể hoàn tác"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Tooltip title="Xóa">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>
                    <GiftOutlined style={{ color: "#1677ff", marginRight: 8 }} />
                    Quản lý Mã Giảm Giá
                </Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchCoupons} loading={loading}>
                        Làm mới
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
                        Tạo mã giảm giá
                    </Button>
                </Space>
            </Flex>

            <Card
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
            >
                <Table
                    dataSource={coupons}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    scroll={{ x: 900 }}
                />
            </Card>

            <Modal
                title={
                    <span style={{ fontSize: 18 }}>
                        <GiftOutlined style={{ color: "#1677ff", marginRight: 8 }} />
                        {editingCoupon ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
                    </span>
                }
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="code"
                        label="Mã giảm giá"
                        rules={[{ required: true, message: "Nhập mã giảm giá" }]}
                    >
                        <Input
                            placeholder="VD: SALE5, NEWUSER..."
                            style={{ textTransform: "uppercase" }}
                        />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <Input placeholder="Mô tả ngắn về mã giảm giá" />
                    </Form.Item>

                    <Flex gap="middle">
                        <Form.Item
                            name="discountType"
                            label="Loại giảm"
                            rules={[{ required: true }]}
                            style={{ flex: 1 }}
                        >
                            <Select
                                options={[
                                    { label: "Phần trăm (%)", value: "percent" },
                                    { label: "Số tiền cố định (₫)", value: "fixed" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            name="discountValue"
                            label="Giá trị giảm"
                            rules={[{ required: true, message: "Nhập giá trị" }]}
                            style={{ flex: 1 }}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                placeholder="VD: 5 hoặc 10000"
                                formatter={(value) =>
                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(value) => value.replace(/,/g, "")}
                            />
                        </Form.Item>
                    </Flex>

                    <Flex gap="middle">
                        <Form.Item
                            name="minOrderAmount"
                            label="Đơn tối thiểu (₫)"
                            style={{ flex: 1 }}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                placeholder="0 = không giới hạn"
                                formatter={(value) =>
                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(value) => value.replace(/,/g, "")}
                            />
                        </Form.Item>

                        <Form.Item
                            name="maxDiscountAmount"
                            label="Giảm tối đa (₫)"
                            style={{ flex: 1 }}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                placeholder="Chỉ áp dụng cho %"
                                formatter={(value) =>
                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(value) => value.replace(/,/g, "")}
                            />
                        </Form.Item>
                    </Flex>

                    <Form.Item name="usageLimit" label="Giới hạn lượt dùng">
                        <InputNumber
                            min={1}
                            style={{ width: "100%" }}
                            placeholder="Để trống = không giới hạn"
                        />
                    </Form.Item>

                    <Flex gap="middle">
                        <Form.Item
                            name="startDate"
                            label="Ngày bắt đầu"
                            rules={[{ required: true, message: "Chọn ngày" }]}
                            style={{ flex: 1 }}
                        >
                            <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                style={{ width: "100%" }}
                                placeholder="Chọn ngày bắt đầu"
                            />
                        </Form.Item>

                        <Form.Item
                            name="expiryDate"
                            label="Ngày hết hạn"
                            rules={[{ required: true, message: "Chọn ngày" }]}
                            style={{ flex: 1 }}
                        >
                            <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                style={{ width: "100%" }}
                                placeholder="Chọn ngày hết hạn"
                            />
                        </Form.Item>
                    </Flex>

                    {editingCoupon && (
                        <Form.Item
                            name="isActive"
                            label="Trạng thái"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
                        </Form.Item>
                    )}

                    <Flex justify="flex-end" gap="small" style={{ marginTop: 16 }}>
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
