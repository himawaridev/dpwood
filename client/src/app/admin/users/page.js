"use client";
import { useCallback, useEffect, useState } from "react";
import { App, Typography, Tabs } from "antd";
import api from "@/utils/axios";

// ðŸ”´ Import cÃ¡c Sub-Components Ä‘Ã£ chia nhá»
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
            message.error("KhÃ´ng thá»ƒ láº¥y danh sÃ¡ch ngÆ°á»i dÃ¹ng");
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
            message.error("KhÃ´ng thá»ƒ láº¥y nháº­t kÃ½ há»‡ thá»‘ng");
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
            message.success("Cáº­p nháº­t quyá»n thÃ nh cÃ´ng");
            fetchUsers();
        } catch {
            message.error("Lá»—i khi cáº­p nháº­t quyá»n");
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
            message.success("ÄÃ£ xÃ³a tÃ i khoáº£n");
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || "Lá»—i khi xÃ³a tÃ i khoáº£n");
        }
    };

    const handleRestore = async (userId) => {
        try {
            await api.put(`/users/${userId}/restore`);
            message.success("ÄÃ£ khÃ´i phá»¥c tÃ i khoáº£n");
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || "Lá»—i khi khÃ´i phá»¥c");
        }
    };

    const handleToggleBan = async (userId) => {
        try {
            const res = await api.put(`/users/${userId}/ban`);
            message.success(res.data.message);
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || "Lá»—i thao tÃ¡c");
        }
    };

    // ðŸ”´ DÃ¹ng thuá»™c tÃ­nh items chuáº©n xÃ¡c theo Ant Design V5
    const tabItems = [
        {
            key: "1",
            label: "PhÃ¢n Quyá»n",
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
            label: "Tráº¡ng ThÃ¡i",
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
            label: "Lá»‹ch Sá»­ ÄÄƒng Nháº­p",
            children: <AuthLogTab logs={logs} loadingLogs={loadingLogs} onFetchLogs={fetchLogs} />,
        },
        {
            key: "4",
            label: "Lá»‹ch Sá»­ Giao Dá»‹ch",
            children: (
                <TransactionLogTab logs={logs} loadingLogs={loadingLogs} onFetchLogs={fetchLogs} />
            ),
        },
    ];

    return (
        <>
            <Title level={3} style={{ marginTop: 0, marginBottom: 20 }}>
                Quáº£n LÃ½ NgÆ°á»i DÃ¹ng & Hoáº¡t Äá»™ng
            </Title>
            <Tabs defaultActiveKey="1" items={tabItems} />
        </>
    );
}
