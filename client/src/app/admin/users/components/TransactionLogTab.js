import React from "react";
import { Table, Tag, Typography, Input, Button, Flex } from "antd";

const { Text } = Typography;

export default function TransactionLogTab({ logs, loadingLogs, onFetchLogs }) {
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
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
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
            </Flex>
            <Table
                dataSource={transactionLogs}
                columns={columns}
                rowKey="id"
                loading={loadingLogs}
                scroll={{ x: 1000 }}
            />
        </>
    );
}
