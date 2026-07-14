import React from "react";
import { Table, Tag, Input, Button, Flex, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

export default function AuthLogTab({ logs, loadingLogs, onFetchLogs }) {
    const authLogs = logs.filter((log) =>
        ["LOGIN", "LOGOUT", "REGISTER", "BAN", "UNBAN", "ROLE_CHANGE"].includes(log.action),
    );

    const getActionTag = (action) => {
        const normalizedAction = action?.toUpperCase();
        switch (normalizedAction) {
            case "LOGIN":
                return <Tag color="green">Đăng nhập</Tag>;
            case "LOGOUT":
                return <Tag color="volcano">Đăng xuất</Tag>;
            case "REGISTER":
                return <Tag color="gold">Đăng ký</Tag>;
            case "BAN":
                return <Tag color="red">Khóa tài khoản</Tag>;
            case "UNBAN":
                return <Tag color="success">Mở khóa</Tag>;
            case "ROLE_CHANGE":
                return <Tag color="purple">Phân quyền</Tag>;
            default:
                return <Tag color="default">{normalizedAction}</Tag>;
        }
    };

    const columns = [
        {
            title: "Thời gian",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleString("vi-VN"),
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
                <Tooltip title="Làm mới lịch sử đăng nhập">
                    <Button
                        type="text"
                        icon={<ReloadOutlined />}
                        aria-label="Làm mới lịch sử đăng nhập"
                        className="dp-admin-action-button"
                        onClick={() => onFetchLogs("")}
                        loading={loadingLogs}
                    />
                </Tooltip>
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
