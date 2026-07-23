"use client";

import { Alert, Flex, Space, Tabs, Typography } from "antd";
import {
    MailOutlined,
    ReloadOutlined,
    RobotOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import AdminIconButton from "@/components/ui/AdminIconButton";
import EmailPreviewModal from "@/components/admin/EmailPreviewModal";
import NewsletterStats from "./components/NewsletterStats";
import NewsletterComposerModal from "./components/NewsletterComposerModal";
import {
    CampaignsTable,
    SubscribersTable,
    VerifiedUsersTable,
} from "./components/NewsletterTables";
import useNewsletterAdmin from "./hooks/useNewsletterAdmin";

const { Title, Text } = Typography;

export default function AdminNewsletterPage() {
    const router = useRouter();
    const newsletter = useNewsletterAdmin();

    const tabs = [
        {
            key: "users",
            label: "Tài khoản đã xác minh",
            children: (
                <VerifiedUsersTable
                    users={newsletter.users}
                    loading={newsletter.loadingUsers}
                    page={newsletter.userPage}
                    total={newsletter.userTotal}
                    role={newsletter.userRole}
                    selectedIds={newsletter.selectedUserIds}
                    onPageChange={newsletter.setUserPage}
                    onRoleChange={(value) => {
                        newsletter.setUserPage(1);
                        newsletter.setUserRole(value);
                    }}
                    onSearch={(value) => {
                        newsletter.setUserPage(1);
                        newsletter.setUserSearch(value);
                    }}
                    onSelectionChange={newsletter.setSelectedUserIds}
                    onOpenComposer={newsletter.openComposer}
                />
            ),
        },
        {
            key: "subscribers",
            label: "Đăng ký bản tin",
            children: (
                <SubscribersTable
                    subscribers={newsletter.subscribers}
                    stats={newsletter.subscriberStats}
                    loading={newsletter.loadingSubscribers}
                    page={newsletter.subscriberPage}
                    total={newsletter.subscriberTotal}
                    status={newsletter.subscriberStatus}
                    resendingId={newsletter.resendingVerificationId}
                    deletingId={newsletter.deletingSubscriberId}
                    onPageChange={newsletter.setSubscriberPage}
                    onStatusChange={(value) => {
                        newsletter.setSubscriberPage(1);
                        newsletter.setSubscriberStatus(value);
                    }}
                    onSearch={(value) => {
                        newsletter.setSubscriberPage(1);
                        newsletter.setSubscriberSearch(value);
                    }}
                    onOpenComposer={newsletter.openComposer}
                    onResendVerification={newsletter.resendSubscriberVerification}
                    onDelete={newsletter.deleteSubscriber}
                />
            ),
        },
        {
            key: "campaigns",
            label: "Lịch sử gửi",
            children: (
                <CampaignsTable
                    campaigns={newsletter.campaigns}
                    loading={newsletter.loadingCampaigns}
                    page={newsletter.campaignPage}
                    total={newsletter.campaignTotal}
                    status={newsletter.campaignStatus}
                    resendingId={newsletter.resendingCampaignId}
                    deletingId={newsletter.deletingCampaignId}
                    onPageChange={newsletter.setCampaignPage}
                    onStatusChange={(value) => {
                        newsletter.setCampaignPage(1);
                        newsletter.setCampaignStatus(value);
                    }}
                    onRefresh={() => newsletter.fetchCampaigns()}
                    onCancel={newsletter.cancelCampaign}
                    onResend={newsletter.resendCampaign}
                    onDelete={newsletter.deleteCampaign}
                />
            ),
        },
    ];

    return (
        <div>
            <Flex justify="space-between" align="center" gap={16} wrap="wrap" style={{ marginBottom: 22 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Quản lý email</Title>
                    <Text type="secondary">
                        Gửi email tới tài khoản đã xác minh hoặc người tự nguyện đăng ký bản tin.
                    </Text>
                </div>
                <Space wrap>
                    <AdminIconButton
                        label="Làm mới"
                        icon={<ReloadOutlined />}
                        loading={newsletter.loadingUsers || newsletter.loadingSubscribers || newsletter.loadingCampaigns}
                        onClick={newsletter.refreshAll}
                    />
                    <AdminIconButton
                        label="Tạo email bằng AI"
                        icon={<RobotOutlined />}
                        onClick={() => router.push("/admin/ai/email")}
                    />
                    <AdminIconButton
                        label="Gửi email kiểm tra"
                        icon={<MailOutlined />}
                        loading={newsletter.testingEmail}
                        onClick={newsletter.sendTestEmail}
                    />
                    <AdminIconButton
                        label="Gửi thư chào mừng còn thiếu"
                        icon={<UserOutlined />}
                        loading={newsletter.sending}
                        onClick={newsletter.sendPendingWelcome}
                    />
                </Space>
            </Flex>

            {newsletter.providerStatus && (
                <Alert
                    type={newsletter.providerStatus.readyForBulk ? "success" : "error"}
                    showIcon
                    title={newsletter.providerStatus.readyForBulk
                        ? "Dịch vụ email sẵn sàng gửi hàng loạt"
                        : "Dịch vụ email chưa sẵn sàng gửi hàng loạt"}
                    description={newsletter.providerStatus.readyForBulk
                        ? `Người gửi: ${newsletter.providerStatus.sender || "DPWOOD"}`
                        : "Resend đang dùng địa chỉ thử nghiệm hoặc chưa xác minh miền gửi. Hãy xác minh dpwood.store và cấu hình RESEND_FROM trên Render."}
                    style={{ marginBottom: 18 }}
                />
            )}

            <NewsletterStats
                userStats={newsletter.userStats}
                subscriberStats={newsletter.subscriberStats}
            />

            <Tabs
                activeKey={newsletter.activeTab}
                onChange={newsletter.setActiveTab}
                items={tabs}
            />

            <NewsletterComposerModal
                open={newsletter.composerOpen}
                form={newsletter.form}
                campaign={newsletter.campaign}
                expectedRecipients={newsletter.expectedRecipients}
                selectedCount={newsletter.selectedUserIds.length}
                sending={newsletter.sending}
                onCancel={() => newsletter.setComposerOpen(false)}
                onPreview={newsletter.openEmailPreview}
                onSubmit={newsletter.handleSubmit}
            />

            <EmailPreviewModal
                open={newsletter.previewOpen}
                onClose={() => newsletter.setPreviewOpen(false)}
                subject={newsletter.form.getFieldValue("subject")}
                preview={newsletter.form.getFieldValue("preview")}
                contentHtml={newsletter.form.getFieldValue("contentHtml")}
                audience={newsletter.campaign.audience}
                recipientName={newsletter.campaign.recipient?.name}
            />
        </div>
    );
}
