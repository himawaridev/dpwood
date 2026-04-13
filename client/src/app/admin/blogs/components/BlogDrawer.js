"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    Drawer,
    Form,
    Input,
    Button,
    Switch,
    message,
    Space,
    Flex,
    Typography,
    Divider,
} from "antd";
import api from "@/utils/axios";
import dynamic from "next/dynamic";

// Sử dụng react-quill-new để tương thích React 19/Next 15
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const { Title, Text } = Typography;

export default function BlogDrawer({ isVisible, onClose, selectedBlog, refreshData }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const quillRef = useRef(null);

    // Đồng bộ dữ liệu khi mở Drawer
    useEffect(() => {
        if (isVisible) {
            if (selectedBlog) {
                form.setFieldsValue({
                    ...selectedBlog,
                    // Đảm bảo Switch nhận đúng giá trị boolean
                    isPublished: !!selectedBlog.isPublished,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ isPublished: true });
            }
        }
    }, [isVisible, selectedBlog, form]);

    // 🔴 Xử lý tải nhiều ảnh lên bài viết
    const imageHandler = () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("image", file);

            try {
                message.loading({ content: "Đang tải ảnh...", key: "uploading" });
                // Gọi tới API upload ảnh (Cloudinary) của bạn
                const res = await api.post("/upload", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data", // Quan trọng
                    },
                });
                const url = res.data.url;

                const quill = quillRef.current.getEditor();
                const range = quill.getSelection();
                quill.insertEmbed(range.index, "image", url);
                message.success({ content: "Đã chèn ảnh!", key: "uploading" });
            } catch (error) {
                message.error({ content: "Tải ảnh thất bại", key: "uploading" });
            }
        };
    };

    const modules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"], // Nút ảnh
                    ["clean"],
                ],
                handlers: { image: imageHandler },
            },
        }),
        [],
    );

    const onFinish = async (values) => {
        try {
            setLoading(true);
            if (selectedBlog) {
                // 🔴 SỬA LỖI: Gọi API PUT để cập nhật
                await api.put(`/blogs/${selectedBlog.id}`, values);
                message.success("Cập nhật bài viết thành công!");
            } else {
                await api.post("/blogs", values);
                message.success("Đăng bài viết mới thành công!");
            }
            refreshData();
            onClose();
        } catch (error) {
            console.error(error);
            message.error("Lỗi lưu bài viết. Vui lòng kiểm tra lại dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            title={selectedBlog ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
            size="large"
            open={isVisible}
            onClose={onClose}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={onClose}>Hủy</Button>
                    <Button type="primary" onClick={() => form.submit()} loading={loading}>
                        Lưu thay đổi
                    </Button>
                </Space>
            }
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item name="title" label="Tiêu đề bài viết" rules={[{ required: true }]}>
                    <Input placeholder="Nhập tiêu đề..." size="large" />
                </Form.Item>

                <Form.Item name="thumbnail" label="Ảnh đại diện (URL)">
                    <Input placeholder="https://..." />
                </Form.Item>

                <Form.Item name="summary" label="Mô tả ngắn">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="content" label="Nội dung bài viết" rules={[{ required: true }]}>
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        modules={modules}
                        style={{ height: 400, marginBottom: 50 }}
                    />
                </Form.Item>

                <Divider />
                <Title level={5}>Cấu hình SEO</Title>
                <Form.Item name="metaTitle" label="SEO Title">
                    <Input />
                </Form.Item>
                <Form.Item name="metaDescription" label="SEO Description">
                    <Input.TextArea rows={2} />
                </Form.Item>

                {/* 🔴 SỬA LỖI: Button Switch không hoạt động */}
                <Form.Item name="isPublished" label="Chế độ xem" valuePropName="checked">
                    <Switch checkedChildren="Công khai" unCheckedChildren="Riêng tư" />
                </Form.Item>
            </Form>
        </Drawer>
    );
}
