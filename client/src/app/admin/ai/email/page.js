"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    App,
    Button,
    Card,
    Col,
    Flex,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    ArrowRightOutlined,
    CheckOutlined,
    MailOutlined,
    RobotOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Title, Text } = Typography;
const { TextArea } = Input;

const recipientOptions = [
    { value: "verified_all", label: "Toàn bộ tài khoản đã xác minh" },
    { value: "selected_users", label: "Chọn tài khoản cụ thể" },
    { value: "subscribers_all", label: "Toàn bộ người đăng ký bản tin" },
];

const roleOptions = [
    { value: "", label: "Tất cả vai trò" },
    { value: "user", label: "Khách hàng" },
    { value: "staff", label: "Nhân viên" },
    { value: "admin", label: "Quản trị" },
    { value: "root", label: "Root" },
];

const roleLabels = Object.fromEntries(roleOptions.map((item) => [item.value, item.label]));

export default function AdminAiEmailPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm();
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recipientMode, setRecipientMode] = useState("verified_all");
    const [pickerOpen, setPickerOpen] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [users, setUsers] = useState([]);
    const [userTotal, setUserTotal] = useState(0);
    const [userPage, setUserPage] = useState(1);
    const [userSearch, setUserSearch] = useState("");
    const [userRole, setUserRole] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedUserMap, setSelectedUserMap] = useState({});

    const fetchUsers = useCallback(async () => {
        if (!pickerOpen) return;
        try {
            setLoadingUsers(true);
            const response = await api.get("/newsletter/admin/recipients", {
                params: {
                    page: userPage,
                    limit: 20,
                    search: userSearch || undefined,
                    role: userRole || undefined,
                },
            });
            setUsers(response.data?.users || []);
            setUserTotal(Number(response.data?.total || 0));
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải danh sách người nhận");
        } finally {
            setLoadingUsers(false);
        }
    }, [message, pickerOpen, userPage, userRole, userSearch]);

    useEffect(() => {
        const timer = window.setTimeout(fetchUsers, 250);
        return () => window.clearTimeout(timer);
    }, [fetchUsers]);

    const selectedUsers = useMemo(
        () => selectedUserIds.map((id) => selectedUserMap[id]).filter(Boolean),
        [selectedUserIds, selectedUserMap],
    );

    const updateSelectedUsers = (keys, rows) => {
        setSelectedUserIds(keys);
        setSelectedUserMap((current) => {
            const next = { ...current };
            rows.forEach((user) => { next[user.id] = user; });
            Object.keys(next).forEach((id) => {
                if (!keys.includes(id)) delete next[id];
            });
            return next;
        });
    };

    const clearSelectedUsers = () => {
        setSelectedUserIds([]);
        setSelectedUserMap({});
    };

    const validateRecipients = () => {
        if (recipientMode !== "selected_users" || selectedUserIds.length) return true;
        message.warning("Hãy chọn ít nhất một tài khoản nhận email");
        return false;
    };

    const generateDraft = async (values) => {
        if (!validateRecipients()) return;
        try {
            setLoading(true);
            const response = await api.post("/ai/email-draft", {
                ...values,
                audience: recipientOptions.find((item) => item.value === recipientMode)?.label,
            });
            const nextDraft = response.data?.draft;
            if (!nextDraft) throw new Error("AI không trả về bản nháp hợp lệ");
            setDraft(nextDraft);
            message.success("Đã tạo bản nháp email. Hãy kiểm tra trước khi sử dụng.");
        } catch (error) {
            message.error(error.response?.data?.message || error.message || "Không thể tạo email bằng AI");
        } finally {
            setLoading(false);
        }
    };

    const useDraft = () => {
        if (!validateRecipients()) return;
        const delivery = recipientMode === "subscribers_all"
            ? { audience: "subscribers", target: "all", userIds: [] }
            : recipientMode === "selected_users"
                ? { audience: "verified_users", target: "selected", userIds: selectedUserIds }
                : { audience: "verified_users", target: "all", userIds: [] };
        sessionStorage.setItem("dpwood-newsletter-ai-draft", JSON.stringify({ draft, delivery }));
        router.push("/admin/newsletter");
    };

    const columns = [
        {
            title: "Tài khoản",
            key: "identity",
            render: (_, record) => (
                <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Text type="secondary">{record.email}</Text>
                </div>
            ),
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            width: 130,
            render: (value) => <Tag>{roleLabels[value] || value}</Tag>,
        },
        {
            title: "Bản tin",
            dataIndex: "newsletterStatus",
            width: 140,
            responsive: ["md"],
            render: (value) => value === "subscribed" ? <Tag color="green">Đã đăng ký</Tag> : <Tag>Chưa đăng ký</Tag>,
        },
    ];

    return (
        <div>
            <Space align="center" style={{ marginBottom: 20 }}>
                <RobotOutlined style={{ color: "#f09b90", fontSize: 24 }} />
                <div>
                    <Title level={3} style={{ margin: 0 }}>AI tạo email</Title>
                    <Text type="secondary">AI chỉ tạo bản nháp. Email chỉ được gửi sau khi quản trị viên duyệt.</Text>
                </div>
            </Space>

            <Row gutter={[20, 20]}>
                <Col xs={24} lg={10}>
                    <Card title="Yêu cầu nội dung">
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={{ tone: "thân thiện, chuyên nghiệp" }}
                            onFinish={generateDraft}
                        >
                            <Form.Item label="Đối tượng nhận email" required>
                                <Select
                                    value={recipientMode}
                                    options={recipientOptions}
                                    onChange={(value) => setRecipientMode(value)}
                                />
                            </Form.Item>

                            {recipientMode === "selected_users" && (
                                <Card size="small" style={{ marginBottom: 18 }}>
                                    <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                                        <div>
                                            <Text strong>{selectedUserIds.length} tài khoản đã chọn</Text>
                                            <br />
                                            <Text type="secondary">Tìm kiếm và chọn bằng bảng phân trang.</Text>
                                        </div>
                                        <Space>
                                            {selectedUserIds.length > 0 && (
                                                <Button type="text" onClick={clearSelectedUsers}>Bỏ chọn</Button>
                                            )}
                                            <Button icon={<TeamOutlined />} onClick={() => setPickerOpen(true)}>
                                                Chọn tài khoản
                                            </Button>
                                        </Space>
                                    </Flex>
                                    {selectedUsers.length > 0 && (
                                        <Flex gap={6} wrap="wrap" style={{ marginTop: 12 }}>
                                            {selectedUsers.slice(0, 3).map((user) => (
                                                <Tag key={user.id}>{user.name}</Tag>
                                            ))}
                                            {selectedUsers.length > 3 && <Tag>+{selectedUsers.length - 3} tài khoản</Tag>}
                                        </Flex>
                                    )}
                                </Card>
                            )}

                            <Form.Item
                                name="prompt"
                                label="Mục tiêu email"
                                rules={[{ required: true, message: "Mô tả nội dung cần tạo" }]}
                            >
                                <TextArea
                                    rows={8}
                                    placeholder="Ví dụ: Giới thiệu bộ nồi mới, hướng dẫn chọn kích thước phù hợp và mời người đọc xem sản phẩm. Không tự tạo mã giảm giá."
                                />
                            </Form.Item>
                            <Form.Item name="tone" label="Giọng văn">
                                <Select
                                    options={[
                                        { value: "thân thiện, chuyên nghiệp", label: "Thân thiện" },
                                        { value: "ngắn gọn, tập trung lợi ích", label: "Ngắn gọn" },
                                        { value: "tư vấn như chuyên gia đồ bếp", label: "Chuyên gia" },
                                    ]}
                                />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" icon={<MailOutlined />} loading={loading}>
                                Tạo bản nháp
                            </Button>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={14}>
                    <Card
                        title="Bản nháp email"
                        extra={draft ? (
                            <Button type="primary" icon={<ArrowRightOutlined />} onClick={useDraft}>
                                Chuyển sang trình gửi
                            </Button>
                        ) : null}
                    >
                        {draft ? (
                            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                                <Alert
                                    type="info"
                                    showIcon
                                    title={recipientOptions.find((item) => item.value === recipientMode)?.label}
                                    description={recipientMode === "selected_users"
                                        ? `${selectedUserIds.length} tài khoản đã được chọn`
                                        : "Không tải toàn bộ email về trình duyệt; máy chủ xác định danh sách khi gửi."}
                                />
                                <Input
                                    value={draft.subject}
                                    onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
                                    addonBefore="Tiêu đề"
                                />
                                <Input
                                    value={draft.preview}
                                    onChange={(event) => setDraft((current) => ({ ...current, preview: event.target.value }))}
                                    addonBefore="Xem trước"
                                />
                                <TextArea
                                    rows={14}
                                    value={draft.contentHtml}
                                    onChange={(event) => setDraft((current) => ({ ...current, contentHtml: event.target.value }))}
                                />
                            </Space>
                        ) : (
                            <Text type="secondary">Chọn đối tượng và nhập yêu cầu để AI tạo tiêu đề, đoạn xem trước và nội dung HTML.</Text>
                        )}
                    </Card>
                </Col>
            </Row>

            <Modal
                open={pickerOpen}
                title="Chọn tài khoản nhận email"
                width={900}
                onCancel={() => setPickerOpen(false)}
                footer={(
                    <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                        <Text>{selectedUserIds.length} tài khoản đã chọn</Text>
                        <Button type="primary" icon={<CheckOutlined />} onClick={() => setPickerOpen(false)}>
                            Hoàn tất
                        </Button>
                    </Flex>
                )}
                styles={{ body: { paddingTop: 12 } }}
            >
                <Alert
                    type="info"
                    showIcon
                    title="Danh sách được tải theo từng trang"
                    description="Bạn có thể tìm theo tên hoặc email, lọc vai trò và tiếp tục chọn ở trang khác mà không mất lựa chọn trước đó."
                    style={{ marginBottom: 16 }}
                />
                <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
                    <Input.Search
                        allowClear
                        placeholder="Tìm tên hoặc email"
                        style={{ width: 320, maxWidth: "100%" }}
                        onSearch={(value) => {
                            setUserPage(1);
                            setUserSearch(value.trim());
                        }}
                    />
                    <Select
                        value={userRole}
                        options={roleOptions}
                        style={{ width: 180 }}
                        onChange={(value) => {
                            setUserPage(1);
                            setUserRole(value);
                        }}
                    />
                </Flex>
                <Table
                    rowKey="id"
                    size="middle"
                    columns={columns}
                    dataSource={users}
                    loading={loadingUsers}
                    scroll={{ x: 620 }}
                    rowSelection={{
                        selectedRowKeys: selectedUserIds,
                        preserveSelectedRowKeys: true,
                        onChange: updateSelectedUsers,
                    }}
                    pagination={{
                        current: userPage,
                        pageSize: 20,
                        total: userTotal,
                        showSizeChanger: false,
                        showTotal: (total) => `${total} tài khoản phù hợp`,
                        onChange: setUserPage,
                    }}
                />
            </Modal>
        </div>
    );
}
