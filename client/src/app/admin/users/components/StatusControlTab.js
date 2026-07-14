import React, { useState } from "react";
import { Table, Tag, Button, Popconfirm, Space, Input, Flex, Select, Tooltip } from "antd";
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
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredUsers = users.filter((user) => {
        const keyword = searchText.toLowerCase();
        const isDeleted = Boolean(user.deletedAt);
        const isLocked = !isDeleted && user.lockUntil && new Date(user.lockUntil) > new Date();
        const statusMatches =
            statusFilter === "all" ||
            (statusFilter === "deleted" && isDeleted) ||
            (statusFilter === "locked" && isLocked) ||
            (statusFilter === "active" && !isDeleted && !isLocked);

        return statusMatches && (
            (user.name || "").toLowerCase().includes(keyword) ||
            (user.email || "").toLowerCase().includes(keyword) ||
            (user.username || "").toLowerCase().includes(keyword)
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
            title: "Xác minh email",
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
                        <Tooltip title={isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản"}>
                            <Button
                                type="text"
                                icon={isBanned ? <UnlockOutlined /> : <LockOutlined />}
                                aria-label={isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                onClick={() => onToggleBan(record.id)}
                                disabled={record.role === "root"}
                                className="dp-admin-action-button"
                            />
                        </Tooltip>
                        {isDeleted ? (
                            <Popconfirm
                                title="Khôi phục tài khoản này?"
                                onConfirm={() => onRestore(record.id)}
                                okText="Khôi phục"
                                cancelText="Hủy"
                            >
                                <Tooltip title="Khôi phục tài khoản">
                                    <Button
                                        type="text"
                                        aria-label="Khôi phục tài khoản"
                                        className="dp-admin-action-button"
                                        icon={<ReloadOutlined />}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        ) : (
                            <Popconfirm
                                title="Xóa tài khoản?"
                                onConfirm={() => onDelete(record.id)}
                                okText="Xóa"
                                cancelText="Hủy"
                            >
                                <Tooltip title="Xóa tài khoản">
                                    <Button
                                        type="text"
                                        aria-label="Xóa tài khoản"
                                        className="dp-admin-action-button"
                                        icon={<DeleteOutlined />}
                                        disabled={record.role === "root"}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap="wrap" gap={12}>
                <Space wrap>
                    <Input.Search
                        placeholder="Tìm theo tên, email, username..."
                        allowClear
                        enterButton="Tìm kiếm"
                        size="large"
                        onSearch={(value) => setSearchText(value)}
                        onChange={(event) => setSearchText(event.target.value)}
                        style={{ width: 380, maxWidth: "100%" }}
                    />
                    <Select
                        size="large"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ minWidth: 170 }}
                        options={[
                            { value: "all", label: "Tất cả trạng thái" },
                            { value: "active", label: "Đang hoạt động" },
                            { value: "locked", label: "Đang bị khóa" },
                            { value: "deleted", label: "Đã bị xóa" },
                        ]}
                    />
                </Space>
                <Tooltip title="Làm mới dữ liệu tài khoản">
                    <Button
                        type="text"
                        icon={<ReloadOutlined />}
                        aria-label="Làm mới dữ liệu tài khoản"
                        className="dp-admin-action-button"
                        onClick={onRefresh}
                        loading={loading}
                    />
                </Tooltip>
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
