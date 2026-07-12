import React, { useState } from "react";
import { Table, Select, Tag, Button, Typography, Input, Flex, Space } from "antd";

const { Text } = Typography;

const normalizeAccountPhone = (value = "") => {
    const digits = String(value).replace(/\D/g, "");
    if (digits.startsWith("84") && digits.length === 11) return `0${digits.slice(2)}`;
    return digits;
};

export default function RoleManagementTab({ users, loading, onRefresh, onChangeRole, onUpdatePhone }) {
    const [searchText, setSearchText] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [phoneDrafts, setPhoneDrafts] = useState({});

    const filteredUsers = users.filter((user) => {
        const keyword = searchText.toLowerCase();
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesSearch =
            (user.name || "").toLowerCase().includes(keyword) ||
            (user.email || "").toLowerCase().includes(keyword) ||
            (user.username || "").toLowerCase().includes(keyword) ||
            (user.phone || "").toLowerCase().includes(keyword);
        return matchesRole && matchesSearch;
    });

    const columns = [
        { title: "Tên", dataIndex: "name", key: "name" },
        { title: "Username", dataIndex: "username", key: "username" },
        { title: "Email", dataIndex: "email", key: "email" },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
            render: (_, record) => {
                const draft = phoneDrafts[record.id] ?? record.phone ?? "";
                const normalizedDraft = normalizeAccountPhone(draft);
                const isDirty = normalizedDraft !== (record.phone || "");

                return (
                    <Space.Compact>
                        <Input
                            value={draft}
                            placeholder="0912345678"
                            inputMode="tel"
                            onChange={(event) =>
                                setPhoneDrafts((prev) => ({
                                    ...prev,
                                    [record.id]: event.target.value,
                                }))
                            }
                            style={{ width: 150 }}
                        />
                        <Button
                            type={isDirty ? "primary" : "default"}
                            disabled={!normalizedDraft || !isDirty}
                            onClick={() => onUpdatePhone(record.id, normalizedDraft)}
                        >
                            Lưu
                        </Button>
                    </Space.Compact>
                );
            },
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
                <Select
                    defaultValue={record.role}
                    style={{ width: 120 }}
                    onChange={(value) => onChangeRole(record.id, value)}
                    disabled={record.role === "root"}
                    options={[
                        { value: "user", label: "User" },
                        { value: "staff", label: "Staff vận hành" },
                        { value: "admin", label: "Admin" },
                    ]}
                />
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap="wrap" gap={12}>
                <Space wrap>
                    <Input.Search
                        placeholder="Tìm theo tên, email, username, số điện thoại..."
                        allowClear
                        enterButton="Tìm kiếm"
                        size="large"
                        onSearch={(value) => setSearchText(value)}
                        onChange={(event) => setSearchText(event.target.value)}
                        style={{ width: 400, maxWidth: "100%" }}
                    />
                    <Select
                        size="large"
                        value={roleFilter}
                        onChange={setRoleFilter}
                        style={{ minWidth: 150 }}
                        options={[
                            { value: "all", label: "Tất cả quyền" },
                            { value: "root", label: "Root" },
                            { value: "admin", label: "Admin" },
                            { value: "staff", label: "Staff vận hành" },
                            { value: "user", label: "User" },
                        ]}
                    />
                </Space>
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
                locale={{ emptyText: <Text type="secondary">Không có người dùng phù hợp</Text> }}
            />
        </>
    );
}
