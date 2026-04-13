"use client";
import React, { useEffect, useState, useRef } from "react";
import { Drawer, Typography, Tag, Input, Button, Avatar, Flex, message, Spin } from "antd";
import { SendOutlined, UserOutlined, RobotOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import dayjs from "dayjs";
import { io } from "socket.io-client";

const { Text, Title } = Typography;

export default function TicketDetailDrawer({ isVisible, onClose, selectedTicket }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // 1. Tải lịch sử tin nhắn khi mở Drawer
    const fetchMessages = async () => {
        if (!selectedTicket) return;
        try {
            setLoading(true);
            const res = await api.get(`/support/${selectedTicket.id}/messages`);
            setMessages(res.data);
        } catch (error) {
            message.error("Không thể tải chi tiết yêu cầu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isVisible) {
            fetchMessages();
        } else {
            setMessages([]);
            setReplyText("");
        }
    }, [isVisible, selectedTicket]);

    // 2. LẮNG NGHE SOCKET REAL-TIME
    useEffect(() => {
        const socket = io("http://localhost:5000"); // Đảm bảo đúng URL Backend

        socket.on("receive_message", (newMessage) => {
            // Chỉ thêm tin nhắn vào màn hình nếu nó thuộc về Ticket đang mở
            if (selectedTicket && String(newMessage.ticketId) === String(selectedTicket.id)) {
                setMessages((prev) => {
                    const isExist = prev.some((m) => m.id === newMessage.id);
                    return isExist ? prev : [...prev, newMessage];
                });
            }
        });

        return () => socket.disconnect();
    }, [selectedTicket]);

    // 3. Cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 4. Hàm gửi tin nhắn
    const handleReply = async () => {
        if (!replyText.trim()) return;
        try {
            setSending(true);
            // Sau khi gọi API này, Backend sẽ phát Socket "receive_message"
            // và useEffect ở trên sẽ tự cập nhật tin nhắn vào UI mà không cần fetch lại.
            await api.post(`/support/${selectedTicket.id}/reply`, { message: replyText });
            setReplyText("");
        } catch (error) {
            message.error("Lỗi khi gửi phản hồi");
        } finally {
            setSending(false);
        }
    };

    if (!selectedTicket) return null;

    return (
        <Drawer
            title={
                <Flex align="center" gap="small">
                    <Text strong style={{ fontSize: 16 }}>
                        {selectedTicket.ticketCode}
                    </Text>
                    <Tag color="blue">{selectedTicket.topic}</Tag>
                </Flex>
            }
            size="large"
            open={isVisible}
            onClose={onClose}
            destroyOnClose
        >
            {/* Header thông tin yêu cầu */}
            <div style={{ marginBottom: 20, padding: 16, background: "#fafafa", borderRadius: 8 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                    {selectedTicket.title}
                </Title>
                <Text type="secondary">Khách hàng: {selectedTicket.User?.email}</Text>
                {selectedTicket.orderCode && (
                    <div style={{ marginTop: 8 }}>
                        <Text strong>Mã đơn hàng liên quan: </Text>
                        <Tag color="magenta">{selectedTicket.orderCode}</Tag>
                    </div>
                )}
            </div>

            {/* Khung nội dung chat */}
            <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 140px)" }}>
                {loading ? (
                    <Flex justify="center" align="center" style={{ flex: 1 }}>
                        <Spin />
                    </Flex>
                ) : (
                    <div
                        style={{ flex: 1, overflowY: "auto", padding: "0 10px", marginBottom: 20 }}
                    >
                        {messages.map((msg) => {
                            const isSenderAdmin = msg.isAdmin;
                            // Lưu ý: Logic UI (trái/phải) bạn có thể tùy chỉnh tùy theo đây là trang Admin hay User
                            return (
                                <div
                                    key={msg.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: isSenderAdmin ? "flex-end" : "flex-start",
                                        marginBottom: 16,
                                    }}
                                >
                                    <Flex
                                        gap="small"
                                        align="flex-start"
                                        style={{ maxWidth: "80%" }}
                                    >
                                        {!isSenderAdmin && <Avatar icon={<UserOutlined />} />}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: isSenderAdmin
                                                    ? "flex-end"
                                                    : "flex-start",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: "10px 14px",
                                                    background: isSenderAdmin
                                                        ? "#1677ff"
                                                        : "#f0f2f5",
                                                    color: isSenderAdmin ? "#fff" : "#000",
                                                    borderRadius: isSenderAdmin
                                                        ? "8px 0px 8px 8px"
                                                        : "0px 8px 8px 8px",
                                                }}
                                            >
                                                {msg.message}
                                            </div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12, marginTop: 4 }}
                                            >
                                                {dayjs(msg.createdAt).format("HH:mm DD/MM")}
                                            </Text>
                                        </div>
                                        {isSenderAdmin && (
                                            <Avatar
                                                style={{ background: "#f56a00" }}
                                                icon={<RobotOutlined />}
                                            />
                                        )}
                                    </Flex>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Ô nhập tin nhắn */}
                <Flex gap="small" style={{ marginTop: "auto" }}>
                    <Input.TextArea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập nội dung phản hồi..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onPressEnter={(e) => {
                            if (!e.shiftKey) {
                                e.preventDefault();
                                handleReply();
                            }
                        }}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        style={{ height: "auto" }}
                        loading={sending}
                        onClick={handleReply}
                    >
                        Gửi
                    </Button>
                </Flex>
            </div>
        </Drawer>
    );
}
