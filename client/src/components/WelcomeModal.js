import React from "react";
import { Modal, Button, Typography, Divider, Checkbox } from "antd";

const { Text } = Typography;

export default function WelcomeModal({
    isOpen,
    onClose,
    userName,
    onCheckboxChange,
    notifications = [],
}) {
    // 🔴 ĐÃ SỬA: Tách riêng từng màu sắc cho từng loại thông báo
    const getNotificationStyle = (type) => {
        switch (type) {
            case "error": // Nghiêm trọng (Đỏ)
                return { bg: "#fff1f0", border: "#ffa39e", text: "#cf1322" };
            case "warning": // Cảnh báo (Vàng/Cam)
                return { bg: "#fffbe6", border: "#ffe58f", text: "#d46b08" };
            case "success": // Khuyến mãi (Xanh lá)
                return { bg: "#f6ffed", border: "#b7eb8f", text: "#52c41a" };
            case "info": // Thông tin (Xanh dương)
            default:
                return { bg: "#e6f4ff", border: "#91caff", text: "#1677ff" };
        }
    };

    return (
        <Modal
            title={<span style={{ fontSize: "20px", color: "#001529" }}>Thông báo hệ thống</span>}
            open={isOpen}
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

                {/* Render động các thông báo từ Database */}
                {notifications.length > 0 ? (
                    notifications.map((note) => {
                        const style = getNotificationStyle(note.type);
                        return (
                            <div
                                key={note.id}
                                style={{
                                    marginTop: 16,
                                    padding: "12px",
                                    background: style.bg,
                                    border: `1px solid ${style.border}`,
                                    borderRadius: "8px",
                                }}
                            >
                                <Text strong style={{ color: style.text }}>
                                    {note.title}:
                                </Text>{" "}
                                {note.content}
                            </div>
                        );
                    })
                ) : (
                    <div style={{ marginTop: 16, color: "#8c8c8c" }}>
                        Hiện tại không có thông báo mới nào. Chúc bạn một ngày tốt lành!
                    </div>
                )}

                <Divider style={{ margin: "20px 0 10px 0" }} />

                <Checkbox onChange={(e) => onCheckboxChange(e.target.checked)}>
                    Không hiển thị lại thông báo này trong 6 giờ
                </Checkbox>
            </div>
        </Modal>
    );
}
