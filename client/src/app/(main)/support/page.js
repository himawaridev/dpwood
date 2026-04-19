"use client";
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Select, Table, Typography, Tag, message, Flex, Card } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

// 🔴 Import Drawer vào
import TicketDetailDrawer from "./components/TicketDetailDrawer";

const { Title, Text } = Typography;

export default function SupportPage() {
    const [form] = Form.useForm();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    // 🔴 State quản lý Drawer
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await api.get("/support/my-tickets");
            setTickets(res.data);
        } catch (error) {
            message.error("Lỗi lấy lịch sử hỗ trợ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const onFinish = async (values) => {
        try {
            await api.post("/support", values);
            message.success("Đã gửi yêu cầu hỗ trợ thành công! Chúng tôi sẽ phản hồi sớm nhất.");
            form.resetFields();
            fetchTickets();
        } catch (error) {
            message.error("Lỗi khi gửi yêu cầu");
        }
    };

    // 🔴 Các hàm đóng/mở Drawer
    const handleViewDetail = (record) => {
        setSelectedTicket(record);
        setIsDrawerVisible(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerVisible(false);
        setSelectedTicket(null);
        fetchTickets();
    };

    const columns = [
        {
            title: "Mã YC",
            dataIndex: "ticketCode",
            key: "ticketCode",
            render: (text) => <Text strong>{text}</Text>,
        },
        { title: "Chủ đề", dataIndex: "title", key: "title" },
        {
            title: "Ngày gửi",
            dataIndex: "createdAt",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (status) => {
                const colors = {
                    PENDING: "warning",
                    PROCESSING: "processing",
                    RESOLVED: "success",
                    CLOSED: "default",
                };
                const labels = {
                    PENDING: "Chờ xử lý",
                    PROCESSING: "Đang xử lý",
                    RESOLVED: "Đã giải quyết",
                    CLOSED: "Đã đóng",
                };
                return <Tag color={colors[status]}>{labels[status]}</Tag>;
            },
        },
        // 🔴 Cột Hành động để khách xem tin nhắn
        {
            title: "Chi tiết",
            key: "action",
            render: (_, record) => (
                <Button
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record)}
                >
                    Xem phản hồi
                </Button>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <Title level={2} style={{ textAlign: "center", marginBottom: 40 }}>
                Trung Tâm Hỗ Trợ
            </Title>

            <Card
                title="Gửi yêu cầu mới"
                variant="borderless"
                style={{ marginBottom: 40, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Flex gap="middle">
                        <Form.Item
                            name="topic"
                            label="Vấn đề bạn gặp phải"
                            rules={[{ required: true }]}
                            style={{ flex: 1 }}
                        >
                            <Select
                                options={[
                                    { value: "PAYMENT", label: "Lỗi thanh toán / Chuyển khoản" },
                                    { value: "ORDER", label: "Vấn đề đơn hàng / Giao nhận" },
                                    { value: "ACCOUNT", label: "Tài khoản / Bảo mật" },
                                    { value: "OTHER", label: "Vấn đề khác" },
                                ]}
                                placeholder="Chọn chủ đề"
                            />
                        </Form.Item>
                        <Form.Item
                            name="orderCode"
                            label="Mã đơn hàng (Nếu có)"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="VD: #12345" />
                        </Form.Item>
                    </Flex>
                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                        <Input placeholder="Tóm tắt vấn đề của bạn..." />
                    </Form.Item>
                    <Form.Item name="message" label="Mô tả chi tiết" rules={[{ required: true }]}>
                        <Input.TextArea
                            rows={4}
                            placeholder="Mô tả rõ ràng vấn đề để chúng tôi hỗ trợ bạn tốt nhất..."
                        />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" size="large">
                        Gửi Yêu Cầu
                    </Button>
                </Form>
            </Card>

            <Title level={4}>Lịch sử hỗ trợ của bạn</Title>
            <Table dataSource={tickets} columns={columns} rowKey="id" loading={loading} />

            {/* 🔴 Nhúng Drawer vào trang */}
            <TicketDetailDrawer
                isVisible={isDrawerVisible}
                onClose={handleCloseDrawer}
                selectedTicket={selectedTicket}
            />
        </div>
    );
}
