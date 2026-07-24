"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Flex, Input, Modal, Select, Space, Table, Tag, Typography } from "antd";
import { CheckOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import AdminIconButton from "@/components/ui/AdminIconButton";
import { formatCurrency } from "@/utils/formatters";

const { Title, Text } = Typography;
const STATUS_OPTIONS = [
    ["REQUESTED", "Mới yêu cầu"],
    ["APPROVED", "Đã duyệt"],
    ["REJECTED", "Từ chối"],
    ["IN_TRANSIT", "Khách đang gửi trả"],
    ["RECEIVED", "Đã nhận hàng trả"],
    ["COMPLETED", "Hoàn tất"],
].map(([value, label]) => ({ value, label }));

export default function AdminReturnsPage() {
    const { message } = App.useApp();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState({ status: "APPROVED", resolutionNote: "", refundAmount: 0 });

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/commerce/returns", {
                params: { limit: 100, ...(status ? { status } : {}) },
            });
            setItems(response.data?.items || []);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải yêu cầu đổi trả.");
        } finally {
            setLoading(false);
        }
    }, [message, status]);

    useEffect(() => {
        load();
    }, [load]);

    const save = async () => {
        await api.put(`/commerce/returns/${editing.id}`, {
            ...draft,
            refundAmount: Number(draft.refundAmount || 0),
            restock: draft.status === "COMPLETED",
        });
        message.success("Đã cập nhật yêu cầu đổi trả.");
        setEditing(null);
        await load();
    };

    return (
        <div>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Đổi trả và hoàn tiền</Title>
                    <Text type="secondary">Duyệt yêu cầu, ghi nhận hàng hoàn và nhập lại tồn kho.</Text>
                </div>
                <Space>
                    <Select
                        allowClear
                        placeholder="Tất cả trạng thái"
                        options={STATUS_OPTIONS}
                        value={status || undefined}
                        onChange={(value) => setStatus(value || "")}
                        style={{ width: 190 }}
                    />
                    <AdminIconButton label="Làm mới" icon={<ReloadOutlined />} onClick={load} loading={loading} />
                </Space>
            </Flex>
            <Table
                rowKey="id"
                loading={loading}
                dataSource={items}
                scroll={{ x: 900 }}
                columns={[
                    { title: "Mã đơn", render: (_, item) => <Text code>#{item.Order?.orderCode}</Text> },
                    { title: "Lý do", dataIndex: "reason" },
                    { title: "Trạng thái", dataIndex: "status", render: (value) => <Tag>{value}</Tag> },
                    { title: "Hoàn dự kiến", dataIndex: "refundAmount", render: (value) => formatCurrency(value || 0) },
                    { title: "Tạo lúc", dataIndex: "createdAt", render: (value) => new Date(value).toLocaleString("vi-VN") },
                    {
                        title: "Hành động",
                        align: "right",
                        render: (_, item) => (
                            <AdminIconButton
                                label="Xử lý yêu cầu"
                                icon={<CheckOutlined />}
                                onClick={() => {
                                    setEditing(item);
                                    setDraft({
                                        status: item.status,
                                        resolutionNote: item.resolutionNote || "",
                                        refundAmount: Number(item.refundAmount || 0),
                                    });
                                }}
                            />
                        ),
                    },
                ]}
            />
            <Modal
                title="Xử lý yêu cầu đổi trả"
                open={Boolean(editing)}
                onCancel={() => setEditing(null)}
                onOk={save}
                okText="Lưu xử lý"
            >
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    <Select
                        value={draft.status}
                        options={STATUS_OPTIONS}
                        onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
                        style={{ width: "100%" }}
                    />
                    <Input.TextArea
                        rows={4}
                        value={draft.resolutionNote}
                        placeholder="Ghi chú xử lý"
                        onChange={(event) => setDraft((current) => ({ ...current, resolutionNote: event.target.value }))}
                    />
                    <Input
                        type="number"
                        min={0}
                        value={draft.refundAmount}
                        addonAfter="đ"
                        onChange={(event) => setDraft((current) => ({ ...current, refundAmount: event.target.value }))}
                    />
                </Space>
            </Modal>
        </div>
    );
}
