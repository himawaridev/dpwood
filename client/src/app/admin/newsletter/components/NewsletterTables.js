import { Alert, Card, Flex, Input, Progress, Select, Table, Tag, Typography } from "antd";
import {
    DeleteOutlined,
    MailOutlined,
    RedoOutlined,
    ReloadOutlined,
    SendOutlined,
    StopOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";
import { formatDateTime } from "@/utils/formatters";
import {
    CAMPAIGN_STATUS_META,
    NEWSLETTER_STATUS_META,
    USER_ROLE_META,
} from "../newsletterConfig";

const { Text } = Typography;

export function VerifiedUsersTable({
    users,
    loading,
    page,
    total,
    role,
    selectedIds,
    onPageChange,
    onRoleChange,
    onSearch,
    onSelectionChange,
    onOpenComposer,
}) {
    const columns = [
        {
            title: "Người dùng",
            key: "identity",
            render: (_, record) => (
                <div><Text strong>{record.name}</Text><br /><Text type="secondary" copyable>{record.email}</Text></div>
            ),
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            render: (value) => <Tag color={USER_ROLE_META[value]?.color}>{USER_ROLE_META[value]?.label || value}</Tag>,
        },
        {
            title: "Bản tin",
            dataIndex: "newsletterStatus",
            render: (value) => value
                ? <Tag color={NEWSLETTER_STATUS_META[value]?.color}>{NEWSLETTER_STATUS_META[value]?.label || value}</Tag>
                : <Tag>Chưa đăng ký</Tag>,
        },
        { title: "Ngày tham gia", dataIndex: "createdAt", render: formatDateTime },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <AdminIconButton
                    label={`Gửi email cho ${record.email}`}
                    icon={<SendOutlined />}
                    onClick={() => onOpenComposer({ target: "individual", recipient: record })}
                />
            ),
        },
    ];

    return (
        <Card>
            <Flex gap={12} wrap style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Tìm theo tên hoặc email"
                    allowClear
                    onSearch={(value) => onSearch(value.trim())}
                    style={{ width: 300 }}
                />
                <Select
                    value={role}
                    onChange={onRoleChange}
                    style={{ width: 180 }}
                    options={[
                        { value: "", label: "Tất cả vai trò" },
                        ...Object.entries(USER_ROLE_META).map(([value, meta]) => ({ value, label: meta.label })),
                    ]}
                />
                <AdminIconButton
                    label={`Gửi cho ${selectedIds.length} tài khoản đã chọn`}
                    icon={<TeamOutlined />}
                    disabled={!selectedIds.length}
                    onClick={() => onOpenComposer({ target: "selected" })}
                />
                <AdminIconButton
                    label="Gửi cho toàn bộ tài khoản đã xác minh"
                    icon={<MailOutlined />}
                    onClick={() => onOpenComposer({ target: "all" })}
                />
            </Flex>
            <Table
                rowKey="id"
                rowSelection={{
                    selectedRowKeys: selectedIds,
                    preserveSelectedRowKeys: true,
                    onChange: onSelectionChange,
                }}
                columns={columns}
                dataSource={users}
                loading={loading}
                scroll={{ x: "max-content" }}
                pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, onChange: onPageChange }}
            />
        </Card>
    );
}

export function SubscribersTable({
    subscribers,
    stats,
    loading,
    page,
    total,
    status,
    resendingId,
    deletingId,
    onPageChange,
    onStatusChange,
    onSearch,
    onOpenComposer,
    onResendVerification,
    onDelete,
}) {
    const columns = [
        { title: "Email", dataIndex: "email", render: (value) => <Text copyable>{value}</Text> },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (value) => (
                <Tag color={NEWSLETTER_STATUS_META[value]?.color}>{NEWSLETTER_STATUS_META[value]?.label || value}</Tag>
            ),
        },
        { title: "Xác nhận lúc", dataIndex: "verifiedAt", render: formatDateTime },
        {
            title: "Thư chào mừng",
            dataIndex: "welcomeSentAt",
            render: (value) => (value ? <Tag color="green">Đã gửi</Tag> : <Tag>Chưa gửi</Tag>),
        },
        { title: "Email gần nhất", dataIndex: "lastEmailSentAt", render: formatDateTime },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Flex gap="small">
                    {record.status === "pending" && (
                        <AdminIconButton
                            label={`Gửi lại email xác nhận cho ${record.email}`}
                            icon={<RedoOutlined />}
                            loading={resendingId === record.id}
                            disabled={deletingId === record.id}
                            onClick={() => onResendVerification(record)}
                        />
                    )}
                    {record.status === "subscribed" && (
                        <AdminIconButton
                            label={`Gửi email cho ${record.email}`}
                            icon={<SendOutlined />}
                            disabled={deletingId === record.id}
                            onClick={() => onOpenComposer({
                                audience: "subscribers",
                                target: "individual",
                                recipient: record,
                            })}
                        />
                    )}
                    <AdminIconButton
                        label={`Xóa ${record.email} khỏi danh sách bản tin`}
                        icon={<DeleteOutlined />}
                        danger
                        loading={deletingId === record.id}
                        disabled={resendingId === record.id}
                        onClick={() => onDelete(record)}
                    />
                </Flex>
            ),
        },
    ];

    return (
        <Card>
            <Flex gap={12} wrap style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Tìm theo email"
                    allowClear
                    onSearch={(value) => onSearch(value.trim())}
                    style={{ width: 300 }}
                />
                <Select
                    value={status}
                    onChange={onStatusChange}
                    style={{ width: 180 }}
                    options={[
                        { value: "", label: "Tất cả trạng thái" },
                        ...Object.entries(NEWSLETTER_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
                    ]}
                />
                <AdminIconButton
                    label="Gửi cho toàn bộ người đăng ký bản tin"
                    icon={<MailOutlined />}
                    disabled={!stats.subscribed}
                    onClick={() => onOpenComposer({ audience: "subscribers", target: "all" })}
                />
            </Flex>
            <Table
                rowKey="id"
                columns={columns}
                dataSource={subscribers}
                loading={loading}
                scroll={{ x: "max-content" }}
                pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, onChange: onPageChange }}
            />
        </Card>
    );
}

