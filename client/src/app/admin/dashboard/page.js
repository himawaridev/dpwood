"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    App,
    Card,
    Col,
    Empty,
    Flex,
    Progress,
    Row,
    Segmented,
    Space,
    Spin,
    Statistic,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    AppstoreAddOutlined,
    BellOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    FileTextOutlined,
    EyeOutlined,
    InboxOutlined,
    ReloadOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import api from "@/utils/axios";
import AdminIconButton from "@/components/ui/AdminIconButton";
import { getProductSalesStats } from "@/utils/productStats";
import { formatCurrency } from "@/utils/formatters";
import {
    buildDashboardData,
    compactNumber,
    getOrderAmount,
    normalizeStatus,
    PERIOD_OPTIONS,
    STATUS_META,
} from "./dashboardUtils";

const { Title, Text, Paragraph } = Typography;

export default function AdminDashboard() {
    const { message } = App.useApp();
    const router = useRouter();
    const [period, setPeriod] = useState(30);
    const [data, setData] = useState({
        products: [],
        users: [],
        orders: [],
        loading: true,
        refreshing: false,
    });

    const fetchDashboardData = useCallback(async (silent = false) => {
        try {
            await Promise.resolve();
            setData((prev) => ({ ...prev, loading: !silent && prev.orders.length === 0, refreshing: silent }));
            const results = await Promise.allSettled([
                api.get("/products"),
                api.get("/users"),
                api.get("/orders/admin"),
            ]);

            setData({
                products: results[0].status === "fulfilled" ? results[0].value.data : [],
                users: results[1].status === "fulfilled" ? results[1].value.data : [],
                orders: results[2].status === "fulfilled" ? results[2].value.data : [],
                loading: false,
                refreshing: false,
            });

            if (results.some((result) => result.status === "rejected")) {
                message.warning("Một số dữ liệu quản trị chưa tải được đầy đủ.");
            }
        } catch (error) {
            console.error("Dashboard error:", error);
            message.error("Không thể tải dữ liệu tổng quan.");
            setData((prev) => ({ ...prev, loading: false, refreshing: false }));
        }
    }, [message]);

    useEffect(() => {
        const timer = window.setTimeout(() => fetchDashboardData(), 0);
        return () => window.clearTimeout(timer);
    }, [fetchDashboardData]);

    const dashboard = useMemo(() => buildDashboardData(data, period), [data, period]);

    const recentOrderColumns = [
        {
            title: "Mã đơn",
            dataIndex: "orderCode",
            key: "orderCode",
            render: (code, record) => <Text code>{code || record.id?.substring(0, 8)}</Text>,
        },
        {
            title: "Khách hàng",
            key: "customer",
            render: (_, record) => record.user?.name || record.User?.name || "Khách hàng",
        },
        {
            title: "Tổng tiền",
            key: "totalAmount",
            render: (_, record) => <Text strong>{formatCurrency(getOrderAmount(record))}</Text>,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                const normalizedStatus = normalizeStatus(status);
                const meta = STATUS_META[normalizedStatus] || { label: normalizedStatus || "N/A", color: "default" };
                return <Tag color={meta.color}>{meta.label}</Tag>;
            },
        },
        {
            title: "Ngày đặt",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
    ];

    const topProductColumns = [
        {
            title: "Sản phẩm",
            dataIndex: "name",
            key: "name",
            render: (name) => <Text strong>{name}</Text>,
        },
        {
            title: "Đã bán",
            dataIndex: "sold",
            key: "sold",
            align: "center",
            render: (sold) => Number(sold || 0),
        },
        {
            title: "Tồn kho",
            dataIndex: "stock",
            key: "stock",
            align: "center",
            render: (stock) => <Tag color={Number(stock || 0) <= 10 ? "red" : "green"}>{Number(stock || 0)}</Tag>,
        },
        {
            title: "Hot",
            key: "hot",
            align: "center",
            render: (_, record) => {
                const stats = getProductSalesStats(record);
                return stats.isHot ? <Tag color="magenta">{stats.soldPercent}%</Tag> : <Tag>Chưa</Tag>;
            },
        },
    ];

    const lowStockColumns = [
        {
            title: "Sản phẩm",
            dataIndex: "name",
            key: "name",
            render: (name) => <Text strong>{name}</Text>,
        },
        {
            title: "Tồn kho",
            dataIndex: "stock",
            key: "stock",
            align: "center",
            render: (stock) => <Tag color={Number(stock || 0) <= 3 ? "red" : "gold"}>{Number(stock || 0)}</Tag>,
        },
        {
            title: "Đã bán",
            dataIndex: "sold",
            key: "sold",
            align: "center",
            render: (sold) => Number(sold || 0),
        },
    ];

    if (data.loading) {
        return (
            <div className="dp-admin-loading">
                <Spin size="large" />
                <Text type="secondary">Đang tổng hợp dữ liệu quản trị...</Text>
            </div>
        );
    }

    return (
        <div className="dp-admin-dashboard">
            <Flex className="dp-admin-dashboard-head" justify="space-between" align="flex-start" gap={16} wrap="wrap">
                <div>
                    <Text className="dp-admin-eyebrow">Tổng quan vận hành</Text>
                    <Title level={2}>Bảng điều khiển quản trị DPWOOD</Title>
                    <Paragraph type="secondary">
                        Theo dõi doanh thu, đơn hàng, tồn kho và hoạt động khách hàng từ một màn hình.
                    </Paragraph>
                </div>

                <Space wrap>
                    <Segmented options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
                    <AdminIconButton
                        label="Làm mới dữ liệu tổng quan"
                        icon={<ReloadOutlined />}
                        onClick={() => fetchDashboardData(true)}
                        loading={data.refreshing}
                    />
                </Space>
            </Flex>

            {dashboard.lowStockProducts.length > 0 && (
                <Alert
                    className="dp-admin-dashboard-alert"
                    type="warning"
                    showIcon
                    title={`${dashboard.lowStockProducts.length} sản phẩm sắp hết hàng`}
                    description="Ưu tiên kiểm tra tồn kho để tránh khách đặt sản phẩm không đủ số lượng."
                    action={
                        <AdminIconButton
                            label="Xem sản phẩm tồn kho thấp"
                            icon={<EyeOutlined />}
                            onClick={() => router.push("/admin/products")}
                        />
                    }
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="dp-admin-kpi-card">
                        <Statistic
                            title="Doanh thu"
                            value={dashboard.revenue}
                            formatter={(value) => formatCurrency(value)}
                            prefix={<DollarOutlined />}
                        />
                        <Text type="secondary">{dashboard.paidOrders.length} đơn đã ghi nhận thanh toán</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="dp-admin-kpi-card">
                        <Statistic
                            title="Đơn hàng"
                            value={dashboard.ordersInPeriod.length}
                            prefix={<ShoppingCartOutlined />}
                        />
                        <Text type="secondary">{dashboard.pendingOrders.length} đơn đang chờ xử lý</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="dp-admin-kpi-card">
                        <Statistic title="Khách hàng" value={dashboard.activeUsers.length} prefix={<TeamOutlined />} />
                        <Text type="secondary">{data.users.length - dashboard.activeUsers.length} tài khoản đã khóa/xóa</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="dp-admin-kpi-card">
                        <Statistic title="Sản phẩm" value={data.products.length} prefix={<InboxOutlined />} />
                        <Text type="secondary">{dashboard.hotProducts.length} mặt hàng bán chạy</Text>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="dp-admin-dashboard-row">
                <Col xs={24} xl={16}>
                    <Card
                        title="Doanh thu và số đơn"
                        extra={<Text type="secondary">Giá trị theo ngày</Text>}
                        className="dp-admin-chart-card"
                    >
                        <ResponsiveContainer width="100%" height={330}>
                            <LineChart data={dashboard.chartData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ededed" />
                                <XAxis dataKey="date" tick={{ fill: "#777", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={compactNumber}
                                    tick={{ fill: "#777", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={72}
                                />
                                <YAxis yAxisId="right" orientation="right" allowDecimals={false} axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(value, name) =>
                                        name === "revenue" ? [formatCurrency(value), "Doanh thu"] : [value, "Số đơn"]
                                    }
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#f09b90"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="#111"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                <Col xs={24} xl={8}>
                    <Card title="Hiệu suất xử lý" className="dp-admin-chart-card">
                        <Flex vertical gap={18}>
                            <div className="dp-admin-processing-rate">
                                <Progress
                                    type="dashboard"
                                    percent={dashboard.processingRate}
                                    strokeColor="#f09b90"
                                    trailColor="#f1f1f1"
                                />
                                <div>
                                    <Text strong>Tỷ lệ đơn đã xử lý</Text>
                                    <Paragraph type="secondary">
                                        Còn {dashboard.remainingWorkCount} đơn chưa đi tới trạng thái cuối.
                                    </Paragraph>
                                </div>
                            </div>

                            {dashboard.statusData.length ? (
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={dashboard.statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72}>
                                            {dashboard.statusData.map((entry) => (
                                                <Cell key={entry.status} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Empty description="Chưa có đơn hàng" />
                            )}

                            <div className="dp-admin-status-list">
                                {dashboard.statusData.map((item) => (
                                    <div key={item.status}>
                                        <span style={{ background: item.color }} />
                                        <Text>{item.name}</Text>
                                        <Text strong>{item.value}</Text>
                                    </div>
                                ))}
                            </div>
                        </Flex>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="dp-admin-dashboard-row">
                <Col xs={24} lg={8}>
                    <Card title="Lối tắt quản trị" className="dp-admin-quick-card">
                        <div className="dp-admin-quick-actions">
                            <AdminIconButton
                                label="Quản lý sản phẩm"
                                icon={<AppstoreAddOutlined />}
                                onClick={() => router.push("/admin/products")}
                            />
                            <AdminIconButton
                                label="Xử lý đơn hàng"
                                icon={<FileTextOutlined />}
                                onClick={() => router.push("/admin/orders")}
                            />
                            <AdminIconButton
                                label="Gửi thông báo"
                                icon={<BellOutlined />}
                                onClick={() => router.push("/admin/notifications")}
                            />
                            <AdminIconButton
                                label="Quản lý người dùng"
                                icon={<TeamOutlined />}
                                onClick={() => router.push("/admin/users")}
                            />
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Sản phẩm bán chạy" className="dp-admin-chart-card">
                        {dashboard.topProducts.length ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={dashboard.topProducts.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={86} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="sold" fill="#f09b90" radius={[0, 0, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Empty description="Chưa có dữ liệu bán hàng" />
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Chỉ số nhanh" className="dp-admin-quick-card">
                        <div className="dp-admin-insight-list">
                            <div>
                                <CheckCircleOutlined />
                                <span>
                                    <Text strong>{formatCurrency(dashboard.averageOrderValue)}</Text>
                                    <Text type="secondary">Giá trị trung bình mỗi đơn đã thanh toán</Text>
                                </span>
                            </div>
                            <div>
                                <ClockCircleOutlined />
                                <span>
                                    <Text strong>{dashboard.pendingOrders.length}</Text>
                                    <Text type="secondary">Đơn đang cần xử lý</Text>
                                </span>
                            </div>
                            <div>
                                <WarningOutlined />
                                <span>
                                    <Text strong>{dashboard.lowStockProducts.length}</Text>
                                    <Text type="secondary">Sản phẩm tồn kho thấp</Text>
                                </span>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="dp-admin-dashboard-row">
                <Col xs={24}>
                    <Card
                        title="Đơn hàng gần đây"
                        extra={
                            <AdminIconButton
                                label="Xem tất cả đơn hàng"
                                icon={<EyeOutlined />}
                                onClick={() => router.push("/admin/orders")}
                            />
                        }
                    >
                        <Table
                            dataSource={data.orders.slice(0, 8)}
                            columns={recentOrderColumns}
                            pagination={false}
                            rowKey="id"
                            size="small"
                            scroll={{ x: "max-content" }}
                            locale={{ emptyText: <Empty description="Chưa có đơn hàng" /> }}
                        />
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card
                        title="Cảnh báo tồn kho"
                        extra={
                            <AdminIconButton
                                label="Quản lý sản phẩm tồn kho"
                                icon={<AppstoreAddOutlined />}
                                onClick={() => router.push("/admin/products")}
                            />
                        }
                    >
                        <Table
                            dataSource={dashboard.lowStockProducts.slice(0, 8)}
                            columns={lowStockColumns}
                            pagination={false}
                            rowKey="id"
                            size="small"
                            scroll={{ x: "max-content" }}
                            locale={{ emptyText: <Empty description="Tồn kho đang ổn định" /> }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Bảng xếp hạng sản phẩm" className="dp-admin-dashboard-row">
                <Table
                    dataSource={dashboard.topProducts}
                    columns={topProductColumns}
                    rowKey="id"
                    pagination={{ pageSize: 6 }}
                    scroll={{ x: "max-content" }}
                    locale={{ emptyText: <Empty description="Chưa có sản phẩm" /> }}
                />
            </Card>
        </div>
    );
}
