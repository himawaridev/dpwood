import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Switch, Button, Flex, DatePicker } from "antd";
import dayjs from "dayjs";

export default function NotificationModal({ isVisible, onClose, onSave, editingItem }) {
    const [form] = Form.useForm();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isVisible && isMounted) {
            if (editingItem) {
                // 🔴 Xử lý đưa thời gian cũ vào RangePicker
                const timeRange =
                    editingItem.startTime && editingItem.endTime
                        ? [dayjs(editingItem.startTime), dayjs(editingItem.endTime)]
                        : undefined;

                form.setFieldsValue({ ...editingItem, timeRange });
            } else {
                form.resetFields();
                form.setFieldsValue({ type: "info", isActive: true });
            }
        }
    }, [isVisible, editingItem, form, isMounted]);

    if (!isMounted) return null;

    return (
        <Modal
            title={editingItem ? "Sửa thông báo" : "Tạo thông báo mới"}
            open={isVisible}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            forceRender
        >
            <Form form={form} layout="vertical" onFinish={onSave}>
                <Form.Item
                    name="title"
                    label="Tiêu đề"
                    rules={[{ required: true, message: "Nhập tiêu đề" }]}
                >
                    <Input placeholder="VD: Khuyến mãi tháng 5" />
                </Form.Item>
                <Form.Item
                    name="content"
                    label="Nội dung"
                    rules={[{ required: true, message: "Nhập nội dung" }]}
                >
                    <Input.TextArea rows={4} placeholder="Nhập chi tiết thông báo..." />
                </Form.Item>

                {/* 🔴 BỔ SUNG: Thanh chọn thời gian */}
                <Form.Item
                    name="timeRange"
                    label="Hẹn giờ hiển thị (Bỏ trống nếu muốn hiện vĩnh viễn)"
                >
                    <DatePicker.RangePicker
                        showTime={{ format: "HH:mm" }}
                        format="DD/MM/YYYY HH:mm"
                        style={{ width: "100%" }}
                        placeholder={["Bắt đầu", "Kết thúc"]}
                    />
                </Form.Item>

                <Flex gap="large">
                    <Form.Item name="type" label="Loại (Màu sắc)" style={{ flex: 1 }}>
                        <Select
                            options={[
                                { value: "info", label: "Thông tin (Xanh dương)" },
                                { value: "success", label: "Khuyến mãi (Xanh lá)" },
                                { value: "warning", label: "Cảnh báo (Vàng)" },
                                { value: "error", label: "Nghiêm trọng (Đỏ)" },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="isActive" label="Trạng thái kích hoạt" valuePropName="checked">
                        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                    </Form.Item>
                </Flex>
                <Flex justify="flex-end" gap="small" style={{ marginTop: 16 }}>
                    <Button onClick={onClose}>Hủy</Button>
                    <Button type="primary" htmlType="submit">
                        Lưu lại
                    </Button>
                </Flex>
            </Form>
        </Modal>
    );
}
