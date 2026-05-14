"use client";
import React, { useState, useEffect } from "react";
import { Typography, Spin, Flex, message, Breadcrumb, Divider, Image, Input, Button, List, Avatar, Form } from "antd";
import { UserOutlined, CalendarOutlined, EyeOutlined, MessageOutlined, SendOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import api from "@/utils/axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi"); // Use Vietnamese locale for fromNow()

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function ClientBlogDetail({ slug }) {
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [userAuth, setUserAuth] = useState({ isAuth: false, user: null });

    useEffect(() => {
        const fetchAuth = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const res = await api.get("/users/me");
                    setUserAuth({ isAuth: true, user: res.data });
                } catch (e) {
                    console.error("Auth error:", e);
                }
            }
        };
        fetchAuth();
    }, []);

    const fetchBlogDetail = async () => {
        if (!slug) return;
        try {
            setLoading(true);
            const res = await api.get(`/blogs/${slug}`);
            setBlog(res.data);
        } catch (error) {
            console.error("Lỗi fetch blog:", error);
            message.error("Không tìm thấy bài viết hoặc lỗi máy chủ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogDetail();
    }, [slug]);

    const handleAddComment = async (parentId = null) => {
        if (!userAuth.isAuth) {
            message.warning("Vui lòng đăng nhập để bình luận");
            return;
        }
        const text = parentId ? replyText : commentText;
        if (!text.trim()) {
            message.warning("Vui lòng nhập nội dung bình luận");
            return;
        }

        try {
            setSubmittingComment(true);
            await api.post(`/blogs/${blog.id}/comments`, {
                text: text.trim(),
                parentId
            });
            message.success("Đã gửi bình luận!");
            if (parentId) {
                setReplyingTo(null);
                setReplyText("");
            } else {
                setCommentText("");
            }
            // Refresh blog to get new comments
            const res = await api.get(`/blogs/${slug}`);
            setBlog(res.data);
        } catch (error) {
            console.error("Lỗi gửi bình luận:", error);
            message.error("Không thể gửi bình luận lúc này.");
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: "80vh" }}>
                <Spin size="large" description="Đang tải nội dung..." />
            </Flex>
        );
    }

    if (!blog) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Title level={3}>Xin lỗi, bài viết không tồn tại!</Title>
                <Link href="/blogs"><Button type="primary">Quay lại danh sách</Button></Link>
            </div>
        );
    }

    const comments = blog.comments || [];

    return (
        <div style={{ background: "#ffffff", minHeight: "100vh", padding: "40px 0 60px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
                <div style={{ marginBottom: 24 }}>
                    <Link href="/blogs">
                        <Button type="text" icon={<ArrowLeftOutlined />} style={{ padding: 0, fontWeight: 500, color: "#595959" }}>
                            Quay lại Cẩm nang
                        </Button>
                    </Link>
                </div>
                
                <Title level={1} style={{ color: "#1f1f1f", fontWeight: 800, lineHeight: 1.3, marginBottom: 20 }}>
                    {blog.title}
                </Title>
                
                <Flex gap="middle" style={{ marginBottom: 30 }} wrap="wrap">
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        <UserOutlined /> {blog.author || "Admin"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        <CalendarOutlined /> {dayjs(blog.createdAt).format("DD/MM/YYYY")}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        <EyeOutlined /> {blog.views || 0} lượt xem
                    </Text>
                </Flex>

                {blog.thumbnail && (
                    <div style={{ textAlign: "center", marginBottom: 40, borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                        <Image
                            src={blog.thumbnail}
                            alt={blog.title}
                            style={{
                                width: "100%",
                                maxHeight: 500,
                                objectFit: "cover",
                                display: "block"
                            }}
                        />
                    </div>
                )}

                <div style={{ marginBottom: 40 }}>
                    <style dangerouslySetInnerHTML={{ __html: `
                        .blog-content img { max-width: 100% !important; height: auto !important; border-radius: 12px; display: block; margin: 20px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                        .blog-content iframe { max-width: 100% !important; border-radius: 12px; }
                        .blog-content h2, .blog-content h3 { color: #001529; margin-top: 30px; font-weight: 700; }
                        .blog-content p { margin-bottom: 16px; }
                        .blog-content a { color: #1677ff; text-decoration: none; }
                        .blog-content a:hover { text-decoration: underline; }
                        .blog-content blockquote { border-left: 4px solid #1677ff; margin: 20px 0; padding: 10px 20px; background: #f0f5ff; border-radius: 0 8px 8px 0; font-style: italic; color: #595959; }
                    `}} />
                    
                    <div
                        className="blog-content"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                        style={{ fontSize: "17px", lineHeight: "1.9", color: "#333", wordWrap: "break-word", overflowWrap: "break-word" }}
                    />
                </div>

                {/* BÌNH LUẬN SECTION */}
                <div style={{ background: "#f8fafd", padding: "40px", borderRadius: 20, marginBottom: 40 }}>
                    <Title level={3} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30 }}>
                        <MessageOutlined style={{ color: "#1677ff" }} /> Bình luận ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})
                    </Title>

                    {/* Form viết bình luận chính */}
                    <div style={{ marginBottom: 40, display: "flex", gap: 16 }}>
                        <Avatar size={48} src={userAuth.user?.avatarUrl} icon={!userAuth.user?.avatarUrl && <UserOutlined />} style={{ backgroundColor: "#1677ff" }} />
                        <div style={{ flex: 1 }}>
                            <TextArea
                                rows={3}
                                placeholder={userAuth.isAuth ? "Chia sẻ cảm nghĩ của bạn về bài viết..." : "Vui lòng đăng nhập để bình luận"}
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                disabled={!userAuth.isAuth || submittingComment}
                                style={{ borderRadius: 12, resize: "none" }}
                            />
                            <div style={{ textAlign: "right", marginTop: 12 }}>
                                <Button 
                                    type="primary" 
                                    icon={<SendOutlined />} 
                                    onClick={() => handleAddComment()} 
                                    loading={submittingComment}
                                    disabled={!userAuth.isAuth || !commentText.trim()}
                                    shape="round"
                                    size="large"
                                >
                                    Gửi bình luận
                                </Button>
                            </div>
                        </div>
                    </div>

                    <List
                        dataSource={comments}
                        header={null}
                        itemLayout="horizontal"
                        locale={{ emptyText: "Chưa có bình luận nào. Hãy là người đầu tiên!" }}
                        renderItem={comment => (
                            <List.Item style={{ display: "block", borderBottom: "1px solid #f0f0f0", padding: "24px 0" }}>
                                <Flex gap={16}>
                                    <Avatar src={comment.userAvatar} icon={!comment.userAvatar && <UserOutlined />} size={44} />
                                    <div style={{ flex: 1 }}>
                                        <Flex justify="space-between" align="baseline">
                                            <Text strong style={{ fontSize: 16 }}>{comment.userName}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(comment.createdAt).fromNow() || dayjs(comment.createdAt).format("DD/MM/YYYY HH:mm")}</Text>
                                        </Flex>
                                        <Paragraph style={{ marginTop: 8, fontSize: 15, color: "#262626", whiteSpace: "pre-line" }}>
                                            {comment.text}
                                        </Paragraph>
                                        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => {
                                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                            setReplyText("");
                                        }}>
                                            Trả lời
                                        </Button>

                                        {/* Form Reply */}
                                        {replyingTo === comment.id && (
                                            <div style={{ marginTop: 16, display: "flex", gap: 12, background: "#f8fafd", padding: 16, borderRadius: 12 }}>
                                                <Avatar size={36} src={userAuth.user?.avatarUrl} icon={!userAuth.user?.avatarUrl && <UserOutlined />} />
                                                <div style={{ flex: 1 }}>
                                                    <TextArea
                                                        rows={2}
                                                        placeholder="Nhập câu trả lời của bạn..."
                                                        value={replyText}
                                                        onChange={e => setReplyText(e.target.value)}
                                                        disabled={!userAuth.isAuth || submittingComment}
                                                        style={{ borderRadius: 8, resize: "none", marginBottom: 8 }}
                                                    />
                                                    <Flex gap="small" justify="flex-end">
                                                        <Button size="small" onClick={() => setReplyingTo(null)}>Hủy</Button>
                                                        <Button size="small" type="primary" loading={submittingComment} disabled={!userAuth.isAuth || !replyText.trim()} onClick={() => handleAddComment(comment.id)}>Gửi</Button>
                                                    </Flex>
                                                </div>
                                            </div>
                                        )}

                                        {/* Replies List */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div style={{ marginTop: 20, paddingLeft: 20, borderLeft: "2px solid #e6f4ff" }}>
                                                {comment.replies.map(reply => (
                                                    <div key={reply.id} style={{ marginBottom: 16 }}>
                                                        <Flex gap={12}>
                                                            <Avatar src={reply.userAvatar} icon={!reply.userAvatar && <UserOutlined />} size={36} />
                                                            <div>
                                                                <Flex gap={8} align="baseline">
                                                                    <Text strong style={{ fontSize: 14 }}>{reply.userName}</Text>
                                                                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(reply.createdAt).fromNow() || dayjs(reply.createdAt).format("DD/MM/YYYY HH:mm")}</Text>
                                                                </Flex>
                                                                <Paragraph style={{ margin: "4px 0 0 0", fontSize: 14, color: "#262626" }}>
                                                                    {reply.text}
                                                                </Paragraph>
                                                            </div>
                                                        </Flex>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Flex>
                            </List.Item>
                        )}
                    />
                </div>
            </div>
        </div>
    );
}
