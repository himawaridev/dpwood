"use client";

import { useEffect, useState } from "react";
import {
    Alert,
    App,
    Button,
    Empty,
    Flex,
    Form,
    Image,
    Input,
    InputNumber,
    Popconfirm,
    Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";
import api from "@/utils/axios";

const { Paragraph, Text, Title } = Typography;

const EMPTY_CATEGORY = {
    label: "",
    value: "",
    imageUrl: "",
    description: "",
    sortOrder: null,
};

export default function CategoryManagerPanel({ categories, loading, onRefresh }) {
    const { message } = App.useApp();
    const [drafts, setDrafts] = useState({});
    const [newCategory, setNewCategory] = useState(EMPTY_CATEGORY);
    const [savingId, setSavingId] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        setDrafts(
            Object.fromEntries(
                (categories || []).map((category) => [
                    category.id,
                    {
                        label: category.label || "",
                        imageUrl: category.imageUrl || "",
                        description: category.description || "",
                        sortOrder: Number(category.sortOrder || 0),
                    },
                ]),
            ),
        );
    }, [categories]);

    const updateDraft = (id, field, value) => {
        setDrafts((current) => ({
            ...current,
            [id]: { ...current[id], [field]: value },
        }));
    };

    const handleSave = async (category) => {
        const draft = drafts[category.id];
        if (!draft?.label?.trim()) {
            message.warning("Tên hiển thị của danh mục không được để trống.");
            return;
        }

        try {
            setSavingId(category.id);
            await api.put(`/products/categories/${category.id}`, draft);
            message.success(`Đã cập nhật danh mục ${draft.label}.`);
            await onRefresh();
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể cập nhật danh mục.");
        } finally {
            setSavingId("");
        }
    };

    const handleCreate = async () => {
        const label = newCategory.label.trim();
        if (!label) {
            message.warning("Vui lòng nhập tên hiển thị của danh mục.");
            return;
        }

        try {
            setCreating(true);
            await api.post("/products/categories", {
                ...newCategory,
                label,
                value: newCategory.value.trim() || undefined,
                sortOrder: newCategory.sortOrder ?? undefined,
            });
            setNewCategory(EMPTY_CATEGORY);
            message.success("Đã thêm danh mục mới.");
            await onRefresh();
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể thêm danh mục.");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (category) => {
        try {
            await api.delete(`/products/categories/${category.id}`);
            message.success(`Đã xóa danh mục ${category.label}.`);
            await onRefresh();
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể xóa danh mục.");
        }
    };

    return (
        <>
            <Alert
                type="info"
                showIcon
                title="Danh mục được dùng ở cả trang chủ, bộ lọc sản phẩm và form thêm sản phẩm"
                description="Tên hiển thị có thể sửa bất cứ lúc nào. Mã hệ thống được tạo một lần để liên kết sản phẩm và không đổi sau khi lưu. Ảnh nên là ảnh ngang, rõ nét, không chứa chữ."
            />

            <section className="dp-admin-category-create">
                <Title level={4}>Thêm danh mục mới</Title>
                <Paragraph type="secondary">
                    Điền tên trước; mã hệ thống có thể để trống để hệ thống tự tạo từ tên danh mục.
                </Paragraph>
                <Form layout="vertical" className="dp-admin-category-create-grid">
                    <Form.Item
                        label="Tên hiển thị"
                        required
                        extra="Tên khách hàng nhìn thấy, ví dụ: Nồi & chảo."
                    >
                        <Input
                            value={newCategory.label}
                            placeholder="Nồi & chảo"
                            onChange={(event) =>
                                setNewCategory((current) => ({ ...current, label: event.target.value }))
                            }
                        />
                    </Form.Item>
                    <Form.Item
                        label="Mã hệ thống"
                        extra="Chỉ dùng chữ thường, số và dấu gạch ngang. Để trống để tự tạo."
                    >
                        <Input
                            value={newCategory.value}
                            placeholder="noi-chao"
                            onChange={(event) =>
                                setNewCategory((current) => ({ ...current, value: event.target.value }))
                            }
                        />
                    </Form.Item>
                    <Form.Item
                        label="URL ảnh đại diện"
                        extra="Dùng URL HTTPS; tỷ lệ khuyên dùng 4:3 hoặc 3:2."
                    >
                        <Input
                            value={newCategory.imageUrl}
                            placeholder="https://..."
                            onChange={(event) =>
                                setNewCategory((current) => ({ ...current, imageUrl: event.target.value }))
                            }
                        />
                    </Form.Item>
                    <Form.Item
                        label="Thứ tự hiển thị"
                        extra="Số nhỏ xuất hiện trước. Để trống để xếp cuối."
                    >
                        <InputNumber
                            min={0}
                            precision={0}
                            value={newCategory.sortOrder}
                            placeholder="Tự động"
                            style={{ width: "100%" }}
                            onChange={(value) =>
                                setNewCategory((current) => ({ ...current, sortOrder: value }))
                            }
                        />
                    </Form.Item>
                    <Form.Item
                        className="dp-admin-category-description-field"
                        label="Mô tả ngắn"
                        extra="Mô tả phạm vi sản phẩm của danh mục; tối đa 500 ký tự."
                    >
                        <Input.TextArea
                            rows={3}
                            maxLength={500}
                            showCount
                            value={newCategory.description}
                            placeholder="Các loại nồi, chảo và bộ nấu dùng trong gia đình."
                            onChange={(event) =>
                                setNewCategory((current) => ({ ...current, description: event.target.value }))
                            }
                        />
                    </Form.Item>
                </Form>
                <Button type="primary" icon={<PlusOutlined />} loading={creating} onClick={handleCreate}>
                    Thêm danh mục
                </Button>
            </section>

            <Flex justify="space-between" align="end" gap="middle" wrap style={{ margin: "24px 0 12px" }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Danh mục đang sử dụng</Title>
                    <Text type="secondary">Có {categories.length} danh mục đang hoạt động.</Text>
                </div>
            </Flex>

            <Flex vertical gap={14} className="dp-admin-category-list" aria-busy={loading}>
                {categories.length ? (
                    categories.map((category) => {
                        const draft = drafts[category.id] || {};
                        return (
                            <article className="dp-admin-category-card" key={category.id}>
                                <div className="dp-admin-category-card-media">
                                    <Image
                                        src={draft.imageUrl}
                                        fallback="/logo.png"
                                        alt={draft.label || category.label}
                                        preview={false}
                                    />
                                    <Text type="secondary">Mã: {category.value}</Text>
                                </div>
                                <Form layout="vertical" className="dp-admin-category-card-fields">
                                    <Form.Item label="Tên hiển thị" required>
                                        <Input
                                            value={draft.label}
                                            onChange={(event) => updateDraft(category.id, "label", event.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="URL ảnh đại diện" extra="Ảnh hiển thị tại mục danh mục trên trang chủ.">
                                        <Input
                                            value={draft.imageUrl}
                                            placeholder="https://..."
                                            onChange={(event) => updateDraft(category.id, "imageUrl", event.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Mô tả ngắn" extra="Giải thích danh mục chứa những sản phẩm nào.">
                                        <Input.TextArea
                                            rows={2}
                                            maxLength={500}
                                            value={draft.description}
                                            onChange={(event) => updateDraft(category.id, "description", event.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Thứ tự" extra="Số nhỏ hiển thị trước.">
                                        <InputNumber
                                            value={draft.sortOrder}
                                            min={0}
                                            precision={0}
                                            style={{ width: "100%" }}
                                            onChange={(value) => updateDraft(category.id, "sortOrder", value)}
                                        />
                                    </Form.Item>
                                </Form>
                                <Flex gap={6} className="dp-admin-category-card-actions">
                                    <AdminIconButton
                                        label={`Lưu danh mục ${category.label}`}
                                        tooltip="Lưu thay đổi"
                                        icon={<SaveOutlined />}
                                        loading={savingId === category.id}
                                        onClick={() => handleSave(category)}
                                    />
                                    <Popconfirm
                                        title={`Xóa danh mục ${category.label}?`}
                                        description="Chỉ xóa được danh mục không còn sản phẩm."
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        onConfirm={() => handleDelete(category)}
                                    >
                                        <AdminIconButton
                                            label={`Xóa danh mục ${category.label}`}
                                            tooltip="Xóa danh mục"
                                            icon={<DeleteOutlined />}
                                        />
                                    </Popconfirm>
                                </Flex>
                            </article>
                        );
                    })
                ) : (
                    <Empty description={loading ? "Đang tải danh mục..." : "Chưa có danh mục sản phẩm"} />
                )}
            </Flex>
        </>
    );
}
