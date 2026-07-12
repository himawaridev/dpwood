import React, { useMemo, useState } from "react";
import { Table, Tag, Typography, Input, Button, Flex, Select, Space } from "antd";

const { Text } = Typography;

export default function TransactionLogTab({ logs, loadingLogs, onFetchLogs }) {
    const [searchText, setSearchText] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    const extractTransactionInfo = (details = "") => {
        let orderCode = "-";
        let method = "-";
        let amount = "-";
        let transId = "-";

        const codeMatch = details.match(/#(\d+)/);
        if (codeMatch) orderCode = codeMatch[1];

        const methodMatch = details.match(/Phương thức: ([A-Z]+)/) || details.match(/: ([A-Z]{2,})/);
        if (methodMatch) method = methodMatch[1];

        const amountMatch = details.match(/(?:Tổng: |đã nhận )([\d.,]+(?:đ|VND)?)/) || details.match(/([\d.,]+(?:đ|VND))/);
        if (amountMatch) amount = amountMatch[1];

        const transMatch = details.match(/Mã GD: ([A-Za-z0-9]+)/) || details.match(/GD: ([A-Za-z0-9]+)/);
        if (transMatch) transId = transMatch[1];

        return { orderCode, method, amount, transId };
    };

    const transactionLogs = useMemo(() => {
        const transactionActions = ["ORDER_CREATED", "PAYMENT_RECEIVED", "ORDER_CANCELED", "ADMIN_UPDATE_ORDER"];
        const keyword = searchText.trim().toLowerCase().replace(/^#/, "");

        return logs.filter((log) => {
            if (!transactionActions.includes(log.action)) return false;
            if (actionFilter !== "all" && log.action !== actionFilter) return false;
            if (!keyword) return true;

            const info = extractTransactionInfo(log.details);
            return [
                log.User?.email,
                log.User?.name,
                log.details,
                info.orderCode,
                info.transId,
            ].some((value) => String(value || "").toLowerCase().includes(keyword));
        });
    }, [actionFilter, logs, searchText]);

    const getCleanNote = (action) => {
        switch (action) {
            case "ORDER_CREATED":
                return "Khách hàng tạo đơn mới";
            case "PAYMENT_RECEIVED":
                return "Hệ thống xác nhận nhận tiền tự động";
            case "ADMIN_UPDATE_ORDER":
                return "Quản trị viên cập nhật trạng thái đơn";
            case "ORDER_CANCELED":
                return "Hủy đơn hàng và hoàn lại tồn kho";
            default:
                return "Cập nhật hệ thống";
        }
    };

    const getActionTag = (action) => {
        const normalizedAction = action?.toUpperCase();
        switch (normalizedAction) {
            case "ORDER_CREATED":
                return <Tag color="blue">Tạo đơn hàng</Tag>;
            case "PAYMENT_RECEIVED":
                return <Tag color="cyan">Thanh toán</Tag>;
            case "ORDER_CANCELED":
                return <Tag color="magenta">Hủy đơn</Tag>;
            case "ADMIN_UPDATE_ORDER":
                return <Tag color="purple">QTV cập nhật</Tag>;
            default:
                return <Tag color="default">{normalizedAction}</Tag>;
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
            render: (action) => getActionTag(action),
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
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap="wrap" gap={12}>
                <Space wrap>
                    <Input.Search
                        placeholder="Tìm email, mã đơn hàng hoặc mã giao dịch..."
                        allowClear
                        enterButton="Tìm kiếm"
                        size="large"
                        value={searchText}
                        onSearch={setSearchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        style={{ width: 440, maxWidth: "100%" }}
                    />
                    <Select
                        size="large"
                        value={actionFilter}
                        onChange={setActionFilter}
                        style={{ minWidth: 180 }}
                        options={[
                            { value: "all", label: "Tất cả hành động" },
                            { value: "ORDER_CREATED", label: "Tạo đơn hàng" },
                            { value: "PAYMENT_RECEIVED", label: "Thanh toán" },
                            { value: "ORDER_CANCELED", label: "Hủy đơn" },
                            { value: "ADMIN_UPDATE_ORDER", label: "QTV cập nhật" },
                        ]}
                    />
                </Space>
                <Button size="large" onClick={() => onFetchLogs("")} loading={loadingLogs}>
                    Làm mới log
                </Button>
            </Flex>
            <Table
                dataSource={transactionLogs}
                columns={columns}
                rowKey="id"
                loading={loadingLogs}
                scroll={{ x: "max-content" }}
            />
        </>
    );
}
