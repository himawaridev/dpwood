"use client";
import { useEffect, useState } from "react";
import {
    Table,
    Select,
    message,
    Typography,
    Card,
    Tag,
    Tabs,
    Button,
    Popconfirm,
    Space,
    Input,
    Layout,
    Menu,
    Avatar,
    Dropdown,
    theme,
} from "antd";
import {
    DeleteOutlined,
    LockOutlined,
    UnlockOutlined,
    TeamOutlined,
    DashboardOutlined,
    HomeOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    AppstoreAddOutlined, // Đã thêm icon này
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// --- SUB-COMPONENTS ---

const AdminSidebar = ({ collapsed }) => {
    const router = useRouter();
    const sidebarMenuItems = [
        { key: "dashboard", icon: <DashboardOutlined />, label: "Tổng quan (Sắp có)" },
        {
            key: "users",
            icon: <TeamOutlined />,
            label: "Quản lý Người Dùng",
            onClick: () => router.push("/admin/users"),
        },
        // Thêm menu Quản lý Sản phẩm
        {
            key: "products",
            icon: <AppstoreAddOutlined />,
            label: "Quản lý Sản Phẩm",
            onClick: () => router.push("/admin/products"),
        },
        { type: "divider" },
        {
            key: "home",
            icon: <HomeOutlined />,
            label: "Về Trang Chủ",
            onClick: () => router.push("/"),
        },
    ];

    return (
        <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={250}>
            <div
                style={{
                    height: 64,
                    margin: 16,
                    color: "white",
                    fontSize: collapsed ? "12px" : "20px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                }}
            >
                {collapsed ? "DP" : "DPWOOD ADMIN"}
            </div>
            <Menu
                theme="dark"
                mode="inline"
                defaultSelectedKeys={["users"]}
                items={sidebarMenuItems}
            />
        </Sider>
    );
};

const AdminHeader = ({ collapsed, setCollapsed, adminName, onLogout, colorBgContainer }) => {
    const userDropdownMenu = [
        {
            key: "logout",
            danger: true,
            icon: <LogoutOutlined />,
            label: "Đăng xuất",
            onClick: onLogout,
        },
    ];

    return (
        <Header
            style={{
                padding: 0,
                background: colorBgContainer,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingRight: "24px",
            }}
        >
            <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: "16px", width: 64, height: 64 }}
            />

            <Dropdown menu={{ items: userDropdownMenu }} placement="bottomRight" arrow>
                <div
                    style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <Avatar style={{ backgroundColor: "#f56a00" }} icon={<UserOutlined />} />
                    <span style={{ fontWeight: 500 }}>{adminName}</span>
                </div>
            </Dropdown>
        </Header>
    );
};

const RoleManagementTab = ({ users, loading, onRefresh, onChangeRole }) => {
    const columns = [
        { title: "Tên", dataIndex: "name", key: "name" },
        { title: "Username", dataIndex: "username", key: "username" },
        { title: "Email", dataIndex: "email", key: "email" },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
            render: (phone) =>
                phone ? phone : <Typography.Text type="secondary">Chưa cập nhật</Typography.Text>,
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
            render: (_, record) => {
                const isBanned = record.lockUntil && new Date(record.lockUntil) > new Date();
                return isBanned ? (
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

const ActivityLogTab = ({ logs, loadingLogs, onFetchLogs }) => {
    const columns = [
        {
            title: "Thời gian",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleString("vi-VN"),
        },
        {
            title: "Người dùng",
            key: "user",
            render: (_, record) =>
                record.User ? `${record.User.name} (${record.User.email})` : "Không xác định",
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
            <div
                style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                }}
            >
                <Input.Search
                    placeholder="Nhập tên hoặc email cần tìm..."
                    allowClear
                    enterButton="Tìm"
                    size="large"
                    onSearch={(value) => onFetchLogs(value)}
                    style={{ width: 400 }}
                />
                <Button size="large" onClick={() => onFetchLogs("")} loading={loadingLogs}>
                    Tải lại toàn bộ log
                </Button>
            </div>
            <Table
                dataSource={logs}
                columns={columns}
                rowKey="id"
                loading={loadingLogs}
                scroll={{ x: 800 }}
            />
        </>
    );
};

// --- MAIN PAGE COMPONENT ---

export default function AdminUsersPage() {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // States cho dữ liệu
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // State cho User đăng nhập
    const [adminName, setAdminName] = useState("");

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
        // Lấy tên admin để hiển thị trên Header
        const name = typeof window !== "undefined" ? localStorage.getItem("userName") : "Admin";
        setAdminName(name);
    }, []);

    // --- CÁC HÀM XỬ LÝ HÀNH ĐỘNG ---
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

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) await api.post("/auth/logout", { refreshToken });
        } catch (error) {
            console.log("Lỗi đăng xuất backend");
        } finally {
            localStorage.clear(); // Xóa sạch local storage
            router.push("/login");
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
            label: "Trạng Thái & Kiểm Soát",
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
            label: "Nhật Ký Hoạt Động",
            children: (
                <ActivityLogTab logs={logs} loadingLogs={loadingLogs} onFetchLogs={fetchLogs} />
            ),
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <AdminSidebar collapsed={collapsed} />

            <Layout>
                <AdminHeader
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    adminName={adminName}
                    onLogout={handleLogout}
                    colorBgContainer={colorBgContainer}
                />

                <Content
                    style={{
                        margin: "24px 16px",
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <Title level={3} style={{ marginTop: 0, marginBottom: 20 }}>
                        Quản Lý Người Dùng
                    </Title>
                    <Tabs defaultActiveKey="1" items={tabItems} />
                </Content>
            </Layout>
        </Layout>
    );
}
