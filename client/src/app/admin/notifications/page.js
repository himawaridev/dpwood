"use client";
import { useEffect, useState } from "react";
import { Table, Button, Typography, Tag, Switch, message, Flex, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FieldTimeOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import NotificationModal from "./components/NotificationModal";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get("/notifications");
            setNotifications(res.data);
        } catch (error) {
            message.error("Lỗi khi tải danh sách thông báo");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSave = async (values) => {
        try {
            // 🔴 Xử lý mảng timeRange thành startTime và endTime gửi xuống Backend
            const payload = { ...values };
            if (values.timeRange && values.timeRange.length === 2) {
                payload.startTime = values.timeRange[0].toISOString();
                payload.endTime = values.timeRange[1].toISOString();
            } else {
                payload.startTime = null;
                payload.endTime = null;
            }
            delete payload.timeRange;

            if (editingItem) {
                await api.put(`/notifications/${editingItem.id}`, payload);
                message.success("Cập nhật thành công");
            } else {
                await api.post("/notifications", payload);
                message.success("Thêm mới thành công");
            }
            setIsModalVisible(false);
            fetchNotifications();
        } catch (error) {
            message.error("Lỗi khi lưu thông báo");
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            message.success("Xóa thành công");
            fetchNotifications();
        } catch (error) {
            message.error("Lỗi khi xóa");
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await api.put(`/notifications/${id}`, { isActive: !currentStatus });
            message.success("Đã cập nhật trạng thái");
            fetchNotifications();
        } catch (error) {
            message.error("Lỗi khi cập nhật");
        }
    };

    const columns = [
        { title: "Tiêu đề", dataIndex: "title", key: "title" },
        {
            title: "Loại (Nhãn)",
            dataIndex: "type",
            render: (type) => {
                const colorMap = { info: "blue", success: "green", warning: "gold", error: "red" };
                const labelMap = {
                    info: "Thông tin",
                    success: "Khuyến mãi",
                    warning: "Cảnh báo",
                    error: "Nghiêm trọng",
                };
                return <Tag color={colorMap[type]}>{labelMap[type]}</Tag>;
            },
        },
        {
            title: "Thời gian áp dụng",
            key: "schedule",
            render: (_, record) => {
                if (!record.startTime || !record.endTime) {
                    return <Text type="secondary">Vĩnh viễn (Không hẹn giờ)</Text>;
                }
                const start = dayjs(record.startTime).format("HH:mm DD/MM");
                const end = dayjs(record.endTime).format("HH:mm DD/MM");

                // Hiển thị thêm icon cảnh báo nếu thông báo đã hết hạn
                const isExpired = dayjs().isAfter(dayjs(record.endTime));

                return (
                    <Flex gap="small" align="center">
                        <FieldTimeOutlined style={{ color: isExpired ? "#cf1322" : "#1677ff" }} />
                        <Text delete={isExpired} type={isExpired ? "secondary" : "default"}>
                            {start} - {end}
                        </Text>
                        {isExpired && (
                            <Tag color="error" style={{ marginLeft: 4 }}>
                                Hết hạn
                            </Tag>
                        )}
                    </Flex>
                );
            },
        },
        {
            title: "Trạng thái Bật/Tắt",
            key: "isActive",
            render: (_, record) => (
                <Switch
                    checked={record.isActive}
                    onChange={() => handleToggleActive(record.id, record.isActive)}
                    checkedChildren="Bật"
                    unCheckedChildren="Tắt"
                />
            ),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Flex gap="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingItem(record);
                            setIsModalVisible(true);
                        }}
                    />
                    <Popconfirm
                        title="Xóa thông báo này?"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                <Title level={3} style={{ margin: 0 }}>
                    Quản Lý Thông Báo Hệ Thống
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingItem(null);
                        setIsModalVisible(true);
                    }}
                >
                    Thêm Mới
                </Button>
            </Flex>
            <Table
                dataSource={notifications}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1000 }}
            />
            <NotificationModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSave={handleSave}
                editingItem={editingItem}
            />
        </>
    );
}
