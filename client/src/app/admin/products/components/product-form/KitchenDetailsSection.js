import { Col, Form, Input, InputNumber, Row, Switch, Typography } from "antd";
import CreatableSelect from "./CreatableSelect";

export default function KitchenDetailsSection({
    materials,
    colors,
    onAddMaterial,
    onAddColor,
}) {
    return (
        <div className="dp-admin-form-block">
            <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                Thông tin đồ gia dụng nhà bếp
            </Typography.Text>
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item name="brand" label="Thương hiệu">
                        <Input placeholder="VD: Lock&Lock, Sunhouse, DPWOOD Kitchen" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="material" label="Chất liệu">
                        <CreatableSelect
                            allowClear
                            showSearch
                            placeholder="Chọn chất liệu"
                            options={materials.map((item) => ({ value: item, label: item }))}
                            addLabel="Chất liệu"
                            onAddOption={onAddMaterial}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="color" label="Màu mặc định">
                        <CreatableSelect
                            allowClear
                            showSearch
                            placeholder="Chọn màu sắc"
                            options={colors.map((item) => ({ value: item, label: item }))}
                            addLabel="Màu sắc"
                            onAddOption={onAddColor}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="capacity" label="Dung tích / kích thước mặc định">
                        <Input placeholder="VD: 28cm, 1.8L, bộ 6 món" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="warranty" label="Bảo hành">
                        <Input placeholder="VD: 12 tháng" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="origin" label="Xuất xứ">
                        <Input placeholder="VD: Việt Nam" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="dimensions" label="Kích thước đóng gói">
                        <Input placeholder="VD: 32 x 20 x 12 cm" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="weight" label="Khối lượng">
                        <Input placeholder="VD: 1.2 kg" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="packageContents" label="Bộ sản phẩm gồm">
                        <Input placeholder="VD: 1 nồi, 1 nắp kính, hướng dẫn" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="careInstructions" label="Hướng dẫn sử dụng và bảo quản">
                        <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="safetyInstructions" label="Cảnh báo an toàn">
                        <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="dishwasherSafe"
                        valuePropName="checked"
                        label="An toàn với máy rửa chén"
                        extra="Bật khi nhà sản xuất xác nhận sản phẩm có thể rửa bằng máy mà không biến dạng, bong lớp phủ hoặc giảm độ bền."
                    >
                        <Switch checkedChildren="Có" unCheckedChildren="Không" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="microwaveSafe"
                        valuePropName="checked"
                        label="An toàn với lò vi sóng"
                        extra="Bật khi sản phẩm được phép hâm nóng trong lò vi sóng. Không áp dụng cho kim loại và không đồng nghĩa với dùng được trong lò nướng."
                    >
                        <Switch checkedChildren="Có" unCheckedChildren="Không" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="returnEligible"
                        valuePropName="checked"
                        label="Cho phép đổi trả"
                        extra="Áp dụng khi sản phẩm còn nguyên trạng và đáp ứng chính sách của cửa hàng."
                    >
                        <Switch checkedChildren="Có" unCheckedChildren="Không" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item name="returnWindowDays" label="Thời hạn đổi trả (ngày)">
                        <InputNumber min={0} max={30} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );
}
