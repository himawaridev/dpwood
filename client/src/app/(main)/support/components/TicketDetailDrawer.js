"use client";

import React, { useEffect, useState } from "react";
import { Alert, App, Button, Descriptions, Drawer, Input, Tag, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

const { Text, Title, Paragraph } = Typography;

export default function TicketDetailDrawer({ isVisible, onClose, selectedTicket, isAdmin = false }) {
    const { message } = App.useApp();
    const [resolutionNote, setResolutionNote] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setResolutionNote(selectedTicket?.resolutionNote || "");
    }, [selectedTicket]);

    const handleSave = async () => {
        if (!selectedTicket) return;
        try {
            setSaving(true);
            await api.put(`/support/admin/${selectedTicket.id}/resolution`, { resolutionNote });
            message.success("Đã lưu kết quả xử lý.");
            onClose();
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể lưu kết quả xử lý.");
        } finally {
            setSaving(false);
        }
    };

    if (!selectedTicket) return null;

    return (
        <Drawer
            title={(
                <span>
                    <Text strong>{selectedTicket.ticketCode}</Text>
                    <Tag color="cyan" style={{ marginLeft: 8 }}>{selectedTicket.topic}</Tag>
                </span>
            )}
            size="large"
            open={isVisible}
            onClose={onClose}
            destroyOnHidden
        >
            <Descriptions
                bordered
                size="small"
                column={1}
                items={[
                    { key: "title", label: "Tiêu đề", children: selectedTicket.title },
                    { key: "customer", label: "Khách hàng", children: selectedTicket.User?.email || "Tài khoản hiện tại" },
                    { key: "order", label: "Mã đơn hàng", children: selectedTicket.orderCode || "Không có" },
                    { key: "created", label: "Ngày gửi", children: new Date(selectedTicket.createdAt).toLocaleString("vi-VN") },
                ]}
            />

            <Title level={5} style={{ marginTop: 24 }}>Nội dung yêu cầu</Title>
            <Paragraph style={{ whiteSpace: "pre-wrap" }}>
                {selectedTicket.description || "Không có mô tả chi tiết."}
            </Paragraph>

            <Title level={5} style={{ marginTop: 24 }}>Kết quả xử lý</Title>
            {isAdmin ? (
                <>
                    <Input.TextArea
                        rows={7}
                        value={resolutionNote}
                        onChange={(event) => setResolutionNote(event.target.value)}
                        placeholder="Nhập hướng xử lý hoặc kết quả cuối cùng cho khách hàng..."
                        maxLength={5000}
                        showCount
                    />
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} style={{ marginTop: 14 }}>
                        Lưu kết quả xử lý
                    </Button>
                </>
            ) : selectedTicket.resolutionNote ? (
                <Alert
                    type="success"
                    showIcon
                    title={selectedTicket.handlerType === "AI" ? "AI DPWOOD đã xử lý" : "DPWOOD đã phản hồi"}
                    description={<span style={{ whiteSpace: "pre-wrap" }}>{selectedTicket.resolutionNote}</span>}
                />
            ) : (
                <Alert type="info" showIcon title="Yêu cầu đang chờ xử lý" />
            )}
        </Drawer>
    );
}
