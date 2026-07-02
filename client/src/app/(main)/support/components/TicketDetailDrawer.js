"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { App, Avatar, Button, Drawer, Empty, Flex, Input, Spin, Tag, Typography } from "antd";
import { RobotOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { io } from "socket.io-client";
import api from "@/utils/axios";

const { Text, Title } = Typography;

const getSocketURL = () => {
    if (typeof window === "undefined") return "http://localhost:5000";

    try {
        const apiURL = new URL(api.defaults.baseURL || "", window.location.origin);
        return apiURL.origin;
    } catch {
        return window.location.origin;
    }
};

export default function TicketDetailDrawer({ isVisible, onClose, selectedTicket }) {
    const { message } = App.useApp();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [page, setPage] = useState(1);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const hasMoreRef = useRef(true);

    const fetchMessages = useCallback(async (currentPage = 1) => {
        if (!selectedTicket || (currentPage > 1 && !hasMoreRef.current)) return;

        try {
            if (currentPage === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await api.get(
                `/support/${selectedTicket.id}/messages?page=${currentPage}&limit=20`,
            );
            const nextMessages = res.data || [];

            if (nextMessages.length < 20) hasMoreRef.current = false;

            if (currentPage === 1) {
                setMessages(nextMessages);
            } else {
                const container = chatContainerRef.current;
                const prevScrollHeight = container?.scrollHeight || 0;
                setMessages((prev) => [...nextMessages, ...prev]);

                window.setTimeout(() => {
                    if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
                }, 0);
            }
        } catch {
            message.error("Không thể tải chi tiết yêu cầu.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [message, selectedTicket]);

    useEffect(() => {
        if (isVisible && selectedTicket) {
            setPage(1);
            hasMoreRef.current = true;
            fetchMessages(1);
        } else {
            setMessages([]);
            setReplyText("");
            setPage(1);
            hasMoreRef.current = true;
        }
    }, [fetchMessages, isVisible, selectedTicket]);

    useEffect(() => {
        if (!isVisible || !selectedTicket) return undefined;

        const socket = io(getSocketURL(), { transports: ["websocket", "polling"] });

        socket.on("receive_message", (newMessage) => {
            if (String(newMessage.ticketId) !== String(selectedTicket.id)) return;

            setMessages((prev) => {
                const exists = prev.some((item) => item.id === newMessage.id);
                return exists ? prev : [...prev, newMessage];
            });
            window.setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => socket.disconnect();
    }, [isVisible, selectedTicket]);

    useEffect(() => {
        if (page === 1) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, page]);

    const handleScroll = (event) => {
        if (event.target.scrollTop === 0 && !loadingMore && hasMoreRef.current) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMessages(nextPage);
        }
    };

    const handleReply = async () => {
        const content = replyText.trim();
        if (!content || !selectedTicket) return;

        try {
            setSending(true);
            await api.post(`/support/${selectedTicket.id}/reply`, { message: content });
            setReplyText("");
        } catch {
            message.error("Không thể gửi phản hồi lúc này.");
        } finally {
            setSending(false);
        }
    };

    if (!selectedTicket) return null;

    return (
        <Drawer
            title={
                <Flex align="center" gap="small" wrap="wrap">
                    <Text strong>{selectedTicket.ticketCode}</Text>
                    <Tag color="cyan">{selectedTicket.topic}</Tag>
                </Flex>
            }
            size="large"
            open={isVisible}
            onClose={onClose}
            destroyOnClose
        >
            <section
                style={{
                    marginBottom: 18,
                    padding: 16,
                    background: "var(--dp-bg)",
                    border: "1px solid var(--dp-soft-border)",
                    borderRadius: 8,
                }}
            >
                <Title level={5} style={{ marginTop: 0 }}>
                    {selectedTicket.title}
                </Title>
                <Text className="dp-muted">Khách hàng: {selectedTicket.User?.email || "N/A"}</Text>
                {selectedTicket.orderCode && (
                    <div style={{ marginTop: 8 }}>
                        <Text strong>Mã đơn hàng: </Text>
                        <Tag color="magenta">{selectedTicket.orderCode}</Tag>
                    </div>
                )}
            </section>

            <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 128px)" }}>
                {loading ? (
                    <Flex justify="center" align="center" style={{ flex: 1 }}>
                        <Spin />
                    </Flex>
                ) : (
                    <div
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                        style={{ flex: 1, overflowY: "auto", padding: "0 6px", marginBottom: 18 }}
                    >
                        {loadingMore && (
                            <Flex justify="center" style={{ marginBottom: 16 }}>
                                <Spin size="small" />
                            </Flex>
                        )}

                        {messages.length === 0 && <Empty description="Chưa có phản hồi" />}

                        {messages.map((item) => {
                            const isAdmin = item.isAdmin;
                            const isAiMessage = isAdmin && String(item.message || "").includes("Phan hoi tu AI Support DPWOOD");
                            return (
                                <Flex
                                    key={item.id}
                                    justify={isAdmin ? "flex-end" : "flex-start"}
                                    style={{ marginBottom: 16 }}
                                >
                                    <Flex gap="small" align="flex-start" style={{ maxWidth: "82%" }}>
                                        {!isAdmin && <Avatar icon={<UserOutlined />} />}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: isAdmin ? "flex-end" : "flex-start",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: "10px 14px",
                                                    background: isAdmin ? "var(--dp-primary)" : "var(--dp-bg)",
                                                    color: isAdmin ? "#fff" : "var(--dp-ink)",
                                                    border: "1px solid var(--dp-soft-border)",
                                                    borderRadius: 8,
                                                    whiteSpace: "pre-wrap",
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {item.message}
                                            </div>
                                            <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                                                {isAdmin && (
                                                    <Tag color={isAiMessage ? "geekblue" : "green"} style={{ marginRight: 6 }}>
                                                        {isAiMessage ? "AI" : "Admin"}
                                                    </Tag>
                                                )}
                                                {dayjs(item.createdAt).format("HH:mm DD/MM")}
                                            </Text>
                                        </div>
                                        {isAdmin && (
                                            <Avatar style={{ background: "var(--dp-accent)" }} icon={<RobotOutlined />} />
                                        )}
                                    </Flex>
                                </Flex>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                <Flex gap="small" style={{ marginTop: "auto" }}>
                    <Input.TextArea
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        placeholder="Nhập nội dung phản hồi..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onPressEnter={(event) => {
                            if (!event.shiftKey) {
                                event.preventDefault();
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
