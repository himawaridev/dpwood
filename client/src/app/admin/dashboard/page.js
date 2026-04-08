"use client";
import React, { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Typography, Table, Tag, Spin, message, Empty } from "antd";
import {
    ShoppingCartOutlined,
    UserOutlined,
    DollarCircleOutlined,
    InboxOutlined,
    WarningOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import api from "@/utils/axios";
// Import thư viện vẽ biểu đồ
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const { Title, Text } = Typography;

export default function AdminDashboard() {
    const [data, setData] = useState({
        products: [],
        users: [],
        orders: [],
        loading: true,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
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
                });

                if (results.some((r) => r.status === "rejected")) {
                    console.warn("Một số dữ liệu không thể tải đầy đủ.");
                }
            } catch (error) {
                console.error("Lỗi hệ thống Dashboard:", error);
                message.error("Lỗi kết nối máy chủ");
                setData((prev) => ({ ...prev, loading: false }));
            }
        };

        fetchDashboardData();
    }, []);

    // --- LOGIC TÍNH TOÁN ---
    const successfulOrders = data.orders.filter((order) => {
        const s = order.status?.toLowerCase();
        return (
            s === "completed" || s === "hoàn thành" || s === "paid" || s === "thanh toán thành công"
        );
    });

    const totalRevenue = successfulOrders.reduce((sum, order) => {
        const amount = order.totalAmount || order.totalPrice || 0;
        return sum + Number(amount);
    }, 0);

    const lowStockCount = data.products.filter((p) => p.stock < 10).length;

    // --- LOGIC XỬ LÝ DỮ LIỆU BIỂU ĐỒ (7 NGÀY GẦN NHẤT) ---
    const getChartData = () => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString("vi-VN");
        }).reverse(); // Đảo ngược để ngày xa nhất xếp đầu tiên

        const revenueMap = {};
        last7Days.forEach((date) => (revenueMap[date] = 0));

        successfulOrders.forEach((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("vi-VN");
            if (revenueMap[dateStr] !== undefined) {
                const amount = order.totalAmount || order.totalPrice || 0;
                revenueMap[dateStr] += Number(amount);
            }
        });

        // Chuyển đổi thành mảng để Recharts đọc được
        return last7Days.map((date) => ({
            // Lấy 5 ký tự đầu (vd: 07/04/2026 -> 07/04) để trục X gọn gàng hơn
            date: date.substring(0, 5),
            revenue: revenueMap[date],
        }));
    };

    const chartData = getChartData();

    // --- CẤU HÌNH BẢNG ---
    const columns = [
        {
            title: "Mã đơn",
            dataIndex: "orderCode",
            key: "orderCode",
            render: (code, record) => <Text code>{code || record.id?.substring(0, 8)}</Text>,
        },
        {
            title: "Khách hàng",
            key: "customer",
            render: (_, record) => record.user?.name || "Khách hàng",
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            render: (val) => (
                <Text strong>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        val || 0,
                    )}
                </Text>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (status) => {
                let color = "blue";
                const s = status?.toLowerCase();
                if (s === "completed" || s === "hoàn thành" || s === "paid") color = "green";
                if (s === "pending" || s === "đang xử lý") color = "orange";
                if (s === "cancelled" || s === "đã hủy") color = "red";
                return <Tag color={color}>{status?.toUpperCase() || "N/A"}</Tag>;
            },
        },
        {
            title: "Ngày đặt",
            dataIndex: "createdAt",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
    ];

    if (data.loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px" }}>
                <Spin size="large" description="Đang tính toán dữ liệu biểu đồ..." />
            </div>
        );
    }

    return (
        <div style={{ padding: "10px" }}>
            <Title level={2} style={{ marginBottom: 24 }}>
                Báo Cáo Tài Chính & Hệ Thống
            </Title>

            {/* CÁC THẺ THỐNG KÊ NHANH */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        variant="borderless"
                        hoverable
                        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    >
                        <Statistic
                            title="Doanh thu thực tế"
                            value={totalRevenue}
                            styles={{ content: { color: "#3f8600", fontWeight: "bold" } }}
                            prefix={<CheckCircleOutlined />}
                            suffix="₫"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        variant="borderless"
                        hoverable
                        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    >
                        <Statistic
                            title="Tổng đơn hàng"
                            value={data.orders.length}
                            styles={{ content: { color: "#1890ff", fontWeight: "bold" } }}
                            prefix={<ShoppingCartOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        variant="borderless"
                        hoverable
                        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    >
                        <Statistic
                            title="Khách hàng"
                            value={data.users.length}
                            styles={{ content: { color: "#722ed1", fontWeight: "bold" } }}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        variant="borderless"
                        hoverable
                        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    >
                        <Statistic
                            title="Sản phẩm"
                            value={data.products.length}
                            styles={{ content: { color: "#fa8c16", fontWeight: "bold" } }}
                            prefix={<InboxOutlined />}
                        />
                        {lowStockCount > 0 && (
                            <Text type="danger" style={{ fontSize: "12px" }}>
                                <WarningOutlined /> {lowStockCount} mã sắp hết hàng
                            </Text>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* KHU VỰC BIỂU ĐỒ VÀ BẢNG */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                {/* Biểu đồ bên trái (chiếm 2/3 màn hình trên Desktop) */}
                <Col xs={24} lg={16}>
                    <Card
                        title="Biểu đồ doanh thu (7 ngày gần nhất)"
                        variant="outlined"
                        style={{ borderRadius: "12px", height: "100%" }}
                    >
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f0f0f0"
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "#8c8c8c", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={(val) =>
                                        new Intl.NumberFormat("vi-VN", {
                                            notation: "compact",
                                            compactDisplay: "short",
                                        }).format(val)
                                    }
                                    tick={{ fill: "#8c8c8c", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={60}
                                />
                                <Tooltip
                                    formatter={(val) => [
                                        new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(val),
                                        "Doanh thu",
                                    ]}
                                    labelStyle={{ color: "#000", fontWeight: "bold" }}
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#1890ff"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* Danh sách đơn hàng bên phải (chiếm 1/3) */}
                <Col xs={24} lg={8}>
                    <Card
                        title="Đơn hàng gần đây"
                        variant="outlined"
                        style={{ borderRadius: "12px", height: "100%" }}
                    >
                        <Table
                            dataSource={data.orders.slice(0, 5)} // Thu gọn lại hiển thị 5 đơn vì có biểu đồ
                            columns={[
                                columns[0], // Mã đơn
                                columns[2], // Tổng tiền
                                columns[3], // Trạng thái
                            ]}
                            pagination={false}
                            rowKey="id"
                            size="small"
                            locale={{ emptyText: <Empty description="Chưa có giao dịch" /> }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
