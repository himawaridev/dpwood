import { Alert, Flex, Form, Input, Modal } from "antd";
import { EyeOutlined, SendOutlined } from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";

const { TextArea } = Input;

const getComposerTitle = (campaign, selectedCount) => {
    if (campaign.target === "individual") return `Gửi email cho ${campaign.recipient?.email}`;
    if (campaign.target === "selected") return `Gửi cho ${selectedCount} tài khoản đã chọn`;
    if (campaign.audience === "subscribers") return "Gửi cho toàn bộ người đăng ký bản tin";
    return "Gửi cho toàn bộ tài khoản đã xác minh";
};

export default function NewsletterComposerModal({
    open,
    form,
    campaign,
    expectedRecipients,
    selectedCount,
    sending,
    onCancel,
    onPreview,
    onSubmit,
}) {
    return (
        <Modal
            open={open}
            title={getComposerTitle(campaign, selectedCount)}
            onCancel={onCancel}
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
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <Form.Item
                    name="subject"
                    label="Tiêu đề"
                    rules={[{ required: true, message: "Nhập tiêu đề email" }]}
                >
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
                <Flex justify="end" gap={10} wrap>
                    <AdminIconButton label="Xem bản gửi" icon={<EyeOutlined />} onClick={onPreview} />
                    <AdminIconButton
                        label="Gửi email"
                        icon={<SendOutlined />}
                        loading={sending}
                        htmlType="submit"
                    />
                </Flex>
            </Form>
        </Modal>
    );
}
