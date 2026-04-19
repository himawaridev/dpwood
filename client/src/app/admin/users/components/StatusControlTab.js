import React, { useState } from "react";
import { Table, Tag, Button, Popconfirm, Space, Input, Flex } from "antd";
import { DeleteOutlined, LockOutlined, UnlockOutlined, ReloadOutlined } from "@ant-design/icons";

export default function StatusControlTab({
    users,
    loading,
    onRefresh,
    onToggleBan,
    onDelete,
    onRestore,
}) {
    const [searchText, setSearchText] = useState("");

    const filteredUsers = users.filter((u) => {
        const keyword = searchText.toLowerCase();
        return (
            (u.name || "").toLowerCase().includes(keyword) ||
            (u.email || "").toLowerCase().includes(keyword) ||
            (u.username || "").toLowerCase().includes(keyword)
        );
    });

    const columns = [
        { title: "Email", dataIndex: "email", key: "email" },
        {
            title: "Ngày đăng ký",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleString("vi-VN"),
        },
        {
            title: "Xác minh Email",
            dataIndex: "isVerified",
            key: "isVerified",
            render: (isVerified) =>
                isVerified ? (
                    <Tag color="success">Đã xác minh</Tag>
                ) : (
                    <Tag color="default">Chưa xác minh</Tag>
                ),
        },
        {
            title: "Trạng thái",
            key: "status",
            render: (_, record) => {
                if (record.deletedAt) return <Tag color="default">Đã bị xóa</Tag>;

                return record.lockUntil && new Date(record.lockUntil) > new Date() ? (
                    <Tag color="error">Bị khóa</Tag>
                ) : (
                    <Tag color="processing">Hoạt động</Tag>
                );
            },
        },
        {
            title: "Hành động",
            key: "actions",
            render: (_, record) => {
                const isBanned = record.lockUntil && new Date(record.lockUntil) > new Date();
                const isDeleted = !!record.deletedAt;
                return (
                    <Space>
                        <Button
                            type={isBanned ? "primary" : "default"}
                            danger={!isBanned}
                            icon={isBanned ? <UnlockOutlined /> : <LockOutlined />}
                            onClick={() => onToggleBan(record.id)}
                            disabled={record.role === "root"}
                        >
                            {isBanned ? "Mở khóa" : "Khóa"}
                        </Button>
                        {isDeleted ? (
                            <Popconfirm
                                title="Khôi phục tài khoản này?"
                                onConfirm={() => onRestore(record.id)}
                                okText="Khôi phục"
                                cancelText="Hủy"
                            >
                                <Button
                                    type="primary"
                                    style={{ background: "#52c41a" }}
                                    icon={<ReloadOutlined />}
                                ></Button>
                            </Popconfirm>
                        ) : (
                            <Popconfirm
                                title="Xóa tài khoản?"
                                onConfirm={() => onDelete(record.id)}
                                okText="Xóa"
                                cancelText="Hủy"
                            >
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={record.role === "root"}
                                />
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Tìm theo tên, email, username..."
                    allowClear
                    enterButton="Tìm kiếm"
                    size="large"
                    onSearch={(value) => setSearchText(value)}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ maxWidth: 400 }}
                />
                <Button size="large" onClick={onRefresh} loading={loading}>
                    Làm mới dữ liệu
                </Button>
            </Flex>
            <Table
                dataSource={filteredUsers}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: "max-content" }}
            />
        </>
    );
}
