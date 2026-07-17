import { Button, Col, Row, Skeleton, Typography } from "antd";

const { Title, Paragraph } = Typography;

export function HomeProductSkeletonGrid({ count = 8 }) {
    return (
        <Row gutter={[30, 36]}>
            {Array.from({ length: count }).map((_, index) => (
                <Col xs={12} md={8} lg={6} key={index}>
                    <div className="webcake-product-skeleton">
                        <Skeleton.Image active className="webcake-product-skeleton-image" />
                        <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                </Col>
            ))}
        </Row>
    );
}

export function HomeProductEmptyState({ onRetry }) {
    return (
        <div className="webcake-empty-products">
            <Title level={4}>Chưa tải được sản phẩm</Title>
            <Paragraph>
                Máy chủ có thể đang khởi động sau thời gian không sử dụng. Vui lòng thử tải lại dữ liệu.
            </Paragraph>
            <Button type="primary" onClick={onRetry}>
                Tải lại sản phẩm
            </Button>
        </div>
    );
}
