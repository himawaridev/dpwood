import React from "react";
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
} from "antd";
import { EnvironmentOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";

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
}) {
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
                    <Form form={addressForm} layout="vertical" onFinish={handleSaveNewAddress}>
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
                            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                        >
                            <Input size="large" placeholder="Số điện thoại liên hệ" />
                        </Form.Item>
                        <Form.Item
                            name="fullAddress"
                            label="Địa chỉ cụ thể"
                            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                        >
                            <Input.TextArea
                                size="large"
                                rows={3}
                                placeholder="Số nhà, đường, phường, quận..."
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
                        <Radio.Group
                            style={{ width: "100%" }}
                            value={selectedAddress?.id}
                            onChange={(e) =>
                                setSelectedAddress(addresses.find((a) => a.id === e.target.value))
                            }
                        >
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
                                        <Flex justify="space-between" align="flex-start">
                                            <Radio value={addr.id}>
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
                                                <div style={{ marginTop: 8, color: "#595959" }}>
                                                    {addr.fullAddress}
                                                </div>
                                            </Radio>
                                            <div
                                                onClick={(e) => {
                                                    e.preventDefault();
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
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </Popconfirm>
                                            </div>
                                        </Flex>
                                    </Card>
                                ))}
                            </Flex>
                        </Radio.Group>
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
