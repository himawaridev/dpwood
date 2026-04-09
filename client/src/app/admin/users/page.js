"use client";
import { useEffect, useState } from "react";
import { message, Typography, Tabs } from "antd";
import api from "@/utils/axios";

// 🔴 Import các Sub-Components đã chia nhỏ
import RoleManagementTab from "./components/RoleManagementTab";
import StatusControlTab from "./components/StatusControlTab";
import AuthLogTab from "./components/AuthLogTab";
import TransactionLogTab from "./components/TransactionLogTab";

const { Title } = Typography;

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/users");
            setUsers(res.data);
        } catch (error) {
            message.error("Không thể lấy danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (searchValue = "") => {
        try {
            setLoadingLogs(true);
            const res = await api.get(`/users/logs${searchValue ? `?search=${searchValue}` : ""}`);
            setLogs(res.data);
        } catch (error) {
            message.error("Không thể lấy nhật ký hệ thống");
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchLogs();
    }, []);

    const handleChangeRole = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            message.success("Cập nhật quyền thành công");
            fetchUsers();
        } catch (error) {
            message.error("Lỗi khi cập nhật quyền");
        }
    };

    const handleDelete = async (userId) => {
        try {
            await api.delete(`/users/${userId}`);
            message.success("Đã xóa tài khoản");
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi xóa tài khoản");
        }
    };

    const handleToggleBan = async (userId) => {
        try {
            const res = await api.put(`/users/${userId}/ban`);
            message.success(res.data.message);
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi thao tác");
        }
    };

    // 🔴 Dùng thuộc tính items chuẩn xác theo Ant Design V5
    const tabItems = [
        {
            key: "1",
            label: "Phân Quyền",
            children: (
                <RoleManagementTab
                    users={users}
                    loading={loading}
                    onRefresh={fetchUsers}
                    onChangeRole={handleChangeRole}
                />
            ),
        },
        {
            key: "2",
            label: "Trạng Thái",
            children: (
                <StatusControlTab
                    users={users}
                    loading={loading}
                    onRefresh={fetchUsers}
                    onToggleBan={handleToggleBan}
                    onDelete={handleDelete}
                />
            ),
        },
        {
            key: "3",
            label: "Lịch Sử Đăng Nhập",
            children: <AuthLogTab logs={logs} loadingLogs={loadingLogs} onFetchLogs={fetchLogs} />,
        },
        {
            key: "4",
            label: "Lịch Sử Giao Dịch",
            children: (
                <TransactionLogTab logs={logs} loadingLogs={loadingLogs} onFetchLogs={fetchLogs} />
            ),
        },
    ];

    return (
        <>
            <Title level={3} style={{ marginTop: 0, marginBottom: 20 }}>
                Quản Lý Người Dùng & Hoạt Động
            </Title>
            <Tabs defaultActiveKey="1" items={tabItems} />
        </>
    );
}
