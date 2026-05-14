import React, { useState, useEffect } from "react";
import {
    Card,
    Button,
    Typography,
    Space,
    Tag,
    Flex,
    Modal,
    Form,
    Input,
    Radio,
    Popconfirm,
    Select,
} from "antd";
import { EnvironmentOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

export default function AddressSection({
    isAuth,
    addresses,
    selectedAddress,
    setSelectedAddress,
    isAddressModalVisible,
    setIsAddressModalVisible,
    isAddingAddress,
    setIsAddingAddress,
    addressForm,
    handleSaveNewAddress,
    handleDeleteAddress,
    userEmail,
}) {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    useEffect(() => {
        if (isAddingAddress) {
            axios.get("https://provinces.open-api.vn/api/?depth=1")
                .then(res => setProvinces(res.data))
                .catch(err => console.error(err));
        }
    }, [isAddingAddress]);

    const handleProvinceChange = (value, option) => {
        addressForm.setFieldsValue({ district: undefined, ward: undefined });
        setWards([]);
        axios.get(`https://provinces.open-api.vn/api/p/${option.key}?depth=2`)
            .then(res => setDistricts(res.data.districts))
            .catch(err => console.error(err));
    };

    const handleDistrictChange = (value, option) => {
        addressForm.setFieldsValue({ ward: undefined });
        axios.get(`https://provinces.open-api.vn/api/d/${option.key}?depth=2`)
            .then(res => setWards(res.data.wards))
            .catch(err => console.error(err));
    };

    const onFinishForm = (values) => {
        const fullAddress = `${values.streetInput}, ${values.ward}, ${values.district}, ${values.province}`;
        handleSaveNewAddress({
            recipientName: values.recipientName,
            phoneNumber: values.phoneNumber,
            email: values.email,
            fullAddress,
        });
    };

    if (!isAuth) return null;

    return (
        <>
            <Card
                variant="borderless"
                style={{
                    marginBottom: 24,
                    borderRadius: 12,
                    border: "2px solid #91caff",
                    boxShadow: "0 4px 12px rgba(22, 119, 255, 0.05)",
                }}
                styles={{ body: { padding: "20px 24px" } }}
            >
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap="middle">
                    <div>
                        <Title
                            level={5}
                            style={{
                                color: "#1677ff",
                                marginTop: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <EnvironmentOutlined /> Địa chỉ nhận hàng
                        </Title>
                        {selectedAddress ? (
                            <Space size="middle" wrap>
                                <Text strong style={{ fontSize: "16px" }}>
                                    {selectedAddress.recipientName} (+84){" "}
                                    {selectedAddress.phoneNumber.replace(/^0/, "")}
                                </Text>
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: "1px",
                                        height: "14px",
                                        backgroundColor: "#d9d9d9",
                                        margin: "0 2px",
                                        verticalAlign: "middle",
                                    }}
                                />
                                <Text>{selectedAddress.fullAddress}</Text>
                                {selectedAddress.isDefault && (
                                    <Tag color="blue" variant="solid">
                                        Mặc định
                                    </Tag>
                                )}
                            </Space>
                        ) : (
                            <Text type="danger">Vui lòng thêm địa chỉ giao hàng để tiếp tục.</Text>
                        )}
                    </div>
                    <Button type="default" onClick={() => setIsAddressModalVisible(true)}>
                        {selectedAddress ? "Thay đổi địa chỉ" : "Thêm địa chỉ"}
                    </Button>
                </Flex>
            </Card>

            <Modal
                title={isAddingAddress ? "Thêm địa chỉ mới" : "Địa chỉ của tôi"}
                open={isAddressModalVisible}
                onCancel={() => {
                    setIsAddressModalVisible(false);
                    setIsAddingAddress(false);
                }}
                footer={null}
                width={600}
                forceRender
            >
                <div style={{ display: isAddingAddress ? "block" : "none", marginTop: 16 }}>
                    <Form form={addressForm} layout="vertical" onFinish={onFinishForm}>
                        <Form.Item
                            name="recipientName"
                            label="Họ và tên"
                            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                        >
                            <Input size="large" placeholder="Tên người nhận" />
                        </Form.Item>
                        <Form.Item
                            name="phoneNumber"
                            label="Số điện thoại"
                            rules={[
                                { required: true, message: "Vui lòng nhập số điện thoại" },
                                { pattern: /^[0-9]{10}$/, message: "Số điện thoại phải đủ 10 số và không chứa ký tự đặc biệt" }
                            ]}
                        >
                            <Input size="large" placeholder="Số điện thoại liên hệ (10 chữ số)" />
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="Email xác nhận"
                            rules={[
                                { required: true, message: "Vui lòng nhập email" },
                                { type: "email", message: "Email không hợp lệ" },
                                {
                                    validator: (_, value) => {
                                        if (!value || value === userEmail) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error("Email phải trùng khớp với email của tài khoản đang đăng nhập!"));
                                    }
                                }
                            ]}
                        >
                            <Input size="large" placeholder="Nhập lại email tài khoản của bạn" />
                        </Form.Item>
                        <Form.Item label="Khu vực" style={{ marginBottom: 0 }}>
                            <Flex gap="small">
                                <Form.Item
                                    name="province"
                                    rules={[{ required: true, message: "Chọn Tỉnh/Thành phố" }]}
                                    style={{ flex: 1 }}
                                >
                                    <Select size="large" placeholder="Tỉnh/Thành phố" onChange={handleProvinceChange} showSearch optionFilterProp="children">
                                        {provinces.map(p => <Select.Option key={p.code} value={p.name}>{p.name}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    name="district"
                                    rules={[{ required: true, message: "Chọn Quận/Huyện" }]}
                                    style={{ flex: 1 }}
                                >
                                    <Select size="large" placeholder="Quận/Huyện" onChange={handleDistrictChange} showSearch optionFilterProp="children" disabled={districts.length === 0}>
                                        {districts.map(d => <Select.Option key={d.code} value={d.name}>{d.name}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    name="ward"
                                    rules={[{ required: true, message: "Chọn Phường/Xã" }]}
                                    style={{ flex: 1 }}
                                >
                                    <Select size="large" placeholder="Phường/Xã" showSearch optionFilterProp="children" disabled={wards.length === 0}>
                                        {wards.map(w => <Select.Option key={w.code} value={w.name}>{w.name}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                            </Flex>
                        </Form.Item>
                        <Form.Item
                            name="streetInput"
                            label="Địa chỉ cụ thể"
                            rules={[{ required: true, message: "Vui lòng nhập địa chỉ cụ thể" }]}
                        >
                            <Input.TextArea
                                size="large"
                                rows={2}
                                placeholder="Số nhà, tên đường, ngõ hẻm..."
                            />
                        </Form.Item>
                        <Flex justify="flex-end" gap="small">
                            <Button size="large" onClick={() => setIsAddingAddress(false)}>
                                Quay lại
                            </Button>
                            <Button size="large" type="primary" htmlType="submit">
                                Hoàn thành
                            </Button>
                        </Flex>
                    </Form>
                </div>

                <div style={{ display: !isAddingAddress ? "block" : "none", marginTop: 16 }}>
                    {addresses.length === 0 ? (
                        <Text type="secondary">Bạn chưa có địa chỉ nào. Hãy thêm mới nhé.</Text>
                    ) : (
                        <Flex vertical gap="middle" style={{ width: "100%" }}>
                            {addresses.map((addr) => (
                                <Card
                                    key={addr.id}
                                    size="small"
                                    hoverable
                                    onClick={() => setSelectedAddress(addr)}
                                    style={{
                                        borderColor:
                                            selectedAddress?.id === addr.id
                                                ? "#1677ff"
                                                : "#d9d9d9",
                                        background:
                                            selectedAddress?.id === addr.id
                                                ? "#e6f4ff"
                                                : "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Flex justify="space-between" align="center">
                                        <Flex gap="middle" align="center">
                                            <Radio checked={selectedAddress?.id === addr.id} />
                                            <div>
                                                <Text strong>{addr.recipientName}</Text>
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        width: "1px",
                                                        height: "12px",
                                                        backgroundColor: "#d9d9d9",
                                                        margin: "0 8px",
                                                        verticalAlign: "middle",
                                                    }}
                                                />
                                                <Text type="secondary">{addr.phoneNumber}</Text>
                                                <div style={{ marginTop: 4, color: "#595959" }}>
                                                    {addr.fullAddress}
                                                </div>
                                            </div>
                                        </Flex>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            <Popconfirm
                                                title="Xóa địa chỉ này?"
                                                description="Hành động này không thể hoàn tác."
                                                onConfirm={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteAddress(addr.id);
                                                }}
                                                onCancel={(e) => e.stopPropagation()}
                                                okText="Xóa"
                                                cancelText="Quay lại"
                                            >
                                                <Button
                                                    type="primary"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Xóa
                                                </Button>
                                            </Popconfirm>
                                        </div>
                                    </Flex>
                                </Card>
                            ))}
                        </Flex>
                    )}
                    <Button
                        type="dashed"
                        block
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddingAddress(true)}
                        style={{ marginTop: 24 }}
                    >
                        Thêm Địa Chỉ Mới
                    </Button>
                    <Button
                        type="primary"
                        block
                        size="large"
                        onClick={() => setIsAddressModalVisible(false)}
                        style={{ marginTop: 12 }}
                        disabled={!selectedAddress && addresses.length > 0}
                    >
                        Xác nhận
                    </Button>
                </div>
            </Modal>
        </>
    );
}
