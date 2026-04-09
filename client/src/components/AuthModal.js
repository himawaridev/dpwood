import React from "react";
import { Modal, Button, Typography, Space, Divider, Checkbox } from "antd";
import { LoginOutlined, InfoCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function AuthModal({ isOpen, onClose, onLogin, onCheckboxChange }) {
    return (
        <Modal
            title={
                <Space>
                    <InfoCircleOutlined style={{ color: "#faad14" }} />
                    <span style={{ fontSize: "18px" }}>Yêu cầu đăng nhập</span>
                </Space>
            }
            open={isOpen} // Chuẩn Antd V5 (dùng open thay cho visible)
            onCancel={onClose}
            centered
            footer={[
                <Button key="later" onClick={onClose}>
                    Để sau
                </Button>,
                <Button key="login" type="primary" icon={<LoginOutlined />} onClick={onLogin}>
                    Đăng nhập ngay
                </Button>,
            ]}
        >
            <div style={{ padding: "10px 0" }}>
                <Text style={{ fontSize: "16px" }}>
                    Bạn hiện đang truy cập với tư cách <b>Khách</b>.
                </Text>
                <br />
                <Text type="secondary">
                    Vui lòng đăng nhập để đặt hàng và xem lịch sử giao dịch.
                </Text>

                <Divider style={{ margin: "20px 0 10px 0" }} />

                <Checkbox onChange={(e) => onCheckboxChange(e.target.checked)}>
                    Không hiển thị lại yêu cầu này trong 6 giờ
                </Checkbox>
            </div>
        </Modal>
    );
}
