"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    App,
    Card,
    Col,
    Flex,
    Form,
    Input,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Typography,
} from "antd";
import {
    DeleteOutlined,
    EyeOutlined,
    MailOutlined,
    RedoOutlined,
    ReloadOutlined,
    RobotOutlined,
    SendOutlined,
    StopOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import AdminIconButton from "@/components/ui/AdminIconButton";
import EmailPreviewModal from "@/components/admin/EmailPreviewModal";
import { formatDateTime } from "@/utils/formatters";

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusMeta = {
    pending: { label: "Chờ xác nhận", color: "gold" },
    subscribed: { label: "Đã đăng ký", color: "green" },
    unsubscribed: { label: "Đã hủy", color: "default" },
};

const roleMeta = {
    root: { label: "Root", color: "red" },
    admin: { label: "Quản trị", color: "volcano" },
    staff: { label: "Nhân viên", color: "blue" },
    user: { label: "Khách hàng", color: "default" },
};

const campaignStatusMeta = {
    queued: { label: "Đang chờ", color: "gold" },
    processing: { label: "Đang gửi", color: "blue" },
    completed: { label: "Hoàn tất", color: "green" },
    failed: { label: "Thất bại", color: "red" },
    cancelled: { label: "Đã hủy", color: "default" },
};

export default function AdminNewsletterPage() {
    const { message, modal } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState("users");
    const [users, setUsers] = useState([]);
    const [userStats, setUserStats] = useState({ verifiedUsers: 0, subscribedNewsletter: 0 });
    const [userTotal, setUserTotal] = useState(0);
    const [userPage, setUserPage] = useState(1);
    const [userSearch, setUserSearch] = useState("");
    const [userRole, setUserRole] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [subscriberStats, setSubscriberStats] = useState({ pending: 0, subscribed: 0, unsubscribed: 0 });
    const [subscriberTotal, setSubscriberTotal] = useState(0);
    const [subscriberPage, setSubscriberPage] = useState(1);
    const [subscriberSearch, setSubscriberSearch] = useState("");
    const [subscriberStatus, setSubscriberStatus] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingSubscribers, setLoadingSubscribers] = useState(false);
    const [resendingVerificationId, setResendingVerificationId] = useState(null);
    const [deletingSubscriberId, setDeletingSubscriberId] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [campaignTotal, setCampaignTotal] = useState(0);
    const [campaignPage, setCampaignPage] = useState(1);
    const [campaignStatus, setCampaignStatus] = useState("");
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [resendingCampaignId, setResendingCampaignId] = useState(null);
    const [deletingCampaignId, setDeletingCampaignId] = useState(null);
    const [sending, setSending] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [providerStatus, setProviderStatus] = useState(null);
    const [composerOpen, setComposerOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [campaign, setCampaign] = useState({ audience: "verified_users", target: "all", recipient: null });

    const fetchUsers = useCallback(async () => {
        try {
            setLoadingUsers(true);
            const response = await api.get("/newsletter/admin/recipients", {
                params: {
                    page: userPage,
                    limit: 20,
                    search: userSearch || undefined,
                    role: userRole || undefined,
                },
                authRequired: true,
            });
            setUsers(response.data?.users || []);
            setUserStats(response.data?.stats || {});
            setUserTotal(Number(response.data?.total || 0));
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải danh sách tài khoản đã xác minh");
        } finally {
            setLoadingUsers(false);
        }
    }, [message, userPage, userRole, userSearch]);

    const fetchSubscribers = useCallback(async () => {
        try {
            setLoadingSubscribers(true);
            const response = await api.get("/newsletter/admin/subscribers", {
                params: {
                    page: subscriberPage,
                    limit: 20,
                    search: subscriberSearch || undefined,
                    status: subscriberStatus || undefined,
                },
                authRequired: true,
            });
            setSubscribers(response.data?.subscribers || []);
            setSubscriberStats(response.data?.stats || {});
            setSubscriberTotal(Number(response.data?.total || 0));
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải danh sách nhận bản tin");
        } finally {
            setLoadingSubscribers(false);
        }
    }, [message, subscriberPage, subscriberSearch, subscriberStatus]);

    const fetchCampaigns = useCallback(async ({ quiet = false } = {}) => {
        try {
            if (!quiet) setLoadingCampaigns(true);
            const response = await api.get("/newsletter/admin/campaigns", {
                params: {
                    page: campaignPage,
                    limit: 20,
                    status: campaignStatus || undefined,
                },
                authRequired: true,
            });
            setCampaigns(response.data?.campaigns || []);
            setCampaignTotal(Number(response.data?.total || 0));
        } catch (error) {
            if (!quiet) message.error(error.response?.data?.message || "Không thể tải lịch sử chiến dịch");
        } finally {
            if (!quiet) setLoadingCampaigns(false);
        }
    }, [campaignPage, campaignStatus, message]);

    const fetchProviderStatus = useCallback(async () => {
        try {
            const response = await api.get("/newsletter/admin/email-status", { authRequired: true });
            setProviderStatus(response.data || null);
        } catch (error) {
            setProviderStatus({
                ready: false,
                readyForBulk: false,
                message: error.response?.data?.message || "Không thể kiểm tra dịch vụ email",
            });
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(fetchUsers, 250);
        return () => window.clearTimeout(timer);
    }, [fetchUsers]);

    useEffect(() => {
        const timer = window.setTimeout(fetchSubscribers, 250);
        return () => window.clearTimeout(timer);
    }, [fetchSubscribers]);

    useEffect(() => {
        void fetchProviderStatus();
    }, [fetchProviderStatus]);

    useEffect(() => {
        if (activeTab !== "campaigns") return undefined;
        void fetchCampaigns();
        const timer = window.setInterval(() => void fetchCampaigns({ quiet: true }), 5000);
        return () => window.clearInterval(timer);
    }, [activeTab, fetchCampaigns]);

    useEffect(() => {
        const rawDraft = sessionStorage.getItem("dpwood-newsletter-ai-draft");
        if (!rawDraft) return;
        try {
            const stored = JSON.parse(rawDraft);
            const draft = stored?.draft || stored;
            const delivery = stored?.delivery || { audience: "verified_users", target: "all", userIds: [] };
            form.setFieldsValue(draft);
            setSelectedUserIds(Array.isArray(delivery.userIds) ? delivery.userIds : []);
            setCampaign({
                audience: delivery.audience === "subscribers" ? "subscribers" : "verified_users",
                target: ["all", "selected"].includes(delivery.target) ? delivery.target : "all",
                recipient: null,
            });
            setComposerOpen(true);
        } catch {
            // Ignore malformed drafts and clear them below.
        } finally {
            sessionStorage.removeItem("dpwood-newsletter-ai-draft");
        }
    }, [form]);

    const openComposer = ({ audience = "verified_users", target = "all", recipient = null } = {}) => {
        setCampaign({ audience, target, recipient });
        form.resetFields();
        setComposerOpen(true);
    };

    const expectedRecipients = useMemo(() => {
        if (campaign.target === "individual") return 1;
        if (campaign.target === "selected") return selectedUserIds.length;
        if (campaign.audience === "subscribers") return subscriberStats.subscribed || 0;
        return userStats.verifiedUsers || 0;
    }, [campaign, selectedUserIds.length, subscriberStats.subscribed, userStats.verifiedUsers]);

    const executeSend = async (values) => {
        try {
            setSending(true);
            const response = await api.post(
                "/newsletter/admin/send",
                {
                    ...values,
                    audience: campaign.audience,
                    target: campaign.target,
                    userId: campaign.audience === "verified_users" ? campaign.recipient?.id : undefined,
                    userIds: campaign.target === "selected" ? selectedUserIds : undefined,
                    subscriberId: campaign.audience === "subscribers" ? campaign.recipient?.id : undefined,
                },
                { authRequired: true },
            );
            message.success(response.data?.message || "Đã tạo chiến dịch email");
            setComposerOpen(false);
            form.resetFields();
            fetchUsers();
            fetchSubscribers();
            setCampaignPage(1);
            setActiveTab("campaigns");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể gửi email");
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = (values) => {
        if (campaign.target === "individual") {
            executeSend(values);
            return;
        }
        modal.confirm({
            title: campaign.target === "selected" ? "Gửi email cho nhóm đã chọn?" : "Gửi email cho toàn bộ người nhận?",
            content: `Hệ thống sẽ gửi tới tối đa ${expectedRecipients} địa chỉ hợp lệ. Hãy kiểm tra kỹ nội dung trước khi tiếp tục.`,
            okText: "Xác nhận gửi",
            cancelText: "Kiểm tra lại",
            onOk: () => executeSend(values),
        });
    };

    const openEmailPreview = async () => {
        try {
            await form.validateFields(["subject", "contentHtml"]);
            setPreviewOpen(true);
        } catch {
            message.warning("Hãy nhập tiêu đề và nội dung trước khi xem bản gửi");
        }
    };

    const sendPendingWelcome = () => {
        modal.confirm({
            title: "Gửi thư chào mừng còn thiếu?",
            content: "Chỉ người đã xác nhận bản tin và chưa từng nhận thư chào mừng mới được gửi.",
            okText: "Tiếp tục",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    setSending(true);
                    const response = await api.post(
                        "/newsletter/admin/send-welcome",
                        undefined,
                        { authRequired: true },
                    );
                    message.success(response.data?.message || "Đã hoàn tất gửi thư chào mừng");
                    fetchSubscribers();
                } catch (error) {
                    message.error(error.response?.data?.message || "Không thể gửi thư chào mừng");
                    throw error;
                } finally {
                    setSending(false);
                }
            },
        });
    };

    const sendTestEmail = () => {
        modal.confirm({
            title: "Gửi email kiểm tra?",
            content: "Hệ thống sẽ gửi một email thử tới địa chỉ email của tài khoản quản trị đang đăng nhập.",
            okText: "Gửi email thử",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    setTestingEmail(true);
                    const response = await api.post(
                        "/newsletter/admin/test-email",
                        undefined,
                        { authRequired: true },
                    );
                    message.success(response.data?.message || "Đã gửi email thử");
                    await fetchProviderStatus();
                } catch (error) {
                    message.error(error.response?.data?.message || "Không thể gửi email thử");
                    throw error;
                } finally {
                    setTestingEmail(false);
                }
            },
        });
    };

    const cancelCampaign = (record) => {
        modal.confirm({
            title: "Hủy chiến dịch email?",
            content: `Chiến dịch “${record.subject}” sẽ dừng sau lô đang xử lý. Email đã gửi sẽ không thể thu hồi.`,
            okText: "Hủy chiến dịch",
            cancelText: "Giữ chiến dịch",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await api.post(
                        `/newsletter/admin/campaigns/${record.id}/cancel`,
                        undefined,
                        { authRequired: true },
                    );
                    message.success("Đã hủy chiến dịch email");
                    await fetchCampaigns();
                } catch (error) {
                    message.error(error.response?.data?.message || "Không thể hủy chiến dịch");
                    throw error;
                }
            },
        });
    };

    const resendCampaign = (record) => {
        modal.confirm({
            title: "Gửi lại chiến dịch email?",
            content: `Hệ thống sẽ tạo một chiến dịch mới từ “${record.subject}” và kiểm tra lại những người nhận hiện còn hợp lệ.`,
            okText: "Gửi lại",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    setResendingCampaignId(record.id);
                    const response = await api.post(
                        `/newsletter/admin/campaigns/${record.id}/resend`,
                        undefined,
                        { authRequired: true },
                    );
                    message.success(response.data?.message || "Đã tạo chiến dịch gửi lại");
                    if (campaignPage === 1) await fetchCampaigns();
                    else setCampaignPage(1);
                } catch (error) {
                    message.error(error.response?.data?.message || "Không thể gửi lại chiến dịch");
                    throw error;
                } finally {
                    setResendingCampaignId(null);
                }
            },
        });
    };

    const deleteCampaign = (record) => {
        modal.confirm({
            title: "Xóa lịch sử chiến dịch?",
            content: `Chiến dịch “${record.subject}” sẽ bị xóa khỏi lịch sử. Email đã gửi và hộp thư người nhận không bị ảnh hưởng.`,
            okText: "Xóa",
            cancelText: "Giữ lại",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    setDeletingCampaignId(record.id);
                    await api.delete(`/newsletter/admin/campaigns/${record.id}`, { authRequired: true });
                    message.success("Đã xóa lịch sử chiến dịch email");
                    if (campaigns.length === 1 && campaignPage > 1) setCampaignPage((page) => page - 1);
                    else await fetchCampaigns();
                } catch (error) {
                    message.error(error.response?.data?.message || "Không thể xóa lịch sử chiến dịch");
                    throw error;
                } finally {
                    setDeletingCampaignId(null);
                }
            },
        });
    };

    const resendSubscriberVerification = (record) => {
        modal.confirm({
            title: "Gửi lại email xác nhận?",
            content: `DPWOOD sẽ gửi một liên kết xác nhận mới tới ${record.email}. Liên kết cũ sẽ hết hiệu lực.`,
            okText: "Gửi lại",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    setResendingVerificationId(record.id);
                    const response = await api.post(
                        `/newsletter/admin/subscribers/${record.id}/resend-verification`,
                        undefined,
                        { authRequired: true },
                    );
                    message.success(response.data?.message || "Đã gửi lại email xác nhận");
                    await fetchSubscribers();
                } catch (error) {
                    message.error(error.response?.data?.message || "Không thể gửi lại email xác nhận");
                    throw error;
                } finally {
                    setResendingVerificationId(null);
                }
            },
        });
    };

    const deleteSubscriber = (record) => {
        modal.confirm({
            title: "Xóa đăng ký bản tin?",
            content: `${record.email} sẽ bị xóa khỏi danh sách bản tin và có thể tự đăng ký lại sau này.`,
            okText: "Xóa",
            cancelText: "Giữ lại",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    setDeletingSubscriberId(record.id);
                    await api.delete(`/newsletter/admin/subscribers/${record.id}`, { authRequired: true });
                    message.success("Đã xóa đăng ký bản tin");
                    if (subscribers.length === 1 && subscriberPage > 1) {
                        setSubscriberPage((page) => page - 1);
                    } else {
                        await fetchSubscribers();
                    }
                } catch (error) {
                    message.error(error.response?.data?.message || "Không thể xóa đăng ký bản tin");
                    throw error;
                } finally {
                    setDeletingSubscriberId(null);
                }
            },
        });
    };

    const userColumns = [
        {
            title: "Người dùng",
            key: "identity",
            render: (_, record) => (
                <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Text type="secondary" copyable>{record.email}</Text>
                </div>
            ),
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            render: (value) => <Tag color={roleMeta[value]?.color}>{roleMeta[value]?.label || value}</Tag>,
        },
        {
            title: "Bản tin",
            dataIndex: "newsletterStatus",
            render: (value) => value
                ? <Tag color={statusMeta[value]?.color}>{statusMeta[value]?.label || value}</Tag>
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
                    onClick={() => openComposer({ target: "individual", recipient: record })}
                />
            ),
        },
    ];

    const subscriberColumns = [
        { title: "Email", dataIndex: "email", render: (value) => <Text copyable>{value}</Text> },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (value) => <Tag color={statusMeta[value]?.color}>{statusMeta[value]?.label || value}</Tag>,
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
                            loading={resendingVerificationId === record.id}
                            disabled={deletingSubscriberId === record.id}
                            onClick={() => resendSubscriberVerification(record)}
                        />
                    )}
                    {record.status === "subscribed" && (
                        <AdminIconButton
                            label={`Gửi email cho ${record.email}`}
                            icon={<SendOutlined />}
                            disabled={deletingSubscriberId === record.id}
                            onClick={() => openComposer({ audience: "subscribers", target: "individual", recipient: record })}
                        />
                    )}
                    <AdminIconButton
                        label={`Xóa ${record.email} khỏi danh sách bản tin`}
                        icon={<DeleteOutlined />}
                        danger
                        loading={deletingSubscriberId === record.id}
                        disabled={resendingVerificationId === record.id}
                        onClick={() => deleteSubscriber(record)}
                    />
                </Flex>
            ),
        },
    ];

    const campaignColumns = [
        {
            title: "Chiến dịch",
            key: "campaign",
            render: (_, record) => (
                <div>
                    <Text strong>{record.subject}</Text>
                    <br />
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
                <Tag color={campaignStatusMeta[value]?.color}>{campaignStatusMeta[value]?.label || value}</Tag>
            ),
        },
        {
            title: "Tiến độ",
            key: "progress",
            width: 250,
            render: (_, record) => {
                const total = Number(record.totalRecipients || 0);
                const processed = Number(record.processedCount || 0);
                const percent = total ? Math.min(Math.round((processed / total) * 100), 100) : 0;
                return (
                    <div>
                        <Progress
                            percent={percent}
                            size="small"
                            status={record.status === "failed" ? "exception" : undefined}
                        />
                        <Text type="secondary">
                            {record.sentCount || 0} đã gửi, {record.failedCount || 0} lỗi / {total} người nhận
                        </Text>
                        {record.lastError && (
                            <Text
                                type="danger"
                                title={record.lastError}
                                style={{
                                    display: "block",
                                    maxWidth: 330,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
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
                                onClick={() => cancelCampaign(record)}
                            />
                        ) : (
                            <>
                                <AdminIconButton
                                    label="Gửi lại chiến dịch"
                                    icon={<RedoOutlined />}
                                    loading={resendingCampaignId === record.id}
                                    disabled={deletingCampaignId === record.id}
                                    onClick={() => resendCampaign(record)}
                                />
                                <AdminIconButton
                                    label="Xóa lịch sử chiến dịch"
                                    icon={<DeleteOutlined />}
                                    danger
                                    loading={deletingCampaignId === record.id}
                                    disabled={resendingCampaignId === record.id}
                                    onClick={() => deleteCampaign(record)}
                                />
                            </>
                        )}
                    </Flex>
                );
            },
        },
    ];

    const userTable = (
        <Card>
            <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Tìm theo tên hoặc email"
                    allowClear
                    onSearch={(value) => { setUserPage(1); setUserSearch(value.trim()); }}
                    style={{ width: 300 }}
                />
                <Select
                    value={userRole}
                    onChange={(value) => { setUserPage(1); setUserRole(value); }}
                    style={{ width: 180 }}
                    options={[
                        { value: "", label: "Tất cả vai trò" },
                        ...Object.entries(roleMeta).map(([value, meta]) => ({ value, label: meta.label })),
                    ]}
                />
                <AdminIconButton
                    label={`Gửi cho ${selectedUserIds.length} tài khoản đã chọn`}
                    icon={<TeamOutlined />}
                    disabled={!selectedUserIds.length}
                    onClick={() => openComposer({ target: "selected" })}
                />
                <AdminIconButton
                    label="Gửi cho toàn bộ tài khoản đã xác minh"
                    icon={<MailOutlined />}
                    onClick={() => openComposer({ target: "all" })}
                />
            </Flex>
            <Table
                rowKey="id"
                rowSelection={{
                    selectedRowKeys: selectedUserIds,
                    preserveSelectedRowKeys: true,
                    onChange: setSelectedUserIds,
                }}
                columns={userColumns}
                dataSource={users}
                loading={loadingUsers}
                scroll={{ x: "max-content" }}
                pagination={{ current: userPage, pageSize: 20, total: userTotal, showSizeChanger: false, onChange: setUserPage }}
            />
        </Card>
    );

    const subscriberTable = (
        <Card>
            <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Tìm theo email"
                    allowClear
                    onSearch={(value) => { setSubscriberPage(1); setSubscriberSearch(value.trim()); }}
                    style={{ width: 300 }}
                />
                <Select
                    value={subscriberStatus}
                    onChange={(value) => { setSubscriberPage(1); setSubscriberStatus(value); }}
                    style={{ width: 180 }}
                    options={[
                        { value: "", label: "Tất cả trạng thái" },
                        ...Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label })),
                    ]}
                />
                <AdminIconButton
                    label="Gửi cho toàn bộ người đăng ký bản tin"
                    icon={<MailOutlined />}
                    disabled={!subscriberStats.subscribed}
                    onClick={() => openComposer({ audience: "subscribers", target: "all" })}
                />
            </Flex>
            <Table
                rowKey="id"
                columns={subscriberColumns}
                dataSource={subscribers}
                loading={loadingSubscribers}
                scroll={{ x: "max-content" }}
                pagination={{
                    current: subscriberPage,
                    pageSize: 20,
                    total: subscriberTotal,
                    showSizeChanger: false,
                    onChange: setSubscriberPage,
                }}
            />
        </Card>
    );

    const campaignTable = (
        <Card>
            <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
                <Select
                    value={campaignStatus}
                    onChange={(value) => { setCampaignPage(1); setCampaignStatus(value); }}
                    style={{ width: 190 }}
                    options={[
                        { value: "", label: "Tất cả trạng thái" },
                        ...Object.entries(campaignStatusMeta).map(([value, meta]) => ({ value, label: meta.label })),
                    ]}
                />
                <AdminIconButton
                    label="Làm mới tiến độ"
                    icon={<ReloadOutlined />}
                    loading={loadingCampaigns}
                    onClick={() => fetchCampaigns()}
                />
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
                columns={campaignColumns}
                dataSource={campaigns}
                loading={loadingCampaigns}
                scroll={{ x: 900 }}
                pagination={{
                    current: campaignPage,
                    pageSize: 20,
                    total: campaignTotal,
                    showSizeChanger: false,
                    onChange: setCampaignPage,
                }}
            />
        </Card>
    );

    return (
        <div>
            <Flex justify="space-between" align="center" gap={16} wrap="wrap" style={{ marginBottom: 22 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Quản lý email</Title>
                    <Text type="secondary">Gửi theo tài khoản đã xác minh hoặc danh sách tự nguyện đăng ký bản tin.</Text>
                </div>
                <Space wrap>
                    <AdminIconButton
                        label="Làm mới"
                        icon={<ReloadOutlined />}
                        loading={loadingUsers || loadingSubscribers || loadingCampaigns}
                        onClick={() => { fetchUsers(); fetchSubscribers(); fetchCampaigns(); fetchProviderStatus(); }}
                    />
                    <AdminIconButton label="Tạo email bằng AI" icon={<RobotOutlined />} onClick={() => router.push("/admin/ai/email")} />
                    <AdminIconButton
                        label="Gửi email kiểm tra"
                        icon={<MailOutlined />}
                        loading={testingEmail}
                        onClick={sendTestEmail}
                    />
                    <AdminIconButton
                        label="Gửi thư chào mừng còn thiếu"
                        icon={<UserOutlined />}
                        loading={sending}
                        onClick={sendPendingWelcome}
                    />
                </Space>
            </Flex>

            {providerStatus && (
                <Alert
                    type={providerStatus.readyForBulk ? "success" : "error"}
                    showIcon
                    title={providerStatus.readyForBulk
                        ? "Dịch vụ email sẵn sàng gửi hàng loạt"
                        : "Dịch vụ email chưa sẵn sàng gửi hàng loạt"}
                    description={providerStatus.readyForBulk
                        ? `Người gửi: ${providerStatus.sender || "DPWOOD"}`
                        : "Resend đang dùng địa chỉ thử nghiệm hoặc chưa xác minh miền gửi. Hãy xác minh dpwood.store và cấu hình RESEND_FROM trên Render."}
                    style={{ marginBottom: 18 }}
                />
            )}

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={12} lg={6}><Card><Statistic title="Tài khoản đã xác minh" value={userStats.verifiedUsers || 0} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card><Statistic title="Đã đăng ký bản tin" value={subscriberStats.subscribed || 0} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card><Statistic title="Chờ xác nhận bản tin" value={subscriberStats.pending || 0} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card><Statistic title="Đã hủy bản tin" value={subscriberStats.unsubscribed || 0} /></Card></Col>
            </Row>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    { key: "users", label: "Tài khoản đã xác minh", children: userTable },
                    { key: "subscribers", label: "Đăng ký bản tin", children: subscriberTable },
                    { key: "campaigns", label: "Lịch sử gửi", children: campaignTable },
                ]}
            />

            <Modal
                open={composerOpen}
                title={campaign.target === "individual"
                    ? `Gửi email cho ${campaign.recipient?.email}`
                    : campaign.target === "selected"
                        ? `Gửi cho ${selectedUserIds.length} tài khoản đã chọn`
                        : campaign.audience === "subscribers"
                            ? "Gửi cho toàn bộ người đăng ký bản tin"
                            : "Gửi cho toàn bộ tài khoản đã xác minh"}
                onCancel={() => setComposerOpen(false)}
                footer={null}
                width={720}
                destroyOnHidden
            >
                {campaign.target !== "individual" && (
                    <Alert
                        type="warning"
                        showIcon
                        title={`Dự kiến tối đa ${expectedRecipients} người nhận`}
                        description="Danh sách thực tế được kiểm tra lại ở máy chủ ngay trước khi gửi. Tài khoản chưa xác minh hoặc đã xóa sẽ bị loại bỏ."
                        style={{ marginBottom: 16 }}
                    />
                )}
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="subject" label="Tiêu đề" rules={[{ required: true, message: "Nhập tiêu đề email" }]}>
                        <Input maxLength={180} showCount />
                    </Form.Item>
                    <Form.Item name="preview" label="Đoạn xem trước">
                        <Input maxLength={240} showCount />
                    </Form.Item>
                    <Form.Item
                        name="contentHtml"
                        label="Nội dung HTML"
                        rules={[{ required: true, message: "Nhập nội dung email" }]}
                        extra="Hỗ trợ các thẻ định dạng an toàn như p, h2, strong, ul, li và liên kết HTTPS."
                    >
                        <TextArea rows={12} />
                    </Form.Item>
                    <Flex justify="end" gap={10} wrap="wrap">
                        <AdminIconButton label="Xem bản gửi" icon={<EyeOutlined />} onClick={openEmailPreview} />
                        <AdminIconButton label="Gửi email" icon={<SendOutlined />} loading={sending} htmlType="submit" />
                    </Flex>
                </Form>
            </Modal>

            <EmailPreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                subject={form.getFieldValue("subject")}
                preview={form.getFieldValue("preview")}
                contentHtml={form.getFieldValue("contentHtml")}
                audience={campaign.audience}
                recipientName={campaign.recipient?.name}
            />
        </div>
    );
}
