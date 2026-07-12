"use client";
import { useCallback, useEffect, useState } from "react";
import { App, Typography } from "antd";
import api from "@/utils/axios";

import RoleManagementTab from "./components/RoleManagementTab";
import StatusControlTab from "./components/StatusControlTab";
import AuthLogTab from "./components/AuthLogTab";
import TransactionLogTab from "./components/TransactionLogTab";

const { Title } = Typography;

const SECTION_TITLES = {
    roles: ["Phân quyền người dùng", "Quản lý vai trò và số điện thoại của từng tài khoản."],
    status: ["Trạng thái tài khoản", "Khóa, mở khóa, xóa mềm hoặc khôi phục tài khoản."],
    "auth-logs": ["Lịch sử đăng nhập", "Theo dõi đăng nhập, đăng xuất và các thay đổi tài khoản."],
    transactions: ["Lịch sử giao dịch", "Tra cứu tạo đơn, thanh toán, hủy đơn và cập nhật trạng thái."],
};

export function AdminUsersSection({ section = "roles" }) {
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
            const res = await api.get(`/users/logs${searchValue ? `?search=${encodeURIComponent(searchValue)}` : ""}`);
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

    const content = {
        roles: (
            <RoleManagementTab
                users={users}
                loading={loading}
                onRefresh={fetchUsers}
                onChangeRole={handleChangeRole}
                onUpdatePhone={handleUpdatePhone}
            />
        ),
        status: (
            <StatusControlTab
                users={users}
                loading={loading}
                onRefresh={fetchUsers}
                onToggleBan={handleToggleBan}
                onDelete={handleDelete}
                onRestore={handleRestore}
            />
        ),
        "auth-logs": <AuthLogTab logs={logs} loadingLogs={loadingLogs} onFetchLogs={fetchLogs} />,
        transactions: (
            <TransactionLogTab logs={logs} loadingLogs={loadingLogs} onFetchLogs={fetchLogs} />
        ),
    };
    const activeSection = SECTION_TITLES[section] ? section : "roles";
    const [title, description] = SECTION_TITLES[activeSection];

    return (
        <>
            <div style={{ marginBottom: 20 }}>
                <Title level={3} style={{ margin: 0 }}>
                    {title}
                </Title>
                <Typography.Text type="secondary">{description}</Typography.Text>
            </div>
            {content[activeSection]}
        </>
    );
}

export default function AdminUsersPage() {
    return <AdminUsersSection section="roles" />;
}