export function CampaignsTable({
    campaigns,
    loading,
    page,
    total,
    status,
    resendingId,
    deletingId,
    onPageChange,
    onStatusChange,
    onRefresh,
    onCancel,
    onResend,
    onDelete,
}) {
    const columns = [
        {
            title: "Chiến dịch",
            key: "campaign",
            render: (_, record) => (
                <div>
                    <Text strong>{record.subject}</Text><br />
                    <Text type="secondary">
                        {record.audience === "subscribers" ? "Người đăng ký bản tin" : "Tài khoản đã xác minh"}
                    </Text>
                </div>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 130,
            render: (value) => (
                <Tag color={CAMPAIGN_STATUS_META[value]?.color}>{CAMPAIGN_STATUS_META[value]?.label || value}</Tag>
            ),
        },
        {
            title: "Tiến độ",
            key: "progress",
            width: 250,
            render: (_, record) => {
                const totalRecipients = Number(record.totalRecipients || 0);
                const processed = Number(record.processedCount || 0);
                const percent = totalRecipients ? Math.min(Math.round((processed / totalRecipients) * 100), 100) : 0;
                return (
                    <div>
                        <Progress
                            percent={percent}
                            size="small"
                            status={record.status === "failed" ? "exception" : undefined}
                        />
                        <Text type="secondary">
                            {record.sentCount || 0} đã gửi, {record.failedCount || 0} lỗi / {totalRecipients} người nhận
                        </Text>
                        {record.lastError && (
                            <Text type="danger" title={record.lastError} className="dp-admin-email-last-error">
                                {record.lastError}
                            </Text>
                        )}
                    </div>
                );
            },
        },
        { title: "Tạo lúc", dataIndex: "createdAt", render: formatDateTime },
        {
            title: "Hành động",
            key: "action",
            width: 150,
            render: (_, record) => {
                const isActive = ["queued", "processing"].includes(record.status);
                return (
                    <Flex gap="small">
                        {isActive ? (
                            <AdminIconButton
                                label="Hủy chiến dịch"
                                icon={<StopOutlined />}
                                onClick={() => onCancel(record)}
                            />
                        ) : (
                            <>
                                <AdminIconButton
                                    label="Gửi lại chiến dịch"
                                    icon={<RedoOutlined />}
                                    loading={resendingId === record.id}
                                    disabled={deletingId === record.id}
                                    onClick={() => onResend(record)}
                                />
                                <AdminIconButton
                                    label="Xóa lịch sử chiến dịch"
                                    icon={<DeleteOutlined />}
                                    danger
                                    loading={deletingId === record.id}
                                    disabled={resendingId === record.id}
                                    onClick={() => onDelete(record)}
                                />
                            </>
                        )}
                    </Flex>
                );
            },
        },
    ];

    return (
        <Card>
            <Flex gap={12} wrap style={{ marginBottom: 16 }}>
                <Select
                    value={status}
                    onChange={onStatusChange}
                    style={{ width: 190 }}
                    options={[
                        { value: "", label: "Tất cả trạng thái" },
                        ...Object.entries(CAMPAIGN_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
                    ]}
                />
                <AdminIconButton label="Làm mới tiến độ" icon={<ReloadOutlined />} loading={loading} onClick={onRefresh} />
            </Flex>
            <Alert
                type="info"
                showIcon
                title="Chiến dịch được xử lý nền theo từng lô"
                description="Bạn có thể đóng trang hoặc tiếp tục công việc khác. Tiến độ được lưu trong database và tự tiếp tục khi server khởi động lại."
                style={{ marginBottom: 16 }}
            />
            <Table
                rowKey="id"
                columns={columns}
                dataSource={campaigns}
                loading={loading}
                scroll={{ x: 900 }}
                pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, onChange: onPageChange }}
            />
        </Card>
    );
}
