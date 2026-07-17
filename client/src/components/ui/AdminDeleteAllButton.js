"use client";

import { useState } from "react";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, Input, Modal, Typography } from "antd";
import AdminIconButton from "./AdminIconButton";

const { Text } = Typography;
const CONFIRMATION_TEXT = "XÓA TẤT CẢ";

export default function AdminDeleteAllButton({
    entityLabel,
    count = 0,
    loading = false,
    onConfirm,
}) {
    const [open, setOpen] = useState(false);
    const [confirmation, setConfirmation] = useState("");

    const closeModal = () => {
        if (loading) return;
        setOpen(false);
        setConfirmation("");
    };

    const handleConfirm = async () => {
        await onConfirm();
        setOpen(false);
        setConfirmation("");
    };

    const isConfirmed = confirmation.trim().toLocaleUpperCase("vi-VN") === CONFIRMATION_TEXT;

    return (
        <>
            <AdminIconButton
                label={`Xóa tất cả ${entityLabel}`}
                tooltip={count > 0 ? `Xóa tất cả ${entityLabel}` : `Không có ${entityLabel} để xóa`}
                icon={<DeleteOutlined />}
                disabled={count === 0 || loading}
                loading={loading}
                onClick={() => setOpen(true)}
            />

            <Modal
                title="Xác nhận xóa toàn bộ"
                open={open}
                okText="Xóa tất cả"
                cancelText="Hủy"
                okButtonProps={{ danger: true, disabled: !isConfirmed }}
                confirmLoading={loading}
                onOk={handleConfirm}
                onCancel={closeModal}
                destroyOnHidden
                centered
            >
                <Alert
                    type="error"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    title={`Bạn sắp xóa vĩnh viễn ${count} ${entityLabel}.`}
                    description="Thao tác này không thể hoàn tác."
                    style={{ marginBottom: 16 }}
                />
                <Text>
                    Nhập <Text code>{CONFIRMATION_TEXT}</Text> để tiếp tục:
                </Text>
                <Input
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder={CONFIRMATION_TEXT}
                    autoComplete="off"
                    disabled={loading}
                    style={{ marginTop: 8 }}
                />
            </Modal>
        </>
    );
}
