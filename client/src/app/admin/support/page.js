"use client";
import React, { useCallback, useEffect, useState } from "react";
import { App, Table, Tag, Select, Typography, Flex } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import AdminIconButton from "@/components/ui/AdminIconButton";

// Nhúng file Ngăn kéo (Drawer) từ thư mục components
import TicketDetailDrawer from "./components/TicketDetailDrawer";

const { Title, Text } = Typography;

export default function AdminSupportPage() {
    const { message } = App.useApp();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    // State quản lý Drawer
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/support/admin/all");
            setTickets(res.data);
        } catch {
            message.error("Lỗi lấy danh sách Ticket");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            await api.put(`/support/admin/${ticketId}/status`, { status: newStatus });
            message.success("Đã cập nhật trạng thái");
            fetchTickets();
        } catch {
            message.error("Lỗi cập nhật");
        }
    };

    // Hàm mở Drawer
    const handleViewDetail = (record) => {
        setSelectedTicket(record);
        setIsDrawerVisible(true);
    };

    // Hàm đóng Drawer và tải lại dữ liệu
    const handleCloseDrawer = () => {
        setIsDrawerVisible(false);
        setSelectedTicket(null);
        fetchTickets();
    };

    const columns = [
        {
            title: "Mã",
            dataIndex: "ticketCode",
            key: "ticketCode",
            render: (text) => <Text strong>{text}</Text>,
        },
        { title: "Khách hàng", key: "user", render: (_, record) => record.User?.email || "Khách" },
        {
            title: "Chủ đề",
            dataIndex: "topic",
            render: (topic) => {
                const colorMap = {
                    PAYMENT: "gold",
                    ORDER: "cyan",
                    ACCOUNT: "purple",
                    OTHER: "default",
                };
                return <Tag color={colorMap[topic]}>{topic}</Tag>;
            },
        },
        { title: "Tiêu đề YC", dataIndex: "title", key: "title" },
        {
            title: "Xử lý bởi",
            key: "handlerType",
            render: (_, record) => {
                const handlerMap = {
                    AI: { color: "geekblue", label: "AI" },
                    ADMIN: { color: "green", label: "Quản trị viên" },
                    NONE: { color: "default", label: "Chưa xử lý" },
                };
                const item = handlerMap[record.handlerType] || handlerMap.NONE;
                return <Tag color={item.color}>{item.label}</Tag>;
            },
        },
        {
            title: "Trạng thái",
            key: "status",
            render: (_, record) => (
                <Select
                    value={record.status}
                    style={{ width: 140 }}
                    onChange={(val) => handleStatusChange(record.id, val)}
                    options={[
                        { value: "PENDING", label: "Chờ xử lý" },
                        { value: "PROCESSING", label: "Đang xử lý" },
                        { value: "RESOLVED", label: "Đã giải quyết" },
                        { value: "CLOSED", label: "Đã đóng" },
                    ]}
                />
            ),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <AdminIconButton
                    label="Xem chi tiết ticket"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record)}
                />
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                <Title level={3} style={{ margin: 0 }}>
                    Quản Lý Hỗ Trợ (Tickets)
                </Title>
            </Flex>

            <Table
                dataSource={tickets}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: "max-content" }}
            />

            {/* Gọi Ngăn kéo ra ở đây */}
            <TicketDetailDrawer
                isVisible={isDrawerVisible}
                onClose={handleCloseDrawer}
                selectedTicket={selectedTicket}
            />
        </>
    );
}
