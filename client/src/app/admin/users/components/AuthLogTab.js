import React from "react";
import { Table, Tag, Input, Flex } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";
import { getActivityActionMeta } from "@/utils/activityLog";
import { formatDateTime } from "@/utils/formatters";

export default function AuthLogTab({ logs, loadingLogs, onFetchLogs }) {
    const authLogs = logs.filter((log) =>
        ["LOGIN", "LOGOUT", "REGISTER", "BAN", "UNBAN", "ROLE_CHANGE"].includes(log.action),
    );

    const getActionTag = (action) => {
        const meta = getActivityActionMeta(action);
        return <Tag color={meta.color}>{meta.label}</Tag>;
    };

    const columns = [
        {
            title: "Thời gian",
            dataIndex: "createdAt",
            key: "createdAt",
            render: formatDateTime,
        },
        {
            title: "Email người dùng",
            key: "user",
            render: (_, record) => record.User?.email || "Không xác định",
        },
        {
            title: "Hành động",
            dataIndex: "action",
            key: "action",
            render: (action) => getActionTag(action),
        },
        { title: "Chi tiết", dataIndex: "details", key: "details" },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap="wrap" gap={12}>
                <Input.Search
                    placeholder="Nhập email cần tìm..."
                    allowClear
                    enterButton="Tìm kiếm"
                    size="large"
                    onSearch={(value) => onFetchLogs(value)}
                    style={{ maxWidth: 400 }}
                />
                <AdminIconButton
                    label="Làm mới lịch sử đăng nhập"
                    icon={<ReloadOutlined />}
                    onClick={() => onFetchLogs("")}
                    loading={loadingLogs}
                />
            </Flex>
            <Table
                dataSource={authLogs}
                columns={columns}
                rowKey="id"
                loading={loadingLogs}
                scroll={{ x: "max-content" }}
            />
        </>
    );
}
