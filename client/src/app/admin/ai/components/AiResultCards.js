import { Alert, Card, Col, Image, Row, Space, Tag, Typography } from "antd";
import {
    AppstoreAddOutlined,
    CustomerServiceOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";
import { isRealProductImage } from "@/utils/productImages";

const { Text, Paragraph } = Typography;

export default function AiResultCards({
    createdBlogs,
    pendingProducts,
    createdProducts,
    supportResult,
    productLoading,
    brokenProductImages,
    onBrokenProductImage,
    onClearPendingProducts,
    onSavePendingProducts,
    onOpenBlogs,
    onEditBlog,
    onOpenProducts,
    onOpenProduct,
    onOpenSupport,
}) {
    return (
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
                    extra={
                        <AdminIconButton label="Xem bài viết" icon={<EyeOutlined />} onClick={onOpenBlogs} />
                    }
                >
                    <div className="dp-admin-ai-result-list">
                        {createdBlogs.map((blog) => (
                            <div className="dp-admin-ai-result-item" key={blog.id}>
                                <div>
                                    <Text strong>{blog.title}</Text>
                                    <Paragraph type="secondary" className="dp-admin-ai-result-summary">
                                        {blog.summary || "Bài viết AI đang chờ bổ sung mô tả."}
                                    </Paragraph>
                                </div>
                                <Space wrap>
                                    <Tag color={blog.isPublished ? "success" : "default"}>
                                        {blog.isPublished ? "Công khai" : "Bản nháp"}
                                    </Tag>
                                    <AdminIconButton
                                        label="Chỉnh sửa bài viết"
                                        icon={<EditOutlined />}
                                        onClick={() => onEditBlog(blog)}
                                    />
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
                            <AdminIconButton
                                label="Xóa toàn bộ bản nháp"
                                icon={<DeleteOutlined />}
                                onClick={onClearPendingProducts}
                            />
                            <AdminIconButton
                                label="Lưu tất cả sản phẩm"
                                icon={<SaveOutlined />}
                                loading={productLoading}
                                onClick={onSavePendingProducts}
                            />
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
                            const previewImage = [
                                product.imageUrl,
                                ...(Array.isArray(product.images) ? product.images : []),
                            ].find(isRealProductImage);
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
                                                onError={() => onBrokenProductImage(imageKey)}
                                            />
                                        ) : (
                                            <div className="dp-admin-ai-image-placeholder">Chưa có ảnh</div>
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
                    extra={
                        <AdminIconButton label="Xem sản phẩm" icon={<EyeOutlined />} onClick={onOpenProducts} />
                    }
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
                                    <AdminIconButton
                                        label="Xem sản phẩm"
                                        icon={<EyeOutlined />}
                                        onClick={() => onOpenProduct(product)}
                                    />
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
                    extra={
                        <AdminIconButton label="Mở yêu cầu hỗ trợ" icon={<EyeOutlined />} onClick={onOpenSupport} />
                    }
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
                                    <Text type="secondary">Chưa có yêu cầu hỗ trợ nào được AI xử lý.</Text>
                                )}
                            </div>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Text strong>Chuyển quản trị viên</Text>
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
                                            <Tag color="warning">Quản trị viên</Tag>
                                        </div>
                                    ))
                                ) : (
                                    <Text type="secondary">Không có yêu cầu hỗ trợ bị chặn.</Text>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card>
            )}
        </>
    );
}
