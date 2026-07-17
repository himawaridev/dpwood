"use client";

import { useEffect, useState } from "react";
import {
    App,
    Button,
    Col,
    Empty,
    Flex,
    Image,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";
import api from "@/utils/axios";

const { Text, Title } = Typography;

export default function CategoryManagerModal({ open, categories, onClose, onRefresh }) {
    const { message } = App.useApp();
    const [drafts, setDrafts] = useState({});
    const [newCategory, setNewCategory] = useState({ label: "", imageUrl: "", description: "" });
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
        try {
            setSavingId(category.id);
            await api.put(`/products/categories/${category.id}`, drafts[category.id]);
            message.success(`Đã cập nhật danh mục ${drafts[category.id]?.label || category.label}.`);
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
            message.warning("Vui lòng nhập tên danh mục.");
            return;
        }

        try {
            setCreating(true);
            await api.post("/products/categories", { ...newCategory, label });
            setNewCategory({ label: "", imageUrl: "", description: "" });
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
        <Modal
            title="Quản lý danh mục sản phẩm"
            open={open}
            onCancel={onClose}
            footer={null}
            width={980}
            destroyOnHidden
        >
            <Text type="secondary">
                Ảnh tại đây được dùng cho khu vực “Danh mục sản phẩm” trên trang chủ. Dùng URL ảnh HTTPS có tỷ lệ ngang để hiển thị đẹp nhất.
            </Text>

            <div className="dp-admin-category-create">
                <Title level={5}>Thêm danh mục</Title>
                <Row gutter={[10, 10]}>
                    <Col xs={24} md={6}>
                        <Input
                            placeholder="Tên danh mục"
                            value={newCategory.label}
                            onChange={(event) =>
                                setNewCategory((current) => ({ ...current, label: event.target.value }))
                            }
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Input
                            placeholder="URL ảnh đại diện"
                            value={newCategory.imageUrl}
                            onChange={(event) =>
                                setNewCategory((current) => ({ ...current, imageUrl: event.target.value }))
                            }
                        />
                    </Col>
                    <Col xs={24} md={7}>
                        <Input
                            placeholder="Mô tả ngắn"
                            value={newCategory.description}
                            onChange={(event) =>
                                setNewCategory((current) => ({ ...current, description: event.target.value }))
                            }
                        />
                    </Col>
                    <Col xs={24} md={3}>
                        <Button type="primary" icon={<PlusOutlined />} block loading={creating} onClick={handleCreate}>
                            Thêm
                        </Button>
                    </Col>
                </Row>
            </div>

            <Flex vertical gap={12} className="dp-admin-category-list">
                {(categories || []).length ? (
                    categories.map((category) => {
                        const draft = drafts[category.id] || {};
                        return (
                            <div className="dp-admin-category-row" key={category.id}>
                                <Image
                                    src={draft.imageUrl}
                                    fallback="/logo.png"
                                    alt={draft.label || category.label}
                                    width={92}
                                    height={72}
                                    preview={false}
                                    style={{ objectFit: "cover" }}
                                />
                                <div className="dp-admin-category-fields">
                                    <Input
                                        value={draft.label}
                                        placeholder="Tên danh mục"
                                        onChange={(event) => updateDraft(category.id, "label", event.target.value)}
                                    />
                                    <Input
                                        value={draft.imageUrl}
                                        placeholder="URL ảnh đại diện"
                                        onChange={(event) => updateDraft(category.id, "imageUrl", event.target.value)}
                                    />
                                    <Input
                                        value={draft.description}
                                        placeholder="Mô tả ngắn"
                                        onChange={(event) => updateDraft(category.id, "description", event.target.value)}
                                    />
                                    <InputNumber
                                        value={draft.sortOrder}
                                        min={0}
                                        precision={0}
                                        aria-label="Thứ tự danh mục"
                                        onChange={(value) => updateDraft(category.id, "sortOrder", value)}
                                    />
                                </div>
                                <Flex gap={4}>
                                    <AdminIconButton
                                        label={`Lưu danh mục ${category.label}`}
                                        tooltip="Lưu danh mục"
                                        icon={<SaveOutlined />}
                                        loading={savingId === category.id}
                                        onClick={() => handleSave(category)}
                                    />
                                    <Popconfirm
                                        title={`Xóa danh mục ${category.label}?`}
                                        description="Chỉ có thể xóa danh mục chưa chứa sản phẩm."
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
                            </div>
                        );
                    })
                ) : (
                    <Empty description="Chưa có danh mục sản phẩm" />
                )}
            </Flex>
        </Modal>
    );
}
