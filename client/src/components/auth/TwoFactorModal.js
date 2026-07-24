"use client";

import { Button, Input, Modal, Space, Typography } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";

const { Paragraph, Title } = Typography;

export default function TwoFactorModal({
    open,
    value,
    loading,
    onChange,
    onSubmit,
    onCancel,
}) {
    return (
        <Modal
            open={open}
            footer={null}
            onCancel={onCancel}
            destroyOnHidden
            width={420}
            title={null}
        >
            <Space orientation="vertical" size={18} style={{ width: "100%" }}>
                <SafetyCertificateOutlined style={{ color: "#f09b90", fontSize: 32 }} />
                <div>
                    <Title level={3} style={{ margin: 0 }}>Xác thực hai bước</Title>
                    <Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
                        Nhập mã gồm 6 chữ số vừa được gửi tới email quản trị. Mã có hiệu lực trong 5 phút.
                    </Paragraph>
                </div>
                <Input.OTP
                    length={6}
                    value={value}
                    onChange={onChange}
                    size="large"
                    autoFocus
                    onPressEnter={() => value?.length === 6 && onSubmit()}
                />
                <Button
                    type="primary"
                    size="large"
                    block
                    loading={loading}
                    disabled={String(value || "").length !== 6}
                    onClick={onSubmit}
                >
                    Xác nhận đăng nhập
                </Button>
            </Space>
        </Modal>
    );
}
