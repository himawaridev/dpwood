import { Col, Form, Input, InputNumber, Row, Typography } from "antd";

const moneyFormatter = (value) =>
    `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const moneyParser = (value) => String(value || "").replace(/\./g, "");

export default function ProductCommerceSection() {
    return (
        <div className="dp-admin-form-block">
            <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                Đóng gói, lợi nhuận và hiển thị trên Google
            </Typography.Text>
            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="costPrice"
                        label="Giá vốn (VND)"
                        extra="Chỉ dùng trong báo cáo lợi nhuận, không hiển thị cho khách hàng."
                    >
                        <InputNumber
                            min={0}
                            step={1000}
                            style={{ width: "100%" }}
                            formatter={moneyFormatter}
                            parser={moneyParser}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="packageWeightGrams"
                        label="Khối lượng đóng gói (gram)"
                        extra="Dùng để tính phí vận chuyển và khai báo nguồn cấp sản phẩm."
                    >
                        <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="googleProductCategory"
                        label="Danh mục Google"
                        extra="Nhập mã hoặc tên danh mục theo Google Product Taxonomy."
                    >
                        <Input placeholder="VD: Home & Garden > Kitchen & Dining" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item name="packageLengthCm" label="Dài kiện hàng (cm)">
                        <InputNumber min={0} precision={1} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item name="packageWidthCm" label="Rộng kiện hàng (cm)">
                        <InputNumber min={0} precision={1} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item name="packageHeightCm" label="Cao kiện hàng (cm)">
                        <InputNumber min={0} precision={1} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={24}>
                    <Form.Item
                        name="seoTitle"
                        label="Tiêu đề SEO"
                        extra="Nên dài 45-60 ký tự. Để trống sẽ dùng tên sản phẩm."
                    >
                        <Input maxLength={180} showCount />
                    </Form.Item>
                </Col>
                <Col xs={24}>
                    <Form.Item
                        name="seoDescription"
                        label="Mô tả SEO"
                        extra="Nên dài 120-160 ký tự. Để trống sẽ rút gọn mô tả sản phẩm."
                    >
                        <Input.TextArea rows={2} maxLength={500} showCount />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );
}
