import React, { useEffect, useState } from "react";
import { App, Modal, Form, Input, InputNumber, Button, Flex, Typography, Row, Col, Select as AntSelect, Switch, Divider } from "antd";
import { MinusCircleOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import {
    KITCHEN_CATEGORY_OPTIONS,
    KITCHEN_COLOR_OPTIONS,
    KITCHEN_MATERIAL_OPTIONS,
} from "@/utils/kitchenProduct";

const createVariantId = () => `variant-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const mergeOptions = (...groups) =>
    [...new Set(groups.flat().filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

function CreatableSelect({ options, onAddOption, addLabel, value, onChange, ...selectProps }) {
    const { message } = App.useApp();
    const [newOption, setNewOption] = useState("");
    const [adding, setAdding] = useState(false);
    const [open, setOpen] = useState(false);

    const handleAdd = async () => {
        const label = newOption.trim();
        if (!label) {
            message.warning(`Vui lòng nhập ${addLabel.toLowerCase()}.`);
            return;
        }

        try {
            setAdding(true);
            const created = await onAddOption(label);
            onChange?.(created?.value || label);
            setNewOption("");
            setOpen(false);
        } catch (error) {
            message.error(error.response?.data?.message || `Không thể thêm ${addLabel.toLowerCase()}.`);
        } finally {
            setAdding(false);
        }
    };

    return (
        <Flex gap={8} align="center">
            <AntSelect
                {...selectProps}
                value={value}
                onChange={onChange}
                open={open}
                onOpenChange={setOpen}
                options={options}
                style={{ flex: 1, minWidth: 0 }}
                popupRender={(menu) => (
                    <>
                        {menu}
                        <Divider style={{ margin: "8px 0" }} />
                        <Flex gap={8} style={{ padding: "0 8px 8px" }}>
                            <Input
                                value={newOption}
                                placeholder={`Nhập ${addLabel.toLowerCase()} mới`}
                                onChange={(event) => setNewOption(event.target.value)}
                                onKeyDown={(event) => event.stopPropagation()}
                                onPressEnter={(event) => {
                                    event.preventDefault();
                                    handleAdd();
                                }}
                            />
                            <Button
                                type="text"
                                icon={<PlusOutlined />}
                                loading={adding}
                                aria-label={`Thêm ${addLabel.toLowerCase()}`}
                                onClick={handleAdd}
                            />
                        </Flex>
                    </>
                )}
            />
            <Button
                icon={<PlusOutlined />}
                aria-label={`Mở phần thêm ${addLabel.toLowerCase()}`}
                onClick={() => setOpen(true)}
            />
        </Flex>
    );
}

export default function ProductModal({
    isVisible,
    onClose,
    onSave,
    editingProduct,
    draftProduct,
    categories = [],
    materialOptions = [],
    colorOptions = [],
    onCreateCategory = async (label) => ({ value: label, label }),
}) {
    const [form] = Form.useForm();
    const [isMounted, setIsMounted] = useState(false);
    const [dynamicMaterials, setDynamicMaterials] = useState([]);
    const [dynamicColors, setDynamicColors] = useState([]);
    const watchedVariants = Form.useWatch("variants", form) || [];
    const hasVariants = watchedVariants.length > 0;
    const variantStockTotal = watchedVariants.reduce(
        (sum, variant) => sum + Number(variant?.stock || 0),
        0,
    );

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isVisible && isMounted) {
            setDynamicMaterials(
                mergeOptions(KITCHEN_MATERIAL_OPTIONS, materialOptions, [editingProduct?.material, draftProduct?.material]),
            );
            setDynamicColors(
                mergeOptions(
                    KITCHEN_COLOR_OPTIONS,
                    colorOptions,
                    [editingProduct?.color, draftProduct?.color],
                    (editingProduct?.variants || draftProduct?.variants || []).map((variant) => variant?.color),
                ),
            );
            if (editingProduct) {
                const currentImages =
                    editingProduct.images?.length > 0
                        ? editingProduct.images
                        : [editingProduct.imageUrl].filter(Boolean);

                form.setFieldsValue({
                    category: "cookware",
                    dishwasherSafe: false,
                    microwaveSafe: false,
                    ...editingProduct,
                    images: currentImages.length > 0 ? currentImages : [""],
                    variants: Array.isArray(editingProduct.variants) ? editingProduct.variants : [],
                });
            } else {
                form.resetFields();
                const draftImages = draftProduct?.images?.length > 0 ? draftProduct.images : [""];
                form.setFieldsValue({
                    category: "cookware",
                    dishwasherSafe: false,
                    microwaveSafe: false,
                    ...(draftProduct || {}),
                    images: draftImages,
                    variants: Array.isArray(draftProduct?.variants) ? draftProduct.variants : [],
                });
            }
        }
    }, [isVisible, editingProduct, draftProduct, form, isMounted, materialOptions, colorOptions]);

    const categoryOptions = mergeOptions(
        categories.map((item) => item.value),
        KITCHEN_CATEGORY_OPTIONS.map((item) => item.value),
    ).map((value) => ({
        value,
        label:
            categories.find((item) => item.value === value)?.label ||
            KITCHEN_CATEGORY_OPTIONS.find((item) => item.value === value)?.label ||
            value,
    }));

    const addMaterialOption = async (label) => {
        setDynamicMaterials((current) => mergeOptions(current, [label]));
        return { value: label, label };
    };

    const addColorOption = async (label) => {
        setDynamicColors((current) => mergeOptions(current, [label]));
        return { value: label, label };
    };

    if (!isMounted) return null;

    return (
        <Modal
            title={editingProduct ? "Cập nhật sản phẩm đồ bếp" : "Thêm sản phẩm đồ bếp"}
            open={isVisible}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            width={960}
            forceRender
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSave}
                onValuesChange={(changedValues, allValues) => {
                    if (!Object.prototype.hasOwnProperty.call(changedValues, "variants")) return;
                    const variants = Array.isArray(allValues.variants) ? allValues.variants : [];
                    if (!variants.length) return;
                    form.setFieldValue(
                        "stock",
                        variants.reduce(
                            (sum, variant) => sum + Number(variant?.stock || 0),
                            0,
                        ),
                    );
                }}
            >
                <Row gutter={16}>
                    <Col xs={24} md={14}>
                        <Form.Item
                            name="name"
                            label="Tên sản phẩm"
                            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
                        >
                            <Input size="large" placeholder="VD: Chảo chống dính đáy từ" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={10}>
                        <Form.Item
                            name="category"
                            label="Danh mục"
                            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
                        >
                            <CreatableSelect
                                size="large"
                                showSearch
                                options={categoryOptions}
                                addLabel="Danh mục"
                                onAddOption={onCreateCategory}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="description" label="Mô tả sản phẩm">
                    <Input.TextArea
                        rows={4}
                        placeholder="Mô tả công dụng, chất liệu, cách dùng và điểm nổi bật của sản phẩm..."
                    />
                </Form.Item>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="price"
                            label="Giá mặc định (VND)"
                            rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: "100%" }}
                                min={0}
                                step={1000}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => String(value || "").replace(/\$\s?|(,*)/g, "")}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="stock"
                            extra={
                                hasVariants
                                    ? `Tổng ${variantStockTotal} sản phẩm, tự động tính từ từng biến thể bên dưới.`
                                    : undefined
                            }
                            label={hasVariants ? "Tổng tồn kho" : "Tồn kho mặc định"}
                            rules={[{ required: true, message: "Nhập số lượng" }]}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: "100%" }}
                                min={0}
                                precision={0}
                                disabled={hasVariants}
                            />
                        </Form.Item>
                    </Col>
                </Row>

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
                                    options={dynamicMaterials.map((item) => ({ value: item, label: item }))}
                                    addLabel="Chất liệu"
                                    onAddOption={addMaterialOption}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="color" label="Màu mặc định">
                                <CreatableSelect
                                    allowClear
                                    showSearch
                                    placeholder="Chọn màu sắc"
                                    options={dynamicColors.map((item) => ({ value: item, label: item }))}
                                    addLabel="Màu sắc"
                                    onAddOption={addColorOption}
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
                        <Col xs={24} sm={12}>
                            <Form.Item name="dishwasherSafe" valuePropName="checked" label="Máy rửa chén">
                                <Switch checkedChildren="Dùng được" unCheckedChildren="Không" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="microwaveSafe" valuePropName="checked" label="Lò vi sóng">
                                <Switch checkedChildren="Dùng được" unCheckedChildren="Không" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <div className="dp-admin-form-block" style={{ marginTop: 16 }}>
                    <Typography.Text strong style={{ display: "block", marginBottom: 4 }}>
                        Biến thể sản phẩm
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ display: "block", marginBottom: 14 }}>
                        Dùng để bán cùng một sản phẩm với nhiều màu sắc, kích cỡ hoặc dung tích khác nhau.
                    </Typography.Text>

                    {hasVariants && (
                        <Flex justify="flex-end" style={{ marginBottom: 12 }}>
                            <Button
                                size="small"
                                icon={<StopOutlined />}
                                onClick={() => {
                                    const nextVariants = watchedVariants.map((variant) => ({
                                        ...variant,
                                        stock: 0,
                                    }));
                                    form.setFieldsValue({ variants: nextVariants, stock: 0 });
                                }}
                            >
                                Đặt tất cả biến thể hết hàng
                            </Button>
                        </Flex>
                    )}

                    <Form.List name="variants">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((field, index) => (
                                    <div key={field.key} className="dp-admin-variant-row">
                                        <Form.Item name={[field.name, "variantId"]} hidden>
                                            <Input />
                                        </Form.Item>
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
                                                        options={dynamicColors.map((item) => ({
                                                            value: item,
                                                            label: item,
                                                        }))}
                                                        addLabel="Màu sắc"
                                                        onAddOption={addColorOption}
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
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                        add({
                                            variantId: createVariantId(),
                                            color: form.getFieldValue("color") || undefined,
                                            size: form.getFieldValue("capacity") || "",
                                            price: form.getFieldValue("price") || 0,
                                            stock: 0,
                                            imageUrl: "",
                                        })
                                    }
                                    block
                                >
                                    Thêm biến thể màu / kích cỡ
                                </Button>
                            </>
                        )}
                    </Form.List>
                </div>

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
                                                rules={[
                                                    {
                                                        type: "url",
                                                        message: "Đường dẫn ảnh không hợp lệ",
                                                    },
                                                ]}
                                                noStyle
                                            >
                                                <Input placeholder={`Nhập đường dẫn ảnh ${index + 1} (https://...)`} />
                                            </Form.Item>
                                            {fields.length > 1 ? (
                                                <MinusCircleOutlined
                                                    style={{ color: "#ff4d4f", fontSize: 20, cursor: "pointer" }}
                                                    onClick={() => remove(field.name)}
                                                />
                                            ) : null}
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

                <Flex justify="flex-end" gap="small" style={{ marginTop: 24 }} wrap="wrap">
                    <Button size="large" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button size="large" type="primary" htmlType="submit">
                        {editingProduct ? "Lưu cập nhật" : "Thêm mới"}
                    </Button>
                </Flex>
            </Form>
        </Modal>
    );
}
