"use client";

import React, { useState, useEffect } from "react";
import { App, Modal, Form, Input, Button, Upload, Avatar, Alert } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";
import api from "@/utils/axios";

const normalizeAccountPhone = (value = "") => {
    const digits = String(value).replace(/\D/g, "");
    if (digits.startsWith("84") && digits.length === 11) return `0${digits.slice(2)}`;
    return digits;
};

const phoneRules = [
    {
        validator: async (_, value) => {
            const phone = normalizeAccountPhone(value);
            if (!phone) throw new Error("Vui lòng nhập số điện thoại.");
            if (!/^0\d{9,10}$/.test(phone)) {
                throw new Error("Số điện thoại cần bắt đầu bằng 0 và có 10-11 chữ số.");
            }
        },
    },
];

export default function EditProfileModal({ isOpen, onClose, user, onSuccess }) {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [tempAvatar, setTempAvatar] = useState("");
    const hasLockedPhone = Boolean(user?.phone);

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                phone: user.phone || "",
            });
            setTempAvatar(user.avatarUrl || "");
        }
    }, [user, form, isOpen]);

    const handleUpload = async ({ file, onSuccess: onUploadSuccess, onError }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "dpwood_avatar");
        formData.append("cloud_name", "desgym0rq");

        try {
            setUploading(true);
            const res = await axios.post("https://api.cloudinary.com/v1_1/desgym0rq/image/upload", formData);
            setTempAvatar(res.data.secure_url);
            onUploadSuccess("ok");
            message.success("Tải ảnh thành công.");
        } catch (error) {
            onError(error);
            message.error("Lỗi khi tải ảnh.");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (values) => {
        try {
            const payload = {
                name: values.name,
                avatarUrl: tempAvatar,
            };

            if (!hasLockedPhone) {
                payload.phone = normalizeAccountPhone(values.phone);
            }

            const response = await api.put("/users/me", payload);
            message.success("Cập nhật hồ sơ thành công.");
            localStorage.setItem("userName", values.name);
            if (tempAvatar) localStorage.setItem("avatarUrl", tempAvatar);
            if (response.data?.user?.phone) localStorage.setItem("userPhone", response.data.user.phone);
            window.dispatchEvent(new Event("storage"));
            onSuccess();
            onClose();
        } catch (error) {
            message.error(error.response?.data?.message || "Cập nhật thất bại.");
        }
    };

    return (
        <Modal title="Cập nhật thông tin cá nhân" open={isOpen} onCancel={onClose} footer={null} forceRender>
            <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
                <div className="dp-profile-edit-avatar">
                    <Avatar size={104} src={tempAvatar || undefined} icon={!tempAvatar && <UserOutlined />} />
                    <Upload customRequest={handleUpload} showUploadList={false} accept="image/*">
                        <Button icon={<UploadOutlined />} loading={uploading}>
                            Thay đổi ảnh
                        </Button>
                    </Upload>
                </div>

                <Form.Item
                    label="Tên hiển thị"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên của bạn." }]}
                >
                    <Input size="large" />
                </Form.Item>

                <Form.Item label="Email">
                    <Input value={user?.email} disabled size="large" />
                </Form.Item>

                <Form.Item
                    label="Số điện thoại gốc"
                    name="phone"
                    rules={hasLockedPhone ? [] : phoneRules}
                    extra={
                        hasLockedPhone
                            ? "Số điện thoại gốc không thể tự thay đổi. Nếu cần đổi, vui lòng liên hệ admin."
                            : "Bạn cần cập nhật số điện thoại trước khi thanh toán."
                    }
                >
                    <Input
                        size="large"
                        inputMode="tel"
                        placeholder="0912345678"
                        disabled={hasLockedPhone}
                    />
                </Form.Item>

                {!hasLockedPhone && (
                    <Alert
                        type="info"
                        showIcon
                        title="Số điện thoại sẽ được dùng làm thông tin tài khoản gốc"
                        description="Sau khi lưu, bạn chỉ có thể thay đổi số này thông qua trang quản trị hoặc liên hệ admin."
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Button type="primary" htmlType="submit" block size="large" loading={uploading}>
                    Lưu thay đổi
                </Button>
            </Form>
        </Modal>
    );
}
