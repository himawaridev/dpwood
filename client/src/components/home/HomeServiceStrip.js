import { Col, Row, Typography } from "antd";
import {
    CustomerServiceOutlined,
    GiftOutlined,
    SafetyCertificateOutlined,
    TruckOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const SERVICE_ITEMS = [
    { key: "delivery", icon: <TruckOutlined />, title: "Giao hàng nhanh", desc: "Đóng gói an toàn cho đồ bếp" },
    { key: "return", icon: <SafetyCertificateOutlined />, title: "Đổi trả 7 ngày", desc: "Hỗ trợ khi sản phẩm lỗi" },
    { key: "discount", icon: <GiftOutlined />, title: "Ưu đãi thành viên", desc: "Lưu mã và dùng khi thanh toán" },
    { key: "support", icon: <CustomerServiceOutlined />, title: "Tư vấn bếp", desc: "Hỗ trợ chọn sản phẩm phù hợp" },
];

export default function HomeServiceStrip() {
    return (
        <section className="webcake-services">
            <div className="webcake-container">
                <Row gutter={[24, 24]}>
                    {SERVICE_ITEMS.map((item) => (
                        <Col xs={12} lg={6} key={item.key}>
                            <div className="webcake-service-item">
                                <span className="webcake-service-icon">{item.icon}</span>
                                <div>
                                    <Text strong>{item.title}</Text>
                                    <Text type="secondary">{item.desc}</Text>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
}
