"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    App,
    DatePicker,
    Flex,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined, ReloadOutlined, TagOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "@/utils/axios";
import AdminIconButton from "@/components/ui/AdminIconButton";

const { Title, Text } = Typography;

export default function AdminDiscountPage() {
    const { message } = App.useApp();
    const [discounts, setDiscounts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const fetchDiscounts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/discounts");
            setDiscounts(res.data || []);
        } catch {
            setDiscounts([]);
            message.error("Lỗi tải danh sách mã giảm giá");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchDiscounts();
    }, [fetchDiscounts]);

    const handleCreate = async (values) => {
        try {
            setSaving(true);
            const payload = {
                ...values,
                code: values.code.trim().toUpperCase(),
                expiryDate: values.expiryDate.toISOString(),
            };

            await api.post("/discounts", payload);
            message.success("Thêm mã giảm giá thành công");
            setIsModalOpen(false);
            form.resetFields();
            fetchDiscounts();
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi thêm mã");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/discounts/${id}`);
            message.success("Đã xóa mã giảm giá");
            fetchDiscounts();
        } catch {
            message.error("Lỗi khi xóa mã");
        }
    };

    const activeCount = useMemo(
        () => discounts.filter((item) => item.expiryDate && dayjs(item.expiryDate).isAfter(dayjs())).length,
        [discounts],
    );

    const columns = [
        {
            title: "Mã",
            dataIndex: "code",
            key: "code",
            render: (text) => (
                <Tag color="cyan" icon={<TagOutlined />}>
                    {text}
                </Tag>
            ),
        },
        {
            title: "Giảm",
            dataIndex: "percentage",
            key: "percentage",
            width: 120,
            render: (value) => <Text strong>{value}%</Text>,
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            render: (value) => value || <Text type="secondary">Không có mô tả</Text>,
        },
        {
            title: "Hết hạn",
            dataIndex: "expiryDate",
            width: 160,
            render: (value) => {
                const expired = value && dayjs(value).isBefore(dayjs());
                return (
                    <Space size={8}>
                        <Text>{value ? dayjs(value).format("DD/MM/YYYY") : "N/A"}</Text>
                        {expired && <Tag color="error">Hết hạn</Tag>}
                    </Space>
                );
            },
        },
        {
            title: "Hành động",
            key: "action",
            width: 110,
            render: (_, record) => (
                <Popconfirm
                    title="Xóa mã giảm giá này?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => handleDelete(record.id)}
                >
                    <AdminIconButton label="Xóa mã giảm giá" icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" gap={16} wrap="wrap" style={{ marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        Quản lý mã giảm giá
                    </Title>
                    <Text type="secondary">
                        {discounts.length} mã trong hệ thống, {activeCount} mã còn hiệu lực.
                    </Text>
                </div>
                <Space wrap>
                    <AdminIconButton
                        label="Làm mới danh sách mã giảm giá"
                        tooltip="Làm mới danh sách mã"
                        icon={<ReloadOutlined />}
                        onClick={fetchDiscounts}
                        loading={loading}
                    />
                    <AdminIconButton
                        label="Thêm mã giảm giá mới"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            form.resetFields();
                            setIsModalOpen(true);
                        }}
                    />
                </Space>
            </Flex>

            <Table
                dataSource={discounts}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: 820 }}
            />

            <Modal
                title="Tạo mã giảm giá"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                okText="Tạo mã"
                cancelText="Hủy"
                confirmLoading={saving}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="code" label="Mã code" rules={[{ required: true, message: "Vui lòng nhập mã" }]}>
                        <Input placeholder="VD: DPWOOD10" />
                    </Form.Item>

                    <Form.Item
                        name="percentage"
                        label="% giảm"
                        rules={[{ required: true, message: "Vui lòng nhập phần trăm giảm" }]}
                    >
                        <InputNumber min={1} max={100} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                        name="expiryDate"
                        label="Ngày hết hạn"
                        rules={[{ required: true, message: "Vui lòng chọn ngày hết hạn" }]}
                    >
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Điều kiện hoặc ghi chú áp dụng mã" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
