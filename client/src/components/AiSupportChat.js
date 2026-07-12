/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useRef, useState } from "react";
import { App, Avatar, Button, Drawer, Flex, Input, Tag, Typography } from "antd";
import { RobotOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

const { Text } = Typography;

const QUICK_PROMPTS = [
    "Gợi ý sản phẩm phù hợp cho gia đình 4 người",
    "Làm sao dùng mã giảm giá?",
    "Tôi muốn kiểm tra giỏ hàng",
    "Thanh toán PayOS hoạt động thế nào?",
];

const isProductAdviceRequest = (value) => {
    const normalized = String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase();
    return /\b(san pham|goi y|tu van|nen mua|so sanh|noi|chao|dao|thot|bat|dia|bep|am|may|chat lieu|dung tich|thuong hieu)\b/.test(normalized);
};

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

const welcomeMessage = {
    role: "assistant",
    content:
        "Xin chào, mình là trợ lý AI của DPWOOD. Mình có thể hỗ trợ bạn về sản phẩm, mã giảm giá, giỏ hàng, thanh toán, tài khoản và đơn hàng.",
};

export default function AiSupportChat({ onOpenChange }) {
    const { message } = App.useApp();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([welcomeMessage]);
    const inputRef = useRef(null);

    const visibleMessages = useMemo(() => messages.slice(-12), [messages]);

    const sendMessage = async (text = input) => {
        const prompt = text.trim();
        if (!prompt || loading) return;

        const nextMessages = [...messages, { role: "user", content: prompt }];
        setMessages(nextMessages);
        setInput("");

        try {
            setLoading(true);
            const endpoint = isProductAdviceRequest(prompt) ? "/ai/product-advisor" : "/ai/support-chat";
            const res = await api.post(endpoint, {
                prompt,
                messages: nextMessages.slice(-8),
            });

            setMessages((current) => [
                ...current,
                {
                    role: "assistant",
                    content: res.data?.answer || "Mình chưa thể trả lời ngay. Bạn thử hỏi lại ngắn gọn hơn nhé.",
                    suggestions: res.data?.suggestions || [],
                    products: res.data?.products || [],
                },
            ]);
        } catch (error) {
            message.error(error.response?.data?.message || "AI hỗ trợ đang bận, bạn thử lại sau nhé.");
            setMessages((current) => [
                ...current,
                {
                    role: "assistant",
                    content: "Mình đang gặp sự cố tạm thời. Bạn có thể thử lại sau hoặc vào mục Hỗ trợ để gửi yêu cầu.",
                },
            ]);
        } finally {
            setLoading(false);
            window.setTimeout(() => inputRef.current?.focus?.(), 80);
        }
    };

    const openChat = () => {
        setOpen(true);
        onOpenChange?.(true);
    };

    const closeChat = () => {
        setOpen(false);
        onOpenChange?.(false);
    };

    return (
        <>
            {!open && (
                <button
                    type="button"
                    className="dp-floating-action dp-ai-chat-action"
                    onClick={openChat}
                    aria-label="AI hỗ trợ DPWOOD"
                    title="AI hỗ trợ DPWOOD"
                >
                    <RobotOutlined className="dp-floating-action-icon" />
                    <span className="dp-floating-action-label">AI</span>
                </button>
            )}

            <Drawer
                title={
                    <Flex align="center" gap={10}>
                        <Avatar icon={<RobotOutlined />} className="dp-ai-chat-avatar" />
                        <div>
                            <Text strong>AI hỗ trợ DPWOOD</Text>
                            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                Sản phẩm, mã giảm giá, thanh toán và đơn hàng
                            </Text>
                        </div>
                    </Flex>
                }
                open={open}
                onClose={closeChat}
                size={420}
                className="dp-ai-chat-drawer"
                rootClassName="dp-ai-chat-drawer-root"
            >
                <Flex vertical className="dp-ai-chat-panel">
                    <div className="dp-ai-chat-messages">
                        {visibleMessages.map((item, index) => {
                            const isUser = item.role === "user";
                            return (
                                <div
                                    key={`${item.role}-${index}-${item.content.slice(0, 12)}`}
                                    className={`dp-ai-chat-row ${isUser ? "is-user" : "is-ai"}`}
                                >
                                    <Avatar
                                        size={30}
                                        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                                        className={isUser ? "dp-ai-user-avatar" : "dp-ai-chat-avatar"}
                                    />
                                    <div className="dp-ai-chat-bubble">
                                        <Text>{item.content}</Text>
                                        {!isUser && item.products?.length > 0 && (
                                            <div className="dp-ai-product-list">
                                                {item.products.map((product) => (
                                                    <button
                                                        type="button"
                                                        key={product.id}
                                                        className="dp-ai-product-card"
                                                        onClick={() => { window.location.href = `/products/${product.id}`; }}
                                                    >
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} alt={product.name} />
                                                        ) : (
                                                            <span className="dp-ai-product-placeholder">DP</span>
                                                        )}
                                                        <span>
                                                            <strong>{product.name}</strong>
                                                            <small>{formatCurrency(product.price)}</small>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {!isUser && item.suggestions?.length > 0 && (
                                            <Flex gap={8} wrap="wrap" style={{ marginTop: 10 }}>
                                                {item.suggestions.map((suggestion) => (
                                                    <Tag
                                                        key={suggestion}
                                                        className="dp-ai-chat-suggestion"
                                                        onClick={() => sendMessage(suggestion)}
                                                    >
                                                        {suggestion}
                                                    </Tag>
                                                ))}
                                            </Flex>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Flex gap={8} wrap="wrap" className="dp-ai-chat-quick">
                        {QUICK_PROMPTS.map((prompt) => (
                            <Tag key={prompt} className="dp-ai-chat-suggestion" onClick={() => sendMessage(prompt)}>
                                {prompt}
                            </Tag>
                        ))}
                    </Flex>

                    <Flex gap={8} className="dp-ai-chat-input">
                        <Input.TextArea
                            ref={inputRef}
                            autoSize={{ minRows: 1, maxRows: 3 }}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onPressEnter={(event) => {
                                if (!event.shiftKey) {
                                    event.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Hỏi về sản phẩm, mã giảm giá, thanh toán..."
                        />
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            loading={loading}
                            onClick={() => sendMessage()}
                            aria-label="Gửi câu hỏi"
                        />
                    </Flex>
                </Flex>
            </Drawer>
        </>
    );
}
