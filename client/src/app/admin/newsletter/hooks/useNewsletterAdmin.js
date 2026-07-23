"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Form } from "antd";
import api from "@/utils/axios";

export default function useNewsletterAdmin() {
    const { message, modal } = App.useApp();
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
    const [campaigns, setCampaigns] = useState([]);
    const [campaignTotal, setCampaignTotal] = useState(0);
    const [campaignPage, setCampaignPage] = useState(1);
    const [campaignStatus, setCampaignStatus] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingSubscribers, setLoadingSubscribers] = useState(false);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [resendingVerificationId, setResendingVerificationId] = useState(null);
    const [deletingSubscriberId, setDeletingSubscriberId] = useState(null);
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
                params: { page: userPage, limit: 20, search: userSearch || undefined, role: userRole || undefined },
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
                params: { page: campaignPage, limit: 20, status: campaignStatus || undefined },
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
            // Ignore malformed AI drafts.
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
            const response = await api.post("/newsletter/admin/send", {
                ...values,
                audience: campaign.audience,
                target: campaign.target,
                userId: campaign.audience === "verified_users" ? campaign.recipient?.id : undefined,
                userIds: campaign.target === "selected" ? selectedUserIds : undefined,
                subscriberId: campaign.audience === "subscribers" ? campaign.recipient?.id : undefined,
            }, { authRequired: true });
            message.success(response.data?.message || "Đã tạo chiến dịch email");
            setComposerOpen(false);
            form.resetFields();
            void fetchUsers();
            void fetchSubscribers();
            setCampaignPage(1);
            setActiveTab("campaigns");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể gửi email");
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = (values) => {
        if (campaign.target === "individual") return executeSend(values);
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

    const sendPendingWelcome = () => modal.confirm({
        title: "Gửi thư chào mừng còn thiếu?",
        content: "Chỉ người đã xác nhận bản tin và chưa từng nhận thư chào mừng mới được gửi.",
        okText: "Tiếp tục",
        cancelText: "Hủy",
        onOk: async () => {
            try {
                setSending(true);
                const response = await api.post("/newsletter/admin/send-welcome", undefined, { authRequired: true });
                message.success(response.data?.message || "Đã hoàn tất gửi thư chào mừng");
                await fetchSubscribers();
            } catch (error) {
                message.error(error.response?.data?.message || "Không thể gửi thư chào mừng");
                throw error;
            } finally {
                setSending(false);
            }
        },
    });

    const sendTestEmail = () => modal.confirm({
        title: "Gửi email kiểm tra?",
        content: "Email thử sẽ được gửi tới địa chỉ của tài khoản quản trị đang đăng nhập.",
        okText: "Gửi email thử",
        cancelText: "Hủy",
        onOk: async () => {
            try {
                setTestingEmail(true);
                const response = await api.post("/newsletter/admin/test-email", undefined, { authRequired: true });
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

    const cancelCampaign = (record) => modal.confirm({
        title: "Hủy chiến dịch email?",
        content: `Chiến dịch “${record.subject}” sẽ dừng sau lô đang xử lý. Email đã gửi không thể thu hồi.`,
        okText: "Hủy chiến dịch",
        cancelText: "Giữ chiến dịch",
        okButtonProps: { danger: true },
        onOk: async () => {
            try {
                await api.post(`/newsletter/admin/campaigns/${record.id}/cancel`, undefined, { authRequired: true });
                message.success("Đã hủy chiến dịch email");
                await fetchCampaigns();
            } catch (error) {
                message.error(error.response?.data?.message || "Không thể hủy chiến dịch");
                throw error;
            }
        },
    });

    const resendCampaign = (record) => modal.confirm({
        title: "Gửi lại chiến dịch email?",
        content: `Hệ thống sẽ tạo một chiến dịch mới từ “${record.subject}” và kiểm tra lại người nhận hợp lệ.`,
        okText: "Gửi lại",
        cancelText: "Hủy",
        onOk: async () => {
            try {
                setResendingCampaignId(record.id);
                const response = await api.post(`/newsletter/admin/campaigns/${record.id}/resend`, undefined, { authRequired: true });
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

    const deleteCampaign = (record) => modal.confirm({
        title: "Xóa lịch sử chiến dịch?",
        content: `Chiến dịch “${record.subject}” sẽ bị xóa khỏi lịch sử. Email đã gửi không bị ảnh hưởng.`,
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

    const resendSubscriberVerification = (record) => modal.confirm({
        title: "Gửi lại email xác nhận?",
        content: `DPWOOD sẽ gửi liên kết xác nhận mới tới ${record.email}. Liên kết cũ sẽ hết hiệu lực.`,
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

    const deleteSubscriber = (record) => modal.confirm({
        title: "Xóa đăng ký bản tin?",
        content: `${record.email} sẽ bị xóa khỏi danh sách và có thể tự đăng ký lại sau này.`,
        okText: "Xóa",
        cancelText: "Giữ lại",
        okButtonProps: { danger: true },
        onOk: async () => {
            try {
                setDeletingSubscriberId(record.id);
                await api.delete(`/newsletter/admin/subscribers/${record.id}`, { authRequired: true });
                message.success("Đã xóa đăng ký bản tin");
                if (subscribers.length === 1 && subscriberPage > 1) setSubscriberPage((page) => page - 1);
                else await fetchSubscribers();
            } catch (error) {
                message.error(error.response?.data?.message || "Không thể xóa đăng ký bản tin");
                throw error;
            } finally {
                setDeletingSubscriberId(null);
            }
        },
    });

    const refreshAll = () => {
        void fetchUsers();
        void fetchSubscribers();
        void fetchCampaigns();
        void fetchProviderStatus();
    };

    return {
        activeTab, setActiveTab, users, userStats, userTotal, userPage, setUserPage,
        userRole, setUserRole, setUserSearch, selectedUserIds, setSelectedUserIds,
        subscribers, subscriberStats, subscriberTotal, subscriberPage, setSubscriberPage,
        subscriberStatus, setSubscriberStatus, setSubscriberSearch,
        campaigns, campaignTotal, campaignPage, setCampaignPage, campaignStatus, setCampaignStatus,
        loadingUsers, loadingSubscribers, loadingCampaigns, resendingVerificationId,
        deletingSubscriberId, resendingCampaignId, deletingCampaignId, sending, testingEmail,
        providerStatus, composerOpen, setComposerOpen, previewOpen, setPreviewOpen, campaign,
        form, expectedRecipients, openComposer, handleSubmit, openEmailPreview, sendPendingWelcome,
        sendTestEmail, cancelCampaign, resendCampaign, deleteCampaign, resendSubscriberVerification,
        deleteSubscriber, fetchCampaigns, refreshAll,
    };
}
