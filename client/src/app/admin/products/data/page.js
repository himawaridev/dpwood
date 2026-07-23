"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, App, Button, Flex, Space, Typography, Upload } from "antd";
import {
    DatabaseOutlined,
    DownloadOutlined,
    FileTextOutlined,
    InboxOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";
import api from "@/utils/axios";
import { buildProductExport, downloadBlob } from "@/utils/productJson";

const { Paragraph, Text, Title } = Typography;
const { Dragger } = Upload;

export default function ProductJsonDataPage() {
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jsonLoading, setJsonLoading] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/products", { params: { withFacets: true } });
            setProducts(response.data?.products || []);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải dữ liệu sản phẩm.");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleExportJson = () => {
        if (!products.length) {
            message.warning("Chưa có sản phẩm để xuất file JSON.");
            return;
        }

        const payload = buildProductExport(products);
        downloadBlob(
            new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
            `dpwood-products-${new Date().toISOString().slice(0, 10)}.json`,
        );
        message.success(`Đã xuất ${payload.total} sản phẩm sang JSON.`);
    };

    const handleImportJson = async (file) => {
        if (jsonLoading) return Upload.LIST_IGNORE;

        try {
            setJsonLoading(true);
            const text = await file.text();
            const parsed = JSON.parse(text);
            const importProducts = Array.isArray(parsed) ? parsed : parsed?.products;
            if (!Array.isArray(importProducts) || !importProducts.length) {
                throw new Error("File cần là một mảng sản phẩm hoặc object có trường products.");
            }

            const normalizedResponse = await api.post("/ai/product-json-import", {
                products: importProducts,
                enrichImages: false,
            });
            const normalizedProducts = normalizedResponse.data?.products || [];
            if (!normalizedProducts.length) {
                throw new Error("Không tìm thấy sản phẩm hợp lệ trong file JSON.");
            }

            const savedResponse = await api.post("/ai/product-batch-save", {
                products: normalizedProducts,
            });
            const savedProducts = savedResponse.data?.products || [];
            message.success(`Đã nhập ${savedProducts.length} sản phẩm vào kho.`);

            const missingImages = Number(
                normalizedResponse.data?.imageCleanup?.productsWithoutProvidedImages || 0,
            );
            if (missingImages > 0) {
                message.warning(`${missingImages} sản phẩm cần bổ sung URL ảnh hợp lệ.`, 6);
            }
            await fetchProducts();
        } catch (error) {
            message.error(error.response?.data?.message || error.message || "Không thể nhập file JSON.");
        } finally {
            setJsonLoading(false);
        }

        return Upload.LIST_IGNORE;
    };

    const handleDownloadSample = async () => {
        try {
            setJsonLoading(true);
            const response = await api.get("/ai/product-json-sample", { responseType: "blob" });
            downloadBlob(
                new Blob([response.data], { type: "application/json;charset=utf-8" }),
                "sample-kitchen-products.json",
            );
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải file JSON mẫu.");
        } finally {
            setJsonLoading(false);
        }
    };

    return (
        <>
            <Flex justify="space-between" align="center" gap="middle" wrap style={{ marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Dữ liệu sản phẩm JSON</Title>
                    <Text type="secondary">Sao lưu, chuyển dữ liệu và tải cấu trúc mẫu dành cho sản phẩm.</Text>
                </div>
                <AdminIconButton
                    label="Làm mới số lượng sản phẩm"
                    icon={<ReloadOutlined />}
                    loading={loading}
                    onClick={fetchProducts}
                />
            </Flex>

            <Alert
                type="warning"
                showIcon
                title="Kiểm tra file trước khi nhập"
                description="Sản phẩm hợp lệ sẽ được lưu trực tiếp vào kho. Dữ liệu nhập không tự xóa hay ghi đè sản phẩm hiện có; hãy kiểm tra tên, giá, tồn kho, biến thể và URL ảnh để tránh tạo bản trùng."
                style={{ marginBottom: 20 }}
            />

            <div className="dp-admin-json-tools">
                <section className="dp-admin-json-tool">
                    <DatabaseOutlined className="dp-admin-json-tool-icon" />
                    <Title level={4}>Xuất dữ liệu hiện tại</Title>
                    <Paragraph type="secondary">
                        Tải toàn bộ {products.length} sản phẩm đang có thành một file JSON để sao lưu hoặc chỉnh sửa.
                    </Paragraph>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExportJson}
                        disabled={loading || !products.length}
                    >
                        Xuất {products.length} sản phẩm
                    </Button>
                </section>

                <section className="dp-admin-json-tool">
                    <FileTextOutlined className="dp-admin-json-tool-icon" />
                    <Title level={4}>Tải file cấu trúc mẫu</Title>
                    <Paragraph type="secondary">
                        Dùng mẫu chuẩn để biết chính xác tên trường, kiểu dữ liệu, biến thể và danh sách hình ảnh.
                    </Paragraph>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadSample} loading={jsonLoading}>
                        Tải JSON mẫu
                    </Button>
                </section>
            </div>

            <section className="dp-admin-json-import">
                <Title level={4}>Nhập sản phẩm từ JSON</Title>
                <Paragraph type="secondary">
                    Chấp nhận file `.json` chứa mảng sản phẩm hoặc object có trường <Text code>products</Text>.
                </Paragraph>
                <Dragger
                    accept="application/json,.json"
                    multiple={false}
                    showUploadList={false}
                    beforeUpload={handleImportJson}
                    disabled={jsonLoading}
                >
                    <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                    <p className="ant-upload-text">Bấm hoặc kéo file JSON vào đây</p>
                    <p className="ant-upload-hint">Chỉ xử lý một file mỗi lần. File không được tự động tải lên nguồn công khai.</p>
                </Dragger>
                {jsonLoading && <Space style={{ marginTop: 12 }}><Text>Đang kiểm tra và lưu dữ liệu...</Text></Space>}
            </section>
        </>
    );
}
