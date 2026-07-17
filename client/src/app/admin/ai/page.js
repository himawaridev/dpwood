"use client";

import React, { useMemo, useState } from "react";
import {
    Alert,
    App,
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Divider,
    Flex,
    Form,
    Input,
    InputNumber,
    Progress,
    Row,
    Select,
    Space,
    Switch,
    Tag,
    Typography,
} from "antd";
import {
    AppstoreAddOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CustomerServiceOutlined,
    FileTextOutlined,
    RobotOutlined,
    SafetyCertificateOutlined,
    StopOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import AdminIconButton from "@/components/ui/AdminIconButton";
import api from "@/utils/axios";
import AiResultCards from "./components/AiResultCards";
import {
    blogBlockOptions,
    blogGoalOptions,
    depthOptions,
    supportAllowedItems,
    supportBlockedItems,
    toneOptions,
} from "./aiOptions";

const { Title, Text, Paragraph } = Typography;

export function AdminAiCenterSection({ section = "blog" }) {
    const { message } = App.useApp();
    const router = useRouter();
    const [blogForm] = Form.useForm();
    const [productForm] = Form.useForm();
    const [supportForm] = Form.useForm();
    const publishMode = Form.useWatch("publishMode", blogForm);
    const [loading, setLoading] = useState(false);
    const [productLoading, setProductLoading] = useState(false);
    const [supportLoading, setSupportLoading] = useState(false);
    const [createdBlogs, setCreatedBlogs] = useState([]);
    const [createdProducts, setCreatedProducts] = useState([]);
    const [pendingProducts, setPendingProducts] = useState([]);
    const [brokenProductImages, setBrokenProductImages] = useState({});
    const [supportResult, setSupportResult] = useState(null);

    const stats = useMemo(
        () => [
            { label: "Blog tối đa/lần", value: "20" },
            { label: "Sản phẩm tối đa/lần", value: "50" },
            { label: "Yêu cầu hỗ trợ AI mỗi lần", value: "20" },
            { label: "Chế độ an toàn", value: "Bật" },
        ],
        [],
    );

    const buildBlogPrompt = (values) => {
        const scheduleText =
            values.publishMode === "schedule" && values.publishAt
                ? `Lịch đăng mong muốn: ${values.publishAt.format("DD/MM/YYYY HH:mm")}. Tạo bài ở trạng thái bản nháp và ghi nội dung phù hợp để admin duyệt trước khi xuất bản.`
                : "";

        return [
            values.prompt,
            values.audience ? `Đối tượng đọc chính: ${values.audience}` : "",
            values.goal ? `Mục tiêu tìm kiếm của bài viết: ${values.goal}` : "",
            values.keywords ? `Từ khóa trọng tâm: ${values.keywords}` : "",
            values.depth ? `Độ sâu nội dung: ${values.depth}` : "",
            values.blocks?.length ? `Các phần cần có: ${values.blocks.join(", ")}` : "",
            scheduleText,
        ]
            .filter(Boolean)
            .join("\n");
    };

    const handleGenerateBlogs = async (values) => {
        try {
            setLoading(true);
            const response = await api.post("/ai/blog-batch", {
                prompt: buildBlogPrompt(values),
                tone: values.tone,
                count: values.count,
                publish: values.publishMode === "publish_now",
                useFreeResources: values.useFreeResources,
            });
            const blogs = response.data?.blogs || [];
            setCreatedBlogs(blogs);

            if (values.publishMode === "schedule") {
                message.success(`Đã tạo ${blogs.length} bản nháp theo lịch gợi ý. Quản trị viên có thể duyệt và xuất bản sau.`);
            } else {
                message.success(response.data?.message || `AI đã tạo ${blogs.length} blog.`);
            }
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tạo blog hàng loạt bằng AI");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateProducts = async (values) => {
        try {
            setProductLoading(true);
            const response = await api.post("/ai/product-batch", {
                prompt: values.prompt,
                count: values.count,
                useFreeResources: values.useFreeResources,
                createMode: values.createMode,
            });
            const products = response.data?.products || [];
            if (response.data?.created === false || values.createMode === "review") {
                setPendingProducts(products);
                setCreatedProducts([]);
                setBrokenProductImages({});
                if (response.data?.fallback) {
                    message.warning(response.data?.message || `Gemini hết quota, hệ thống đã tạo ${products.length} bản nháp nội bộ.`);
                } else {
                    message.success(response.data?.message || `AI đã tạo ${products.length} bản nháp để duyệt.`);
                }
            } else {
                setCreatedProducts(products);
                setPendingProducts([]);
                setBrokenProductImages({});
                if (response.data?.fallback) {
                    message.warning(response.data?.message || `Gemini hết quota, hệ thống đã tạo ${products.length} sản phẩm nội bộ.`);
                } else {
                    message.success(response.data?.message || `AI đã tạo ${products.length} sản phẩm.`);
                }
            }
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tạo sản phẩm hàng loạt bằng AI");
        } finally {
            setProductLoading(false);
        }
    };

    const handleSavePendingProducts = async () => {
        if (!pendingProducts.length) return;
        try {
            setProductLoading(true);
            const response = await api.post("/ai/product-batch-save", { products: pendingProducts });
            const products = response.data?.products || [];
            setCreatedProducts(products);
            setPendingProducts([]);
            setBrokenProductImages({});
            message.success(response.data?.message || `Đã lưu ${products.length} sản phẩm.`);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể lưu danh sách sản phẩm đã duyệt");
        } finally {
            setProductLoading(false);
        }
    };

    const handleAutoResolveSupport = async (values) => {
        try {
            setSupportLoading(true);
            const response = await api.post("/ai/support-auto-resolve", {
                limit: values.limit,
                closeResolved: values.closeResolved,
            });
            setSupportResult(response.data || null);
            message.success(response.data?.message || "AI đã xử lý support.");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tự động xử lý support bằng AI");
        } finally {
            setSupportLoading(false);
        }
    };

    const resultCards = (
        <AiResultCards
            createdBlogs={createdBlogs}
            pendingProducts={pendingProducts}
            createdProducts={createdProducts}
            supportResult={supportResult}
            productLoading={productLoading}
            brokenProductImages={brokenProductImages}
            onBrokenProductImage={(imageKey) =>
                setBrokenProductImages((current) => ({ ...current, [imageKey]: true }))
            }
            onClearPendingProducts={() => setPendingProducts([])}
            onSavePendingProducts={handleSavePendingProducts}
            onOpenBlogs={() => router.push("/admin/blogs")}
            onEditBlog={(blog) => router.push(`/admin/blogs/${blog.id}?from=ai`)}
            onOpenProducts={() => router.push("/admin/products")}
            onOpenProduct={(product) => router.push(`/products/${product.id}`)}
            onOpenSupport={() => router.push("/admin/support")}
        />
    );
    const blogTab = (
        <Row gutter={[16, 16]}>
            <Col xs={24} xl={15}>
                <Card
                    title={
                        <Space>
                            <ThunderboltOutlined />
                            Tạo blog hàng loạt
                        </Space>
                    }
                    className="dp-admin-ai-card"
                >
                    <Alert
                        type="info"
                        showIcon
                        title="Quy trình khuyến nghị"
                        description="Nên tạo bản nháp trước, kiểm duyệt nội dung, ảnh đại diện và SEO rồi mới xuất bản. Nếu chọn lịch đăng, AI sẽ tạo bản nháp theo lịch gợi ý để admin duyệt."
                        style={{ marginBottom: 18 }}
                    />

                    <Form
                        form={blogForm}
                        layout="vertical"
                        initialValues={{
                            count: 5,
                            tone: toneOptions[0].value,
                            depth: "day du",
                            goal: blogGoalOptions[0].value,
                            publishMode: "draft",
                            blocks: ["seo", "buyingGuide", "careTips"],
                            useFreeResources: true,
                        }}
                        onFinish={handleGenerateBlogs}
                    >
                        <Form.Item
                            name="prompt"
                            label="Chiến dịch hoặc chủ đề"
                            rules={[
                                { required: true, message: "Hãy nhập chủ đề để AI tạo blog." },
                                { min: 8, message: "Chủ đề cần chi tiết hơn." },
                            ]}
                        >
                            <Input.TextArea
                                rows={5}
                                placeholder="VD: Tạo chuỗi blog tư vấn chọn đồ gia dụng nhà bếp cho gia đình trẻ, tập trung nồi chảo, bát đĩa, dụng cụ bếp và mẹo bảo quản."
                            />
                        </Form.Item>

                        <Row gutter={12}>
                            <Col xs={24} md={8}>
                                <Form.Item name="count" label="Số blog" rules={[{ required: true }]}>
                                    <InputNumber min={1} max={20} style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="tone" label="Giọng văn">
                                    <Select options={toneOptions} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="depth" label="Độ sâu nội dung">
                                    <Select options={depthOptions} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col xs={24} md={14}>
                                <Form.Item name="audience" label="Đối tượng người đọc">
                                    <Input placeholder="VD: Gia đình 2-4 người, người mới tự nấu ăn" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={10}>
                                <Form.Item name="goal" label="Mục tiêu bài viết">
                                    <Select options={blogGoalOptions} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="keywords" label="Từ khóa chính">
                            <Input placeholder="VD: đồ bếp an toàn, nồi inox, bát đĩa sứ, mẹo nhà bếp" />
                        </Form.Item>

                        <Form.Item name="blocks" label="Các phần AI cần viết">
                            <Checkbox.Group options={blogBlockOptions} className="dp-admin-ai-checkbox-grid" />
                        </Form.Item>

                        <Form.Item
                            name="useFreeResources"
                            label="Tìm ảnh và tài liệu miễn phí"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                        </Form.Item>

                        <Row gutter={12}>
                            <Col xs={24} md={12}>
                                <Form.Item name="publishMode" label="Chế độ xuất bản">
                                    <Select
                                        options={[
                                            { value: "draft", label: "Tạo bản nháp" },
                                            { value: "publish_now", label: "Xuất bản ngay" },
                                            { value: "schedule", label: "Lên lịch để admin duyệt" },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="publishAt" label="Thời gian dự kiến">
                                    <DatePicker
                                        showTime
                                        format="DD/MM/YYYY HH:mm"
                                        style={{ width: "100%" }}
                                        disabled={publishMode !== "schedule"}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Button type="primary" htmlType="submit" loading={loading} icon={<RobotOutlined />}>
                            Tạo blog bằng AI
                        </Button>
                    </Form>
                </Card>
            </Col>

            <Col xs={24} xl={9}>
                <Card
                    title={
                        <Space>
                            <CalendarOutlined />
                            Lịch nội dung
                        </Space>
                    }
                    className="dp-admin-ai-card"
                >
                    <Progress percent={70} showInfo={false} strokeColor="#f09b90" />
                    <Title level={4}>Mục tiêu 20 blog/ngày</Title>
                    <Paragraph type="secondary">
                        Trang này đã có cấu hình tạo theo lịch. Để tự đăng đúng giờ trên production, nên thêm Cron Job
                        riêng trên Render để gọi batch theo lịch cố định.
                    </Paragraph>
                    <div className="dp-admin-ai-checklist">
                        <Tag color="success">Tạo nháp</Tag>
                        <Tag color="success">Xuất bản ngay</Tag>
                        <Tag color="warning">Cần tác vụ định kỳ để tự động xuất bản</Tag>
                    </div>
                    <Divider />
                    <Text strong>Tùy chọn đã bổ sung</Text>
                    <div className="dp-admin-ai-list">
                        {[
                            "Giọng văn theo mục tiêu bán hàng hoặc tư vấn chuyên gia.",
                            "Độ sâu nội dung ngắn, đầy đủ hoặc chuyên sâu.",
                            "Từ khóa SEO và các khối FAQ, chọn mua, bảo quản.",
                            "Quay về đúng Trung tâm AI sau khi chỉnh sửa bài viết.",
                        ].map((item) => (
                            <div key={item} className="dp-admin-ai-list-item">
                                {item}
                            </div>
                        ))}
                    </div>
                    <Button block icon={<FileTextOutlined />} onClick={() => router.push("/admin/blogs")}>
                        Quản lý blog
                    </Button>
                </Card>
            </Col>
        </Row>
    );

    const productTab = (
        <Row gutter={[16, 16]}>
            <Col xs={24} xl={15}>
                <Card
                    title={
                        <Space>
                            <AppstoreAddOutlined />
                            Tạo sản phẩm hàng loạt
                        </Space>
                    }
                    className="dp-admin-ai-card"
                >
                    <Alert
                        type="warning"
                        showIcon
                        title="AI sẽ lưu sản phẩm trực tiếp vào kho"
                        description="Sau khi tạo, admin vẫn cần rà lại ảnh, giá, tồn kho, màu sắc, kích cỡ và biến thể trước khi bán thật."
                        style={{ marginBottom: 18 }}
                    />

                    <Form
                        form={productForm}
                        layout="vertical"
                        initialValues={{
                            count: 12,
                            useFreeResources: true,
                            createMode: "review",
                        }}
                        onFinish={handleGenerateProducts}
                    >
                        <Form.Item
                            name="prompt"
                            label="Mô tả nhóm sản phẩm cần thêm"
                            rules={[
                                { required: true, message: "Hãy nhập nhóm sản phẩm cần tạo." },
                                { min: 8, message: "Yêu cầu cần chi tiết hơn." },
                            ]}
                        >
                            <Input.TextArea
                                rows={5}
                                placeholder="VD: Tạo 30 sản phẩm đồ gia dụng nhà bếp gồm nồi chảo, bát đĩa, dao thớt, hộp bảo quản, máy gia dụng nhỏ. Có màu sắc, kích cỡ và biến thể giá hợp lý."
                            />
                        </Form.Item>

                        <Form.Item name="count" label="Số sản phẩm" rules={[{ required: true }]}>
                            <InputNumber min={1} max={50} style={{ width: "100%" }} />
                        </Form.Item>

                        <Form.Item name="createMode" label="Cách tạo">
                            <Select
                                options={[
                                    { value: "review", label: "Duyệt trước rồi lưu" },
                                    { value: "auto", label: "Tự động lưu vào kho" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            name="useFreeResources"
                            label="Tự do tìm kiếm ảnh sắc nét phù hợp"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" loading={productLoading} icon={<AppstoreAddOutlined />}>
                            Tạo sản phẩm bằng AI
                        </Button>
                    </Form>
                </Card>
            </Col>

            <Col xs={24} xl={9}>
                <Card title="Checklist sau khi tạo" className="dp-admin-ai-card">
                    <div className="dp-admin-ai-list">
                        {[
                            "Kiểm tra ảnh đại diện và gallery.",
                            "Rà lại giá bán, giá biến thể và tồn kho.",
                            "Kiểm tra màu sắc/kích cỡ có độc lập và hợp lý.",
                            "Ẩn hoặc xóa sản phẩm chưa đạt.",
                        ].map((item) => (
                            <div key={item} className="dp-admin-ai-list-item">
                                {item}
                            </div>
                        ))}
                    </div>
                    <Button block icon={<AppstoreAddOutlined />} onClick={() => router.push("/admin/products")}>
                        Quản lý sản phẩm
                    </Button>
                </Card>
            </Col>
        </Row>
    );

    const supportTab = (
        <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
                <Card
                    title={
                        <Space>
                            <CustomerServiceOutlined />
                            AI xử lý yêu cầu hỗ trợ
                        </Space>
                    }
                    className="dp-admin-ai-card"
                >
                    <Alert
                        type="warning"
                        showIcon
                        title="AI chỉ xử lý yêu cầu hỗ trợ an toàn"
                        description="Các vấn đề tiền bạc, thanh toán, hoàn tiền, tài khoản hoặc sửa thông tin cá nhân sẽ bị chặn và chuyển sang quản trị viên."
                        style={{ marginBottom: 18 }}
                    />

                    <Form
                        form={supportForm}
                        layout="vertical"
                        initialValues={{ limit: 5, closeResolved: false }}
                        onFinish={handleAutoResolveSupport}
                    >
                        <Row gutter={12}>
                            <Col xs={24} md={12}>
                                <Form.Item name="limit" label="Số yêu cầu xử lý mỗi lần" rules={[{ required: true }]}>
                                    <InputNumber min={1} max={20} style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="closeResolved" label="Đóng yêu cầu sau khi AI trả lời" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Button type="primary" htmlType="submit" loading={supportLoading} icon={<CustomerServiceOutlined />}>
                            Chạy AI support
                        </Button>
                    </Form>
                </Card>
            </Col>

            <Col xs={24} xl={10}>
                <Card
                    title={
                        <Space>
                            <SafetyCertificateOutlined />
                            Phạm vi xử lý yêu cầu hỗ trợ
                        </Space>
                    }
                    className="dp-admin-ai-card"
                >
                    <Row gutter={[12, 12]}>
                        <Col xs={24}>
                            <Text strong>
                                <CheckCircleOutlined style={{ color: "#52c41a" }} /> AI được xử lý
                            </Text>
                            <div className="dp-admin-ai-list">
                                {supportAllowedItems.map((item) => (
                                    <div key={item} className="dp-admin-ai-list-item">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </Col>
                        <Col xs={24}>
                            <Text strong>
                                <StopOutlined style={{ color: "#ff4d4f" }} /> Chuyển admin
                            </Text>
                            <div className="dp-admin-ai-list">
                                {supportBlockedItems.map((item) => (
                                    <div key={item} className="dp-admin-ai-list-item dp-admin-ai-list-item-danger">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                    <Button block onClick={() => router.push("/admin/support")}>
                        Quản lý yêu cầu hỗ trợ
                    </Button>
                </Card>
            </Col>
        </Row>
    );

    const rulesTab = (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
                <Card className="dp-admin-ai-card" title="Bài viết">
                    <Paragraph type="secondary">
                        AI phù hợp để tạo bản nháp, tiêu đề, đoạn mở đầu, tiêu đề SEO, mô tả SEO và dàn ý. Quản trị viên vẫn nên duyệt
                        lại thông tin, hình ảnh và giọng văn trước khi đăng.
                    </Paragraph>
                    <Tag color="success">Có thể tự động hóa cao</Tag>
                </Card>
            </Col>
            <Col xs={24} lg={8}>
                <Card className="dp-admin-ai-card" title="Sản phẩm">
                    <Paragraph type="secondary">
                        AI giúp nhập nhanh dữ liệu ban đầu. Các phần cần con người xác nhận gồm giá, tồn kho, biến thể, ảnh
                        thật và mô tả cam kết.
                    </Paragraph>
                    <Tag color="warning">Cần admin duyệt</Tag>
                </Card>
            </Col>
            <Col xs={24} lg={8}>
                <Card className="dp-admin-ai-card" title="Yêu cầu hỗ trợ">
                    <Paragraph type="secondary">
                        AI chỉ trả lời câu hỏi vận hành thông thường. Khi có rủi ro tiền bạc hoặc dữ liệu cá nhân, yêu cầu sẽ
                        được chuyển cho quản trị viên.
                    </Paragraph>
                    <Tag color="error">Chặn nội dung nhạy cảm</Tag>
                </Card>
            </Col>
        </Row>
    );

    const sectionMap = {
        blog: blogTab,
        products: productTab,
        support: supportTab,
        rules: rulesTab,
    };

    return (
        <div className="dp-admin-ai-page">
            <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap" className="dp-admin-ai-head">
                <div>
                    <Text className="dp-admin-eyebrow">Trung tâm tự động hóa</Text>
                    <Title level={2}>
                        <RobotOutlined /> Trung tâm AI
                    </Title>
                    <Paragraph type="secondary">
                        Điều phối AI tạo nội dung, nhập sản phẩm và xử lý yêu cầu hỗ trợ trong phạm vi an toàn cho DPWOOD.
                    </Paragraph>
                </div>
                <Space wrap>
                    <AdminIconButton
                        label="Bài viết AI"
                        icon={<FileTextOutlined />}
                        onClick={() => router.push("/admin/ai/blog")}
                    />
                    <AdminIconButton
                        label="Hỗ trợ AI"
                        icon={<CustomerServiceOutlined />}
                        onClick={() => router.push("/admin/ai/support")}
                    />
                </Space>
            </Flex>

            <Row gutter={[16, 16]}>
                {stats.map((item) => (
                    <Col xs={12} lg={6} key={item.label}>
                        <Card className="dp-admin-ai-stat">
                            <Text type="secondary">{item.label}</Text>
                            <Title level={3}>{item.value}</Title>
                        </Card>
                    </Col>
                ))}
            </Row>

            <div className="dp-admin-ai-section">{sectionMap[section] || blogTab}</div>
            {resultCards}
        </div>
    );
}

export default function AdminAiCenterPage() {
    return <AdminAiCenterSection section="blog" />;
}
