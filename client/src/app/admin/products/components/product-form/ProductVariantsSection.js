import { Button, Col, Divider, Flex, Form, Input, InputNumber, Row, Typography } from "antd";
import { MinusCircleOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import CreatableSelect from "./CreatableSelect";

const createVariantId = () => `variant-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function ProductVariantsSection({ form, variants, colors, onAddColor }) {
    const hasVariants = variants.length > 0;

    const markAllOutOfStock = () => {
        const nextVariants = variants.map((variant) => ({ ...variant, stock: 0 }));
        form.setFieldsValue({ variants: nextVariants, stock: 0 });
    };

    const addVariant = (add) => add({
        variantId: createVariantId(),
        color: form.getFieldValue("color") || undefined,
        size: form.getFieldValue("capacity") || "",
        price: form.getFieldValue("price") || 0,
        stock: 0,
        imageUrl: "",
    });

    return (
        <div className="dp-admin-form-block" style={{ marginTop: 16 }}>
            <Typography.Text strong style={{ display: "block", marginBottom: 4 }}>
                Biến thể sản phẩm
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: "block", marginBottom: 14 }}>
                Dùng để bán cùng một sản phẩm với nhiều màu sắc, kích cỡ hoặc dung tích khác nhau.
            </Typography.Text>

            {hasVariants && (
                <Flex justify="flex-end" style={{ marginBottom: 12 }}>
                    <Button size="small" icon={<StopOutlined />} onClick={markAllOutOfStock}>
                        Đặt tất cả biến thể hết hàng
                    </Button>
                </Flex>
            )}

            <Form.List name="variants">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map((field, index) => (
                            <div key={field.key} className="dp-admin-variant-row">
                                <Form.Item name={[field.name, "variantId"]} hidden><Input /></Form.Item>
                                <Form.Item name={[field.name, "sku"]} hidden><Input /></Form.Item>
                                <Row gutter={12} align="middle">
                                    <Col xs={24} md={5}>
                                        <Form.Item
                                            name={[field.name, "color"]}
                                            label="Màu"
                                            rules={[{ required: true, message: "Chọn màu" }]}
                                        >
                                            <CreatableSelect
                                                showSearch
                                                placeholder="Màu"
                                                options={colors.map((item) => ({ value: item, label: item }))}
                                                addLabel="Màu sắc"
                                                onAddOption={onAddColor}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={5}>
                                        <Form.Item name={[field.name, "size"]} label="Kích cỡ / dung tích">
                                            <Input placeholder="28cm / 1.8L" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={4}>
                                        <Form.Item
                                            name={[field.name, "price"]}
                                            label="Giá"
                                            rules={[{ required: true, message: "Nhập giá" }]}
                                        >
                                            <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={4}>
                                        <Form.Item
                                            name={[field.name, "stock"]}
                                            label="Tồn kho"
                                            rules={[{ required: true, message: "Nhập tồn kho" }]}
                                        >
                                            <InputNumber min={0} style={{ width: "100%" }} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={5}>
                                        <Form.Item name={[field.name, "imageUrl"]} label="Ảnh riêng">
                                            <Input placeholder="URL ảnh biến thể" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={1}>
                                        <Button
                                            danger
                                            type="text"
                                            icon={<MinusCircleOutlined />}
                                            onClick={() => remove(field.name)}
                                            aria-label={`Xóa biến thể ${index + 1}`}
                                        />
                                    </Col>
                                </Row>
                            </div>
                        ))}
                        {fields.length > 0 && <Divider style={{ margin: "12px 0" }} />}
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => addVariant(add)} block>
                            Thêm biến thể màu / kích cỡ
                        </Button>
                    </>
                )}
            </Form.List>
        </div>
    );
}
