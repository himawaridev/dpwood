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
    Image,
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
    EditOutlined,
    FileTextOutlined,
    RobotOutlined,
    SafetyCertificateOutlined,
    StopOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Title, Text, Paragraph } = Typography;

const toneOptions = [
    { value: "than thien, chuyen nghiep", label: "Thân thiện" },
    { value: "sang trong, tu van nhu chuyen gia", label: "Chuyên gia" },
    { value: "ngan gon, tap trung SEO va chuyen doi", label: "SEO bán hàng" },
];

const depthOptions = [
    { value: "ngan gon", label: "Ngắn gọn" },
    { value: "day du", label: "Đầy đủ" },
    { value: "chuyen sau", label: "Chuyên sâu" },
];

const blogBlockOptions = [
    { value: "seo", label: "Tối ưu SEO" },
    { value: "faq", label: "FAQ cuối bài" },
    { value: "buyingGuide", label: "Gợi ý chọn mua" },
    { value: "careTips", label: "Mẹo sử dụng/bảo quản" },
    { value: "internalLinks", label: "Gợi ý liên kết sản phẩm" },
];

const supportAllowedItems = [
    "Tư vấn cách tìm sản phẩm, danh mục, mã giảm giá và giỏ hàng.",
    "Hướng dẫn đặt hàng, theo dõi trạng thái đơn và chính sách giao hàng chung.",
    "Giải thích cách dùng voucher, điều kiện áp dụng và lỗi nhập mã thông thường.",
    "Trả lời câu hỏi về chất liệu, kích cỡ, bảo quản đồ bếp, kinh nghiệm chọn mua.",
    "Tóm tắt ticket dài để admin đọc nhanh hơn.",
];

