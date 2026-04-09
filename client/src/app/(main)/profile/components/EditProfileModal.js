import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Upload, Avatar, message } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";
import api from "@/utils/axios";

export default function EditProfileModal({ isOpen, onClose, user, onSuccess }) {
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [tempAvatar, setTempAvatar] = useState("");

    useEffect(() => {
        if (user) {
            form.setFieldsValue({ name: user.name });
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
            const res = await axios.post(
                "https://api.cloudinary.com/v1_1/desgym0rq/image/upload",
                formData,
            );
            setTempAvatar(res.data.secure_url);
            onUploadSuccess("ok");
            message.success("Tải ảnh thành công!");
        } catch (error) {
            onError(error);
            message.error("Lỗi khi tải ảnh.");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (values) => {
        try {
            await api.put("/users/me", { name: values.name, avatarUrl: tempAvatar });
            message.success("Cập nhật hồ sơ thành công!");
            localStorage.setItem("userName", values.name);
            if (tempAvatar) localStorage.setItem("avatarUrl", tempAvatar);
            window.dispatchEvent(new Event("storage"));
            onSuccess();
            onClose();
        } catch (error) {
            message.error("Cập nhật thất bại.");
        }
    };

    return (
        <Modal
            title="Cập nhật thông tin cá nhân"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            forceRender // 🔴 CHÌA KHÓA FIX LỖI: Ép Modal load ngầm Form từ đầu
        >
            <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <Avatar
                        size={100}
                        src={tempAvatar || undefined}
                        icon={!tempAvatar && <UserOutlined />}
                        style={{ marginBottom: 12 }}
                    />
                    <div>
                        <Upload
                            customRequest={handleUpload}
                            showUploadList={false}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />} loading={uploading}>
                                Thay đổi ảnh
                            </Button>
                        </Upload>
                    </div>
                </div>
                <Form.Item
                    label="Tên hiển thị"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên của bạn!" }]}
                >
                    <Input size="large" />
                </Form.Item>
                <Form.Item label="Email (Cố định)">
                    <Input value={user?.email} disabled size="large" />
                </Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={uploading}
                    style={{ marginTop: 10 }}
                >
                    Lưu thay đổi
                </Button>
            </Form>
        </Modal>
    );
}
