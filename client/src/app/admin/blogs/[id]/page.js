"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Form, Input, Button, Switch, message, Typography, Row, Col, Card, Flex, Spin } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import api from "@/utils/axios";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const { Title, Text } = Typography;

export default function BlogEditorPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    // 🔴 1. Tạo state để lưu dữ liệu ban đầu
    const [initialData, setInitialData] = useState({});
    const router = useRouter();
    const params = useParams();
    const quillRef = useRef(null);

    const isEditMode = params.id !== "create";

    useEffect(() => {
        const fetchBlog = async () => {
            if (!isEditMode) {
                // 🔴 2. Thay form.setFieldsValue bằng setInitialData
                setInitialData({ isPublished: true, author: "Admin" });
                setFetching(false);
                return;
            }
            try {
                const res = await api.get(`/blogs/admin-get/${params.id}`);
                const data = res.data;
                // 🔴 2. Thay form.setFieldsValue bằng setInitialData
                setInitialData({
                    ...data,
                    isPublished: !!data.isPublished,
                });
            } catch (error) {
                message.error("Lỗi lấy dữ liệu bài viết!");
                router.push("/admin/blogs");
            } finally {
                setFetching(false);
            }
        };
        fetchBlog();
    }, [params.id, isEditMode, router]);

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
                const res = await api.post("/upload", formData);
                const url = res.data.url;

                const quill = quillRef.current.getEditor();
                const range = quill.getSelection(true);
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
                    ["bold", "italic", "underline", "strike", "blockquote"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image", "video"],
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
            if (isEditMode) {
                await api.put(`/blogs/${params.id}`, values);
                message.success("Đã cập nhật bài viết!");
            } else {
                await api.post("/blogs", values);
                message.success("Đã đăng bài viết mới!");
                router.push("/admin/blogs");
            }
        } catch (error) {
            message.error("Lỗi khi lưu bài viết");
        } finally {
            setLoading(false);
        }
    };

    if (fetching)
        return (
            <Flex justify="center" align="center" style={{ minHeight: "60vh" }}>
                <Spin size="large" description="Đang tải dữ liệu..." />
            </Flex>
        );

    return (
        <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                <Flex align="center" gap="small">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.push("/admin/blogs")}
                    >
                        Quay lại
                    </Button>
                    <Title level={3} style={{ margin: 0 }}>
                        {isEditMode ? "Chỉnh sửa Bài viết" : "Viết bài mới"}
                    </Title>
                </Flex>
                <Button
                    type="primary"
                    size="large"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={() => form.submit()}
                >
                    {isEditMode ? "Cập nhật thay đổi" : "Xuất bản bài viết"}
                </Button>
            </Flex>

            {/* 🔴 3. Truyền initialValues={initialData} vào Form */}
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={initialData}
                onFinishFailed={() =>
                    message.error("Vui lòng điền các thông tin bắt buộc (chữ màu đỏ)!")
                }
            >
                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <Card
                            title="Nội dung bài viết"
                            variant="borderless"
                            style={{ marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                        >
                            <Form.Item
                                name="title"
                                label="Tiêu đề (H1)"
                                rules={[
                                    { required: true, message: "Vui lòng nhập tiêu đề bài viết" },
                                ]}
                            >
                                <Input
                                    placeholder="VD: 5 xu hướng thiết kế nội thất 2026..."
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item name="summary" label="Đoạn tóm tắt (Sapo)">
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Viết một đoạn ngắn giới thiệu thu hút độc giả..."
                                />
                            </Form.Item>

                            <Form.Item
                                name="content"
                                label="Nội dung chi tiết"
                                rules={[
                                    { required: true, message: "Vui lòng nhập nội dung bài viết" },
                                ]}
                            >
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    modules={modules}
                                    style={{ height: 500, marginBottom: 40, background: "#fff" }}
                                />
                            </Form.Item>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card
                            title="Xuất bản"
                            variant="borderless"
                            style={{ marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                        >
                            <Form.Item name="isPublished" valuePropName="checked">
                                <Switch
                                    checkedChildren="Đang Công Khai"
                                    unCheckedChildren="Đang Ẩn (Nháp)"
                                />
                            </Form.Item>
                            <Form.Item name="author" label="Tác giả">
                                <Input />
                            </Form.Item>
                        </Card>

                        <Card
                            title="Ảnh đại diện"
                            variant="borderless"
                            style={{ marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                        >
                            <Form.Item name="thumbnail">
                                <Input placeholder="Dán URL ảnh vào đây..." />
                            </Form.Item>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Bạn có thể dùng link ảnh trên Cloudinary hoặc bất kỳ nguồn nào.
                            </Text>
                        </Card>

                        <Card
                            title="Tối ưu SEO (Google)"
                            variant="borderless"
                            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                        >
                            <Form.Item name="metaTitle" label="SEO Title">
                                <Input placeholder="Tiêu đề hiện trên Google..." />
                            </Form.Item>
                            <Form.Item name="metaDescription" label="SEO Description">
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Đoạn mô tả ngắn hiện dưới tiêu đề tìm kiếm..."
                                />
                            </Form.Item>
                            <Form.Item name="metaKeywords" label="Từ khóa (Keywords)">
                                <Input placeholder="noi that, ban go, meo vat..." />
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
