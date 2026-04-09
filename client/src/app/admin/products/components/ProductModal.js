import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Button, Flex, Typography } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

export default function ProductModal({ isVisible, onClose, onSave, editingProduct }) {
    const [form] = Form.useForm();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isVisible && isMounted) {
            if (editingProduct) {
                const currentImages =
                    editingProduct.images?.length > 0
                        ? editingProduct.images
                        : [editingProduct.imageUrl].filter(Boolean);

                form.setFieldsValue({
                    ...editingProduct,
                    images: currentImages.length > 0 ? currentImages : [""],
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ images: [""] });
            }
        }
    }, [isVisible, editingProduct, form, isMounted]);

    // Tránh lỗi Hydration Mismatch trên Server
    if (!isMounted) return null;

    const handleFinish = (values) => {
        onSave(values);
    };

    return (
        <Modal
            title={editingProduct ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}
            open={isVisible}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            width={700}
            forceRender // Giữ nguyên để Form instance luôn tồn tại
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item
                    name="name"
                    label="Tên sản phẩm"
                    rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
                >
                    <Input size="large" placeholder="VD: Bàn gỗ Sồi cao cấp" />
                </Form.Item>

                <Form.Item name="description" label="Mô tả sản phẩm">
                    <Input.TextArea rows={4} placeholder="Nhập thông tin chi tiết về sản phẩm..." />
                </Form.Item>

                <Flex gap="large" style={{ marginBottom: 16 }}>
                    <Form.Item
                        name="price"
                        label="Giá bán (VNĐ)"
                        rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                        style={{ flex: 1, margin: 0 }}
                    >
                        <InputNumber
                            size="large"
                            style={{ width: "100%" }}
                            min={0}
                            step={1000}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        />
                    </Form.Item>
                    <Form.Item
                        name="stock"
                        label="Số lượng tồn kho"
                        rules={[{ required: true, message: "Nhập số lượng" }]}
                        style={{ flex: 1, margin: 0 }}
                    >
                        <InputNumber size="large" style={{ width: "100%" }} min={0} />
                    </Form.Item>
                </Flex>

                <div
                    style={{
                        background: "#fafafa",
                        padding: 16,
                        borderRadius: 8,
                        border: "1px solid #f0f0f0",
                        marginBottom: 24,
                    }}
                >
                    <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                        Danh sách Hình ảnh (URLs)
                    </Typography.Text>
                    <Form.List name="images">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((field, index) => (
                                    <div key={field.key} style={{ marginBottom: 12 }}>
                                        <Flex gap="small" align="center">
                                            <Form.Item
                                                name={field.name}
                                                isListField={field.isListField}
                                                fieldKey={field.fieldKey}
                                                validateTrigger={["onChange", "onBlur"]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        whitespace: true,
                                                        message:
                                                            "Vui lòng nhập link ảnh hoặc xóa ô này",
                                                    },
                                                ]}
                                                noStyle
                                            >
                                                <Input
                                                    placeholder={`Nhập đường dẫn ảnh ${index + 1} (https://...)`}
                                                />
                                            </Form.Item>
                                            {fields.length > 1 ? (
                                                <MinusCircleOutlined
                                                    style={{
                                                        color: "#ff4d4f",
                                                        fontSize: "20px",
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() => remove(field.name)}
                                                />
                                            ) : null}
                                        </Flex>
                                    </div>
                                ))}
                                <Form.Item style={{ margin: 0 }}>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        Thêm ảnh khác
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </div>

                <Flex justify="flex-end" gap="small" style={{ marginTop: 24 }}>
                    <Button size="large" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button size="large" type="primary" htmlType="submit">
                        {editingProduct ? "Lưu cập nhật" : "Thêm mới"}
                    </Button>
                </Flex>
            </Form>
        </Modal>
    );
}
