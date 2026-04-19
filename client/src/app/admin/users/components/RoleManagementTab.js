import React, { useState } from "react";
import { Table, Select, Tag, Button, Typography, Input, Flex } from "antd";

const { Text } = Typography;

export default function RoleManagementTab({ users, loading, onRefresh, onChangeRole }) {
    const [searchText, setSearchText] = useState("");

    // Bộ lọc tìm kiếm người dùng theo Tên, Username hoặc Email
    const filteredUsers = users.filter((u) => {
        const keyword = searchText.toLowerCase();
        return (
            (u.name || "").toLowerCase().includes(keyword) ||
            (u.email || "").toLowerCase().includes(keyword) ||
            (u.username || "").toLowerCase().includes(keyword)
        );
    });

    const columns = [
        { title: "Tên", dataIndex: "name", key: "name" },
        { title: "Username", dataIndex: "username", key: "username" },
        { title: "Email", dataIndex: "email", key: "email" },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
            render: (phone) => (phone ? phone : <Text type="secondary">Chưa cập nhật</Text>),
        },
        {
            title: "Quyền hiện tại",
            dataIndex: "role",
            key: "role",
            render: (role) => (
                <Tag color={role === "root" ? "red" : role === "admin" ? "gold" : "blue"}>
                    {role.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Thay đổi quyền",
            key: "action",
            render: (_, record) => (
                // 🔴 ANTD V5: Sử dụng options thay vì Select.Option
                <Select
                    defaultValue={record.role}
                    style={{ width: 120 }}
                    onChange={(value) => onChangeRole(record.id, value)}
                    disabled={record.role === "root"}
                    options={[
                        { value: "user", label: "User" },
                        { value: "seller", label: "Seller" },
                        { value: "admin", label: "Admin" },
                    ]}
                />
            ),
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
                    Làm mới danh sách
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
