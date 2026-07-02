"use client";
import { useCallback, useEffect, useState } from "react";
import { App, Typography, Tabs } from "antd";
import api from "@/utils/axios";

import RoleManagementTab from "./components/RoleManagementTab";
import StatusControlTab from "./components/StatusControlTab";
import AuthLogTab from "./components/AuthLogTab";
import TransactionLogTab from "./components/TransactionLogTab";

const { Title } = Typography;

export default function AdminUsersPage() {
    const { message } = App.useApp();
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/users");
            setUsers(res.data);
        } catch {
            message.error("Không thể lấy danh sách người dùng");
        } finally {
            setLoading(false);
        }
    }, [message]);

    const fetchLogs = useCallback(async (searchValue = "") => {
        try {
            setLoadingLogs(true);
            const res = await api.get(`/users/logs${searchValue ? `?search=${searchValue}` : ""}`);
            setLogs(res.data);
        } catch {
            message.error("Không thể lấy nhật ký hệ thống");
        } finally {
            setLoadingLogs(false);
        }
    }, [message]);

    useEffect(() => {
        fetchUsers();
        fetchLogs();
    }, [fetchLogs, fetchUsers]);

    const handleChangeRole = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            message.success("Cập nhật quyền thành công");
            fetchUsers();
        } catch {
            message.error("Lỗi khi cập nhật quyền");
        }
    };

    const handleUpdatePhone = async (userId, phone) => {
        try {
            await api.put(`/users/${userId}/phone`, { phone });
            message.success("Cập nhật số điện thoại thành công.");
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể cập nhật số điện thoại.");
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

    const handleRestore = async (userId) => {
        try {
            await api.put(`/users/${userId}/restore`);
            message.success("Đã khôi phục tài khoản");
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi khôi phục");
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

    const tabItems = [
        {
            key: "1",
            label: "Phân quyền",
            children: (
                <RoleManagementTab
                    users={users}
                    loading={loading}
                    onRefresh={fetchUsers}
                    onChangeRole={handleChangeRole}
                    onUpdatePhone={handleUpdatePhone}
                />
            ),
        },
        {
            key: "2",
            label: "Trạng thái",
            children: (
                <StatusControlTab
                    users={users}
                    loading={loading}
                    onRefresh={fetchUsers}
                    onToggleBan={handleToggleBan}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                />
            ),
        },
        {
            key: "3",
            label: "Lịch sử đăng nhập",
            children: <AuthLogTab logs={logs} loadingLogs={loadingLogs} onFetchLogs={fetchLogs} />,
        },
        {
            key: "4",
            label: "Lịch sử giao dịch",
            children: (
                <TransactionLogTab logs={logs} loadingLogs={loadingLogs} onFetchLogs={fetchLogs} />
            ),
        },
    ];

    return (
        <>
            <Title level={3} style={{ marginTop: 0, marginBottom: 20 }}>
                Quản lý người dùng & hoạt động
            </Title>
            <Tabs defaultActiveKey="1" items={tabItems} />
        </>
    );
}
