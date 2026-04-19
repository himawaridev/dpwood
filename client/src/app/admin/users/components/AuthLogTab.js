import React from "react";
import { Table, Tag, Input, Button, Flex } from "antd";

export default function AuthLogTab({ logs, loadingLogs, onFetchLogs }) {
    const authLogs = logs.filter((log) =>
        ["LOGIN", "LOGOUT", "REGISTER", "BAN", "UNBAN", "ROLE_CHANGE"].includes(log.action),
    );

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
            render: (action) => (
                <Tag color={action === "LOGIN" ? "green" : action === "LOGOUT" ? "orange" : "blue"}>
                    {action}
                </Tag>
            ),
        },
        { title: "Chi tiết", dataIndex: "details", key: "details" },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Nhập email cần tìm..."
                    allowClear
                    enterButton="Tìm kiếm"
                    size="large"
                    onSearch={(value) => onFetchLogs(value)}
                    style={{ maxWidth: 400 }}
                />
                <Button size="large" onClick={() => onFetchLogs("")} loading={loadingLogs}>
                    Làm mới log
                </Button>
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
