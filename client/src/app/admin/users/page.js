"use client";
import { useEffect, useState } from "react";
import {
    Table,
    Select,
    message,
    Typography,
    Tag,
    Tabs,
    Button,
    Popconfirm,
    Space,
    Input,
} from "antd";
import { DeleteOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

const { Title, Text } = Typography;

// --- SUB-COMPONENTS CHO CÁC TABS ---

const RoleManagementTab = ({ users, loading, onRefresh, onChangeRole }) => {
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
                <Select
                    defaultValue={record.role}
                    style={{ width: 120 }}
                    onChange={(value) => onChangeRole(record.id, value)}
                    disabled={record.role === "root"}
                >
                    <Select.Option value="user">User</Select.Option>
                    <Select.Option value="seller">Seller</Select.Option>
                    <Select.Option value="admin">Admin</Select.Option>
                </Select>
            ),
        },
    ];

    return (
        <>
            <div style={{ marginBottom: 16, textAlign: "right" }}>
                <Button onClick={onRefresh} loading={loading}>
                    Làm mới danh sách
                </Button>
            </div>
            <Table
                dataSource={users}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: 800 }}
            />
        </>
    );
};

const StatusControlTab = ({ users, loading, onRefresh, onToggleBan, onDelete }) => {
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
            render: (_, record) =>
                record.lockUntil && new Date(record.lockUntil) > new Date() ? (
                    <Tag color="error">Bị khóa</Tag>
                ) : (
                    <Tag color="processing">Hoạt động</Tag>
                ),
        },
        {
            title: "Hành động",
            key: "actions",
            render: (_, record) => {
                const isBanned = record.lockUntil && new Date(record.lockUntil) > new Date();
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
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <div style={{ marginBottom: 16, textAlign: "right" }}>
                <Button onClick={onRefresh} loading={loading}>
                    Làm mới dữ liệu
                </Button>
            </div>
            <Table
                dataSource={users}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: 800 }}
            />
        </>
    );
};

const AuthLogTab = ({ logs, loadingLogs, onFetchLogs }) => {
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
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
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
            </div>
            <Table
                dataSource={authLogs}
                columns={columns}
                rowKey="id"
                loading={loadingLogs}
                scroll={{ x: 800 }}
            />
        </>
    );
};

const TransactionLogTab = ({ logs, loadingLogs, onFetchLogs }) => {
    const transactionLogs = logs.filter((log) =>
        ["ORDER_CREATED", "PAYMENT_RECEIVED", "ORDER_CANCELED", "ADMIN_UPDATE_ORDER"].includes(
            log.action,
        ),
    );

    const extractTransactionInfo = (details) => {
        let orderCode = "-";
        let method = "-";
        let amount = "-";
        let transId = "-";

        const codeMatch = details.match(/#(\d+)/);
        if (codeMatch) orderCode = codeMatch[1];

        const methodMatch = details.match(/Phương thức: ([A-Z]+)/);
        if (methodMatch) method = methodMatch[1];

        const amountMatch = details.match(/(Tổng: |đã nhận )([\d.,]+đ)/);
        if (amountMatch) amount = amountMatch[2];

        const transMatch = details.match(/Mã GD: ([A-Za-z0-9]+)/);
        if (transMatch) transId = transMatch[1];

        return { orderCode, method, amount, transId };
    };

    const getCleanNote = (action) => {
        switch (action) {
            case "ORDER_CREATED":
                return "Khách hàng tạo đơn mới";
            case "PAYMENT_RECEIVED":
                return "Hệ thống xác nhận nhận tiền tự động";
            case "ADMIN_UPDATE_ORDER":
                return "Quản trị viên cập nhật trạng thái đơn";
            case "ORDER_CANCELED":
                return "Hủy đơn hàng & hoàn lại tồn kho";
            default:
                return "Cập nhật hệ thống";
        }
    };

    const columns = [
        {
            title: "Thời gian",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleString("vi-VN"),
        },
        {
            title: "Email giao dịch",
            key: "user",
            render: (_, record) => record.User?.email || "Khách ẩn danh",
        },
        {
            title: "Mã đơn hàng",
            key: "orderCode",
            render: (_, record) => (
                <Text strong>#{extractTransactionInfo(record.details).orderCode}</Text>
            ),
        },
        {
            title: "Mã giao dịch",
            key: "transId",
            render: (_, record) => {
                const transId = extractTransactionInfo(record.details).transId;
                return transId !== "-" ? <Tag color="geekblue">{transId}</Tag> : "-";
            },
        },
        {
            title: "Phương thức",
            key: "method",
            render: (_, record) => {
                const method = extractTransactionInfo(record.details).method;
                return method !== "-" ? (
                    <Tag color={method === "QR" ? "purple" : "default"}>{method}</Tag>
                ) : (
                    "-"
                );
            },
        },
        {
            title: "Giá tiền",
            key: "amount",
            render: (_, record) => {
                const amount = extractTransactionInfo(record.details).amount;
                return amount !== "-" ? (
                    <Text type="danger" strong>
                        {amount}
                    </Text>
                ) : (
                    "-"
                );
            },
        },
        {
            title: "Hành động",
            dataIndex: "action",
            render: (action) => {
                let color = "blue";
                if (action === "ORDER_CREATED") color = "cyan";
                if (action === "PAYMENT_RECEIVED") color = "green";
                if (action === "ORDER_CANCELED") color = "red";
                return <Tag color={color}>{action}</Tag>;
            },
        },
        {
            title: "Mô tả",
            dataIndex: "action",
            key: "cleanNote",
            render: (action) => <Text type="secondary">{getCleanNote(action)}</Text>,
        },
    ];

    return (
        <>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
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
            </div>
            <Table
                dataSource={transactionLogs}
                columns={columns}
                rowKey="id"
                loading={loadingLogs}
                scroll={{ x: 1000 }}
            />
        </>
    );
};

// --- MAIN PAGE COMPONENT ---

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
