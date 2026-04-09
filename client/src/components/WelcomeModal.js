import React from "react";
import { Modal, Button, Typography, Divider, Checkbox } from "antd";

const { Text } = Typography;

export default function WelcomeModal({ isOpen, onClose, userName, onCheckboxChange }) {
    return (
        <Modal
            title={<span style={{ fontSize: "20px", color: "#001529" }}>Thông báo hệ thống</span>}
            open={isOpen} // Chuẩn Antd V5
            onCancel={onClose}
            centered
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    Xác nhận
                </Button>,
            ]}
        >
            <div style={{ padding: "16px 0" }}>
                <Text style={{ fontSize: 16 }}>
                    Xin chào, <strong style={{ color: "#1890ff" }}>{userName}</strong>!
                </Text>
                <div
                    style={{
                        marginTop: 24,
                        padding: "12px",
                        background: "#fff1f0", // Đổi màu nền cho cảnh báo đỏ
                        border: "1px solid #ffa39e",
                        borderRadius: "8px",
                    }}
                >
                    <Text strong style={{ color: "#cf1322" }}>
                        Thông báo:
                    </Text>{" "}
                    Yêu cầu tạm ngừng giao dịch với tính năng banking. Hệ thống đang bảo trì mất
                    tiền không chịu trách nhiệm.
                </div>
                <div
                    style={{
                        marginTop: 24,
                        padding: "12px",
                        background: "#f6ffed", // Màu nền cho khuyến mãi xanh
                        border: "1px solid #b7eb8f",
                        borderRadius: "8px",
                    }}
                >
                    <Text strong style={{ color: "#52c41a" }}>
                        Khuyến mãi:
                    </Text>{" "}
                    Giảm ngay 10% cho đơn hàng đầu tiên!
                </div>

                <Divider style={{ margin: "20px 0 10px 0" }} />

                <Checkbox onChange={(e) => onCheckboxChange(e.target.checked)}>
                    Không hiển thị lại thông báo này trong 6 giờ
                </Checkbox>
            </div>
        </Modal>
    );
}
