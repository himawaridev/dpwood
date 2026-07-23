"use client";

import { useEffect, useState } from "react";
import { App, Button, Form, Image, Input, InputNumber, Modal, Space, Switch, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import { formatBannerPriceText } from "@/utils/bannerPrice";

const DEFAULT_VALUES = {
    eyebrow: "Nổi bật cho gian bếp",
    buttonText: "XEM SẢN PHẨM",
    buttonLink: "/products",
    sortOrder: 1,
    isActive: true,
};

const getNextAvailableOrder = (usedSortOrders = []) => {
    const used = new Set(usedSortOrders.map(Number));
    let nextOrder = 1;
    while (used.has(nextOrder)) nextOrder += 1;
    return nextOrder;
};

export default function BannerModal({ open, banner, usedSortOrders = [], onClose, onSaved }) {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const imageUrl = Form.useWatch("imageUrl", form);

    useEffect(() => {
        if (!open) return;
        form.setFieldsValue(
            banner
                ? { ...DEFAULT_VALUES, ...banner }
                : { ...DEFAULT_VALUES, sortOrder: getNextAvailableOrder(usedSortOrders) },
        );
    }, [banner, form, open, usedSortOrders]);

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append("image", file);

        try {
            setUploading(true);
            const response = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                authRequired: true,
            });
            form.setFieldValue("imageUrl", response.data.url);
            message.success("Đã tải ảnh banner");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải ảnh banner");
        } finally {
            setUploading(false);
        }

        return Upload.LIST_IGNORE;
    };

    const handleSubmit = async (values) => {
        try {
            setSaving(true);
            if (banner) await api.put(`/banners/${banner.id}`, values, { authRequired: true });
            else await api.post("/banners", values, { authRequired: true });
            message.success(banner ? "Đã cập nhật banner" : "Đã thêm banner");
            onSaved();
            onClose();
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể lưu banner");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title={banner ? "Chỉnh sửa banner" : "Thêm banner mới"}
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            okText="Lưu banner"
            cancelText="Hủy"
            confirmLoading={saving}
            width={860}
            destroyOnHidden
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
                <Form.Item label="Ảnh banner" required>
                    <Space.Compact style={{ width: "100%" }}>
                        <Form.Item
                            name="imageUrl"
                            noStyle
                            rules={[{ required: true, message: "Hãy tải ảnh hoặc nhập URL ảnh" }]}
                        >
                            <Input placeholder="https://... hoặc /ten-anh.jpg" />
                        </Form.Item>
                        <Upload
                            accept="image/jpeg,image/png,image/webp"
                            showUploadList={false}
                            beforeUpload={uploadImage}
                        >
                            <Button icon={<UploadOutlined />} loading={uploading} aria-label="Tải ảnh banner" />
                        </Upload>
                    </Space.Compact>
                </Form.Item>

                {imageUrl && (
                    <div className="dp-admin-banner-preview">
                        <Image src={imageUrl} alt="Xem trước banner" fallback="/linkbanner.png" />
                    </div>
                )}

                <Form.Item name="eyebrow" label="Nhãn nhỏ">
                    <Input maxLength={100} placeholder="Nổi bật cho gian bếp" />
                </Form.Item>
                <Form.Item
                    name="title"
                    label="Tiêu đề"
                    rules={[{ required: true, message: "Hãy nhập tiêu đề banner" }]}
                >
                    <Input maxLength={180} />
                </Form.Item>
                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={3} maxLength={1200} showCount />
                </Form.Item>
                <Form.Item name="priceText" label="Giá hoặc nội dung nổi bật" normalize={formatBannerPriceText}>
                    <Input maxLength={80} placeholder="Ví dụ: 590.000đ hoặc Giảm đến 20%" />
                </Form.Item>

                <div className="dp-admin-banner-form-grid">
                    <Form.Item
                        name="buttonText"
                        label="Nhãn nút"
                        rules={[{ required: true, message: "Hãy nhập nhãn nút" }]}
                    >
                        <Input maxLength={80} />
                    </Form.Item>
                    <Form.Item
                        name="buttonLink"
                        label="Liên kết nút"
                        rules={[{ required: true, message: "Hãy nhập liên kết" }]}
                    >
                        <Input placeholder="/products hoặc /products/{id}" />
                    </Form.Item>
                    <Form.Item
                        name="sortOrder"
                        label="Vị trí hiển thị"
                        extra={
                            usedSortOrders.length
                                ? `Vị trí đã dùng: ${usedSortOrders.slice().sort((a, b) => a - b).join(", ")}`
                                : "Banner đầu tiên sẽ ở vị trí 1."
                        }
                        rules={[
                            { required: true, message: "Hãy chọn vị trí hiển thị" },
                            {
                                validator: (_, value) => {
                                    const isOwnOrder = banner && Number(value) === Number(banner.sortOrder);
                                    if (!isOwnOrder && usedSortOrders.map(Number).includes(Number(value))) {
                                        return Promise.reject(new Error(`Vị trí ${value} đã được sử dụng`));
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <InputNumber min={1} max={9999} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Hiển thị" valuePropName="checked">
                        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
}
