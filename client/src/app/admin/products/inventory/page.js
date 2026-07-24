"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Flex, Select, Table, Tag, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import AdminIconButton from "@/components/ui/AdminIconButton";

const { Title, Text } = Typography;

export default function InventoryHistoryPage() {
    const { message } = App.useApp();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/commerce/inventory", {
                params: { limit: 100, ...(type ? { type } : {}) },
            });
            setItems(response.data?.items || []);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải lịch sử tồn kho.");
        } finally {
            setLoading(false);
        }
    }, [message, type]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Lịch sử tồn kho</Title>
                    <Text type="secondary">Theo dõi giữ hàng, hoàn kho, điều chỉnh và hàng trả lại.</Text>
                </div>
                <Flex gap={8}>
                    <Select
                        allowClear
                        placeholder="Tất cả biến động"
                        value={type || undefined}
                        onChange={(value) => setType(value || "")}
                        style={{ width: 190 }}
                        options={["RESERVE", "RELEASE", "SALE", "RETURN", "ADJUSTMENT", "IMPORT"].map((value) => ({ value, label: value }))}
                    />
                    <AdminIconButton label="Làm mới" icon={<ReloadOutlined />} onClick={load} loading={loading} />
                </Flex>
            </Flex>
            <Table
                rowKey="id"
                loading={loading}
                dataSource={items}
                scroll={{ x: 860 }}
                columns={[
                    { title: "Sản phẩm", render: (_, item) => item.Product?.name || item.productId },
                    { title: "SKU", render: (_, item) => <Text code>{item.Product?.sku || "-"}</Text> },
                    { title: "Loại", dataIndex: "type", render: (value) => <Tag>{value}</Tag> },
                    {
                        title: "Thay đổi",
                        dataIndex: "quantity",
                        align: "right",
                        render: (value) => (
                            <Text style={{ color: Number(value) < 0 ? "#dc2626" : "#16a34a" }}>
                                {Number(value) > 0 ? "+" : ""}{value}
                            </Text>
                        ),
                    },
                    { title: "Tồn sau", dataIndex: "stockAfter", align: "right" },
                    { title: "Tham chiếu", dataIndex: "reference" },
                    { title: "Thời gian", dataIndex: "createdAt", render: (value) => new Date(value).toLocaleString("vi-VN") },
                ]}
            />
        </div>
    );
}