const supportBlockedItems = [
    "Thanh toán, PayOS, chuyển khoản, hoàn tiền hoặc tranh chấp tiền bạc.",
    "Sửa số điện thoại, email, địa chỉ, họ tên hoặc dữ liệu cá nhân.",
    "Mật khẩu, OTP, xác minh tài khoản hoặc thông tin định danh.",
    "Khiếu nại cần quyết định của admin: hủy đơn, đổi trả đặc biệt, bồi thường.",
    "Bất kỳ ticket nào AI không đủ chắc chắn hoặc khách yêu cầu gặp admin.",
];

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
            { label: "Ticket AI/lần", value: "20" },
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
                message.success(`Đã tạo ${blogs.length} bản nháp theo lịch gợi ý. Admin có thể duyệt và xuất bản sau.`);
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

    const isGeneratedPlaceholderUrl = (url) => {
        const value = String(url || "").toLowerCase();
        return (
            !value ||
            value.includes("/ai/product-image-placeholder") ||
            value.includes("product-image-placeholder?") ||
            value.includes("placehold.co/") ||
            value.includes("loremflickr.com/") ||
            value.includes("picsum.photos/")
        );
    };

    const isRealProductImage = (url) => /^https?:\/\//i.test(String(url || "")) && !isGeneratedPlaceholderUrl(url);

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
        <>
            {createdBlogs.length > 0 && (
                <Card
                    className="dp-admin-ai-card"
                    title={
                        <Space>
                            <EditOutlined />
                            Blog vừa tạo
                        </Space>
                    }
                    extra={<Button onClick={() => router.push("/admin/blogs")}>Xem blog</Button>}
                >
                    <div className="dp-admin-ai-result-list">
                        {createdBlogs.map((blog) => (
                            <div className="dp-admin-ai-result-item" key={blog.id}>
                                <div>
                                    <Text strong>{blog.title}</Text>
                                    <Paragraph type="secondary" className="dp-admin-ai-result-summary">
                                        {blog.summary || "Blog AI đang chờ bổ sung mô tả."}
                                    </Paragraph>
                                </div>
                                <Space wrap>
                                    <Tag color={blog.isPublished ? "success" : "default"}>
                                        {blog.isPublished ? "Công khai" : "Bản nháp"}
                                    </Tag>
                                    <Button type="link" onClick={() => router.push(`/admin/blogs/${blog.id}?from=ai`)}>
                                        Chỉnh sửa
                                    </Button>
                                </Space>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {pendingProducts.length > 0 && (
                <Card
                    className="dp-admin-ai-card"
                    title={
                        <Space>
                            <AppstoreAddOutlined />
                            Sản phẩm chờ duyệt
                        </Space>
                    }
                    extra={
                        <Space wrap>
                            <Button onClick={() => setPendingProducts([])}>Xóa bản nháp</Button>
                            <Button type="primary" loading={productLoading} onClick={handleSavePendingProducts}>
                                Lưu tất cả
                            </Button>
                        </Space>
                    }
                >
                    <Alert
                        type="info"
                        showIcon
                        title="Duyệt trước khi lưu"
                        description="Các sản phẩm dưới đây chưa được lưu vào database. Kiểm tra nhanh ảnh, giá và tồn kho rồi bấm Lưu tất cả."
                        style={{ marginBottom: 14 }}
                    />
                    <div className="dp-admin-ai-result-list">
                        {pendingProducts.map((product, index) => {
                            const previewImage = [product.imageUrl, ...(Array.isArray(product.images) ? product.images : [])].find(
                                isRealProductImage,
                            );
                            const imageKey = `${product.name}-${index}`;
                            const imageSrc = brokenProductImages[imageKey] ? "" : previewImage;
                            return (
                                <div className="dp-admin-ai-result-item" key={imageKey}>
                                    <Space align="start" size={12}>
                                        {imageSrc ? (
                                            <Image
                                                src={imageSrc}
                                                alt={product.name}
                                                width={64}
                                                height={64}
                                                style={{ objectFit: "cover" }}
                                                onError={() =>
                                                    setBrokenProductImages((current) => ({
                                                        ...current,
                                                        [imageKey]: true,
                                                    }))
                                                }
                                            />
                                        ) : (
                                            <div className="dp-admin-ai-image-placeholder">No image</div>
                                        )}
                                        <div>
                                            <Text strong>{product.name}</Text>
                                            <Paragraph type="secondary" className="dp-admin-ai-result-summary">
                                                {`${Number(product.price || 0).toLocaleString("vi-VN")} đ - Tồn kho ${product.stock || 0}`}
                                            </Paragraph>
                                        </div>
                                    </Space>
                                    <Space wrap>
                                        <Tag>{product.category || "kitchen"}</Tag>
                                        <Tag color={imageSrc ? "success" : "warning"}>
                                            {imageSrc ? "Có ảnh" : "Thiếu ảnh"}
                                        </Tag>
                                    </Space>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {createdProducts.length > 0 && (
                <Card
                    className="dp-admin-ai-card"
                    title={
                        <Space>
                            <AppstoreAddOutlined />
                            Sản phẩm vừa tạo
                        </Space>
                    }
                    extra={<Button onClick={() => router.push("/admin/products")}>Xem sản phẩm</Button>}
                >
                    <div className="dp-admin-ai-result-list">
                        {createdProducts.map((product) => (
                            <div className="dp-admin-ai-result-item" key={product.id}>
                                <div>
                                    <Text strong>{product.name}</Text>
                                    <Paragraph type="secondary" className="dp-admin-ai-result-summary">
                                        {`${Number(product.price || 0).toLocaleString("vi-VN")} đ - Tồn kho ${product.stock || 0}`}
                                    </Paragraph>
                                </div>
                                <Space wrap>
                                    <Tag>{product.category || "kitchen"}</Tag>
                                    <Button type="link" onClick={() => router.push(`/products/${product.id}`)}>
                                        Xem
                                    </Button>
                                </Space>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {supportResult && (
                <Card
                    className="dp-admin-ai-card"
                    title={
                        <Space>
                            <CustomerServiceOutlined />
                            Kết quả xử lý support
                        </Space>
                    }
                    extra={<Button onClick={() => router.push("/admin/support")}>Mở ticket</Button>}
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Text strong>Đã xử lý</Text>
                            <div className="dp-admin-ai-result-list" style={{ marginTop: 10 }}>
                                {(supportResult.handled || []).length ? (
                                    supportResult.handled.map((ticket) => (
                                        <div className="dp-admin-ai-result-item" key={ticket.id}>
                                            <div>
                                                <Text strong>{ticket.ticketCode}</Text>
                                                <Paragraph type="secondary" className="dp-admin-ai-result-summary">
                                                    {ticket.title}
                                                </Paragraph>
                                            </div>
                                            <Tag color="success">{ticket.status}</Tag>
                                        </div>
                                    ))
                                ) : (
                                    <Text type="secondary">Chưa có ticket nào được AI xử lý.</Text>
                                )}
                            </div>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Text strong>Chuyển admin</Text>
                            <div className="dp-admin-ai-result-list" style={{ marginTop: 10 }}>
                                {(supportResult.skipped || []).length ? (
                                    supportResult.skipped.map((ticket) => (
                                        <div className="dp-admin-ai-result-item" key={ticket.id}>
                                            <div>
                                                <Text strong>{ticket.ticketCode}</Text>
                                                <Paragraph type="secondary" className="dp-admin-ai-result-summary">
                                                    {ticket.reason}
                                                </Paragraph>
                                            </div>
                                            <Tag color="warning">Admin</Tag>
                                        </div>
                                    ))
                                ) : (
                                    <Text type="secondary">Không có ticket bị chặn.</Text>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card>
            )}
        </>
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
                        <Tag color="warning">Cần cron để auto publish</Tag>
                    </div>
                    <Divider />
                    <Text strong>Option đã bổ sung</Text>
                    <div className="dp-admin-ai-list">
                        {[
                            "Giọng văn theo mục tiêu bán hàng hoặc tư vấn chuyên gia.",
                            "Độ sâu nội dung ngắn, đầy đủ hoặc chuyên sâu.",
                            "Từ khóa SEO và các khối FAQ, chọn mua, bảo quản.",
                            "Chuyển về đúng AI Center sau khi chỉnh sửa blog.",
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
                        title="AI chỉ xử lý ticket an toàn"
                        description="Các vấn đề tiền bạc, thanh toán, hoàn tiền, tài khoản hoặc sửa thông tin cá nhân sẽ bị chặn và chuyển sang admin."
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
                                <Form.Item name="limit" label="Số ticket xử lý/lần" rules={[{ required: true }]}>
                                    <InputNumber min={1} max={20} style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="closeResolved" label="Đóng ticket sau khi AI trả lời" valuePropName="checked">
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
                            Phạm vi xử lý ticket
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
                        Quản lý ticket
                    </Button>
                </Card>
            </Col>
        </Row>
    );

    const rulesTab = (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
                <Card className="dp-admin-ai-card" title="Blog">
                    <Paragraph type="secondary">
                        AI phù hợp để tạo bản nháp, tiêu đề, sapo, SEO title, SEO description và dàn ý. Admin vẫn nên duyệt
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
                <Card className="dp-admin-ai-card" title="Ticket">
                    <Paragraph type="secondary">
                        AI chỉ trả lời câu hỏi vận hành thông thường. Khi có rủi ro tiền bạc hoặc dữ liệu cá nhân, ticket sẽ
                        được chuyển cho admin.
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
                        <RobotOutlined /> AI Center
                    </Title>
                    <Paragraph type="secondary">
                        Điều phối AI tạo nội dung, nhập sản phẩm và hỗ trợ ticket theo phạm vi an toàn cho DPWOOD.
                    </Paragraph>
                </div>
                <Space wrap>
                    <Button icon={<FileTextOutlined />} onClick={() => router.push("/admin/ai/blog")}>
                        Blog AI
                    </Button>
                    <Button icon={<CustomerServiceOutlined />} onClick={() => router.push("/admin/ai/support")}>
                        Ticket AI
                    </Button>
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
