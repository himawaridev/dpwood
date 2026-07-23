import { Button, Flex, Form, Input, Typography } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

export default function ProductImagesSection() {
    return (
        <div className="dp-admin-form-block" style={{ marginTop: 16 }}>
            <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                Danh sách hình ảnh (URL)
            </Typography.Text>
            <Form.List name="images">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map((field, index) => (
                            <div key={field.key} style={{ marginBottom: 12 }}>
                                <Flex gap="small" align="center">
                                    <Form.Item
                                        name={field.name}
                                        isListField={field.isListField}
                                        fieldKey={field.fieldKey}
                                        validateTrigger={["onChange", "onBlur"]}
                                        rules={[{ type: "url", message: "Đường dẫn ảnh không hợp lệ" }]}
                                        noStyle
                                    >
                                        <Input placeholder={`Nhập đường dẫn ảnh ${index + 1} (https://...)`} />
                                    </Form.Item>
                                    {fields.length > 1 && (
                                        <MinusCircleOutlined
                                            style={{ color: "#ff4d4f", fontSize: 20, cursor: "pointer" }}
                                            onClick={() => remove(field.name)}
                                        />
                                    )}
                                </Flex>
                            </div>
                        ))}
                        <Form.Item style={{ margin: 0 }}>
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                Thêm ảnh khác
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
        </div>
    );
}
