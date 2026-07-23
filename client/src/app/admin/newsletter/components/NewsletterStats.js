import { Card, Col, Row, Statistic } from "antd";

export default function NewsletterStats({ userStats, subscriberStats }) {
    const items = [
        ["Tài khoản đã xác minh", userStats.verifiedUsers || 0],
        ["Đã đăng ký bản tin", subscriberStats.subscribed || 0],
        ["Chờ xác nhận bản tin", subscriberStats.pending || 0],
        ["Đã hủy bản tin", subscriberStats.unsubscribed || 0],
    ];

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {items.map(([title, value]) => (
                <Col xs={24} sm={12} lg={6} key={title}>
                    <Card><Statistic title={title} value={value} /></Card>
                </Col>
            ))}
        </Row>
    );
}
