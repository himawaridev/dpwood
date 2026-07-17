import React, { useState } from "react";
import { Table, Select, Tag, Typography, Input, Flex, Space } from "antd";
import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";

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
        { title: "Tên đăng nhập", dataIndex: "username", key: "username" },
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
                        <AdminIconButton
                            label="Lưu số điện thoại"
                            icon={<SaveOutlined />}
                            disabled={!normalizedDraft || !isDirty}
                            onClick={() => onUpdatePhone(record.id, normalizedDraft)}
                        />
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
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Select
                    defaultValue={record.role}
                    style={{ width: 120 }}
                    onChange={(value) => onChangeRole(record.id, value)}
                    disabled={record.role === "root"}
                    options={[
                        { value: "user", label: "Khách hàng" },
                        { value: "staff", label: "Nhân viên vận hành" },
                        { value: "admin", label: "Quản trị viên" },
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
                            { value: "admin", label: "Quản trị viên" },
                            { value: "staff", label: "Nhân viên vận hành" },
                            { value: "user", label: "Khách hàng" },
                        ]}
                    />
                </Space>
                <AdminIconButton
                    label="Làm mới danh sách người dùng"
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    loading={loading}
                />
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
