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
    const [loadingMore, setLoadingMore] = useState(false); // Trạng thái cuộn để tải thêm
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);

    // Quản lý phân trang
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null); // Ref để theo dõi vị trí cuộn

    // 1. Hàm tải tin nhắn (Hỗ trợ phân trang)
    const fetchMessages = async (currentPage = 1) => {
        if (!selectedTicket || !hasMore) return;
        try {
            if (currentPage === 1) setLoading(true);
            else setLoadingMore(true);

            // Truyền page và limit (20) lên Backend
            const res = await api.get(
                `/support/${selectedTicket.id}/messages?page=${currentPage}&limit=20`,
            );
            const newMessages = res.data;

            // Nếu Backend trả về ít hơn 20 tin, nghĩa là đã hết sạch tin cũ
            if (newMessages.length < 20) {
                setHasMore(false);
            }

            if (currentPage === 1) {
                setMessages(newMessages);
            } else {
                // Giữ vị trí thanh cuộn khi load thêm tin cũ để màn hình không bị giật lên nóc
                const container = chatContainerRef.current;
                const prevScrollHeight = container.scrollHeight;

                setMessages((prev) => [...newMessages, ...prev]);

                setTimeout(() => {
                    if (container) {
                        container.scrollTop = container.scrollHeight - prevScrollHeight;
                    }
                }, 0);
            }
        } catch (error) {
            message.error("Không thể tải chi tiết yêu cầu");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // 2. Lắng nghe sự kiện Cuộn chuột chạm nóc
    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && !loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMessages(nextPage);
        }
    };

    // 3. Reset state và tải dữ liệu khi mở Drawer
    useEffect(() => {
        if (isVisible) {
            setPage(1);
            setHasMore(true);
            fetchMessages(1);
        } else {
            // Dọn dẹp dữ liệu khi đóng Drawer
            setMessages([]);
            setReplyText("");
            setPage(1);
            setHasMore(true);
        }
    }, [isVisible, selectedTicket]);

    // 4. LẮNG NGHE SOCKET REAL-TIME
    useEffect(() => {
        const socket = io("http://localhost:5000");

        socket.on("receive_message", (newMessage) => {
            if (selectedTicket && String(newMessage.ticketId) === String(selectedTicket.id)) {
                setMessages((prev) => {
                    const isExist = prev.some((m) => m.id === newMessage.id);
                    return isExist ? prev : [...prev, newMessage];
                });
                // Cuộn xuống dòng cuối khi có tin mới
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            }
        });

        return () => socket.disconnect();
    }, [selectedTicket]);

    // Cuộn xuống tin nhắn mới nhất khi lần đầu tiên tải xong (Page 1)
    useEffect(() => {
        if (page === 1) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, page]);

    // 5. Hàm gửi tin nhắn
    const handleReply = async () => {
        if (!replyText.trim()) return;
        try {
            setSending(true);
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
            <div style={{ marginBottom: 20, padding: 16, background: "#fafafa", borderRadius: 8 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                    {selectedTicket.title}
                </Title>
                <Text type="secondary">Khách hàng: {selectedTicket.User?.email || "N/A"}</Text>
                {selectedTicket.orderCode && (
                    <div style={{ marginTop: 8 }}>
                        <Text strong>Mã đơn hàng liên quan: </Text>
                        <Tag color="magenta">{selectedTicket.orderCode}</Tag>
                    </div>
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 140px)" }}>
                {loading ? (
                    <Flex justify="center" align="center" style={{ flex: 1 }}>
                        <Spin />
                    </Flex>
                ) : (
                    <div
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                        style={{ flex: 1, overflowY: "auto", padding: "0 10px", marginBottom: 20 }}
                    >
                        {/* Biểu tượng loading khi cuộn lên tải tin nhắn cũ */}
                        {loadingMore && (
                            <Flex justify="center" style={{ marginBottom: 16 }}>
                                <Spin size="small" />
                            </Flex>
                        )}

                        {messages.map((msg) => {
                            const isSenderAdmin = msg.isAdmin;
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
                                                    wordWrap: "break-word",
                                                    whiteSpace: "pre-wrap",
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
