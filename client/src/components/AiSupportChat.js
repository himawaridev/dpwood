"use client";

import { useMemo, useRef, useState } from "react";
import { App, Avatar, Button, Drawer, Flex, FloatButton, Input, Tag, Typography } from "antd";
import { RobotOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

const { Text } = Typography;

const QUICK_PROMPTS = [
    "Làm sao dùng mã giảm giá?",
    "Tôi muốn kiểm tra giỏ hàng",
    "Thanh toán PayOS hoạt động thế nào?",
];

const welcomeMessage = {
    role: "assistant",
    content:
        "Xin chào, mình là trợ lý AI của DPWOOD. Mình có thể hỗ trợ bạn về sản phẩm, mã giảm giá, giỏ hàng, thanh toán, tài khoản và đơn hàng.",
};

export default function AiSupportChat() {
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
            const res = await api.post("/ai/support-chat", {
                prompt,
                messages: nextMessages.slice(-8),
            });

            setMessages((current) => [
                ...current,
                {
                    role: "assistant",
                    content: res.data?.answer || "Mình chưa thể trả lời ngay. Bạn thử hỏi lại ngắn gọn hơn nhé.",
                    suggestions: res.data?.suggestions || [],
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

    return (
        <>
            <FloatButton
                className="dp-ai-chat-float"
                icon={<RobotOutlined />}
                description="AI"
                tooltip="AI hỗ trợ DPWOOD"
                onClick={() => setOpen(true)}
                style={{ right: 24, bottom: 88 }}
            />

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
                onClose={() => setOpen(false)}
                width={420}
                className="dp-ai-chat-drawer"
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
