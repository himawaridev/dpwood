"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Col, Empty, Form, Input, Row, Select, Space, Table, Tag, Typography } from "antd";
import { CustomerServiceOutlined, EyeOutlined, SendOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import TicketDetailDrawer from "./components/TicketDetailDrawer";

const { Title, Text, Paragraph } = Typography;

const statusMeta = {
    PENDING: { color: "warning", label: "Chờ xử lý" },
    PROCESSING: { color: "processing", label: "Đang xử lý" },
    RESOLVED: { color: "success", label: "Đã giải quyết" },
    CLOSED: { color: "default", label: "Đã đóng" },
};

export default function SupportPage() {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/support/my-tickets");
            setTickets(res.data || []);
        } catch {
            setTickets([]);
            message.error("Không thể tải lịch sử hỗ trợ.");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const onFinish = async (values) => {
        try {
            setSubmitting(true);
            await api.post("/support", values);
            message.success("Đã gửi yêu cầu hỗ trợ. DPWOOD sẽ phản hồi sớm.");
            form.resetFields();
            fetchTickets();
        } catch {
            message.error("Không thể gửi yêu cầu lúc này.");
        } finally {
            setSubmitting(false);
        }
    };

    const columns = useMemo(
        () => [
            {
                title: "Mã yêu cầu",
                dataIndex: "ticketCode",
                key: "ticketCode",
                render: (text) => <Text code>{text}</Text>,
            },
            { title: "Chủ đề", dataIndex: "title", key: "title" },
            {
                title: "Ngày gửi",
                dataIndex: "createdAt",
                width: 130,
                render: (date) => new Date(date).toLocaleDateString("vi-VN"),
            },
            {
                title: "Trạng thái",
                dataIndex: "status",
                width: 140,
                render: (status) => {
                    const meta = statusMeta[status] || { color: "default", label: status || "N/A" };
                    return <Tag color={meta.color}>{meta.label}</Tag>;
                },
            },
            {
                title: "",
                key: "action",
                width: 150,
                render: (_, record) => (
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedTicket(record);
                            setIsDrawerVisible(true);
                        }}
                    >
                        Xem phản hồi
                    </Button>
                ),
            },
        ],
        [],
    );

    return (
        <div className="dp-page">
            <div className="dp-container" style={{ maxWidth: 1100 }}>
                <section style={{ marginBottom: 22 }}>
                    <span className="dp-eyebrow">Hỗ trợ khách hàng</span>
                    <Title level={1} className="dp-section-title">
                        <CustomerServiceOutlined style={{ color: "var(--dp-primary)", marginRight: 10 }} />
                        Trung tâm hỗ trợ
                    </Title>
                    <Paragraph className="dp-muted" style={{ maxWidth: 700, margin: 0 }}>
                        Gửi yêu cầu liên quan đến đơn hàng, thanh toán, giao nhận hoặc tài khoản. Mọi phản hồi
                        được lưu lại để bạn theo dõi trong cùng một nơi.
                    </Paragraph>
                </section>

                <Row gutter={[20, 20]} align="stretch">
                    <Col xs={24} lg={10}>
                        <section className="dp-panel" style={{ padding: 24, height: "100%" }}>
                            <Title level={3} style={{ marginTop: 0 }}>
                                Gửi yêu cầu mới
                            </Title>
                            <Form form={form} layout="vertical" onFinish={onFinish}>
                                <Form.Item
                                    name="topic"
                                    label="Vấn đề bạn gặp phải"
                                    rules={[{ required: true, message: "Vui lòng chọn chủ đề" }]}
                                >
                                    <Select
                                        size="large"
                                        placeholder="Chọn chủ đề"
                                        options={[
                                            { value: "PAYMENT", label: "Thanh toán / chuyển khoản" },
                                            { value: "ORDER", label: "Đơn hàng / giao nhận" },
                                            { value: "PRODUCT", label: "Sản phẩm / bảo hành" },
                                            { value: "ACCOUNT", label: "Tài khoản / bảo mật" },
                                            { value: "OTHER", label: "Vấn đề khác" },
                                        ]}
                                    />
                                </Form.Item>
                                <Form.Item name="orderCode" label="Mã đơn hàng">
                                    <Input size="large" placeholder="Ví dụ: DPW123456" />
                                </Form.Item>
                                <Form.Item
                                    name="title"
                                    label="Tiêu đề"
                                    rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                                >
                                    <Input size="large" placeholder="Tóm tắt vấn đề của bạn" />
                                </Form.Item>
                                <Form.Item
                                    name="message"
                                    label="Mô tả chi tiết"
                                    rules={[{ required: true, message: "Vui lòng mô tả vấn đề" }]}
                                >
                                    <Input.TextArea
                                        rows={5}
                                        placeholder="Cung cấp thêm ảnh hưởng, thời điểm xảy ra lỗi hoặc thông tin thanh toán nếu có."
                                    />
                                </Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<SendOutlined />}
                                    loading={submitting}
                                    block
                                >
                                    Gửi yêu cầu
                                </Button>
                            </Form>
                        </section>
                    </Col>

                    <Col xs={24} lg={14}>
                        <section className="dp-panel" style={{ padding: 24, height: "100%" }}>
                            <Space orientation="vertical" size={4} style={{ width: "100%", marginBottom: 18 }}>
                                <Title level={3} style={{ margin: 0 }}>
                                    Lịch sử hỗ trợ
                                </Title>
                                <Text className="dp-muted">
                                    Theo dõi trạng thái và trao đổi tiếp với đội ngũ DPWOOD.
                                </Text>
                            </Space>
                            <Table
                                dataSource={tickets}
                                columns={columns}
                                rowKey="id"
                                loading={loading}
                                scroll={{ x: 760 }}
                                locale={{ emptyText: <Empty description="Chưa có yêu cầu hỗ trợ" /> }}
                                pagination={{ pageSize: 5 }}
                            />
                        </section>
                    </Col>
                </Row>

                <TicketDetailDrawer
                    isVisible={isDrawerVisible}
                    onClose={() => {
                        setIsDrawerVisible(false);
                        setSelectedTicket(null);
                        fetchTickets();
                    }}
                    selectedTicket={selectedTicket}
                />
            </div>
        </div>
    );
}
