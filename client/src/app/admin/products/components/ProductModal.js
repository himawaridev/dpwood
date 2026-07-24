import { useEffect, useState } from "react";
import { Button, Col, Flex, Form, Input, InputNumber, Modal, Row } from "antd";
import {
    KITCHEN_COLOR_OPTIONS,
    KITCHEN_MATERIAL_OPTIONS,
} from "@/utils/kitchenProduct";
import CreatableSelect from "./product-form/CreatableSelect";
import KitchenDetailsSection from "./product-form/KitchenDetailsSection";
import ProductImagesSection from "./product-form/ProductImagesSection";
import ProductVariantsSection from "./product-form/ProductVariantsSection";
import ProductCommerceSection from "./product-form/ProductCommerceSection";

const mergeOptions = (...groups) =>
    [...new Set(groups.flat().filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

const getInitialValues = (product = {}) => ({
    sold: 0,
    dishwasherSafe: false,
    microwaveSafe: false,
    returnEligible: true,
    returnWindowDays: 7,
    ...product,
    images: product.images?.length > 0
        ? product.images
        : [product.imageUrl].filter(Boolean).length
            ? [product.imageUrl]
            : [""],
    variants: Array.isArray(product.variants) ? product.variants : [],
});

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
        if (!isVisible || !isMounted) return;

        const product = editingProduct || draftProduct || {};
        setDynamicMaterials(mergeOptions(
            KITCHEN_MATERIAL_OPTIONS,
            materialOptions,
            [product.material],
        ));
        setDynamicColors(mergeOptions(
            KITCHEN_COLOR_OPTIONS,
            colorOptions,
            [product.color],
            (product.variants || []).map((variant) => variant?.color),
        ));

        if (!editingProduct) form.resetFields();
        form.setFieldsValue(getInitialValues(product));
    }, [isVisible, isMounted, editingProduct, draftProduct, form, materialOptions, colorOptions]);

    const categoryOptions = categories.map((item) => ({
        value: item.value,
        label: item.label || item.value,
    }));

    const addMaterialOption = async (label) => {
        setDynamicMaterials((current) => mergeOptions(current, [label]));
        return { value: label, label };
    };

    const addColorOption = async (label) => {
        setDynamicColors((current) => mergeOptions(current, [label]));
        return { value: label, label };
    };

    const syncVariantStock = (changedValues, allValues) => {
        if (!Object.prototype.hasOwnProperty.call(changedValues, "variants")) return;
        const variants = Array.isArray(allValues.variants) ? allValues.variants : [];
        if (!variants.length) return;
        form.setFieldValue(
            "stock",
            variants.reduce((sum, variant) => sum + Number(variant?.stock || 0), 0),
        );
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
            <Form form={form} layout="vertical" onFinish={onSave} onValuesChange={syncVariantStock}>
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
                    <Col xs={24} md={8}>
                        <Form.Item name="sku" label="SKU" extra="Để trống để hệ thống tự tạo mã duy nhất.">
                            <Input placeholder="VD: COOK-PAN-28-BLK" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item name="gtin" label="GTIN / mã vạch">
                            <Input placeholder="8, 12, 13 hoặc 14 chữ số" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item name="mpn" label="MPN / mã nhà sản xuất">
                            <Input placeholder="Mã model của nhà sản xuất" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} md={8}>
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
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="stock"
                            label={hasVariants ? "Tổng tồn kho" : "Tồn kho mặc định"}
                            extra={hasVariants
                                ? `Tổng ${variantStockTotal} sản phẩm, tự động tính từ từng biến thể bên dưới.`
                                : undefined}
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
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="sold"
                            label="Số lượng đã bán"
                            extra="Dữ liệu bán trước đây. Hệ thống sẽ tiếp tục tự tăng khi phát sinh đơn hàng và giảm khi đơn bị hủy."
                            rules={[{ required: true, message: "Nhập số lượng đã bán" }]}
                        >
                            <InputNumber size="large" style={{ width: "100%" }} min={0} precision={0} />
                        </Form.Item>
                    </Col>
                </Row>

                <KitchenDetailsSection
                    materials={dynamicMaterials}
                    colors={dynamicColors}
                    onAddMaterial={addMaterialOption}
                    onAddColor={addColorOption}
                />
                <ProductCommerceSection />
                <ProductVariantsSection
                    form={form}
                    variants={watchedVariants}
                    colors={dynamicColors}
                    onAddColor={addColorOption}
                />
                <ProductImagesSection />

                <Flex justify="flex-end" gap="small" style={{ marginTop: 24 }} wrap="wrap">
                    <Button size="large" onClick={onClose}>Hủy</Button>
                    <Button size="large" type="primary" htmlType="submit">
                        {editingProduct ? "Lưu cập nhật" : "Thêm mới"}
                    </Button>
                </Flex>
            </Form>
        </Modal>
    );
}
